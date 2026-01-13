import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { ZodError } from "zod"
import { requireUserId } from "@/lib/auth/get-user"
import { embeddingService } from "@/lib/ai/embedding"

const CARD_CATEGORIES = ["character", "term", "item", "skill", "location", "faction", "event"] as const

// 更新卡片 schema
const updateCardSchema = z.object({
  name: z.string().min(1, "名称不能为空").max(50, "名称不能超过50字").optional(),
  category: z.enum(CARD_CATEGORIES).optional(),
  description: z.string().max(5000, "描述不能超过5000字").optional().nullable(),
  avatar: z.string().optional().nullable(),
  tags: z.string().optional().nullable(),
  isPinned: z.boolean().optional(),
  sortOrder: z.number().optional(),
  attributes: z.record(z.string(), z.unknown()).optional().nullable(),
})

// GET /api/novels/[novelId]/cards/[cardId] - 获取卡片详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ novelId: string; cardId: string }> }
) {
  try {
    const userId = await requireUserId()
    const { novelId, cardId } = await params

    // 验证小说属于当前用户
    const novel = await prisma.novel.findUnique({
      where: { id: novelId, userId },
    })

    if (!novel) {
      return NextResponse.json({ error: "小说不存在" }, { status: 404 })
    }

    const card = await prisma.card.findUnique({
      where: { id: cardId, novelId },
    })

    if (!card) {
      return NextResponse.json({ error: "卡片不存在" }, { status: 404 })
    }

    return NextResponse.json(card)
  } catch (error) {
    console.error("Get card error:", error)
    return NextResponse.json({ error: "获取卡片失败" }, { status: 500 })
  }
}

// PUT /api/novels/[novelId]/cards/[cardId] - 更新卡片
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ novelId: string; cardId: string }> }
) {
  try {
    const userId = await requireUserId()
    const { novelId, cardId } = await params
    const body = await request.json()

    const validatedData = updateCardSchema.parse(body)

    // 验证小说属于当前用户
    const novel = await prisma.novel.findUnique({
      where: { id: novelId, userId },
    })

    if (!novel) {
      return NextResponse.json({ error: "小说不存在" }, { status: 404 })
    }

    // 检查卡片是否存在
    const existingCard = await prisma.card.findUnique({
      where: { id: cardId, novelId },
    })

    if (!existingCard) {
      return NextResponse.json({ error: "卡片不存在" }, { status: 404 })
    }

    // 构建更新数据，处理 attributes 的 null 值
    const updateData: Record<string, unknown> = {}
    if (validatedData.name !== undefined) updateData.name = validatedData.name
    if (validatedData.category !== undefined) updateData.category = validatedData.category
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (validatedData.avatar !== undefined) updateData.avatar = validatedData.avatar
    if (validatedData.tags !== undefined) updateData.tags = validatedData.tags
    if (validatedData.isPinned !== undefined) updateData.isPinned = validatedData.isPinned
    if (validatedData.sortOrder !== undefined) updateData.sortOrder = validatedData.sortOrder
    if (validatedData.attributes !== undefined) {
      updateData.attributes = validatedData.attributes === null ? undefined : validatedData.attributes
    }

    const card = await prisma.card.update({
      where: { id: cardId },
      data: updateData,
    })

    // 异步更新 embedding（不阻塞响应）
    if (validatedData.name !== undefined || validatedData.description !== undefined || validatedData.tags !== undefined) {
      embeddingService.updateCardEmbedding(cardId).catch(err => {
        console.error("更新卡片 embedding 失败:", err)
      })
    }

    return NextResponse.json(card)
  } catch (error) {
    console.error("Update card error:", error)

    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }

    return NextResponse.json({ error: "更新卡片失败" }, { status: 500 })
  }
}

// DELETE /api/novels/[novelId]/cards/[cardId] - 删除卡片
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ novelId: string; cardId: string }> }
) {
  try {
    const userId = await requireUserId()
    const { novelId, cardId } = await params

    // 验证小说属于当前用户
    const novel = await prisma.novel.findUnique({
      where: { id: novelId, userId },
    })

    if (!novel) {
      return NextResponse.json({ error: "小说不存在" }, { status: 404 })
    }

    // 检查卡片是否存在
    const existingCard = await prisma.card.findUnique({
      where: { id: cardId, novelId },
    })

    if (!existingCard) {
      return NextResponse.json({ error: "卡片不存在" }, { status: 404 })
    }

    await prisma.card.delete({
      where: { id: cardId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete card error:", error)
    return NextResponse.json({ error: "删除卡片失败" }, { status: 500 })
  }
}
