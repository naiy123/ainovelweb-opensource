import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireUserId } from "@/lib/auth/get-user"
import { z } from "zod"

const summarySchema = z.object({
  summary: z.string().min(1, "摘要不能为空").max(2000, "摘要不能超过2000字"),
  keyPoints: z.array(z.string()).optional().default([]),
  tokenCount: z.number().optional(),
  isManual: z.boolean().optional().default(false),
})

// 辅助函数：将数组转为 JSON 字符串存储
function serializeArray(arr: string[] | null | undefined): string | null {
  if (!arr || arr.length === 0) return null
  return JSON.stringify(arr)
}

// 辅助函数：将 JSON 字符串解析为数组
function parseArray(str: string | null | undefined): string[] {
  if (!str) return []
  try {
    return JSON.parse(str)
  } catch {
    return []
  }
}

// 辅助函数：转换摘要数据
function transformSummary(summary: { keyPoints?: string | null; [key: string]: unknown }) {
  return {
    ...summary,
    keyPoints: parseArray(summary.keyPoints),
  }
}

// GET /api/novels/[novelId]/summaries/[chapterId] - 获取章节摘要
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ novelId: string; chapterId: string }> }
) {
  try {
    const userId = await requireUserId()
    const { novelId, chapterId } = await params

    // 验证小说属于当前用户
    const novel = await db.novel.findUnique({
      where: { id: novelId, userId },
    })

    if (!novel) {
      return NextResponse.json({ error: "小说不存在" }, { status: 404 })
    }

    const summary = await db.chapterSummary.findUnique({
      where: { chapterId },
    })

    if (!summary) {
      return NextResponse.json({ error: "摘要不存在" }, { status: 404 })
    }

    return NextResponse.json(transformSummary(summary))
  } catch (error) {
    console.error("Get chapter summary error:", error)
    return NextResponse.json({ error: "获取摘要失败" }, { status: 500 })
  }
}

// PUT /api/novels/[novelId]/summaries/[chapterId] - 创建或更新章节摘要
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ novelId: string; chapterId: string }> }
) {
  try {
    const userId = await requireUserId()
    const { novelId, chapterId } = await params
    const body = await request.json()

    const validatedData = summarySchema.parse(body)

    // 验证小说和章节属于当前用户
    const chapter = await db.chapter.findFirst({
      where: {
        id: chapterId,
        novelId,
        novel: { userId },
      },
    })

    if (!chapter) {
      return NextResponse.json({ error: "章节不存在" }, { status: 404 })
    }

    // upsert 摘要
    const summary = await db.chapterSummary.upsert({
      where: { chapterId },
      update: {
        summary: validatedData.summary,
        keyPoints: serializeArray(validatedData.keyPoints),
        tokenCount: validatedData.tokenCount,
        isManual: validatedData.isManual,
      },
      create: {
        novelId,
        chapterId,
        summary: validatedData.summary,
        keyPoints: serializeArray(validatedData.keyPoints),
        tokenCount: validatedData.tokenCount,
        isManual: validatedData.isManual,
      },
    })

    return NextResponse.json(transformSummary(summary))
  } catch (error) {
    console.error("Update chapter summary error:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: "更新摘要失败" }, { status: 500 })
  }
}

// DELETE /api/novels/[novelId]/summaries/[chapterId] - 删除章节摘要
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ novelId: string; chapterId: string }> }
) {
  try {
    const userId = await requireUserId()
    const { novelId, chapterId } = await params

    // 验证小说属于当前用户
    const novel = await db.novel.findUnique({
      where: { id: novelId, userId },
    })

    if (!novel) {
      return NextResponse.json({ error: "小说不存在" }, { status: 404 })
    }

    await db.chapterSummary.delete({
      where: { chapterId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete chapter summary error:", error)
    return NextResponse.json({ error: "删除摘要失败" }, { status: 500 })
  }
}
