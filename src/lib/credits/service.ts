/**
 * 积分服务 - 开源版本（无限制）
 *
 * 所有操作直接返回成功，不进行实际扣费
 * 用户可以无限使用所有 AI 功能
 */

// 开源版本：永远有足够的积分
const UNLIMITED_BALANCE = 999999

export interface ConsumeOptions {
  userId: string
  amount: number
  category: string
  description?: string
  refId?: string
  refType?: string
}

export interface AddCreditsOptions {
  userId: string
  amount: number
  type: "recharge" | "gift" | "refund"
  category?: string
  description?: string
  refId?: string
  refType?: string
}

/**
 * 获取用户余额（开源版：返回无限）
 */
export async function getBalance(_userId: string): Promise<number> {
  return UNLIMITED_BALANCE
}

/**
 * 检查余额是否足够（开源版：永远足够）
 */
export async function checkCredits(
  _userId: string,
  _required: number
): Promise<{ sufficient: boolean; balance: number }> {
  return { sufficient: true, balance: UNLIMITED_BALANCE }
}

/**
 * 消费灵感点（开源版：直接返回成功）
 */
export async function consumeCredits(_options: ConsumeOptions): Promise<{
  success: boolean
  balance: number
  error?: string
}> {
  return { success: true, balance: UNLIMITED_BALANCE }
}

/**
 * 添加灵感点（开源版：直接返回成功）
 */
export async function addCredits(_options: AddCreditsOptions): Promise<{
  success: boolean
  balance: number
  error?: string
}> {
  return { success: true, balance: UNLIMITED_BALANCE }
}

/**
 * 获取用户流水记录（开源版：返回空列表）
 */
export async function getTransactions(
  _userId: string,
  _options?: {
    limit?: number
    cursor?: string
    type?: string
  }
) {
  return {
    transactions: [],
    nextCursor: null,
    hasMore: false,
  }
}

/**
 * 初始化用户灵感点（开源版：无操作）
 */
export async function initUserCredits(
  _userId: string,
  _amount: number = 100
): Promise<void> {
  // 开源版本不需要初始化积分
}
