import { NextRequest } from "next/server"
import { getTextProvider, type TokenUsage } from "@/lib/ai"
import { buildChapterSystemPrompt, buildChapterUserPrompt, type MatchedCard, type ChapterSummaryInfo } from "@/lib/ai/prompts/chapter"
import { generateChapterSchema } from "@/lib/validations/chapter"
import { ZodError } from "zod"
import { requireUserId } from "@/lib/auth/get-user"
import { prisma } from "@/lib/db"
import { rateLimit } from "@/lib/rate-limit"
import { sanitizePromptInput, validateOrigin } from "@/lib/security"
import { getModelConfig, calculateLinkedChaptersCredits } from "@/lib/ai/models"
import { checkCredits, consumeCredits } from "@/lib/credits"
import { logStreamComplete } from "@/lib/ai/logger"
import { embeddingService } from "@/lib/ai/embedding"
import type { CharacterAttributes } from "@/hooks/use-cards"

/**
 * 根据触发词匹配卡片
 * @param text 要匹配的文本（章节剧情、故事背景等）
 * @param cards 所有卡片
 * @returns 匹配到的卡片
 */
function matchCardsByTriggers(
  text: string,
  cards: { id: string; name: string; category: string; description: string | null; triggers: string[]; attributes: unknown }[]
): MatchedCard[] {
  if (!text || cards.length === 0) return []

  const matched: MatchedCard[] = []
  const matchedIds = new Set<string>()

  for (const card of cards) {
    // 跳过没有触发词的卡片
    if (!card.triggers || card.triggers.length === 0) continue

    // 检查任意触发词是否在文本中出现
    const isMatched = card.triggers.some(trigger => {
      if (!trigger) return false
      return text.includes(trigger)
    })

    if (isMatched && !matchedIds.has(card.id)) {
      matchedIds.add(card.id)
      const attrs = card.attributes as CharacterAttributes | null

      matched.push({
        name: card.name,
        category: card.category as "character" | "term",
        description: card.description || undefined,
        gender: attrs?.gender,
        age: attrs?.age,
        personality: attrs?.personality,
        background: attrs?.background,
        abilities: attrs?.abilities,
      })
    }
  }

  return matched
}

