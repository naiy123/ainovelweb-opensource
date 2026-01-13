/**
 * AI Provider 统一类型定义 - 导出
 */

// 基础类型
export type { BaseGenerateParams, ThinkingOptions, TokenUsage, ProviderName } from "./common"
export { AIProviderError, CapabilityNotSupportedError } from "./common"

// 文本生成类型
export type {
  TextGenerateParams,
  UnifiedTextResult,
  TextStreamChunk,
  TextStreamChunkType,
  StreamAggregatedResult,
} from "./text"

// 图片生成类型
export type {
  ImageGenerateParams,
  UnifiedImageResult,
  ImageAspectRatio,
  ImageSize,
} from "./image"
export { ASPECT_RATIO_SIZES, getImageDimensions } from "./image"
