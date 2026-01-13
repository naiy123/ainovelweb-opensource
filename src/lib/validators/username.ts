import { z } from "zod"

/**
 * 用户名要求
 * - 4-20 字符
 * - 仅字母、数字、下划线、连字符
 * - 不能以数字或下划线开头
 * - 不区分大小写（存储为小写）
 */
export const USERNAME_REQUIREMENTS = {
  minLength: 4,
  maxLength: 20,
  pattern: /^[a-zA-Z][a-zA-Z0-9_-]{3,19}$/,
}

/**
 * 保留用户名列表（不允许注册）
 */
export const RESERVED_USERNAMES = new Set([
  // 系统保留
  "admin",
  "administrator",
  "root",
  "system",
  "sys",
  "superuser",
  "sudo",
  // 网站相关
  "api",
  "www",
  "web",
  "mail",
  "email",
  "support",
  "help",
  "info",
  "contact",
  "about",
  "login",
  "logout",
  "register",
  "signup",
  "signin",
  "auth",
  "oauth",
  // 测试
  "test",
  "testing",
  "demo",
  "example",
  "sample",
  // 产品相关
  "lingji",
  "灵机",
  "ainovel",
  "novel",
  // 其他
  "null",
  "undefined",
  "anonymous",
  "guest",
  "user",
  "member",
  "moderator",
  "mod",
  "staff",
  "official",
])

/**
 * 用户名验证 schema
 */
export const usernameSchema = z
  .string()
  .min(USERNAME_REQUIREMENTS.minLength, `用户名至少 ${USERNAME_REQUIREMENTS.minLength} 个字符`)
  .max(USERNAME_REQUIREMENTS.maxLength, `用户名最多 ${USERNAME_REQUIREMENTS.maxLength} 个字符`)
  .regex(
    USERNAME_REQUIREMENTS.pattern,
    "用户名只能包含字母、数字、下划线和连字符，且必须以字母开头"
  )
  .refine(
    (username) => !RESERVED_USERNAMES.has(username.toLowerCase()),
    "该用户名为系统保留，请选择其他用户名"
  )

/**
 * 验证用户名格式
 */
export function isValidUsername(username: string): { valid: boolean; error?: string } {
  const result = usernameSchema.safeParse(username)
  if (result.success) {
    return { valid: true }
  }
  return {
    valid: false,
    error: result.error.issues[0]?.message || "用户名格式不正确",
  }
}

/**
 * 规范化用户名（转小写，用于存储和比较）
 */
export function normalizeUsername(username: string): string {
  return username.toLowerCase().trim()
}

/**
 * 检查用户名是否为保留名
 */
export function isReservedUsername(username: string): boolean {
  return RESERVED_USERNAMES.has(username.toLowerCase())
}
