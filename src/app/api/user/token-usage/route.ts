import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireUserId } from "@/lib/auth/get-user"

// GET /api/user/token-usage - 获取用户 Token 使用统计
export async function GET() {
  try {
    const userId = await requireUserId()

    // 聚合查询用户的所有 token 消耗
    const stats = await prisma.aIGenerationLog.aggregate({
      where: { userId },
      _sum: {
        inputTokens: true,
        outputTokens: true,
        thoughtsTokens: true,
        totalTokens: true,
      },
      _count: {
        id: true,
      },
    })

    // 获取今日统计
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayStats = await prisma.aIGenerationLog.aggregate({
      where: {
        userId,
        createdAt: { gte: today },
      },
      _sum: {
        inputTokens: true,
        outputTokens: true,
        thoughtsTokens: true,
        totalTokens: true,
      },
      _count: {
        id: true,
      },
    })

    // 获取本月统计
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

    const monthStats = await prisma.aIGenerationLog.aggregate({
      where: {
        userId,
        createdAt: { gte: monthStart },
      },
      _sum: {
        inputTokens: true,
        outputTokens: true,
        thoughtsTokens: true,
        totalTokens: true,
      },
      _count: {
        id: true,
      },
    })

    // 计算预估费用（基于 Gemini 2.5 Flash 价格）
    const calculateCost = (input: number, output: number) => {
      // 输入: $0.30/M, 输出: $2.50/M
      return (input * 0.30 + output * 2.50) / 1000000
    }

    return NextResponse.json({
      total: {
        inputTokens: stats._sum.inputTokens || 0,
        outputTokens: stats._sum.outputTokens || 0,
        thoughtsTokens: stats._sum.thoughtsTokens || 0,
        totalTokens: stats._sum.totalTokens || 0,
        count: stats._count.id,
        estimatedCost: calculateCost(
          stats._sum.inputTokens || 0,
          stats._sum.outputTokens || 0
        ),
      },
      today: {
        inputTokens: todayStats._sum.inputTokens || 0,
        outputTokens: todayStats._sum.outputTokens || 0,
        thoughtsTokens: todayStats._sum.thoughtsTokens || 0,
        totalTokens: todayStats._sum.totalTokens || 0,
        count: todayStats._count.id,
        estimatedCost: calculateCost(
          todayStats._sum.inputTokens || 0,
          todayStats._sum.outputTokens || 0
        ),
      },
      month: {
        inputTokens: monthStats._sum.inputTokens || 0,
        outputTokens: monthStats._sum.outputTokens || 0,
        thoughtsTokens: monthStats._sum.thoughtsTokens || 0,
        totalTokens: monthStats._sum.totalTokens || 0,
        count: monthStats._count.id,
        estimatedCost: calculateCost(
          monthStats._sum.inputTokens || 0,
          monthStats._sum.outputTokens || 0
        ),
      },
    })
  } catch (error) {
    console.error("Get token usage error:", error)
    return NextResponse.json({ error: "获取 Token 使用统计失败" }, { status: 500 })
  }
}
