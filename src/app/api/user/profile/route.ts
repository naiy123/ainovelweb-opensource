import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireUserId } from "@/lib/auth/get-user"
import { getBalance } from "@/lib/credits/service"

// GET /api/user/profile - 获取用户个人信息
export async function GET() {
  try {
    const userId = await requireUserId()

    const [user, creditBalance] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          shortId: true,
          phone: true,
          nickname: true,
          createdAt: true,
          subscription: {
            select: {
              plan: true,
              expiresAt: true,
            },
          },
          _count: {
            select: {
              novels: true,
            },
          },
        },
      }),
      getBalance(userId),
    ])

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 })
    }

    // 脱敏处理手机号
    const maskedPhone = user.phone
      ? user.phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2")
      : null

    return NextResponse.json({
      ...user,
      phone: maskedPhone,
      creditBalance,
    })
  } catch (error) {
    console.error("Get profile error:", error)
    return NextResponse.json({ error: "获取用户信息失败" }, { status: 500 })
  }
}

// PATCH /api/user/profile - 更新用户信息
export async function PATCH(request: Request) {
  try {
    const userId = await requireUserId()
    const body = await request.json()

    const { nickname } = body

    if (!nickname || typeof nickname !== "string" || nickname.trim().length === 0) {
      return NextResponse.json({ error: "昵称不能为空" }, { status: 400 })
    }

    if (nickname.length > 20) {
      return NextResponse.json({ error: "昵称不能超过20个字符" }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { nickname: nickname.trim() },
      select: {
        id: true,
        nickname: true,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error("Update profile error:", error)
    return NextResponse.json({ error: "更新用户信息失败" }, { status: 500 })
  }
}
