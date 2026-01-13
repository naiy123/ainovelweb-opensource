import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireUserId } from "@/lib/auth/get-user"

// GET /api/cover/history - 获取生成历史
export async function GET(request: NextRequest) {
  try {
    const userId = await requireUserId()

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") // background, cover, 或 null (全部)
    const cursor = searchParams.get("cursor") // 分页游标
    const limit = parseInt(searchParams.get("limit") || "20")

    const where: { userId: string; type?: string } = { userId }
    if (type) {
      where.type = type
    }

    const images = await db.generatedImage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit + 1, // 多取一条用于判断是否有更多
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      select: {
        id: true,
        type: true,
        imageUrl: true,
        title: true,
        author: true,
        prompt: true,
        createdAt: true,
      },
    })

    let nextCursor: string | null = null
    if (images.length > limit) {
      const nextItem = images.pop()
      nextCursor = nextItem!.id
    }

    return NextResponse.json({
      images,
      nextCursor,
      hasMore: nextCursor !== null,
    })
  } catch (error) {
    console.error("Get cover history error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "获取历史失败" },
      { status: 500 }
    )
  }
}
