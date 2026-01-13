import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { isValidUsername, normalizeUsername } from "@/lib/validators/username"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username } = body

    if (!username || typeof username !== "string") {
      return NextResponse.json(
        { available: false, message: "请输入用户名" },
        { status: 400 }
      )
    }

    // 验证用户名格式
    const validation = isValidUsername(username)
    if (!validation.valid) {
      return NextResponse.json(
        { available: false, message: validation.error },
        { status: 400 }
      )
    }

    // 规范化用户名（小写）
    const normalizedUsername = normalizeUsername(username)

    // 检查是否已被注册
    const existingUser = await prisma.user.findUnique({
      where: { username: normalizedUsername },
      select: { id: true },
    })

    if (existingUser) {
      return NextResponse.json({
        available: false,
        message: "该用户名已被注册",
      })
    }

    return NextResponse.json({
      available: true,
      message: "用户名可用",
    })
  } catch (error) {
    console.error("Check username error:", error)
    return NextResponse.json(
      { available: false, message: "服务器错误，请重试" },
      { status: 500 }
    )
  }
}
