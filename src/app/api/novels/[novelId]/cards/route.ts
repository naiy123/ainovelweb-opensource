import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"
import { ZodError } from "zod"
import type { Prisma } from "@prisma/client"
import { requireUserId } from "@/lib/auth/get-user"
import { serializeArray, transformCard } from "@/lib/db-utils"

// 卡片分类（不导出常量，避免 Next.js 路由文件限制）
const CARD_CATEGORIES = ["character", "term", "item", "skill", "location", "faction", "event"] as const
type CardCategory = typeof CARD_CATEGORIES[number]

// 角色卡扩展字段
const characterAttributesSchema = z.object({
  gender: z.string().optional(),
  age: z.string().optional(),
  personality: z.string().optional(),
  background: z.string().optional(),
  abilities: z.string().optional(),
  relations: z.string().optional(),
})

// 创建卡片 schema（使用 nullish 接受 null 或 undefined）
const createCardSchema = z.object({
  name: z.string().min(1, "名称不能为空").max(50, "名称不能超过50字"),
  category: z.enum(CARD_CATEGORIES),
  description: z.string().max(5000, "描述不能超过5000字").nullish(),
  avatar: z.string().nullish(),
  tags: z.string().nullish(),
  triggers: z.array(z.string()).nullish(),
  isPinned: z.boolean().nullish(),
  attributes: z.record(z.string(), z.unknown()).nullish(),
})

// GET /api/novels/[novelId]/cards - 获取卡片列表
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ novelId: string }> }
) {
  try {
    const userId = await requireUserId()
    const { novelId } = await params
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")

    // 验证小说属于当前用户
    const novel = await db.novel.findUnique({
      where: { id: novelId, userId },
    })

    if (!novel) {
      return NextResponse.json({ error: "小说不存在" }, { status: 404 })
    }

    // 查询卡片列表
    const whereCondition: { novelId: string; category?: string } = { novelId }
    if (category) {
      whereCondition.category = category
    }

    const cards = await db.card.findMany({
      where: whereCondition,
      orderBy: [
        { isPinned: "desc" },
        { sortOrder: "asc" },
        { createdAt: "asc" },
      ],
    })

    // 转换 triggers 字段
    return NextResponse.json(cards.map(transformCard))
  } catch (error) {
    console.error("Get cards error:", error)
    return NextResponse.json({ error: "获取卡片列表失败" }, { status: 500 })
  }
}

// POST /api/novels/[novelId]/cards - 创建新卡片
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ novelId: string }> }
) {
  try {
    const userId = await requireUserId()
    const { novelId } = await params
    const body = await request.json()

    const validatedData = createCardSchema.parse(body)

    // 验证小说属于当前用户
    const novel = await db.novel.findUnique({
      where: { id: novelId, userId },
    })

    if (!novel) {
      return NextResponse.json({ error: "小说不存在" }, { status: 404 })
    }

    // 获取当前分类的最大 sortOrder
    const maxSortOrder = await db.card.aggregate({
      where: { novelId, category: validatedData.category },
      _max: { sortOrder: true },
    })

    const card = await db.card.create({
      data: {
        novelId,
        name: validatedData.name,
        category: validatedData.category,
        description: validatedData.description || null,
        avatar: validatedData.avatar || null,
        tags: validatedData.tags || null,
        triggers: serializeArray(validatedData.triggers),
        isPinned: validatedData.isPinned || false,
        sortOrder: (maxSortOrder._max.sortOrder || 0) + 1,
        attributes: validatedData.attributes as Prisma.InputJsonValue | undefined,
      },
    })

    return NextResponse.json(transformCard(card), { status: 201 })
  } catch (error) {
    console.error("Create card error:", error)

    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }

    return NextResponse.json({ error: "创建卡片失败" }, { status: 500 })
  }
}
