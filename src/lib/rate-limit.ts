import { redis } from "./redis"

interface RateLimitResult {
  success: boolean
  remaining: number
  resetIn: number // 秒
  message?: string
}

/**
 * 速率限制降级策略
 * - strict: Redis 故障时拒绝请求（安全优先）
 * - permissive: Redis 故障时允许请求（可用性优先）
 */
type FallbackStrategy = "strict" | "permissive"

/**
 * 基于 Redis 的速率限制
 * @param key 限制的键名（如 phone:13800000000 或 ip:192.168.1.1）
 * @param limit 时间窗口内允许的最大请求数
 * @param windowSeconds 时间窗口（秒）
 * @param strategy 降级策略，默认 strict（安全优先）
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
  strategy: FallbackStrategy = "strict"
): Promise<RateLimitResult> {
  // Redis 未配置时的处理
  if (!redis) {
    console.warn(`Rate limit: Redis not configured, using ${strategy} strategy for key: ${key}`)
    if (strategy === "strict") {
      return {
        success: false,
        remaining: 0,
        resetIn: windowSeconds,
        message: "服务暂时不可用，请稍后重试",
      }
    }
    return { success: true, remaining: limit, resetIn: windowSeconds }
  }

  const redisKey = `rate_limit:${key}`

  try {
    const current = await redis.incr(redisKey)

    if (current === 1) {
      await redis.expire(redisKey, windowSeconds)
    }

    const ttl = await redis.ttl(redisKey)

    if (current > limit) {
      return {
        success: false,
        remaining: 0,
        resetIn: ttl > 0 ? ttl : windowSeconds,
        message: `请求过于频繁，请 ${ttl > 0 ? ttl : windowSeconds} 秒后重试`,
      }
    }

    return {
      success: true,
      remaining: limit - current,
      resetIn: ttl > 0 ? ttl : windowSeconds,
    }
  } catch (error) {
    // Redis 连接失败时根据策略处理
    console.error(`Rate limit error for key ${key}:`, error)

    if (strategy === "strict") {
      return {
        success: false,
        remaining: 0,
        resetIn: windowSeconds,
        message: "服务暂时不可用，请稍后重试",
      }
    }
    return { success: true, remaining: limit, resetIn: windowSeconds }
  }
}

/**
 * SMS 发送速率限制（安全优先）
 * - 同一手机号：60秒内1次
 * - 同一IP：1分钟内5次
 */
export async function checkSmsRateLimit(
  phone: string,
  ip: string
): Promise<RateLimitResult> {
  // 检查手机号限制（60秒1次）- 安全优先
  const phoneLimit = await rateLimit(`sms:phone:${phone}`, 1, 60, "strict")
  if (!phoneLimit.success) {
    return {
      ...phoneLimit,
      message: `验证码发送过于频繁，请 ${phoneLimit.resetIn} 秒后重试`,
    }
  }

  // 检查 IP 限制（1分钟5次）- 安全优先
  const ipLimit = await rateLimit(`sms:ip:${ip}`, 5, 60, "strict")
  if (!ipLimit.success) {
    return {
      ...ipLimit,
      message: "请求过于频繁，请稍后重试",
    }
  }

  return { success: true, remaining: phoneLimit.remaining, resetIn: phoneLimit.resetIn }
}

/**
 * 登录速率限制（安全优先）
 * - 同一 IP：1分钟内10次
 */
export async function checkLoginRateLimit(ip: string): Promise<RateLimitResult> {
  const result = await rateLimit(`login:ip:${ip}`, 10, 60, "strict")
  if (!result.success) {
    return {
      ...result,
      message: "登录尝试过于频繁，请稍后重试",
    }
  }
  return result
}

/**
 * 注册速率限制（安全优先）
 * - 同一 IP：1小时内5次
 */
export async function checkRegisterRateLimit(ip: string): Promise<RateLimitResult> {
  const result = await rateLimit(`register:ip:${ip}`, 5, 3600, "strict")
  if (!result.success) {
    return {
      ...result,
      message: "注册请求过于频繁，请稍后重试",
    }
  }
  return result
}

/**
 * 登录验证失败次数限制（安全优先）
 * - 同一手机号：15分钟内5次失败后锁定
 */
export async function checkLoginAttempts(phone: string): Promise<RateLimitResult> {
  const result = await rateLimit(`login:fail:${phone}`, 5, 900, "strict") // 15分钟
  if (!result.success) {
    return {
      ...result,
      message: "验证码错误次数过多，请 15 分钟后重试",
    }
  }
  return result
}

/**
 * 记录登录失败
 */
export async function recordLoginFailure(phone: string): Promise<void> {
  if (!redis) return

  const redisKey = `rate_limit:login:fail:${phone}`
  try {
    const current = await redis.incr(redisKey)
    if (current === 1) {
      await redis.expire(redisKey, 900) // 15分钟
    }
  } catch {
    // 静默处理
  }
}

/**
 * 清除登录失败记录（登录成功后调用）
 */
export async function clearLoginFailures(phone: string): Promise<void> {
  if (!redis) return

  const redisKey = `rate_limit:login:fail:${phone}`
  try {
    await redis.del(redisKey)
  } catch {
    // 静默处理
  }
}

/**
 * 支付订单创建速率限制（安全优先）
 * - 同一用户：1分钟内最多3次
 * - 同一用户：1小时内最多20次
 * - 同一IP：1分钟内最多10次
 */
export async function checkPaymentRateLimit(
  userId: string,
  ip: string
): Promise<RateLimitResult> {
  // 检查用户分钟限制（1分钟3次）
  const userMinuteLimit = await rateLimit(`payment:user:minute:${userId}`, 3, 60, "strict")
  if (!userMinuteLimit.success) {
    return {
      ...userMinuteLimit,
      message: `操作过于频繁，请 ${userMinuteLimit.resetIn} 秒后重试`,
    }
  }

  // 检查用户小时限制（1小时20次）
  const userHourLimit = await rateLimit(`payment:user:hour:${userId}`, 20, 3600, "strict")
  if (!userHourLimit.success) {
    return {
      ...userHourLimit,
      message: "今日支付请求次数过多，请稍后重试",
    }
  }

  // 检查 IP 限制（1分钟10次）
  const ipLimit = await rateLimit(`payment:ip:${ip}`, 10, 60, "strict")
  if (!ipLimit.success) {
    return {
      ...ipLimit,
      message: "请求过于频繁，请稍后重试",
    }
  }

  return { success: true, remaining: userMinuteLimit.remaining, resetIn: userMinuteLimit.resetIn }
}

/**
 * API 通用速率限制（可用性优先，用于非敏感接口）
 * - 同一 IP：1分钟内60次
 */
export async function checkApiRateLimit(ip: string): Promise<RateLimitResult> {
  const result = await rateLimit(`api:ip:${ip}`, 60, 60, "permissive")
  if (!result.success) {
    return {
      ...result,
      message: "请求过于频繁，请稍后重试",
    }
  }
  return result
}
