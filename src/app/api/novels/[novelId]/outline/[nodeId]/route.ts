import { NextRequest, NextResponse } from "next/server"
import { ZodError } from "zod"
import { db } from "@/lib/db"
import { requireUserId } from "@/lib/auth/get-user"
import { updateOutlineNodeSchema } from "@/lib/validations/outline"

// GET /api/novels/[novelId]/outline/[nodeId] - 获取单个大纲节点
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ novelId: string; nodeId: string }> }
) {
  try {
    const userId = await requireUserId()
    const { novelId, nodeId } = await params

    // 验证小说归属
    const novel = await db.novel.findUnique({
      where: { id: novelId, userId },
    })

    if (!novel) {
      return NextResponse.json({ error: "小说不存在" }, { status: 404 })
    }

    // 获取节点
    const node = await db.outlineNode.findUnique({
      where: { id: nodeId, novelId },
      include: {
        children: {
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        },
      },
    })

    if (!node) {
      return NextResponse.json({ error: "大纲节点不存在" }, { status: 404 })
    }

    return NextResponse.json(node)
  } catch (error) {
    console.error("Get outline node error:", error)
    return NextResponse.json({ error: "获取大纲节点失败" }, { status: 500 })
  }
}

// PUT /api/novels/[novelId]/outline/[nodeId] - 更新大纲节点
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ novelId: string; nodeId: string }> }
) {
  try {
    const userId = await requireUserId()
    const { novelId, nodeId } = await params
    const body = await request.json()

    // 验证小说归属
    const novel = await db.novel.findUnique({
      where: { id: novelId, userId },
    })

    if (!novel) {
      return NextResponse.json({ error: "小说不存在" }, { status: 404 })
    }

    // 验证节点存在
    const existingNode = await db.outlineNode.findUnique({
      where: { id: nodeId, novelId },
    })

    if (!existingNode) {
      return NextResponse.json({ error: "大纲节点不存在" }, { status: 404 })
    }

    // 验证输入
    const validatedData = updateOutlineNodeSchema.parse(body)

    // 如果更改 parentId，验证新父节点存在且不会造成循环
    if (validatedData.parentId !== undefined) {
      if (validatedData.parentId === nodeId) {
        return NextResponse.json({ error: "不能将节点设为自己的子节点" }, { status: 400 })
      }

      if (validatedData.parentId) {
        const parent = await db.outlineNode.findUnique({
          where: { id: validatedData.parentId, novelId },
        })
        if (!parent) {
          return NextResponse.json({ error: "父节点不存在" }, { status: 400 })
        }

        // 检查是否会造成循环（父节点是当前节点的子孙）
        const isDescendant = await checkIsDescendant(nodeId, validatedData.parentId)
        if (isDescendant) {
          return NextResponse.json({ error: "不能将节点移动到其子节点下" }, { status: 400 })
        }
      }
    }

    // 如果是章纲，验证关联的章节存在
    if (existingNode.type === "chapter_outline" && validatedData.linkedChapterId) {
      const chapter = await db.chapter.findUnique({
        where: { id: validatedData.linkedChapterId, novelId },
      })
      if (!chapter) {
        return NextResponse.json({ error: "关联的章节不存在" }, { status: 400 })
      }
    }

    // 更新节点
    const updatedNode = await db.outlineNode.update({
      where: { id: nodeId },
      data: {
        ...(validatedData.title !== undefined && { title: validatedData.title }),
        ...(validatedData.content !== undefined && { content: validatedData.content }),
        ...(validatedData.type !== undefined && { type: validatedData.type }),
        ...(validatedData.sortOrder !== undefined && { sortOrder: validatedData.sortOrder }),
        ...(validatedData.parentId !== undefined && { parentId: validatedData.parentId }),
        ...(validatedData.completed !== undefined && { completed: validatedData.completed }),
        ...(validatedData.linkedChapterId !== undefined && { linkedChapterId: validatedData.linkedChapterId }),
      },
    })

    return NextResponse.json(updatedNode)
  } catch (error) {
    console.error("Update outline node error:", error)
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: "更新大纲节点失败" }, { status: 500 })
  }
}

// DELETE /api/novels/[novelId]/outline/[nodeId] - 删除大纲节点
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ novelId: string; nodeId: string }> }
) {
  try {
    const userId = await requireUserId()
    const { novelId, nodeId } = await params

    // 验证小说归属
    const novel = await db.novel.findUnique({
      where: { id: novelId, userId },
    })

    if (!novel) {
      return NextResponse.json({ error: "小说不存在" }, { status: 404 })
    }

    // 验证节点存在
    const node = await db.outlineNode.findUnique({
      where: { id: nodeId, novelId },
    })

    if (!node) {
      return NextResponse.json({ error: "大纲节点不存在" }, { status: 404 })
    }

    // 删除节点 (子节点会级联删除)
    await db.outlineNode.delete({
      where: { id: nodeId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete outline node error:", error)
    return NextResponse.json({ error: "删除大纲节点失败" }, { status: 500 })
  }
}

// 检查 targetId 是否是 nodeId 的子孙节点
async function checkIsDescendant(nodeId: string, targetId: string): Promise<boolean> {
  const children = await db.outlineNode.findMany({
    where: { parentId: nodeId },
    select: { id: true },
  })

  for (const child of children) {
    if (child.id === targetId) {
      return true
    }
    const isDescendant = await checkIsDescendant(child.id, targetId)
    if (isDescendant) {
      return true
    }
  }

  return false
}
