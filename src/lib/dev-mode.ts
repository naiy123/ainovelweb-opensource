/**
 * 开发模式 - 开源版本（始终为开发模式）
 *
 * 开源版本默认启用所有功能，无限制
 */

/**
 * 检查是否为开发模式（开源版：始终返回 true）
 */
export function isDevMode(): boolean {
  return true
}

/**
 * 检查是否为开发用户（开源版：始终返回 true）
 */
export function isDevUser(_userId: string): boolean {
  return true
}

/**
 * 获取开发用户 ID
 */
export function getDevUserId(): string | null {
  return null
}

/**
 * 是否跳过积分检查（开源版：始终跳过）
 */
export function shouldSkipCredits(_userId: string): boolean {
  return true
}
