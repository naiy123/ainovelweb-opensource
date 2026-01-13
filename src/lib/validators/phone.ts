import { z } from "zod"

/**
 * 中国大陆手机号正则
 * 支持 13x, 14x, 15x, 16x, 17x, 18x, 19x 号段
 */
export const CHINA_PHONE_REGEX = /^1[3-9]\d{9}$/

/**
 * 验证中国大陆手机号
 */
export function isValidChinesePhone(phone: string): boolean {
  return CHINA_PHONE_REGEX.test(phone)
}

/**
 * Zod 手机号验证 schema
 */
export const phoneSchema = z
  .string()
  .min(1, "请输入手机号")
  .regex(CHINA_PHONE_REGEX, "请输入正确的手机号")

/**
 * 手机号脱敏显示
 * 例: 13812345678 -> 138****5678
 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length !== 11) return phone
  return phone.slice(0, 3) + "****" + phone.slice(-4)
}
