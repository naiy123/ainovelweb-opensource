import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { updateChapterSchema } from "@/lib/validations/chapter"
import { ZodError } from "zod"
import { requireUserId } from "@/lib/auth/get-user"

// GET /api/novels/[novelId]/chapters/[chapterId] - 获取章节详情
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

    const chapter = await db.chapter.findUnique({
      where: { id: chapterId, novelId },
    })

    if (!chapter) {
      return NextResponse.json({ error: "章节不存在" }, { status: 404 })
    }

    return NextResponse.json(chapter)
  } catch (error) {
    console.error("Get chapter error:", error)
    return NextResponse.json({ error: "获取章节失败" }, { status: 500 })
  }
}

// PATCH /api/novels/[novelId]/chapters/[chapterId] - 更新章节
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ novelId: string; chapterId: string }> }
) {
  try {
    const userId = await requireUserId()
    const { novelId, chapterId } = await params
    const body = await request.json()

    const validatedData = updateChapterSchema.parse(body)

    // 验证小说属于当前用户
    const novel = await db.novel.findUnique({
      where: { id: novelId, userId },
    })

    if (!novel) {
      return NextResponse.json({ error: "小说不存在" }, { status: 404 })
    }

    const existingChapter = await db.chapter.findUnique({
      where: { id: chapterId, novelId },
    })

    if (!existingChapter) {
      return NextResponse.json({ error: "章节不存在" }, { status: 404 })
    }

    // 计算字数变化（移除 HTML 标签和空格后的纯文本长度）
    const oldWordCount = existingChapter.wordCount
    const newWordCount = validatedData.content
      ? validatedData.content.replace(/<[^>]*>/g, "").replace(/\s/g, "").length
      : oldWordCount

    // 确定状态变化
    const oldStatus = existingChapter.status
    const newStatus = validatedData.status ?? oldStatus
    const statusChanged = oldStatus !== newStatus

    // 如果状态变化，需要重新计算 number
    let newNumber = existingChapter.number
    if (statusChanged) {
      const lastChapter = await db.chapter.findFirst({
        where: { novelId, status: newStatus },
        orderBy: { number: "desc" },
      })
      newNumber = lastChapter ? lastChapter.number + 1 : 1
    }

    // 更新章节
    const chapter = await db.chapter.update({
      where: { id: chapterId },
      data: {
        ...(validatedData.title && { title: validatedData.title }),
        ...(validatedData.content && {
          content: validatedData.content,
          wordCount: newWordCount,
        }),
        ...(statusChanged && {
          status: newStatus,
          number: newNumber,
        }),
      },
    })

    // 计算总字数变化
    // 只有 published 章节计入总字数
    let totalWordsDiff = 0
    if (statusChanged) {
      if (oldStatus === "published" && newStatus === "draft") {
        // 从正文移到草稿箱：减去字数
        totalWordsDiff = -oldWordCount
      } else if (oldStatus === "draft" && newStatus === "published") {
        // 从草稿箱移到正文：加上字数
        totalWordsDiff = newWordCount
      }
    } else if (oldStatus === "published") {
      // 状态没变，只有 published 章节才计算字数差
      totalWordsDiff = newWordCount - oldWordCount
    }

    // 更新小说总字数
    if (totalWordsDiff !== 0) {
      await db.novel.update({
        where: { id: novelId },
        data: {
          totalWords: { increment: totalWordsDiff },
        },
      })
    }

    // 如果状态变化，重新排序原状态的章节
    if (statusChanged) {
      const chaptersToReorder = await db.chapter.findMany({
        where: { novelId, status: oldStatus },
        orderBy: { number: "asc" },
      })
      for (let i = 0; i < chaptersToReorder.length; i++) {
        if (chaptersToReorder[i].number !== i + 1) {
          await db.chapter.update({
            where: { id: chaptersToReorder[i].id },
            data: { number: i + 1 },
          })
        }
      }
    }

    return NextResponse.json(chapter)
  } catch (error) {
    console.error("Update chapter error:", error)

    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }

    return NextResponse.json({ error: "更新章节失败" }, { status: 500 })
  }
}
