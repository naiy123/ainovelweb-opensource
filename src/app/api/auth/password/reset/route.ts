import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { prisma } from "@/lib/db"
import { hashPassword } from "@/lib/auth/password"
import { normalizeUsername } from "@/lib/validators/username"
import { isValidPassword, isPasswordSameAsUsername } from "@/lib/validators/password"
import { verifySmsCode } from "@/lib/aliyun-sms"
import { rateLimit } from "@/lib/rate-limit"

/**
 * 获取客户端 IP
 */
function getClientIp(headersList: Headers): string {
  const forwardedFor = headersList.get("x-forwarded-for")
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim()
  }
  return headersList.get("x-real-ip") || "unknown"
}

export async function POST(request: Request) {
  try {
    const headersList = await headers()
    const ip = getClientIp(headersList)

    // IP 速率限制
    const ipLimit = await rateLimit(`password-reset-submit:ip:${ip}`, 10, 300)
    if (!ipLimit.success) {
      return NextResponse.json(
        { success: false, message: "请求过于频繁，请稍后重试" },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { username, smsCode, newPassword } = body

    // 验证必填字段
    if (!username || !smsCode || !newPassword) {
      return NextResponse.json(
        { success: false, message: "请填写所有必填信息" },
        { status: 400 }
      )
    }

    // 验证新密码强度
    const passwordValidation = isValidPassword(newPassword)
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { success: false, message: passwordValidation.errors[0] },
        { status: 400 }
      )
    }

    // 检查密码是否与用户名相同
    if (isPasswordSameAsUsername(newPassword, username)) {
      return NextResponse.json(
        { success: false, message: "密码不能与用户名相同" },
        { status: 400 }
      )
    }

    // 规范化用户名
    const normalizedUsername = normalizeUsername(username)

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { username: normalizedUsername },
      select: { id: true, phone: true, phoneVerified: true },
    })

    if (!user || !user.phone || !user.phoneVerified) {
      // 统一错误消息，防止用户名枚举
      return NextResponse.json(
        { success: false, message: "验证码错误或已过期" },
        { status: 400 }
      )
    }

    // 验证短信验证码
    // 开发模式跳过验证
    if (!(process.env.NODE_ENV === "development" && process.env.DEV_SKIP_AUTH === "true")) {
      const smsResult = await verifySmsCode(user.phone, smsCode)
      if (!smsResult.success) {
        return NextResponse.json(
          { success: false, message: smsResult.message || "验证码错误或已过期" },
          { status: 400 }
        )
      }
    }

    // 哈希新密码
    const passwordHash = await hashPassword(newPassword)

    // 更新密码，同时清除登录失败记录和锁定状态
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        failedLoginCount: 0,
        lockedUntil: null,
      },
    })

    // 删除该用户的所有会话（强制重新登录）
    await prisma.session.deleteMany({
      where: { userId: user.id },
    })

    return NextResponse.json({
      success: true,
      message: "密码重置成功，请使用新密码登录",
    })
  } catch (error) {
    console.error("Password reset error:", error)
    return NextResponse.json(
      { success: false, message: "密码重置失败，请重试" },
      { status: 500 }
    )
  }
}
