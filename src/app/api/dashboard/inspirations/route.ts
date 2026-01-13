import { NextResponse } from "next/server"
import { getRandomInspirations } from "@/lib/data/daily-inspirations"

// GET /api/dashboard/inspirations - 获取随机每日灵感
export async function GET() {
  try {
    const inspirations = getRandomInspirations(3)
    return NextResponse.json(inspirations)
  } catch (error) {
    console.error("Get inspirations error:", error)
    return NextResponse.json({ error: "获取灵感失败" }, { status: 500 })
  }
}
