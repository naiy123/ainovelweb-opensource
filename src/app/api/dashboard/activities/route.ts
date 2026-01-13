import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireUserId } from "@/lib/auth/get-user"

// GET /api/dashboard/activities - 获取用户动态列表
export async function GET() {
  try {
    const userId = await requireUserId()
    const activities = await prisma.userActivity.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10, // 最近10条
    })

    return NextResponse.json(activities)
  } catch (error) {
    console.error("Get activities error:", error)
    return NextResponse.json({ error: "获取动态失败" }, { status: 500 })
  }
}
