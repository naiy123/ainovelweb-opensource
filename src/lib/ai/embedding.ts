/**
 * Embedding 服务 - 基于 pgvector 的向量检索
 *
 * 使用 Google gemini-embedding-001 模型生成向量
 * 支持混合检索：语义相似度 + 关键词匹配
 */

import { GoogleGenAI } from "@google/genai"
import { prisma } from "@/lib/db"

// ============ 配置 ============

const EMBEDDING_MODEL = "gemini-embedding-001"
const VECTOR_DIMENSION = 3072

// 相似度阈值
const SIMILARITY_THRESHOLD = 0.5
// 混合检索权重
const SEMANTIC_WEIGHT = 0.8
const KEYWORD_WEIGHT = 0.2

// ============ 类型定义 ============

export interface EmbeddingResult {
  values: number[]
  dimension: number
}

export interface CardSearchResult {
  id: string
  name: string
  category: string
  description: string | null
  score: number
  matchType: "semantic" | "keyword" | "hybrid"
}

export interface SummarySearchResult {
  id: string
  chapterId: string
  chapterTitle: string
  summary: string
  score: number
}

// ============ Embedder 类 ============

class EmbeddingService {
  private ai: GoogleGenAI | null = null

  private getClient(): GoogleGenAI {
    if (!this.ai) {
      const apiKey = process.env.GEMINI_API_KEY
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY 未配置")
      }
      this.ai = new GoogleGenAI({ apiKey })
    }
    return this.ai
  }

  /**
   * 生成单个文本的 embedding
   */
  async embed(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
      throw new Error("文本不能为空")
    }

    const client = this.getClient()
    const response = await client.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: text,
    })

    const values = response.embeddings?.[0]?.values
    if (!values || values.length === 0) {
      throw new Error("Embedding 生成失败")
    }

    return values
  }

  /**
   * 批量生成 embedding
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    const results: number[][] = []
    for (const text of texts) {
      if (text && text.trim().length > 0) {
        const embedding = await this.embed(text)
        results.push(embedding)
      } else {
        results.push([])
      }
      // 避免 API 限流
      await new Promise(r => setTimeout(r, 50))
    }
    return results
  }

  /**
   * 为卡片生成 embedding 文本
   */
  buildCardEmbeddingText(card: {
    name: string
    category: string
    description?: string | null
    tags?: string | null
  }): string {
    const parts = [
      card.name,
      card.category,
      card.description || "",
      card.tags || "",
    ].filter(Boolean)
    return parts.join(" ")
  }

  /**
   * 更新单个卡片的 embedding
   */
  async updateCardEmbedding(cardId: string): Promise<void> {
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      select: { id: true, name: true, category: true, description: true, tags: true },
    })

    if (!card) {
      throw new Error(`卡片不存在: ${cardId}`)
    }

    const embeddingText = this.buildCardEmbeddingText(card)
    const embedding = await this.embed(embeddingText)

    // 使用原始 SQL 更新 vector 字段
    // pgvector 需要 '[0.1, 0.2, ...]' 格式的字符串
    const vectorStr = `[${embedding.join(",")}]`
    await prisma.$executeRawUnsafe(
      `UPDATE cards SET embedding = $1::vector, embedding_text = $2 WHERE id = $3`,
      vectorStr,
      embeddingText,
      cardId
    )

    console.log(`✅ 卡片 embedding 已更新: ${card.name}`)
  }

  /**
   * 更新单个摘要的 embedding
   */
  async updateSummaryEmbedding(summaryId: string): Promise<void> {
    const summary = await prisma.chapterSummary.findUnique({
      where: { id: summaryId },
      select: { id: true, summary: true },
    })

    if (!summary) {
      throw new Error(`摘要不存在: ${summaryId}`)
    }

    const embedding = await this.embed(summary.summary)

    // pgvector 需要 '[0.1, 0.2, ...]' 格式的字符串
    const vectorStr = `[${embedding.join(",")}]`
    await prisma.$executeRawUnsafe(
      `UPDATE chapter_summaries SET embedding = $1::vector WHERE id = $2`,
      vectorStr,
      summaryId
    )

    console.log(`✅ 摘要 embedding 已更新: ${summaryId}`)
  }

  /**
   * 批量更新小说的所有卡片 embedding
   */
  async updateNovelCardEmbeddings(novelId: string): Promise<number> {
    const cards = await prisma.card.findMany({
      where: { novelId },
      select: { id: true, name: true, category: true, description: true, tags: true },
    })

    let updated = 0
    for (const card of cards) {
      try {
        await this.updateCardEmbedding(card.id)
        updated++
      } catch (error) {
        console.error(`❌ 更新卡片 embedding 失败: ${card.name}`, error)
      }
    }

    console.log(`📊 已更新 ${updated}/${cards.length} 个卡片的 embedding`)
    return updated
  }

  /**
   * 批量更新小说的所有摘要 embedding
   */
  async updateNovelSummaryEmbeddings(novelId: string): Promise<number> {
    const summaries = await prisma.chapterSummary.findMany({
      where: { novelId },
      select: { id: true, summary: true },
    })

    let updated = 0
    for (const summary of summaries) {
      try {
        await this.updateSummaryEmbedding(summary.id)
        updated++
      } catch (error) {
        console.error(`❌ 更新摘要 embedding 失败: ${summary.id}`, error)
      }
    }

    console.log(`📊 已更新 ${updated}/${summaries.length} 个摘要的 embedding`)
    return updated
  }

  /**
   * 关键词匹配得分
   */
  private keywordScore(query: string, card: {
    name: string
    description?: string | null
    tags?: string | null
  }): number {
    const queryLower = query.toLowerCase()
    let score = 0

    // 名称匹配
    if (card.name.toLowerCase().includes(queryLower)) {
      score += 0.4
    }

    // 描述匹配
    if (card.description?.toLowerCase().includes(queryLower)) {
      score += 0.2
    }

    // 标签匹配
    if (card.tags) {
      const tags = card.tags.split(",").map(t => t.trim().toLowerCase())
      for (const tag of tags) {
        if (tag.includes(queryLower) || queryLower.includes(tag)) {
          score += 0.15
        }
      }
    }

    return Math.min(score, 1.0)
  }

  /**
   * 语义检索卡片
   */
  async searchCards(
    novelId: string,
    query: string,
    options: {
      topK?: number
      threshold?: number
      includeKeyword?: boolean
    } = {}
  ): Promise<CardSearchResult[]> {
    const { topK = 10, threshold = SIMILARITY_THRESHOLD, includeKeyword = true } = options

    // 生成查询的 embedding
    const queryEmbedding = await this.embed(query)
    const vectorStr = `[${queryEmbedding.join(",")}]`

    // 使用 pgvector 进行相似度搜索
    const results = await prisma.$queryRawUnsafe<Array<{
      id: string
      name: string
      category: string
      description: string | null
      tags: string | null
      similarity: number
    }>>(
      `SELECT
        id, name, category, description, tags,
        1 - (embedding <=> $1::vector) as similarity
      FROM cards
      WHERE novel_id = $2
        AND embedding IS NOT NULL
      ORDER BY embedding <=> $1::vector
      LIMIT $3`,
      vectorStr,
      novelId,
      topK * 2
    )

    // 混合检索：结合语义和关键词
    const scoredResults: CardSearchResult[] = results.map(r => {
      const semanticScore = r.similarity
      const kwScore = includeKeyword ? this.keywordScore(query, r) : 0
      const finalScore = semanticScore * SEMANTIC_WEIGHT + kwScore * KEYWORD_WEIGHT

      let matchType: "semantic" | "keyword" | "hybrid" = "semantic"
      if (kwScore > 0 && semanticScore > threshold) {
        matchType = "hybrid"
      } else if (kwScore > 0.3) {
        matchType = "keyword"
      }

      return {
        id: r.id,
        name: r.name,
        category: r.category,
        description: r.description,
        score: finalScore,
        matchType,
      }
    })

    // 过滤和排序
    return scoredResults
      .filter(r => r.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
  }

  /**
   * 语义检索章节摘要
   * @param beforeChapterId 只返回该章节之前的摘要（根据 order 排序）
   */
  async searchSummaries(
    novelId: string,
    query: string,
    options: {
      topK?: number
      threshold?: number
      beforeChapterId?: string
    } = {}
  ): Promise<SummarySearchResult[]> {
    const { topK = 5, threshold = SIMILARITY_THRESHOLD, beforeChapterId } = options

    const queryEmbedding = await this.embed(query)
    const vectorStr = `[${queryEmbedding.join(",")}]`

    // 如果指定了 beforeChapterId，获取该章节的 number
    let beforeNumber: number | null = null
    if (beforeChapterId) {
      const currentChapter = await prisma.chapter.findUnique({
        where: { id: beforeChapterId },
        select: { number: true },
      })
      beforeNumber = currentChapter?.number ?? null
    }

    // 构建查询条件
    let results: Array<{
      id: string
      chapter_id: string
      chapter_title: string
      summary: string
      similarity: number
    }>

    if (beforeNumber !== null) {
      // 只查询当前章节之前的摘要
      results = await prisma.$queryRawUnsafe<typeof results>(
        `SELECT
          cs.id, cs.chapter_id, c.title as chapter_title, cs.summary,
          1 - (cs.embedding <=> $1::vector) as similarity
        FROM chapter_summaries cs
        JOIN chapters c ON cs.chapter_id = c.id
        WHERE cs.novel_id = $2
          AND cs.embedding IS NOT NULL
          AND c.number < $4
        ORDER BY cs.embedding <=> $1::vector
        LIMIT $3`,
        vectorStr,
        novelId,
        topK,
        beforeNumber
      )
    } else {
      // 查询所有摘要
      results = await prisma.$queryRawUnsafe<typeof results>(
        `SELECT
          cs.id, cs.chapter_id, c.title as chapter_title, cs.summary,
          1 - (cs.embedding <=> $1::vector) as similarity
        FROM chapter_summaries cs
        JOIN chapters c ON cs.chapter_id = c.id
        WHERE cs.novel_id = $2
          AND cs.embedding IS NOT NULL
        ORDER BY cs.embedding <=> $1::vector
        LIMIT $3`,
        vectorStr,
        novelId,
        topK
      )
    }

    return results
      .filter(r => r.similarity >= threshold)
      .map(r => ({
        id: r.id,
        chapterId: r.chapter_id,
        chapterTitle: r.chapter_title,
        summary: r.summary,
        score: r.similarity,
      }))
  }
}

// 导出单例
export const embeddingService = new EmbeddingService()
