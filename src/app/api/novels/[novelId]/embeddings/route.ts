import { NextRequest, NextResponse } from "next/server"
import { requireUserId } from "@/lib/auth/get-user"
import { prisma } from "@/lib/db"
import { embeddingService } from "@/lib/ai/embedding"

// POST /api/novels/[novelId]/embeddings - 批量更新小说的所有 embedding
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ novelId: string }> }
) {
  try {
    const userId = await requireUserId()
    const { novelId } = await params

    // 验证小说属于当前用户
    const novel = await prisma.novel.findUnique({
      where: { id: novelId, userId },
      select: { id: true, title: true },
    })

    if (!novel) {
      return NextResponse.json({ error: "小说不存在" }, { status: 404 })
    }

    // 统计需要更新的数据
    const [cardCount, summaryCount] = await Promise.all([
      prisma.card.count({ where: { novelId } }),
      prisma.chapterSummary.count({ where: { novelId } }),
    ])

    if (cardCount === 0 && summaryCount === 0) {
      return NextResponse.json({
        success: true,
        message: "没有需要更新的数据",
        cards: { total: 0, updated: 0 },
        summaries: { total: 0, updated: 0 },
      })
    }

    // 执行批量更新（这是一个耗时操作）
    console.log(`🔄 开始批量更新 embedding: ${novel.title}`)
    console.log(`   - 卡片: ${cardCount} 个`)
    console.log(`   - 摘要: ${summaryCount} 个`)

    const [cardsUpdated, summariesUpdated] = await Promise.all([
      embeddingService.updateNovelCardEmbeddings(novelId),
      embeddingService.updateNovelSummaryEmbeddings(novelId),
    ])

    console.log(`✅ 批量更新完成:`)
    console.log(`   - 卡片: ${cardsUpdated}/${cardCount}`)
    console.log(`   - 摘要: ${summariesUpdated}/${summaryCount}`)

    return NextResponse.json({
      success: true,
      message: "Embedding 更新完成",
      cards: { total: cardCount, updated: cardsUpdated },
      summaries: { total: summaryCount, updated: summariesUpdated },
    })
  } catch (error) {
    console.error("Batch update embeddings error:", error)
    return NextResponse.json({ error: "批量更新失败" }, { status: 500 })
  }
}

// GET /api/novels/[novelId]/embeddings - 获取 embedding 状态
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ novelId: string }> }
) {
  try {
    const userId = await requireUserId()
    const { novelId } = await params

    // 验证小说属于当前用户
    const novel = await prisma.novel.findUnique({
      where: { id: novelId, userId },
    })

    if (!novel) {
      return NextResponse.json({ error: "小说不存在" }, { status: 404 })
    }

    // 统计 embedding 状态
    // 使用原始 SQL 查询因为 Prisma 不支持直接查询 Unsupported 字段
    const [cardStats, summaryStats] = await Promise.all([
      prisma.$queryRaw<[{ total: bigint; with_embedding: bigint }]>`
        SELECT
          COUNT(*) as total,
          COUNT(embedding) as with_embedding
        FROM cards
        WHERE novel_id = ${novelId}
      `,
      prisma.$queryRaw<[{ total: bigint; with_embedding: bigint }]>`
        SELECT
          COUNT(*) as total,
          COUNT(embedding) as with_embedding
        FROM chapter_summaries
        WHERE novel_id = ${novelId}
      `,
    ])

    return NextResponse.json({
      cards: {
        total: Number(cardStats[0].total),
        withEmbedding: Number(cardStats[0].with_embedding),
        percentage: cardStats[0].total > 0
          ? Math.round(Number(cardStats[0].with_embedding) / Number(cardStats[0].total) * 100)
          : 0,
      },
      summaries: {
        total: Number(summaryStats[0].total),
        withEmbedding: Number(summaryStats[0].with_embedding),
        percentage: summaryStats[0].total > 0
          ? Math.round(Number(summaryStats[0].with_embedding) / Number(summaryStats[0].total) * 100)
          : 0,
      },
    })
  } catch (error) {
    console.error("Get embedding status error:", error)
    return NextResponse.json({ error: "获取状态失败" }, { status: 500 })
  }
}
