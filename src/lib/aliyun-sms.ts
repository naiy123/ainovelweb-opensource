/**
 * 短信验证 - 开源版本（禁用）
 *
 * 开源版本不需要短信验证，直接跳过
 */

/**
 * 发送短信验证码（开源版：直接返回成功）
 */
export async function sendSmsCode(
  _phone: string
): Promise<{ success: boolean; error?: string }> {
  console.log("[开源版] 跳过短信验证")
  return { success: true }
}

/**
 * 验证短信验证码（开源版：任意验证码都通过）
 */
export async function verifySmsCode(
  _phone: string,
  _code: string
): Promise<{ success: boolean; error?: string }> {
  console.log("[开源版] 跳过短信验证")
  return { success: true }
}
