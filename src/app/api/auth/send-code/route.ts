import { NextRequest, NextResponse } from "next/server"
import { sendSmsCode } from "@/lib/aliyun-sms"
import { checkSmsRateLimit } from "@/lib/rate-limit"
import { isValidChinesePhone } from "@/lib/validators/phone"
import { validateOrigin, getClientIP, verifyRecaptcha, canSkipAuth } from "@/lib/security"
import { logCsrfBlocked, logRateLimitExceeded, logRecaptchaFailed } from "@/lib/audit-log"

export async function POST(request: NextRequest) {
  const ip = getClientIP(request)

  try {
    // 1. CSRF 验证
    if (!validateOrigin(request)) {
      await logCsrfBlocked(ip, "/api/auth/send-code", request.headers.get("origin") || undefined)
      return NextResponse.json(
        { success: false, message: "请求来源无效" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { phone, recaptchaToken } = body

    // 2. 验证手机号格式
    if (!phone || !isValidChinesePhone(phone)) {
      return NextResponse.json(
        { success: false, message: "请输入正确的手机号" },
        { status: 400 }
      )
    }

    // 3. reCAPTCHA 验证（如果配置了）
    if (process.env.RECAPTCHA_SECRET_KEY && !canSkipAuth()) {
      const recaptchaResult = await verifyRecaptcha(recaptchaToken, "send_code")
      if (!recaptchaResult.success) {
        await logRecaptchaFailed(ip, recaptchaResult.score, "send_code")
        return NextResponse.json(
          { success: false, message: "人机验证失败，请刷新页面重试" },
          { status: 400 }
        )
      }
    }

    // 4. 检查速率限制
    const rateLimitResult = await checkSmsRateLimit(phone, ip)
    if (!rateLimitResult.success) {
      await logRateLimitExceeded(ip, "sms", phone)
      return NextResponse.json(
        { success: false, message: rateLimitResult.message },
        { status: 429 }
      )
    }

    // 5. 发送验证码
    const result = await sendSmsCode(phone)

    if (result.success) {
      return NextResponse.json({ success: true, message: "验证码已发送" })
    }

    return NextResponse.json(
      { success: false, message: result.message },
      { status: 400 }
    )
  } catch (error) {
    console.error("Send code error:", error)
    return NextResponse.json(
      { success: false, message: "服务器错误，请稍后重试" },
      { status: 500 }
    )
  }
}
