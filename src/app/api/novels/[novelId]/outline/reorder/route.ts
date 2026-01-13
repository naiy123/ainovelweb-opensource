import { NextRequest, NextResponse } from "next/server"
import { ZodError } from "zod"
import { prisma } from "@/lib/db"
import { requireUserId } from "@/lib/auth/get-user"
import { reorderOutlineNodesSchema } from "@/lib/validations/outline"

// PATCH /api/novels/[novelId]/outline/reorder - 批量重排序大纲节点
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ novelId: string }> }
) {
  try {
    const userId = await requireUserId()
    const { novelId } = await params
    const body = await request.json()

    // 验证小说归属
    const novel = await prisma.novel.findUnique({
      where: { id: novelId, userId },
    })

    if (!novel) {
      return NextResponse.json({ error: "小说不存在" }, { status: 404 })
    }

    // 验证输入
    const validatedData = reorderOutlineNodesSchema.parse(body)

    // 验证所有节点都属于这本小说
    const nodeIds = validatedData.updates.map((u) => u.id)
    const existingNodes = await prisma.outlineNode.findMany({
      where: { id: { in: nodeIds }, novelId },
      select: { id: true },
    })

    if (existingNodes.length !== nodeIds.length) {
      return NextResponse.json({ error: "部分节点不存在或不属于此小说" }, { status: 400 })
    }

    // 批量更新
    await prisma.$transaction(
      validatedData.updates.map((update) =>
        prisma.outlineNode.update({
          where: { id: update.id },
          data: {
            sortOrder: update.sortOrder,
            ...(update.parentId !== undefined && { parentId: update.parentId }),
          },
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Reorder outline nodes error:", error)
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: "重排序大纲节点失败" }, { status: 500 })
  }
}
