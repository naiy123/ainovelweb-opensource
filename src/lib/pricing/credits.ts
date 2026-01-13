/**
 * 灵感点定价配置
 * 基于 Gemini API 定价，50% 利润率
 */

// 图片生成定价（灵感点）
export const IMAGE_CREDITS = {
  // AI 背景图生成 (Gemini 2.5 Flash Image)
  BACKGROUND: 15,

  // 快速封面 - 设计家模型 (Gemini 3 Pro Image)
  COVER_DESIGNER: 280,

  // 快速封面 - 风格家模型 (Seeddream 4.5)
  COVER_STYLIST: 160,

  // 封面生成 (Gemini 3 Pro Image 1K)
  COVER_1K: 79,

  // 封面生成 (Gemini 3 Pro Image 2K)
  COVER_2K: 300,

  // 高清封面 (4K)
  COVER_4K: 380,
} as const

// 文字生成定价（灵感点/章，约3000字）
export const TEXT_CREDITS = {
  // 疾速 - 2.5 Flash-Lite
  FAST: 4,

  // 均衡 - 2.5 Flash
  BALANCED: 24,

  // 深思 - 2.5 Flash + 思考
  THINKING: 33,

  // 专业 - 2.5 Pro
  PRO: 97,

  // 大师 - 2.5 Pro + 思考
  MASTER: 131,

  // 旗舰 - 3.0 Pro
  FLAGSHIP: 118,

  // 至臻 - 3.0 Pro + 思考
  ULTIMATE: 159,
} as const

// 格式化显示
export function formatCredits(amount: number): string {
  return `${amount}点`
}