// POST /api/novels/[novelId]/chapters/generate - AI 流式生成内容
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ novelId: string }> }
) {
  try {
    // CSRF 验证
    if (!validateOrigin(request)) {
      return Response.json({ error: "Invalid request origin" }, { status: 403 })
    }

    // 获取用户 ID（必须登录）
    const userId = await requireUserId()

    // 速率限制：每用户每分钟 3 次（章节生成消耗较大）
    const rateLimitKey = `ai:chapter:${userId}`
    const rateLimitResult = await rateLimit(rateLimitKey, 3, 60)
    if (!rateLimitResult.success) {
      return Response.json(
        { error: `请求过于频繁，请 ${rateLimitResult.resetIn} 秒后重试` },
        { status: 429 }
      )
    }

    const { novelId } = await params
    const body = await request.json()

    // 验证输入
    const validatedData = generateChapterSchema.parse(body)

    // 清理用户输入
    const sanitizedData = {
      ...validatedData,
      storyBackground: sanitizePromptInput(validatedData.storyBackground || "", 2000),
      chapterPlot: sanitizePromptInput(validatedData.chapterPlot || "", 2000),
      writingStyle: sanitizePromptInput(validatedData.writingStyle || "", 500),
    }

    // 获取模型配置
    const modelConfig = getModelConfig(validatedData.aiModel || "balanced")
    const baseCredits = modelConfig.credits

    // 计算关联章节的额外费用
    let linkedChaptersCredits = 0
    let linkedChaptersChars = 0
    if (validatedData.linkedChapters && validatedData.linkedChapters.length > 0) {
      linkedChaptersChars = validatedData.linkedChapters.reduce(
        (sum, ch) => sum + (ch.content?.length || 0),
        0
      )
      if (linkedChaptersChars > 0) {
        linkedChaptersCredits = calculateLinkedChaptersCredits(
          linkedChaptersChars,
          validatedData.aiModel || "balanced"
        )
      }
    }

    // 总费用 = 基础费用 + 关联章节费用
    const requiredCredits = baseCredits + linkedChaptersCredits

    // 检查余额
    const { sufficient, balance } = await checkCredits(userId, requiredCredits)
    if (!sufficient) {
      return Response.json(
        { error: `灵感点不足，需要 ${requiredCredits} 点，当前余额 ${balance} 点` },
        { status: 402 }
      )
    }

    // 扣费（流式 API 不退款，扣费后即视为消费）
    const description = linkedChaptersCredits > 0
      ? `章节生成 (${modelConfig.name}) + 关联${validatedData.linkedChapters?.length}章`
      : `章节生成 (${modelConfig.name})`

    const consumeResult = await consumeCredits({
      userId,
      amount: requiredCredits,
      category: "chapter",
      description,
    })

    if (!consumeResult.success) {
      return Response.json(
        { error: consumeResult.error || "扣费失败" },
        { status: 402 }
      )
    }
    console.log(`💰 扣费成功: ${requiredCredits}点 (基础${baseCredits} + 关联${linkedChaptersCredits}), 余额: ${consumeResult.balance}`)

    console.log("📝 AI 生成请求:", {
      model: modelConfig.name,
      baseCredits,
      linkedChaptersCredits,
      linkedChaptersChars,
      totalCredits: requiredCredits,
      chapterPlot: sanitizedData.chapterPlot?.slice(0, 50) + "...",
      wordCount: sanitizedData.wordCount,
    })

    // 获取小说摘要
    const novel = await prisma.novel.findUnique({
      where: { id: novelId },
      select: { summary: true },
    })

    // 用于语义检索的查询文本
    const searchQuery = [
      sanitizedData.chapterPlot,
      sanitizedData.storyBackground,
    ].filter(Boolean).join("\n")

    // 并行执行：语义检索卡片和摘要
    let semanticCards: Awaited<ReturnType<typeof embeddingService.searchCards>> = []
    let semanticSummaries: Awaited<ReturnType<typeof embeddingService.searchSummaries>> = []

    // 用户排除的 ID（从上下文预览中手动移除的）
    const excludedCardIds = new Set(validatedData.excludedCardIds || [])
    const excludedSummaryIds = new Set(validatedData.excludedSummaryIds || [])

    if (searchQuery.length > 10) {
      try {
        // 语义检索（如果有 embedding）
        const [cardsResult, summariesResult] = await Promise.allSettled([
          embeddingService.searchCards(novelId, searchQuery, { topK: 8, threshold: 0.4 }),
          embeddingService.searchSummaries(novelId, searchQuery, { topK: 5, threshold: 0.4 }),
        ])

        if (cardsResult.status === "fulfilled") {
          // 过滤掉用户排除的卡片
          semanticCards = cardsResult.value.filter(c => !excludedCardIds.has(c.id))
        }
        if (summariesResult.status === "fulfilled") {
          // 过滤掉用户排除的摘要
          semanticSummaries = summariesResult.value.filter(s => !excludedSummaryIds.has(s.id))
        }
      } catch (err) {
        console.warn("语义检索失败，使用回退方案:", err)
      }
    }

    // 获取语义检索匹配的卡片详情
    const semanticCardIds = new Set(semanticCards.map(c => c.id))
    let matchedCards: MatchedCard[] = semanticCards.map(c => ({
      name: c.name,
      category: c.category as "character" | "term",
      description: c.description || undefined,
    }))

    // 回退：如果语义检索没有结果，使用触发词匹配
    if (matchedCards.length === 0) {
      const cardsWithTriggers = await prisma.card.findMany({
        where: {
          novelId,
          triggers: { isEmpty: false },
        },
        select: {
          id: true,
          name: true,
          category: true,
          description: true,
          triggers: true,
          attributes: true,
        },
      })

      matchedCards = matchCardsByTriggers(searchQuery, cardsWithTriggers)
    } else {
      // 补充：对于语义匹配的卡片，获取完整的 attributes
      const fullCards = await prisma.card.findMany({
        where: { id: { in: Array.from(semanticCardIds) } },
        select: { id: true, attributes: true },
      })
      const attrMap = new Map(fullCards.map(c => [c.id, c.attributes]))

      matchedCards = semanticCards.map(c => {
        const attrs = attrMap.get(c.id) as CharacterAttributes | null
        return {
          name: c.name,
          category: c.category as "character" | "term",
          description: c.description || undefined,
          gender: attrs?.gender,
          age: attrs?.age,
          personality: attrs?.personality,
          background: attrs?.background,
          abilities: attrs?.abilities,
        }
      })
    }

    // 章节摘要：优先使用语义检索结果，回退到最近章节
    let summaryInfos: ChapterSummaryInfo[] = []

    if (semanticSummaries.length > 0) {
      // 使用语义检索结果
      summaryInfos = semanticSummaries.map(s => ({
        title: s.chapterTitle,
        summary: s.summary,
      }))
    } else {
      // 回退：获取最近的章节摘要（最多10章）
      const chapterSummaries = await prisma.chapterSummary.findMany({
        where: { novelId },
        include: {
          chapter: {
            select: { title: true, createdAt: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      })

      summaryInfos = chapterSummaries
        .reverse()
        .map(s => ({
          title: s.chapter.title,
          summary: s.summary,
        }))
    }

    console.log("📚 上下文注入:", {
      novelSummary: novel?.summary ? "有" : "无",
      chapterSummaries: summaryInfos.length,
      matchedCards: matchedCards.length,
      matchedCardNames: matchedCards.map(c => c.name),
      semanticSearch: semanticCards.length > 0 || semanticSummaries.length > 0,
      excludedCards: excludedCardIds.size,
      excludedSummaries: excludedSummaryIds.size,
    })

    // 构建 Prompt
    const chapterInput = {
      storyBackground: sanitizedData.storyBackground,
      chapterPlot: sanitizedData.chapterPlot,
      writingStyle: sanitizedData.writingStyle,
      wordCount: sanitizedData.wordCount,
      characters: sanitizedData.characters,
      terms: sanitizedData.terms,
      characterRelations: sanitizedData.characterRelations,
      linkedChapters: validatedData.linkedChapters,
      // 新增：摘要上下文
      novelSummary: novel?.summary || undefined,
      chapterSummaries: summaryInfos.length > 0 ? summaryInfos : undefined,
      matchedCards: matchedCards.length > 0 ? matchedCards : undefined,
    }

    const systemPrompt = buildChapterSystemPrompt(chapterInput)
    const userPrompt = buildChapterUserPrompt(chapterInput)

    // 获取 Text Provider
    const textProvider = getTextProvider()

    // 创建流式响应
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const startTime = Date.now()
          let tokenUsage: TokenUsage | null = null
          let generatedContent = ""
          let thinkingContent = ""

          // 先发送扣费信息，让前端立即更新余额
          const creditData = JSON.stringify({
            type: "credit",
            credits: requiredCredits,
            balance: consumeResult.balance
          })
          controller.enqueue(encoder.encode(`data: ${creditData}\n\n`))

          // 使用新架构调用 AI 流式生成
          const generator = textProvider.generateStream({
            model: modelConfig.model,
            systemPrompt,
            userPrompt,
            maxTokens: sanitizedData.wordCount * 2 + (modelConfig.thinking ? 2000 : 0),
            thinking: modelConfig.thinking ? {
              enabled: true,
              budget: 2000,
              includeInResponse: true,
            } : undefined,
          })

          for await (const chunk of generator) {
            // 收集生成内容和思考内容
            if (chunk.type === "content" && chunk.text) {
              generatedContent += chunk.text
              // 发送 SSE 格式数据（保持与旧接口兼容的格式）
              const data = JSON.stringify({ type: "content", text: chunk.text })
              controller.enqueue(encoder.encode(`data: ${data}\n\n`))
            } else if (chunk.type === "thinking" && chunk.text) {
              thinkingContent += chunk.text
              const data = JSON.stringify({ type: "thinking", text: chunk.text })
              controller.enqueue(encoder.encode(`data: ${data}\n\n`))
            } else if (chunk.type === "usage" && chunk.usage) {
              tokenUsage = chunk.usage
              // 转换为旧格式兼容前端
              const data = JSON.stringify({
                type: "usage",
                usage: {
                  promptTokenCount: chunk.usage.inputTokens,
                  candidatesTokenCount: chunk.usage.outputTokens,
                  thoughtsTokenCount: chunk.usage.thinkingTokens,
                  cachedContentTokenCount: chunk.usage.cachedTokens,
                  totalTokenCount: chunk.usage.totalTokens,
                }
              })
              controller.enqueue(encoder.encode(`data: ${data}\n\n`))
            }
          }

          const durationMs = Date.now() - startTime

          // 打印完成日志
          logStreamComplete({
            title: `章节生成 (${modelConfig.name})`,
            durationMs,
            generatedContentLength: generatedContent.length,
            usage: tokenUsage ? {
              promptTokenCount: tokenUsage.inputTokens,
              candidatesTokenCount: tokenUsage.outputTokens,
              thoughtsTokenCount: tokenUsage.thinkingTokens,
              cachedContentTokenCount: tokenUsage.cachedTokens,
              totalTokenCount: tokenUsage.totalTokens,
            } : undefined,
            thinkingContent: thinkingContent || undefined,
          })

          // 发送完成信号
          controller.enqueue(encoder.encode(`data: {"type":"done"}\n\n`))

          // 保存 token 统计到数据库
          if (tokenUsage) {
            try {
              await prisma.aIGenerationLog.create({
                data: {
                  userId,
                  novelId,
                  aiModel: modelConfig.model,
                  storyBackground: sanitizedData.storyBackground,
                  chapterPlot: sanitizedData.chapterPlot,
                  writingStyle: sanitizedData.writingStyle,
                  characterRelations: sanitizedData.characterRelations,
                  linkedCardIds: [
                    ...(sanitizedData.characters?.map(c => c.name) || []),
                    ...(sanitizedData.terms?.map(t => t.name) || []),
                  ].join(",") || null,
                  inputTokens: tokenUsage.inputTokens,
                  outputTokens: tokenUsage.outputTokens,
                  thoughtsTokens: tokenUsage.thinkingTokens || null,
                  totalTokens: tokenUsage.totalTokens,
                  thinking: thinkingContent || null,
                  generatedContent: generatedContent || null,
                },
              })
              console.log("📊 Token 统计已保存:", {
                input: tokenUsage.inputTokens,
                output: tokenUsage.outputTokens,
                total: tokenUsage.totalTokens,
              })
            } catch (dbError) {
              console.error("保存 token 统计失败:", dbError)
            }
          }

          controller.close()
        } catch (error) {
          console.error("Stream error:", error)

          // 流式 API 不退款（防止用户断开连接骗取退款）
          const errorData = JSON.stringify({
            type: "error",
            message: error instanceof Error ? error.message : "生成失败"
          })
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    })
  } catch (error) {
    console.error("Generate content error:", error)

    if (error instanceof ZodError) {
      return Response.json({ error: error.issues }, { status: 400 })
    }

    return Response.json({ error: "生成失败，请稍后重试" }, { status: 500 })
  }
}
