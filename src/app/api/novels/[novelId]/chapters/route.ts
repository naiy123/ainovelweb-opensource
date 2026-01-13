import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { ZodError } from "zod"
import { requireUserId } from "@/lib/auth/get-user"

const createChapterSchema = z.object({
  title: z.string().min(1, "章节标题不能为空").max(100, "标题不能超过100字"),
  content: z.string().default(""),
  status: z.enum(["published", "draft"]).default("published"),
})

// GET /api/novels/[novelId]/chapters - 获取章节列表
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

    const chapters = await prisma.chapter.findMany({
      where: { novelId },
      orderBy: { number: "asc" },
    })

    return NextResponse.json(chapters)
  } catch (error) {
    console.error("Get chapters error:", error)
    return NextResponse.json({ error: "获取章节列表失败" }, { status: 500 })
  }
}

// POST /api/novels/[novelId]/chapters - 创建新章节
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ novelId: string }> }
) {
  try {
    const userId = await requireUserId()
    const { novelId } = await params
    const body = await request.json()

    const validatedData = createChapterSchema.parse(body)

    // 验证小说属于当前用户
    const novel = await prisma.novel.findUnique({
      where: { id: novelId, userId },
    })

    if (!novel) {
      return NextResponse.json({ error: "小说不存在" }, { status: 404 })
    }

    // 根据 status 计算新章节序号（published 和 draft 分开排序）
    const lastChapter = await prisma.chapter.findFirst({
      where: { novelId, status: validatedData.status },
      orderBy: { number: "desc" },
    })
    const nextNumber = lastChapter ? lastChapter.number + 1 : 1

    // 计算字数（移除 HTML 标签和空格后的纯文本长度）
    const wordCount = validatedData.content.replace(/<[^>]*>/g, "").replace(/\s/g, "").length

    // 创建章节
    const chapter = await prisma.chapter.create({
      data: {
        novelId,
        number: nextNumber,
        title: validatedData.title,
        content: validatedData.content,
        wordCount,
        status: validatedData.status,
      },
    })

    // 只有 published 章节才计入总字数
    if (wordCount > 0 && validatedData.status === "published") {
      await prisma.novel.update({
        where: { id: novelId },
        data: {
          totalWords: { increment: wordCount },
        },
      })
    }

    return NextResponse.json(chapter, { status: 201 })
  } catch (error) {
    console.error("Create chapter error:", error)

    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }

    return NextResponse.json({ error: "创建章节失败" }, { status: 500 })
  }
}
