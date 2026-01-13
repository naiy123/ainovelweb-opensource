import { z } from "zod"

/**
 * 常见弱密码字典（Top 100 常见密码）
 * 来源: Have I Been Pwned, SplashData 年度报告等
 */
const COMMON_WEAK_PASSWORDS = new Set([
  // 数字序列
  "123456", "12345678", "123456789", "1234567890", "12345",
  "1234567", "000000", "111111", "123123", "654321",
  "666666", "888888", "987654321", "123321", "112233",
  // 键盘序列
  "qwerty", "qwerty123", "qwertyuiop", "asdfgh", "zxcvbn",
  "1qaz2wsx", "qazwsx", "1q2w3e4r", "1q2w3e", "qweasd",
  // 常见单词
  "password", "password1", "password123", "passw0rd", "passwd",
  "admin", "admin123", "administrator", "root", "letmein",
  "welcome", "welcome1", "login", "master", "hello",
  "monkey", "dragon", "shadow", "sunshine", "princess",
  "football", "baseball", "soccer", "hockey", "batman",
  "superman", "trustno1", "whatever", "freedom", "mustang",
  // 爱情相关
  "iloveyou", "love", "lovely", "lover", "mylove",
  // 中文拼音常见
  "woaini", "aini", "nihao", "wangyi", "taobao",
  "baidu", "qq123456", "a123456", "abc123", "abc12345",
  // 日期相关
  "19900101", "20000101", "19880888", "19890604",
  // 组合
  "aa123456", "a12345678", "5201314", "woaini1314",
  "asd123", "zxc123", "qwe123", "asdasd", "zxczxc",
])

/**
 * 密码强度要求
 * - 6-128 字符
 * - 至少包含字母
 * - 至少包含数字
 */
export const PASSWORD_REQUIREMENTS = {
  minLength: 6,
  maxLength: 128,
  requireLetter: true,
  requireDigit: true,
}

/**
 * 密码验证 schema
 */
export const passwordSchema = z
  .string()
  .min(PASSWORD_REQUIREMENTS.minLength, `密码至少 ${PASSWORD_REQUIREMENTS.minLength} 个字符`)
  .max(PASSWORD_REQUIREMENTS.maxLength, `密码最多 ${PASSWORD_REQUIREMENTS.maxLength} 个字符`)
  .regex(/[a-zA-Z]/, "密码需包含至少一个字母")
  .regex(/[0-9]/, "密码需包含至少一个数字")

/**
 * 密码强度评分
 */
export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4 // 0=很弱, 1=弱, 2=中等, 3=强, 4=很强
  label: string
  feedback: string[]
}

/**
 * 检查密码是否在弱密码字典中
 */
export function isWeakPassword(password: string): boolean {
  const normalizedPassword = password.toLowerCase()

  // 直接匹配
  if (COMMON_WEAK_PASSWORDS.has(normalizedPassword)) {
    return true
  }

  // 检查简单变体（数字后缀）
  const basePassword = normalizedPassword.replace(/\d+$/, "")
  if (basePassword.length >= 4 && COMMON_WEAK_PASSWORDS.has(basePassword)) {
    return true
  }

  // 检查重复字符（如 aaaaaa, 111111）
  if (/^(.)\1{5,}$/.test(normalizedPassword)) {
    return true
  }

  // 检查简单递增/递减序列
  if (isSequentialPassword(normalizedPassword)) {
    return true
  }

  return false
}

/**
 * 检查是否为简单序列密码（如 123456, abcdef）
 */
function isSequentialPassword(password: string): boolean {
  if (password.length < 6) return false

  let ascending = true
  let descending = true

  for (let i = 1; i < password.length; i++) {
    const diff = password.charCodeAt(i) - password.charCodeAt(i - 1)
    if (diff !== 1) ascending = false
    if (diff !== -1) descending = false
  }

  return ascending || descending
}

/**
 * 检查密码强度
 */
export function checkPasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = []
  let score = 0

  // 弱密码检查（最高优先级）
  if (isWeakPassword(password)) {
    return {
      score: 0,
      label: "太常见",
      feedback: ["此密码太常见，请选择更复杂的密码"],
    }
  }

  // 长度检查
  if (password.length >= 6) score += 1
  if (password.length >= 8) score += 0.5
  if (password.length >= 12) score += 0.5
  if (password.length < 6) feedback.push("密码长度至少 6 个字符")

  // 字母
  if (/[a-zA-Z]/.test(password)) {
    score += 1
  } else {
    feedback.push("添加字母")
  }

  // 数字
  if (/[0-9]/.test(password)) {
    score += 1
  } else {
    feedback.push("添加数字")
  }

  // 特殊字符（加分项，非必须）
  if (/[!@#$%^&*(),.?":{}|<>\-_=+\[\]\\\/`~]/.test(password)) {
    score += 0.5
  }

  // 大小写混合（加分项，非必须）
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) {
    score += 0.5
  }

  // 归一化分数到 0-4
  const normalizedScore = Math.min(4, Math.floor(score)) as 0 | 1 | 2 | 3 | 4

  const labels = ["很弱", "弱", "中等", "强", "很强"]

  return {
    score: normalizedScore,
    label: labels[normalizedScore],
    feedback,
  }
}

/**
 * 验证密码是否满足要求
 */
export function isValidPassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // 基础格式验证
  const result = passwordSchema.safeParse(password)
  if (!result.success) {
    errors.push(...result.error.issues.map((e) => e.message))
  }

  // 弱密码检查
  if (isWeakPassword(password)) {
    errors.push("此密码太常见，请选择更复杂的密码")
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * 检查密码是否与用户名相同（不安全）
 */
export function isPasswordSameAsUsername(password: string, username: string): boolean {
  return password.toLowerCase() === username.toLowerCase()
}

/**
 * 检查密码是否包含用户名
 */
export function passwordContainsUsername(password: string, username: string): boolean {
  if (username.length < 3) return false
  return password.toLowerCase().includes(username.toLowerCase())
}
