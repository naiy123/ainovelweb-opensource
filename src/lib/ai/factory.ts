/**
 * AI Provider 工厂
 *
 * 根据配置或环境变量创建对应的 Provider 实例
 */

import type { ProviderName } from "./types/common"
import type { TextProvider, ImageProvider } from "./providers/types"
import { GeminiTextProvider, GeminiImageProvider, isGeminiAvailable } from "./providers/gemini"
import { VolcTextProvider, VolcImageProvider, isVolcengineAvailable } from "./providers/volcengine"
import { inferProviderFromModel } from "./capabilities"

// ============ 环境变量配置 ============
const DEFAULT_TEXT_PROVIDER = (process.env.AI_TEXT_PROVIDER as ProviderName) || "gemini"
const DEFAULT_IMAGE_PROVIDER = (process.env.AI_IMAGE_PROVIDER as ProviderName) || "gemini"

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
 * @param name Provider 名称，默认从环境变量读取
 * @returns TextProvider 实例
 *
 * @example
 * ```ts
 * // 使用默认 Provider
 * const provider = getTextProvider()
 *
 * // 指定 Provider
 * const gemini = getTextProvider('gemini')
 * const volc = getTextProvider('volcengine')
 * ```
 */
export function getTextProvider(name?: ProviderName): TextProvider {
  const providerName = name || DEFAULT_TEXT_PROVIDER

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
