import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireUserId } from "@/lib/auth/get-user"

// GET /api/novels/[novelId] - 获取小说详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ novelId: string }> }
) {
  try {
    const userId = await requireUserId()
    const { novelId } = await params

    const novel = await db.novel.findUnique({
      where: { id: novelId, userId },
      include: {
        chapters: {
          orderBy: { number: "asc" },
        },
      },
    })

    if (!novel) {
      return NextResponse.json({ error: "小说不存在" }, { status: 404 })
    }

    return NextResponse.json(novel)
  } catch (error) {
    console.error("Get novel error:", error)
    return NextResponse.json({ error: "获取小说详情失败" }, { status: 500 })
  }
}

// PATCH /api/novels/[novelId] - 更新小说
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ novelId: string }> }
) {
  try {
    const userId = await requireUserId()
    const { novelId } = await params
    const body = await request.json()

    // 检查小说是否存在
    const existing = await db.novel.findUnique({
      where: { id: novelId, userId },
    })

    if (!existing) {
      return NextResponse.json({ error: "小说不存在" }, { status: 404 })
    }

    // 更新小说（始终验证 userId 确保权限）
    const novel = await db.novel.update({
      where: { id: novelId, userId },
      data: {
        title: body.title,
        description: body.description,
        status: body.status,
        tags: body.tags,
      },
    })

    return NextResponse.json(novel)
  } catch (error) {
    console.error("Update novel error:", error)
    return NextResponse.json({ error: "更新小说失败" }, { status: 500 })
  }
}

// DELETE /api/novels/[novelId] - 删除小说
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ novelId: string }> }
) {
  try {
    const userId = await requireUserId()
    const { novelId } = await params

    // 检查小说是否存在
    const existing = await db.novel.findUnique({
      where: { id: novelId, userId },
    })

    if (!existing) {
      return NextResponse.json({ error: "小说不存在" }, { status: 404 })
    }

    // 删除小说（始终验证 userId 确保权限，会级联删除相关章节）
    await db.novel.delete({
      where: { id: novelId, userId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete novel error:", error)
    return NextResponse.json({ error: "删除小说失败" }, { status: 500 })
  }
}
