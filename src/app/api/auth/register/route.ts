import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { hashPassword } from "@/lib/auth/password"
import { isValidUsername, normalizeUsername } from "@/lib/validators/username"
import { isValidPassword, isPasswordSameAsUsername, isWeakPassword } from "@/lib/validators/password"
import { isValidChinesePhone } from "@/lib/validators/phone"
import { verifySmsCode } from "@/lib/aliyun-sms"
import { checkRegisterRateLimit } from "@/lib/rate-limit"
import { validateOrigin, getClientIP, verifyRecaptcha, canSkipAuth, assertDevSkipAuthSafe } from "@/lib/security"
import { logRegisterSuccess, logRegisterFailed, logCsrfBlocked, logRateLimitExceeded, logRecaptchaFailed } from "@/lib/audit-log"

// 启动时检查 DEV_SKIP_AUTH 安全性
assertDevSkipAuthSafe()

export async function POST(request: Request) {
  const ip = getClientIP(request)
  const userAgent = request.headers.get("user-agent") || undefined

  try {
    // 1. CSRF 验证
    if (!validateOrigin(request)) {
      await logCsrfBlocked(ip, "/api/auth/register", request.headers.get("origin") || undefined)
      return NextResponse.json(
        { success: false, message: "请求来源无效" },
        { status: 403 }
      )
    }

    // 2. IP 速率限制
    const ipLimit = await checkRegisterRateLimit(ip)
    if (!ipLimit.success) {
      await logRateLimitExceeded(ip, "register")
      return NextResponse.json(
        { success: false, message: ipLimit.message },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { username, password, phone, smsCode, recaptchaToken } = body

    // 3. reCAPTCHA 验证（如果配置了）
    if (process.env.RECAPTCHA_SECRET_KEY && !canSkipAuth()) {
      const recaptchaResult = await verifyRecaptcha(recaptchaToken, "register")
      if (!recaptchaResult.success) {
        await logRecaptchaFailed(ip, recaptchaResult.score, "register")
        return NextResponse.json(
          { success: false, message: "人机验证失败，请刷新页面重试" },
          { status: 400 }
        )
      }
    }

    // 4. 验证必填字段
    if (!username || !password || !phone || !smsCode) {
      await logRegisterFailed(username || "unknown", ip, userAgent, "missing_fields")
      return NextResponse.json(
        { success: false, message: "请填写所有必填信息" },
        { status: 400 }
      )
    }

    // 5. 验证用户名格式
    const usernameValidation = isValidUsername(username)
    if (!usernameValidation.valid) {
      await logRegisterFailed(username, ip, userAgent, "invalid_username")
      return NextResponse.json(
        { success: false, message: usernameValidation.error },
        { status: 400 }
      )
    }

    // 6. 验证密码强度
    const passwordValidation = isValidPassword(password)
    if (!passwordValidation.valid) {
      await logRegisterFailed(username, ip, userAgent, "weak_password")
      return NextResponse.json(
        { success: false, message: passwordValidation.errors[0] },
        { status: 400 }
      )
    }

    // 7. 弱密码字典检查
    if (isWeakPassword(password)) {
      await logRegisterFailed(username, ip, userAgent, "common_password")
      return NextResponse.json(
        { success: false, message: "此密码太常见，请选择更复杂的密码" },
        { status: 400 }
      )
    }

    // 8. 检查密码是否与用户名相同
    if (isPasswordSameAsUsername(password, username)) {
      await logRegisterFailed(username, ip, userAgent, "password_same_as_username")
      return NextResponse.json(
        { success: false, message: "密码不能与用户名相同" },
        { status: 400 }
      )
    }

    // 9. 验证手机号格式
    if (!isValidChinesePhone(phone)) {
      await logRegisterFailed(username, ip, userAgent, "invalid_phone")
      return NextResponse.json(
        { success: false, message: "请输入正确的手机号" },
        { status: 400 }
      )
    }

    // 10. 规范化用户名
    const normalizedUsername = normalizeUsername(username)

    // 11. 检查用户名是否已被注册
    const existingUsername = await prisma.user.findUnique({
      where: { username: normalizedUsername },
      select: { id: true },
    })
    if (existingUsername) {
      await logRegisterFailed(username, ip, userAgent, "username_taken")
      return NextResponse.json(
        { success: false, message: "该用户名已被注册" },
        { status: 400 }
      )
    }

    // 12. 检查手机号是否已被注册且已验证
    const existingPhone = await prisma.user.findUnique({
      where: { phone },
      select: { id: true, phoneVerified: true, username: true },
    })
    if (existingPhone && existingPhone.phoneVerified && existingPhone.username) {
      await logRegisterFailed(username, ip, userAgent, "phone_taken")
      return NextResponse.json(
        { success: false, message: "该手机号已被注册，请直接登录" },
        { status: 400 }
      )
    }

    // 13. 验证短信验证码
    if (!canSkipAuth()) {
      const smsResult = await verifySmsCode(phone, smsCode)
      if (!smsResult.success) {
        await logRegisterFailed(username, ip, userAgent, "invalid_sms_code")
        return NextResponse.json(
          { success: false, message: smsResult.message || "验证码错误" },
          { status: 400 }
        )
      }
    }

    // 14. 哈希密码
    const passwordHash = await hashPassword(password)

    // 15. 创建或更新用户
    let user
    if (existingPhone) {
      user = await prisma.user.update({
        where: { phone },
        data: {
          username: normalizedUsername,
          passwordHash,
          phoneVerified: true,
          nickname: existingPhone.username ? undefined : `用户${phone.slice(-4)}`,
        },
      })
    } else {
      user = await prisma.user.create({
        data: {
          username: normalizedUsername,
          passwordHash,
          phone,
          phoneVerified: true,
          nickname: `用户${phone.slice(-4)}`,
          subscription: {
            create: { plan: "free", dailyLimit: 3 },
          },
        },
      })
    }

    // 记录注册成功
    await logRegisterSuccess(user.id, normalizedUsername, ip, userAgent)

    return NextResponse.json({
      success: true,
      message: "注册成功",
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
      },
    })
  } catch (error) {
    console.error("Register error:", error)
    await logRegisterFailed("unknown", ip, userAgent, "server_error")
    return NextResponse.json(
      { success: false, message: "注册失败，请重试" },
      { status: 500 }
    )
  }
}
