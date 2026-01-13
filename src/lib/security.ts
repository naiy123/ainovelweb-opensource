import { NextRequest } from "next/server"

/**
 * 验证请求来源，防止 CSRF 攻击
 * 检查 Origin 和 Referer 头是否来自同一站点
 */
export function validateOrigin(request: NextRequest | Request): boolean {
  const headers = request.headers
  const origin = headers.get("origin")
  const referer = headers.get("referer")
  const host = headers.get("host")

  // 获取允许的来源
  const allowedOrigins = [
    `https://${host}`,
    `http://${host}`, // 开发环境
    process.env.NEXTAUTH_URL,
    process.env.NEXT_PUBLIC_BASE_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  ].filter(Boolean)

  // 开发环境放宽限制
  if (process.env.NODE_ENV === "development") {
    allowedOrigins.push("http://localhost:3000")
    allowedOrigins.push("http://127.0.0.1:3000")
  }

  // 验证 Origin
  if (origin) {
    return allowedOrigins.some((allowed) => origin.startsWith(allowed as string))
  }

  // 如果没有 Origin，检查 Referer
  if (referer) {
    return allowedOrigins.some((allowed) => referer.startsWith(allowed as string))
  }

  // 既没有 Origin 也没有 Referer，拒绝请求
  // 注意：某些合法请求可能没有这些头（如同源的简单请求）
  // 但对于 POST/PUT/DELETE 等修改操作，应该有这些头
  return false
}

/**
 * CSRF 验证失败时的响应
 */
export function csrfErrorResponse() {
  return new Response(JSON.stringify({ error: "Invalid request origin" }), {
    status: 403,
    headers: { "Content-Type": "application/json" },
  })
}

/**
 * 清理用户输入，防止提示注入
 * @param input 用户输入
 * @param maxLength 最大长度
 */
export function sanitizePromptInput(input: string, maxLength: number = 500): string {
  if (!input) return ""

  return input
    // 限制长度
    .substring(0, maxLength)
    // 移除可能的指令注入关键词
    .replace(/ignore\s+(all\s+)?(previous\s+)?instructions?/gi, "")
    .replace(/disregard\s+(all\s+)?(previous\s+)?instructions?/gi, "")
    .replace(/forget\s+(all\s+)?(previous\s+)?instructions?/gi, "")
    .replace(/system\s*:/gi, "")
    .replace(/assistant\s*:/gi, "")
    .replace(/user\s*:/gi, "")
    // 移除控制字符
    .replace(/[\x00-\x1F\x7F]/g, "")
    // 规范化空白字符
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * 获取客户端 IP 地址
 */
export function getClientIP(request: NextRequest | Request): string {
  const headers = request.headers
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  )
}

/**
 * 验证 reCAPTCHA token
 * @param token reCAPTCHA token from client
 * @param action 预期的 action 名称
 * @returns 验证结果
 */
export async function verifyRecaptcha(
  token: string,
  action?: string
): Promise<{ success: boolean; score?: number; error?: string }> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY

  // 开发环境跳过验证
  if (process.env.NODE_ENV === "development" && process.env.DEV_SKIP_RECAPTCHA === "true") {
    return { success: true, score: 1.0 }
  }

  // 未配置 reCAPTCHA 时跳过
  if (!secretKey) {
    console.warn("reCAPTCHA secret key not configured, skipping verification")
    return { success: true, score: 1.0 }
  }

  if (!token) {
    return { success: false, error: "Missing reCAPTCHA token" }
  }

  try {
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }),
    })

    const data = await response.json()

    if (!data.success) {
      return { success: false, error: "reCAPTCHA verification failed" }
    }

    // reCAPTCHA v3: 检查分数（0.0 - 1.0，越高越可能是人类）
    if (data.score !== undefined) {
      const threshold = 0.5 // 可调整阈值
      if (data.score < threshold) {
        return { success: false, score: data.score, error: "Suspicious activity detected" }
      }

      // 验证 action（如果提供）
      if (action && data.action !== action) {
        return { success: false, error: "Invalid reCAPTCHA action" }
      }
    }

    return { success: true, score: data.score }
  } catch (error) {
    console.error("reCAPTCHA verification error:", error)
    // 验证服务出错时，根据安全策略决定是放行还是拒绝
    // 这里选择放行以保证可用性，但记录日志
    return { success: true, error: "Verification service error" }
  }
}

/**
 * 验证开发环境跳过设置的安全性
 * 确保 DEV_SKIP_AUTH 不会在生产环境生效
 */
export function assertDevSkipAuthSafe(): void {
  if (process.env.DEV_SKIP_AUTH === "true" && process.env.NODE_ENV === "production") {
    throw new Error(
      "CRITICAL SECURITY ERROR: DEV_SKIP_AUTH cannot be enabled in production environment. " +
        "Remove this environment variable immediately."
    )
  }
}

/**
 * 检查是否允许跳过认证（仅开发环境）
 */
export function canSkipAuth(): boolean {
  return process.env.NODE_ENV === "development" && process.env.DEV_SKIP_AUTH === "true"
}
