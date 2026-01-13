import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireUserId } from "@/lib/auth/get-user"

// GET /api/dashboard/stats - 获取本周统计数据
export async function GET() {
  try {
    const userId = await requireUserId()

    // 计算本周开始时间（周一）
    const now = new Date()
    const dayOfWeek = now.getDay()
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // 周一为第一天
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - diff)
    weekStart.setHours(0, 0, 0, 0)

    // 获取用户所有小说的总字数
    const novels = await prisma.novel.findMany({
      where: { userId },
      select: { totalWords: true },
    })
    const totalWords = novels.reduce((sum, novel) => sum + novel.totalWords, 0)

    // 计算本周创作天数（通过章节更新时间）
    const chaptersThisWeek = await prisma.chapter.findMany({
      where: {
        novel: { userId },
        updatedAt: { gte: weekStart },
        wordCount: { gt: 0 },
      },
      select: { updatedAt: true },
    })

    // 统计不同的日期
    const uniqueDays = new Set(
      chaptersThisWeek.map((c) => c.updatedAt.toDateString())
    )
    const writingDays = uniqueDays.size

    // 格式化字数
    const formatWordCount = (count: number): string => {
      if (count >= 10000) {
        return (count / 10000).toFixed(1) + "万"
      } else if (count >= 1000) {
        return (count / 1000).toFixed(1) + "K"
      }
      return count.toString()
    }

    return NextResponse.json({
      totalWords: formatWordCount(totalWords),
      totalWordsRaw: totalWords,
      writingDays,
    })
  } catch (error) {
    console.error("Get stats error:", error)
    return NextResponse.json({ error: "获取统计失败" }, { status: 500 })
  }
}
