import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { createNovelSchema } from "@/lib/validations/novel"
import { ZodError } from "zod"
import { createNovelCreatedActivity } from "@/lib/services/activity"
import { requireUserId } from "@/lib/auth/get-user"

// GET /api/novels - 获取小说列表
export async function GET() {
  try {
    const userId = await requireUserId()
    const novels = await prisma.novel.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: {
          select: { chapters: true },
        },
      },
    })

    return NextResponse.json(novels)
  } catch (error) {
    console.error("Get novels error:", error)
    return NextResponse.json({ error: "获取小说列表失败" }, { status: 500 })
  }
}

// POST /api/novels - 创建新小说（自动创建第一章）
export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId()
    const body = await request.json()
    const validatedData = createNovelSchema.parse(body)

    // 使用事务同时创建小说和第一章
    const novel = await prisma.novel.create({
      data: {
        userId,
        title: validatedData.title,
        description: validatedData.description || "",
        status: "active",
        chapters: {
          create: {
            number: 1,
            title: "第1章",
            content: "",
            wordCount: 0,
          },
        },
      },
      include: {
        chapters: true,
      },
    })

    // 创建动态记录
    await createNovelCreatedActivity(userId, novel.id, novel.title)

    return NextResponse.json(novel)
  } catch (error) {
    console.error("Create novel error:", error)

    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }

    return NextResponse.json({ error: "创建小说失败" }, { status: 500 })
  }
}
