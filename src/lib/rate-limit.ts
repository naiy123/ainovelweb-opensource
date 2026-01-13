/**
 * 速率限制 - 简化版 (无限制模式)
 * 本地版本不进行速率限制
 */

interface RateLimitResult {
  success: boolean
  remaining: number
  resetIn: number
}

/**
 * 速率限制检查 (始终通过)
 */
export async function rateLimit(
  _key: string,
  _limit: number,
  _windowSeconds: number
): Promise<RateLimitResult> {
  return {
    success: true,
    remaining: 999,
    resetIn: 0,
  }
}

/**
 * 检查 SMS 速率限制 (始终通过)
 */
export async function checkSmsRateLimit(_phone: string, _ip: string): Promise<RateLimitResult> {
  return { success: true, remaining: 999, resetIn: 0 }
}

/**
 * 检查登录速率限制 (始终通过)
 */
export async function checkLoginRateLimit(_ip: string): Promise<RateLimitResult> {
  return { success: true, remaining: 999, resetIn: 0 }
}

/**
 * 检查注册速率限制 (始终通过)
 */
export async function checkRegisterRateLimit(_ip: string): Promise<RateLimitResult> {
  return { success: true, remaining: 999, resetIn: 0 }
}

/**
 * 检查 API 速率限制 (始终通过)
 */
export async function checkApiRateLimit(_ip: string): Promise<RateLimitResult> {
  return { success: true, remaining: 999, resetIn: 0 }
}
