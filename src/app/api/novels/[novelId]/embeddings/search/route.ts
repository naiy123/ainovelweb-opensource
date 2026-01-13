import { NextRequest, NextResponse } from "next/server"
import { requireUserId } from "@/lib/auth/get-user"
import { prisma } from "@/lib/db"
import { embeddingService } from "@/lib/ai/embedding"

// POST /api/novels/[novelId]/embeddings/search - 语义检索预览
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ novelId: string }> }
) {
  try {
    const userId = await requireUserId()
    const { novelId } = await params
    const { query, topK = 5, currentChapterId } = await request.json()

    if (!query || query.length < 5) {
      return NextResponse.json({ error: "查询内容过短" }, { status: 400 })
    }

    // 验证小说属于当前用户
    const novel = await prisma.novel.findUnique({
      where: { id: novelId, userId },
    })

    if (!novel) {
      return NextResponse.json({ error: "小说不存在" }, { status: 404 })
    }

    // 并行执行语义检索
    // 摘要检索只返回当前章节之前的内容
    const [cards, summaries] = await Promise.all([
      embeddingService.searchCards(novelId, query, { topK, threshold: 0.3 }),
      embeddingService.searchSummaries(novelId, query, {
        topK: Math.min(topK, 5),
        threshold: 0.3,
        beforeChapterId: currentChapterId,
      }),
    ])

    return NextResponse.json({
      cards: cards.map(c => ({
        id: c.id,
        name: c.name,
        category: c.category,
        description: c.description?.slice(0, 100),
        score: Math.round(c.score * 100),
        matchType: c.matchType,
      })),
      summaries: summaries.map(s => ({
        id: s.id,
        chapterId: s.chapterId,
        chapterTitle: s.chapterTitle,
        summary: s.summary.slice(0, 100),
        score: Math.round(s.score * 100),
      })),
    })
  } catch (error) {
    console.error("Semantic search error:", error)
    return NextResponse.json({ error: "检索失败" }, { status: 500 })
  }
}
