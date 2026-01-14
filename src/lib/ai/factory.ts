/**
 * AI Provider 工厂
 *
 * 根据配置或环境变量创建对应的 Provider 实例
 * 本地版本优先使用数据库配置的 API Key
 */

import type { ProviderName } from "./types/common"
import type { TextProvider, ImageProvider } from "./providers/types"
import { GeminiTextProvider, GeminiImageProvider, isGeminiAvailable } from "./providers/gemini"
import { VolcTextProvider, VolcImageProvider, isVolcengineAvailable, isVolcengineAvailableAsync } from "./providers/volcengine"
import { inferProviderFromModel } from "./capabilities"
import { getDoubaoApiKey, getSeedreamApiKey } from "@/lib/settings"

// ============ 环境变量配置 ============
const ENV_TEXT_PROVIDER = process.env.AI_TEXT_PROVIDER as ProviderName | undefined
const ENV_IMAGE_PROVIDER = process.env.AI_IMAGE_PROVIDER as ProviderName | undefined

// ============ Provider 工厂注册表 ============
const textProviderFactories: Record<ProviderName, () => TextProvider> = {
  gemini: () => new GeminiTextProvider(),
  volcengine: () => new VolcTextProvider(),
  openai: () => {
    throw new Error("OpenAI provider not implemented yet")
  },
}

const imageProviderFactories: Record<ProviderName, () => ImageProvider> = {
  gemini: () => new GeminiImageProvider(),
  volcengine: () => new VolcImageProvider(),
  openai: () => {
    throw new Error("OpenAI provider not implemented yet")
  },
}

// ============ Provider 实例缓存 ============
const textProviderCache = new Map<ProviderName, TextProvider>()
const imageProviderCache = new Map<ProviderName, ImageProvider>()

// ============ 工厂函数 ============

/**
 * 获取文本生成 Provider
 *
 * @param name Provider 名称，不指定时自动选择已配置的 Provider
 * @returns TextProvider 实例
 *
 * 优先级：
 * 1. 显式指定的 name
 * 2. 环境变量 AI_TEXT_PROVIDER
 * 3. 火山引擎（如果数据库配置了 doubao_api_key）
 * 4. Gemini（默认后备）
 *
 * @example
 * ```ts
 * // 使用默认 Provider（自动检测已配置的）
 * const provider = getTextProvider()
 *
 * // 指定 Provider
 * const gemini = getTextProvider('gemini')
 * const volc = getTextProvider('volcengine')
 * ```
 */
export function getTextProvider(name?: ProviderName): TextProvider {
  // 如果指定了 name 或环境变量，使用指定的
  const providerName = name || ENV_TEXT_PROVIDER || "volcengine"

  // 检查缓存
  if (textProviderCache.has(providerName)) {
    return textProviderCache.get(providerName)!
  }

  // 创建实例
  const factory = textProviderFactories[providerName]
  if (!factory) {
    throw new Error(`Unknown text provider: ${providerName}`)
  }

  const provider = factory()
  textProviderCache.set(providerName, provider)

  return provider
}

/**
 * 异步获取文本生成 Provider（推荐使用）
 * 会检查数据库配置的 API Key 来选择最佳 Provider
 */
export async function getTextProviderAsync(name?: ProviderName): Promise<TextProvider> {
  // 如果显式指定，直接返回
  if (name) {
    return getTextProvider(name)
  }

  // 检查环境变量
  if (ENV_TEXT_PROVIDER) {
    return getTextProvider(ENV_TEXT_PROVIDER)
  }

  // 检查数据库配置
  const doubaoKey = await getDoubaoApiKey()
  if (doubaoKey) {
    return getTextProvider("volcengine")
  }

  // 检查 Gemini 是否可用
  if (isGeminiAvailable()) {
    return getTextProvider("gemini")
  }

  // 默认返回火山引擎（即使没配置，让它显示具体错误）
  return getTextProvider("volcengine")
}

/**
 * 获取图片生成 Provider
 *
 * @param name Provider 名称，默认从环境变量读取
 * @returns ImageProvider 实例
 *
 * @example
 * ```ts
 * // 使用默认 Provider
 * const provider = getImageProvider()
 *
 * // 指定 Provider
 * const gemini = getImageProvider('gemini')
 * const volc = getImageProvider('volcengine')
 * ```
 */
export function getImageProvider(name?: ProviderName): ImageProvider {
  const providerName = name || DEFAULT_IMAGE_PROVIDER

  // 检查缓存
  if (imageProviderCache.has(providerName)) {
    return imageProviderCache.get(providerName)!
  }

  // 创建实例
  const factory = imageProviderFactories[providerName]
  if (!factory) {
    throw new Error(`Unknown image provider: ${providerName}`)
  }

  const provider = factory()
  imageProviderCache.set(providerName, provider)

  return provider
}

/**
 * 根据模型名称自动选择 Provider
 *
 * @param model 模型名称
 * @returns TextProvider 实例
 *
 * @example
 * ```ts
 * const provider = getTextProviderForModel('gemini-2.5-flash')
 * // 返回 GeminiTextProvider
 *
 * const provider = getTextProviderForModel('doubao-seed-1-6')
 * // 返回 VolcTextProvider
 * ```
 */
export function getTextProviderForModel(model: string): TextProvider {
  const providerName = inferProviderFromModel(model)
  if (!providerName) {
    throw new Error(`Cannot infer provider for model: ${model}`)
  }
  return getTextProvider(providerName)
}

/**
 * 根据模型名称自动选择图片 Provider
 *
 * @param model 模型名称
 * @returns ImageProvider 实例
 */
export function getImageProviderForModel(model: string): ImageProvider {
  const providerName = inferProviderFromModel(model)
  if (!providerName) {
    throw new Error(`Cannot infer provider for model: ${model}`)
  }
  return getImageProvider(providerName)
}

/**
 * 检查指定 Provider 是否可用（API Key 已配置）
 */
export function isProviderAvailable(name: ProviderName): boolean {
  switch (name) {
    case "gemini":
      return isGeminiAvailable()
    case "volcengine":
      return isVolcengineAvailable()
    case "openai":
      return !!process.env.OPENAI_API_KEY
    default:
      return false
  }
}

/**
 * 获取所有可用的 Provider 列表
 */
export function getAvailableProviders(): ProviderName[] {
  const providers: ProviderName[] = ["gemini", "volcengine", "openai"]
  return providers.filter(isProviderAvailable)
}

/**
 * 清除 Provider 缓存（用于测试或重新初始化）
 */
export function clearProviderCache(): void {
  textProviderCache.clear()
  imageProviderCache.clear()
}
