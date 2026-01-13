/**
 * 积分定价配置 - 简化版 (所有价格为 0)
 * 本地版本无需积分限制
 */

// 图片生成积分（全部为 0）
export const IMAGE_CREDITS = {
  BACKGROUND: 0,
  COVER_DESIGNER: 0,
  COVER_STYLIST: 0,
  COVER_1K: 0,
  COVER_2K: 0,
  COVER_4K: 0,
} as const

// 文字生成积分（全部为 0）
export const TEXT_CREDITS = {
  FAST: 0,
  BALANCED: 0,
  THINKING: 0,
  PRO: 0,
  MASTER: 0,
  FLAGSHIP: 0,
  ULTIMATE: 0,
} as const

// 其他功能积分（全部为 0）
export const FEATURE_CREDITS = {
  HUMANIZE: 0,
  TRANSLATE: 0,
  CARD_GENERATE: 0,
  OUTLINE_GENERATE: 0,
  SUMMARY_GENERATE: 0,
} as const
