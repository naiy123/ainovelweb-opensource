import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireUserId } from "@/lib/auth/get-user"

// GET /api/user/profile - 获取用户个人信息
export async function GET() {
  try {
    const userId = await requireUserId()

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        shortId: true,
        nickname: true,
        createdAt: true,
        _count: {
          select: {
            novels: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 })
    }

    return NextResponse.json(user)
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

    const user = await db.user.update({
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
