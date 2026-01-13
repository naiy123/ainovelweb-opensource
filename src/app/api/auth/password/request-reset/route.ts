import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { prisma } from "@/lib/db"
import { sendSmsCode } from "@/lib/aliyun-sms"
import { normalizeUsername } from "@/lib/validators/username"
import { maskPhone } from "@/lib/validators/phone"
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
    const ipLimit = await rateLimit(`password-reset:ip:${ip}`, 5, 300)
    if (!ipLimit.success) {
      return NextResponse.json(
        { success: false, message: "请求过于频繁，请稍后重试" },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { username } = body

    if (!username || typeof username !== "string") {
      return NextResponse.json(
        { success: false, message: "请输入用户名" },
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

    // 为了防止用户名枚举，无论用户是否存在都返回相同响应
    // 但是实际只有存在的用户才会发送短信
    if (!user || !user.phone || !user.phoneVerified) {
      // 延迟响应，防止时序攻击
      await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 500))
      return NextResponse.json({
        success: true,
        message: "如果该用户存在且绑定了手机号，验证码已发送",
        maskedPhone: "***",
      })
    }

    // 用户级速率限制（60秒一次）
    const userLimit = await rateLimit(`password-reset:user:${user.id}`, 1, 60)
    if (!userLimit.success) {
      return NextResponse.json(
        {
          success: false,
          message: `请 ${userLimit.resetIn} 秒后重试`,
          maskedPhone: maskPhone(user.phone),
        },
        { status: 429 }
      )
    }

    // 发送短信验证码
    // 开发模式跳过发送
    if (!(process.env.NODE_ENV === "development" && process.env.DEV_SKIP_AUTH === "true")) {
      const smsResult = await sendSmsCode(user.phone)
      if (!smsResult.success) {
        return NextResponse.json(
          { success: false, message: smsResult.message || "短信发送失败，请重试" },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: "验证码已发送",
      maskedPhone: maskPhone(user.phone),
    })
  } catch (error) {
    console.error("Password reset request error:", error)
    return NextResponse.json(
      { success: false, message: "请求失败，请重试" },
      { status: 500 }
    )
  }
}
