import { NextRequest, NextResponse } from "next/server"
import { ZodError } from "zod"
import { db } from "@/lib/db"
import { requireUserId } from "@/lib/auth/get-user"
import { createOutlineNodeSchema, getChildNodeType, type OutlineNodeType } from "@/lib/validations/outline"

interface OutlineNodeWithChildren {
  id: string
  novelId: string
  parentId: string | null
  linkedChapterId: string | null
  title: string
  content: string | null
  type: string
  sortOrder: number
  completed: boolean
  createdAt: Date
  updatedAt: Date
  children: OutlineNodeWithChildren[]
}

// GET /api/novels/[novelId]/outline - 获取大纲树
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ novelId: string }> }
) {
  try {
    const userId = await requireUserId()
    const { novelId } = await params

    // 验证小说归属
    const novel = await db.novel.findUnique({
      where: { id: novelId, userId },
    })

    if (!novel) {
      return NextResponse.json({ error: "小说不存在" }, { status: 404 })
    }

    // 获取所有大纲节点
    const nodes = await db.outlineNode.findMany({
      where: { novelId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    })

    // 构建树形结构
    const nodeMap = new Map<string, OutlineNodeWithChildren>()
    nodes.forEach((n) => nodeMap.set(n.id, { ...n, children: [] }))

    const rootNodes: OutlineNodeWithChildren[] = []

    for (const node of nodeMap.values()) {
      if (node.parentId && nodeMap.has(node.parentId)) {
        nodeMap.get(node.parentId)!.children.push(node)
      } else {
        rootNodes.push(node)
      }
    }

    return NextResponse.json(rootNodes)
  } catch (error) {
    console.error("Get outline error:", error)
    return NextResponse.json({ error: "获取大纲失败" }, { status: 500 })
  }
}

// POST /api/novels/[novelId]/outline - 创建大纲节点
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ novelId: string }> }
) {
  try {
    const userId = await requireUserId()
    const { novelId } = await params
    const body = await request.json()

    // 验证小说归属
    const novel = await db.novel.findUnique({
      where: { id: novelId, userId },
    })

    if (!novel) {
      return NextResponse.json({ error: "小说不存在" }, { status: 404 })
    }

    // 验证输入
    const validatedData = createOutlineNodeSchema.parse(body)

    // 确定节点类型（根据父节点自动推断）
    let nodeType: OutlineNodeType = "volume"
    let parentNode = null

    if (validatedData.parentId) {
      parentNode = await db.outlineNode.findUnique({
        where: { id: validatedData.parentId, novelId },
      })
      if (!parentNode) {
        return NextResponse.json({ error: "父节点不存在" }, { status: 400 })
      }
      // 情节点下不能创建子节点
      if (parentNode.type === "plot_point") {
        return NextResponse.json({ error: "情节点下不能创建子节点" }, { status: 400 })
      }
      nodeType = getChildNodeType(parentNode.type as OutlineNodeType)
    }

    // 如果是章纲，验证关联的章节存在
    if (nodeType === "chapter_outline" && validatedData.linkedChapterId) {
      const chapter = await db.chapter.findUnique({
        where: { id: validatedData.linkedChapterId, novelId },
      })
      if (!chapter) {
        return NextResponse.json({ error: "关联的章节不存在" }, { status: 400 })
      }
    }

    // 计算 sortOrder (同级节点中最大值 + 1)
    const lastNode = await db.outlineNode.findFirst({
      where: {
        novelId,
        parentId: validatedData.parentId ?? null,
      },
      orderBy: { sortOrder: "desc" },
    })
    const sortOrder = (lastNode?.sortOrder ?? -1) + 1

    // 创建节点
    const node = await db.outlineNode.create({
      data: {
        novelId,
        parentId: validatedData.parentId ?? null,
        title: validatedData.title,
        content: validatedData.content ?? null,
        type: nodeType,
        sortOrder,
        linkedChapterId: nodeType === "chapter_outline" ? (validatedData.linkedChapterId ?? null) : null,
      },
    })

    return NextResponse.json(node, { status: 201 })
  } catch (error) {
    console.error("Create outline node error:", error)
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: "创建大纲节点失败" }, { status: 500 })
  }
}
