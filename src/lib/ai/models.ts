/**
 * AI 文字生成模型配置
 * 本地版本使用火山引擎豆包模型
 */

export interface AITextModel {
  id: string
  name: string
  model: string
  credits: number
  description: string
  thinking: boolean
  // 输入价格：美元/百万tokens（用于计算关联章节消耗）
  inputPricePerMillion: number
}

// 火山引擎豆包模型配置（本地版本）
// 统一使用 doubao-seed-1-6 深度思考模型
export const AI_TEXT_MODELS: Record<string, AITextModel> = {
  balanced: {
    id: "balanced",
    name: "豆包 1.6",
    model: "doubao-seed-1-6-251015",
    credits: 0,
    description: "豆包深度思考模型",
    thinking: true,
    inputPricePerMillion: 0.60,
  },
} as const

// 默认模型
export const DEFAULT_MODEL_ID = "balanced"

// 获取模型配置
export function getModelConfig(modelId: string): AITextModel {
  return AI_TEXT_MODELS[modelId] || AI_TEXT_MODELS[DEFAULT_MODEL_ID]
}

// 获取所有模型列表（用于前端展示）
export function getModelList(): AITextModel[] {
  return Object.values(AI_TEXT_MODELS)
}

// ============================================
// 卡片生成模型配置（轻量级任务，选项更少）
// ============================================

export interface AICardModel {
  id: string
  name: string
  model: string
  credits: number
  description: string
}

export const AI_CARD_MODELS: Record<string, AICardModel> = {
  balanced: {
    id: "balanced",
    name: "豆包 1.6",
    model: "doubao-seed-1-6-251015",
    credits: 0,
    description: "豆包深度思考模型",
  },
} as const

// 默认卡片生成模型
export const DEFAULT_CARD_MODEL_ID = "fast"

// 获取卡片生成模型配置
export function getCardModelConfig(modelId: string): AICardModel {
  return AI_CARD_MODELS[modelId] || AI_CARD_MODELS[DEFAULT_CARD_MODEL_ID]
}

// 获取卡片生成模型列表
export function getCardModelList(): AICardModel[] {
  return Object.values(AI_CARD_MODELS)
}

// ============================================
// 关联章节消耗计算（本地版本保留计算逻辑但不扣费）
// ============================================

// 1 灵感点 = ¥0.0068
const CREDIT_TO_CNY = 0.0068
// 美元兑人民币汇率（取 7.2）
const USD_TO_CNY = 7.2
// 中文字符约 2 tokens/字
const CHARS_TO_TOKENS = 2

/**
 * 计算关联章节的预估灵感点消耗
 * @param charCount 字符数
 * @param modelId 模型ID
 * @returns 预估消耗的灵感点数（本地版本仅供参考）
 */
export function calculateLinkedChaptersCredits(charCount: number, modelId: string): number {
  const model = getModelConfig(modelId)

  // 字符 -> tokens（中文约 2 tokens/字）
  const tokens = charCount * CHARS_TO_TOKENS

  // 计算美元成本（inputPricePerMillion 已包含 2 倍利润）
  const usdCost = (tokens / 1_000_000) * model.inputPricePerMillion

  // 转换为人民币
  const cnyCost = usdCost * USD_TO_CNY

  // 转换为灵感点（向上取整）
  const credits = Math.ceil(cnyCost / CREDIT_TO_CNY)

  return credits
}
