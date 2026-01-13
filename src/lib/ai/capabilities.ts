/**
 * AI Provider 能力声明
 *
 * 定义各 Provider 支持的能力，用于：
 * 1. 运行时检查功能可用性
 * 2. 优雅降级处理
 * 3. 模型选择建议
 */

import type { ProviderName } from "./types/common"

// ============ 思考风格 ============
export type ThinkingStyle =
  | "budget"  // Gemini 2.5: 通过 thinkingBudget 控制
  | "level"   // Gemini 3: 通过 thinkingLevel 控制 (LOW/HIGH)
  | "auto"    // 火山: 深度思考模型自动触发
  | null      // 不支持

// ============ 能力声明接口 ============
export interface ProviderCapabilities {
  // ===== 基础能力 =====
  /** 支持文本生成 */
  text: boolean
  /** 支持流式文本生成 */
  textStream: boolean
  /** 支持图片生成 */
  image: boolean

  // ===== 高级能力 =====
  /** 深度思考能力：native(原生支持) / simulated(模拟) / false(不支持) */
  thinking: "native" | "simulated" | false
  /** 思考配置风格 */
  thinkingStyle: ThinkingStyle
  /** JSON 模式（结构化输出） */
  jsonMode: boolean
  /** 多模态图片输入 */
  imageInput: boolean

  // ===== 限制 =====
  /** 最大上下文 token 数 */
  maxContextTokens: number
  /** 最大输出 token 数 */
  maxOutputTokens: number

  // ===== 模型列表 =====
  /** 文本模型列表 */
  textModels: string[]
  /** 图片模型列表 */
  imageModels: string[]
  /** 支持深度思考的模型 */
  thinkingModels: string[]
  /** 默认文本模型 */
  defaultTextModel: string
  /** 默认图片模型 */
  defaultImageModel: string
}

// ============ Provider 能力注册表 ============
export const PROVIDER_CAPABILITIES: Record<ProviderName, ProviderCapabilities> = {
  gemini: {
    // 基础能力
    text: true,
    textStream: true,
    image: true,

    // 高级能力
    thinking: "native",
    thinkingStyle: "budget", // Gemini 2.5 用 budget，3 用 level（在适配器内判断）
    jsonMode: true,
    imageInput: true,

    // 限制
    maxContextTokens: 1_000_000,
    maxOutputTokens: 65_536,

    // 模型
    textModels: [
      "gemini-2.5-flash-lite-preview-06-17",
      "gemini-2.5-flash-preview-05-20",
      "gemini-2.5-pro-preview-06-05",
      "gemini-2.0-flash",
    ],
    imageModels: [
      "gemini-3-pro-image-preview",  // Gemini 3 Pro Image (原生图片生成)
      "imagen-3.0-generate-002",      // Imagen 3 (独立图片模型)
    ],
    thinkingModels: [
      "gemini-2.5-flash-preview-05-20",
      "gemini-2.5-pro-preview-06-05",
      "gemini-3-pro-image-preview",  // Gemini 3 也是 thinking 模型
    ],
    defaultTextModel: "gemini-2.5-flash-preview-05-20",
    defaultImageModel: "gemini-3-pro-image-preview",
  },

  volcengine: {
    // 基础能力
    text: true,
    textStream: true,
    image: true,

    // 高级能力
    thinking: "native",
    thinkingStyle: "auto", // 火山深度思考模型自动触发
    jsonMode: false, // Doubao 不原生支持 JSON 模式
    imageInput: false, // Doubao 文本模型不支持图片输入

    // 限制
    maxContextTokens: 128_000,
    maxOutputTokens: 32_768,

    // 模型
    textModels: [
      "doubao-seed-1-6-251015", // 深度思考模型
      "doubao-1-5-pro-256k-250115", // 长上下文模型
      "doubao-1-5-pro-32k-250115",
    ],
    imageModels: ["doubao-seedream-4-5-251128"],
    thinkingModels: ["doubao-seed-1-6-251015"],
    defaultTextModel: "doubao-seed-1-6-251015",
    defaultImageModel: "doubao-seedream-4-5-251128",
  },

  openai: {
    // 基础能力
    text: true,
    textStream: true,
    image: true,

    // 高级能力
    thinking: false, // GPT 不支持原生深度思考
    thinkingStyle: null,
    jsonMode: true,
    imageInput: true,

    // 限制
    maxContextTokens: 128_000,
    maxOutputTokens: 16_384,

    // 模型
    textModels: ["gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"],
    imageModels: ["dall-e-3"],
    thinkingModels: [],
    defaultTextModel: "gpt-4o",
    defaultImageModel: "dall-e-3",
  },
}

// ============ 能力检查工具函数 ============

/**
 * 获取 Provider 能力配置
 */
export function getProviderCapabilities(provider: ProviderName): ProviderCapabilities {
  const caps = PROVIDER_CAPABILITIES[provider]
  if (!caps) {
    throw new Error(`Unknown provider: ${provider}`)
  }
  return caps
}

/**
 * 检查 Provider 是否支持某能力
 */
export function hasCapability<K extends keyof ProviderCapabilities>(
  provider: ProviderName,
  capability: K
): boolean {
  const caps = PROVIDER_CAPABILITIES[provider]
  if (!caps) return false
  return !!caps[capability]
}

/**
 * 检查模型是否支持深度思考
 */
export function supportsThinking(provider: ProviderName, model: string): boolean {
  const caps = PROVIDER_CAPABILITIES[provider]
  if (!caps) return false
  return caps.thinkingModels.includes(model)
}

/**
 * 获取 Provider 的思考配置风格
 */
export function getThinkingStyle(provider: ProviderName): ThinkingStyle {
  return PROVIDER_CAPABILITIES[provider]?.thinkingStyle ?? null
}

/**
 * 检查模型是否属于指定 Provider
 */
export function isModelOfProvider(provider: ProviderName, model: string): boolean {
  const caps = PROVIDER_CAPABILITIES[provider]
  if (!caps) return false
  return [...caps.textModels, ...caps.imageModels].includes(model)
}

/**
 * 根据模型名自动推断 Provider
 */
export function inferProviderFromModel(model: string): ProviderName | null {
  for (const [provider, caps] of Object.entries(PROVIDER_CAPABILITIES)) {
    if ([...caps.textModels, ...caps.imageModels].includes(model)) {
      return provider as ProviderName
    }
  }

  // 模式匹配
  if (model.startsWith("gemini-") || model.startsWith("imagen-")) {
    return "gemini"
  }
  if (model.startsWith("doubao-")) {
    return "volcengine"
  }
  if (model.startsWith("gpt-") || model.startsWith("dall-e")) {
    return "openai"
  }

  return null
}
