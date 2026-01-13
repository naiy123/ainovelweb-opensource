/**
 * AI Provider 接口定义
 */

import type { ProviderCapabilities } from "../capabilities"
import type { ProviderName } from "../types/common"
import type {
  TextGenerateParams,
  UnifiedTextResult,
  TextStreamChunk,
} from "../types/text"
import type { ImageGenerateParams, UnifiedImageResult } from "../types/image"

// ============ 文本生成 Provider 接口 ============
export interface TextProvider {
  /** Provider 名称 */
  readonly name: ProviderName

  /** Provider 能力配置 */
  readonly capabilities: ProviderCapabilities

  /**
   * 生成文本（非流式）
   */
  generate(params: TextGenerateParams): Promise<UnifiedTextResult>

  /**
   * 生成文本（流式）
   * @returns AsyncGenerator 产出 TextStreamChunk
   */
  generateStream(
    params: TextGenerateParams
  ): AsyncGenerator<TextStreamChunk, void, unknown>
}

// ============ 图片生成 Provider 接口 ============
export interface ImageProvider {
  /** Provider 名称 */
  readonly name: ProviderName

  /** Provider 能力配置 */
  readonly capabilities: ProviderCapabilities

  /**
   * 生成图片
   */
  generate(params: ImageGenerateParams): Promise<UnifiedImageResult>
}

// ============ 组合 Provider 接口（可选） ============
/**
 * 同时支持文本和图片生成的 Provider
 * 注意：由于 generate 方法签名不同，使用组合而非继承
 */
export interface AIProvider {
  /** Provider 名称 */
  readonly name: ProviderName

  /** Provider 能力配置 */
  readonly capabilities: ProviderCapabilities

  /** 文本生成（非流式） */
  generateText(params: TextGenerateParams): Promise<UnifiedTextResult>

  /** 文本生成（流式） */
  generateTextStream(
    params: TextGenerateParams
  ): AsyncGenerator<TextStreamChunk, void, unknown>

  /** 图片生成 */
  generateImage(params: ImageGenerateParams): Promise<UnifiedImageResult>
}

// ============ Provider 工厂函数类型 ============
export type TextProviderFactory = () => TextProvider
export type ImageProviderFactory = () => ImageProvider
