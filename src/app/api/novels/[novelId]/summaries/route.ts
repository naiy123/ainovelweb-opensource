import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireUserId } from "@/lib/auth/get-user"

// 辅助函数：将 JSON 字符串解析为数组
function parseArray(str: string | null | undefined): string[] {
  if (!str) return []
  try {
    return JSON.parse(str)
  } catch {
    return []
  }
}

// GET /api/novels/[novelId]/summaries - 获取小说的所有章节摘要
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ novelId: string }> }
) {
  try {
    const userId = await requireUserId()
    const { novelId } = await params

    // 验证小说属于当前用户
    const novel = await db.novel.findUnique({
      where: { id: novelId, userId },
      select: { id: true, summary: true },
    })

    if (!novel) {
      return NextResponse.json({ error: "小说不存在" }, { status: 404 })
    }

    // 获取所有章节及其摘要
    const chapters = await db.chapter.findMany({
      where: { novelId, status: "published" },
      orderBy: { number: "asc" },
      select: {
        id: true,
        number: true,
        title: true,
        wordCount: true,
        summary: {
          select: {
            id: true,
            summary: true,
            keyPoints: true,
            tokenCount: true,
            isManual: true,
            updatedAt: true,
          },
        },
      },
    })

    // 转换 keyPoints 字段
    const transformedChapters = chapters.map(chapter => ({
      ...chapter,
      summary: chapter.summary ? {
        ...chapter.summary,
        keyPoints: parseArray(chapter.summary.keyPoints),
      } : null,
    }))

    return NextResponse.json({
      novelSummary: novel.summary,
      chapters: transformedChapters,
    })
  } catch (error) {
    console.error("Get summaries error:", error)
    return NextResponse.json({ error: "获取摘要失败" }, { status: 500 })
  }
}

// PUT /api/novels/[novelId]/summaries - 更新全书概要
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ novelId: string }> }
) {
  try {
    const userId = await requireUserId()
    const { novelId } = await params
    const { summary } = await request.json()

    // 验证小说属于当前用户
    const novel = await db.novel.findUnique({
      where: { id: novelId, userId },
    })

    if (!novel) {
      return NextResponse.json({ error: "小说不存在" }, { status: 404 })
    }

    await db.novel.update({
      where: { id: novelId },
      data: { summary },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Update novel summary error:", error)
    return NextResponse.json({ error: "更新全书概要失败" }, { status: 500 })
  }
}
