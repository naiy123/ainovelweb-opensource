import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { ZodError } from "zod"
import type { Prisma } from "@prisma/client"
import { requireUserId } from "@/lib/auth/get-user"
import { embeddingService } from "@/lib/ai/embedding"

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
    const novel = await prisma.novel.findUnique({
      where: { id: novelId, userId },
    })

    if (!novel) {
      return NextResponse.json({ error: "小说不存在" }, { status: 404 })
    }

    // 使用原始 SQL 查询以获取 embedding 状态
    const cards = await prisma.$queryRawUnsafe<Array<{
      id: string
      novel_id: string
      name: string
      category: string
      description: string | null
      avatar: string | null
      tags: string | null
      triggers: string[]
      sort_order: number
      is_pinned: boolean
      attributes: unknown
      has_embedding: boolean
      created_at: Date
      updated_at: Date
    }>>(`
      SELECT
        id, novel_id, name, category, description, avatar, tags, triggers,
        sort_order, is_pinned, attributes,
        embedding IS NOT NULL as has_embedding,
        created_at, updated_at
      FROM cards
      WHERE novel_id = $1 ${category ? 'AND category = $2' : ''}
      ORDER BY is_pinned DESC, sort_order ASC, created_at ASC
    `, novelId, ...(category ? [category] : []))

    // 转换字段名为 camelCase
    const formattedCards = cards.map(card => ({
      id: card.id,
      novelId: card.novel_id,
      name: card.name,
      category: card.category,
      description: card.description,
      avatar: card.avatar,
      tags: card.tags,
      triggers: card.triggers || [],
      sortOrder: card.sort_order,
      isPinned: card.is_pinned,
      attributes: card.attributes,
      hasEmbedding: card.has_embedding,
      createdAt: card.created_at,
      updatedAt: card.updated_at,
    }))

    return NextResponse.json(formattedCards)
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
    const novel = await prisma.novel.findUnique({
      where: { id: novelId, userId },
    })

    if (!novel) {
      return NextResponse.json({ error: "小说不存在" }, { status: 404 })
    }

    // 获取当前分类的最大 sortOrder
    const maxSortOrder = await prisma.card.aggregate({
      where: { novelId, category: validatedData.category },
      _max: { sortOrder: true },
    })

    const card = await prisma.card.create({
      data: {
        novelId,
        name: validatedData.name,
        category: validatedData.category,
        description: validatedData.description || null,
        avatar: validatedData.avatar || null,
        tags: validatedData.tags || null,
        isPinned: validatedData.isPinned || false,
        sortOrder: (maxSortOrder._max.sortOrder || 0) + 1,
        attributes: validatedData.attributes as Prisma.InputJsonValue | undefined,
      },
    })

    // 异步生成 embedding（不阻塞响应）
    embeddingService.updateCardEmbedding(card.id).catch(err => {
      console.error("生成卡片 embedding 失败:", err)
    })

    return NextResponse.json(card, { status: 201 })
  } catch (error) {
    console.error("Create card error:", error)

    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }

    return NextResponse.json({ error: "创建卡片失败" }, { status: 500 })
  }
}
