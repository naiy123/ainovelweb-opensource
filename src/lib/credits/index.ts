/**
 * 积分系统 - 简化版 (无限制模式)
 * 所有操作直接执行，不进行扣费
 */

interface WithCreditsOptions {
  userId: string
  amount: number
  category?: string
  description?: string
  refId?: string
  refType?: string
}

interface WithCreditsResult<T> {
  success: boolean
  data?: T
  error?: string
  code?: string
  creditsConsumed?: number
  balanceAfter?: number
}

/**
 * 包装函数 - 执行操作（不扣费）
 */
export async function withCredits<T>(
  _options: WithCreditsOptions,
  operation: () => Promise<T>
): Promise<WithCreditsResult<T>> {
  try {
    const data = await operation()
    return {
      success: true,
      data,
      creditsConsumed: 0,
      balanceAfter: 999999,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "操作失败",
      code: "OPERATION_FAILED",
    }
  }
}

/**
 * 获取积分错误状态码
 */
export function getCreditsErrorStatus(code?: string): number {
  if (code === "INSUFFICIENT_CREDITS") return 402
  if (code === "OPERATION_FAILED") return 500
  return 500
}

/**
 * 获取用户积分余额 (始终返回无限)
 */
export async function getBalance(_userId: string): Promise<number> {
  return 999999
}

/**
 * 检查积分是否足够 (始终返回足够)
 */
export async function checkCredits(
  _userId: string,
  _amount: number
): Promise<{ sufficient: boolean; balance: number }> {
  return { sufficient: true, balance: 999999 }
}

/**
 * 消费积分 (简化版 - 不实际扣费)
 */
export async function consumeCredits(_options: {
  userId: string
  amount: number
  category?: string
  description?: string
  refId?: string
  refType?: string
}): Promise<{ success: boolean; balance: number; error?: string }> {
  return { success: true, balance: 999999 }
}
