/**
 * 扣费高阶函数 - 统一管理 AI 生成的扣费逻辑
 *
 * 流程：检查余额 → 扣费 → 执行业务 → 失败自动退款
 */

import { checkCredits, consumeCredits, addCredits } from "./service"

export interface WithCreditsOptions {
  userId: string
  amount: number
  category: string
  description: string
}

export interface WithCreditsResult<T> {
  success: true
  data: T
  creditsConsumed: number
  balanceAfter: number
}

export interface WithCreditsError {
  success: false
  error: string
  code: "INSUFFICIENT_BALANCE" | "CONSUME_FAILED" | "ACTION_FAILED"
}

/**
 * 带扣费的操作包装器
 *
 * @example
 * ```ts
 * const result = await withCredits({
 *   userId,
 *   amount: 100,
 *   category: "cover",
 *   description: "封面生成",
 * }, async () => {
 *   return await generateCover(...)
 * })
 *
 * if (!result.success) {
 *   return NextResponse.json({ error: result.error }, { status: 402 })
 * }
 *
 * return NextResponse.json({
 *   ...result.data,
 *   creditsConsumed: result.creditsConsumed,
 *   balanceAfter: result.balanceAfter,
 * })
 * ```
 */
export async function withCredits<T>(
  options: WithCreditsOptions,
  action: () => Promise<T>
): Promise<WithCreditsResult<T> | WithCreditsError> {
  const { userId, amount, category, description } = options

  // 1. 检查余额
  const { sufficient, balance } = await checkCredits(userId, amount)
  if (!sufficient) {
    return {
      success: false,
      error: `灵感点不足，需要 ${amount} 点，当前余额 ${balance} 点`,
      code: "INSUFFICIENT_BALANCE",
    }
  }

  // 2. 扣费
  const consumeResult = await consumeCredits({
    userId,
    amount,
    category,
    description,
  })

  if (!consumeResult.success) {
    return {
      success: false,
      error: consumeResult.error || "扣费失败",
      code: "CONSUME_FAILED",
    }
  }

  // 3. 执行业务逻辑
  try {
    const data = await action()

    return {
      success: true,
      data,
      creditsConsumed: amount,
      balanceAfter: consumeResult.balance,
    }
  } catch (error) {
    // 4. 失败自动退款
    try {
      await addCredits({
        userId,
        amount,
        type: "refund",
        category,
        description: `${description}失败退款`,
      })
    } catch (refundError) {
      // 退款失败，记录严重错误（需要人工处理）
      console.error(`🚨 退款失败，需人工处理: userId=${userId}, amount=${amount}, category=${category}`, refundError)
      // 继续返回原始错误，不要因为退款失败而掩盖业务错误
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "操作失败",
      code: "ACTION_FAILED",
    }
  }
}

/**
 * 手动扣费结果 - 用于流式 API
 */
export interface WithCreditsManualResult {
  success: true
  creditsConsumed: number
  balanceAfter: number
  /** 调用此函数执行退款（流式 API 错误时使用） */
  refund: () => Promise<{ balance: number }>
}

/**
 * 手动扣费模式 - 用于流式 API
 *
 * 与 withCredits 的区别：
 * - withCredits: 自动退款（适合普通请求-响应模式）
 * - withCreditsManual: 返回 refund 函数，由调用者决定何时退款（适合流式 API）
 *
 * @example
 * ```ts
 * const creditResult = await withCreditsManual({ userId, amount, ... })
 * if (!creditResult.success) {
 *   return Response.json({ error: creditResult.error }, { status: 402 })
 * }
 *
 * const stream = new ReadableStream({
 *   async start(controller) {
 *     try {
 *       // 发送扣费信息
 *       controller.enqueue({ credits: creditResult.creditsConsumed, balance: creditResult.balanceAfter })
 *       // 执行生成...
 *     } catch (error) {
 *       // 手动退款
 *       const { balance } = await creditResult.refund()
 *       controller.enqueue({ type: "refund", balance })
 *     }
 *   }
 * })
 * ```
 */
export async function withCreditsManual(
  options: WithCreditsOptions
): Promise<WithCreditsManualResult | WithCreditsError> {
  const { userId, amount, category, description } = options

  // 1. 检查余额
  const { sufficient, balance } = await checkCredits(userId, amount)
  if (!sufficient) {
    return {
      success: false,
      error: `灵感点不足，需要 ${amount} 点，当前余额 ${balance} 点`,
      code: "INSUFFICIENT_BALANCE",
    }
  }

  // 2. 扣费
  const consumeResult = await consumeCredits({
    userId,
    amount,
    category,
    description,
  })

  if (!consumeResult.success) {
    return {
      success: false,
      error: consumeResult.error || "扣费失败",
      code: "CONSUME_FAILED",
    }
  }

  // 3. 返回成功结果和退款函数（带防重复保护）
  let refunded = false
  let lastRefundBalance = consumeResult.balance

  return {
    success: true,
    creditsConsumed: amount,
    balanceAfter: consumeResult.balance,
    refund: async () => {
      // 防止重复退款
      if (refunded) {
        console.warn(`⚠️ 重复退款请求被阻止: ${description}`)
        return { balance: lastRefundBalance }
      }
      refunded = true

      try {
        const refundResult = await addCredits({
          userId,
          amount,
          type: "refund",
          category,
          description: `${description}失败退款`,
        })
        lastRefundBalance = refundResult.balance
        return { balance: refundResult.balance }
      } catch (error) {
        // 退款失败，记录严重错误（需要人工处理）
        console.error(`🚨 退款失败，需人工处理: userId=${userId}, amount=${amount}, category=${category}`, error)
        // 保持 refunded = true，防止重复尝试导致潜在的双重退款
        throw error
      }
    },
  }
}

/**
 * HTTP 状态码映射
 */
export function getCreditsErrorStatus(code: WithCreditsError["code"]): number {
  switch (code) {
    case "INSUFFICIENT_BALANCE":
      return 402 // Payment Required
    case "CONSUME_FAILED":
      return 402
    case "ACTION_FAILED":
      return 500
    default:
      return 500
  }
}
