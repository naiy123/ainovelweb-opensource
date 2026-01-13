import bcrypt from "bcryptjs"
import crypto from "crypto"

/**
 * bcrypt 配置
 * cost factor 12 提供良好的安全性和性能平衡
 */
const BCRYPT_ROUNDS = 12

/**
 * 用于防止时序攻击的 dummy hash
 * 当用户不存在时也要验证一个 hash，保持响应时间一致
 */
const DUMMY_HASH = "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.p3qWl8IeR/x3lW"

/**
 * 对密码进行 bcrypt 哈希
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

/**
 * 验证密码是否匹配哈希
 * 使用常量时间比较，防止时序攻击
 */
export async function verifyPassword(
  password: string,
  hash: string | null | undefined
): Promise<boolean> {
  // 即使没有 hash 也要进行验证操作，防止时序攻击
  const hashToVerify = hash || DUMMY_HASH
  const result = await bcrypt.compare(password, hashToVerify)
  // 如果原本就没有 hash，则一定返回 false
  return hash ? result : false
}

/**
 * 生成安全的随机 token（用于密码重置等）
 * 返回 base64url 编码的 32 字节随机字符串
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString("base64url")
}

/**
 * 对 token 进行哈希存储（不需要反向解密）
 * 使用 SHA-256，因为 token 本身已经是高熵随机值
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex")
}

/**
 * 验证 token 是否匹配
 */
export function verifyToken(token: string, hashedToken: string): boolean {
  const tokenHash = hashToken(token)
  // 使用 timingSafeEqual 防止时序攻击
  try {
    return crypto.timingSafeEqual(
      Buffer.from(tokenHash, "hex"),
      Buffer.from(hashedToken, "hex")
    )
  } catch {
    return false
  }
}
