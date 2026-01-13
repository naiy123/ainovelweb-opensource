/**
 * AI 文字生成模型配置
 * 基于 Gemini API，包含模型ID、灵感点定价、思考模式等
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

// Vertex AI 定价 (美元/百万tokens) - 已包含 2 倍利润系数
// Gemini 2.5 Flash Lite: $0.10 input × 2 = $0.20
// Gemini 2.5 Flash: $0.30 input × 2 = $0.60
// Gemini 2.5 Pro: $1.25 input × 2 = $2.50
// Gemini 3 Pro: $2.00 input × 2 = $4.00

export const AI_TEXT_MODELS: Record<string, AITextModel> = {
  fast: {
    id: "fast",
    name: "疾速",
    model: "gemini-2.5-flash-lite",
    credits: 10,
    description: "速度最快，经济实惠",
    thinking: false,
    inputPricePerMillion: 0.20,
  },
  balanced: {
    id: "balanced",
    name: "均衡",
    model: "gemini-2.5-flash",
    credits: 24,
    description: "性价比最高，日常写作首选",
    thinking: false,
    inputPricePerMillion: 0.60,
  },
  thinking: {
    id: "thinking",
    name: "深思",
    model: "gemini-2.5-flash",
    credits: 33,
    description: "开启深度思考，逻辑更严谨",
    thinking: true,
    inputPricePerMillion: 0.60,
  },
  pro: {
    id: "pro",
    name: "专业",
    model: "gemini-2.5-pro",
    credits: 97,
    description: "高质量输出，复杂剧情",
    thinking: false,
    inputPricePerMillion: 2.50,
  },
  master: {
    id: "master",
    name: "大师",
    model: "gemini-2.5-pro",
    credits: 131,
    description: "专业级 + 深度思考",
    thinking: true,
    inputPricePerMillion: 2.50,
  },
  flagship: {
    id: "flagship",
    name: "旗舰",
    model: "gemini-3-pro-preview",
    credits: 118,
    description: "最新模型，最强能力",
    thinking: false,  // LOW
    inputPricePerMillion: 4.00,
  },
  ultimate: {
    id: "ultimate",
    name: "至臻",
    model: "gemini-3-pro-preview",
    credits: 159,
    description: "旗舰 + 深度思考，极致体验",
    thinking: true,
    inputPricePerMillion: 4.00,
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
  fast: {
    id: "fast",
    name: "疾速",
    model: "gemini-2.5-flash-lite",
    credits: 1,
    description: "快速生成，日常使用",
  },
  balanced: {
    id: "balanced",
    name: "均衡",
    model: "gemini-2.5-flash",
    credits: 3,
    description: "更丰富的设定细节",
  },
  pro: {
    id: "pro",
    name: "专业",
    model: "gemini-2.5-pro",
    credits: 10,
    description: "专业级角色/世界观设定",
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
// 关联章节消耗计算
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
 * @returns 预估消耗的灵感点数
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
