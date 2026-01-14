/**
 * AI 模块统一导出
 *
 * 新版统一架构导出（推荐）：
 * - 统一类型定义
 * - Provider 接口
 * - 工厂函数
 * - 能力检查
 *
 * 旧版导出（保持兼容）：
 * - 原有的业务函数
 */

// ============================================================
// 新版统一架构导出（推荐使用）
// ============================================================

// 统一类型定义
export type {
  // 基础类型
  BaseGenerateParams,
  ThinkingOptions,
  TokenUsage,
  ProviderName,
  // 文本生成类型
  TextGenerateParams,
  UnifiedTextResult,
  TextStreamChunk,
  TextStreamChunkType,
  StreamAggregatedResult,
  // 图片生成类型
  ImageGenerateParams,
  UnifiedImageResult,
  ImageAspectRatio,
  ImageSize,
} from "./types/index"

// 错误类型
export { AIProviderError, CapabilityNotSupportedError } from "./types/index"

// 图片尺寸工具
export { ASPECT_RATIO_SIZES, getImageDimensions } from "./types/index"

// Provider 接口
export type { TextProvider, ImageProvider, AIProvider as UnifiedAIProvider } from "./providers/types"

// 工厂函数
export {
  getTextProvider,
  getTextProviderAsync,
  getImageProvider,
  getTextProviderForModel,
  getImageProviderForModel,
  isProviderAvailable,
  getAvailableProviders,
  clearProviderCache,
} from "./factory"

// 能力检查
export {
  PROVIDER_CAPABILITIES,
  getProviderCapabilities,
  hasCapability,
  supportsThinking,
  getThinkingStyle,
  isModelOfProvider,
  inferProviderFromModel,
} from "./capabilities"
export type { ProviderCapabilities, ThinkingStyle } from "./capabilities"

// Provider 实现（高级用法，直接使用 Provider 类）
export {
  GeminiTextProvider,
  GeminiImageProvider,
  VolcTextProvider,
  VolcImageProvider,
} from "./providers"

// ============================================================
// 旧版导出（保持向后兼容）
// ============================================================

// 旧版类型定义
export type {
  AIProvider,
  GenerateParams,
  StreamChunk,
  CoverGenerationParams,
  CoverGenerationResult,
  CardGenerationParams,
  CardGenerationResult,
  GeneratedCharacter,
  GeneratedTerm,
  CharacterCardInfo,
  TermCardInfo,
  // 大纲生成类型
  OutlineNodeType as AIOutlineNodeType,
  OutlineGenerationParams,
  OutlineGenerationResult,
  GeneratedOutlineNode,
} from "./types"

// 写作生成（旧版）
export { GeminiProvider, aiProvider } from "./writing"

// 封面生成（旧版）
export { generateCoverImage } from "./cover"

// 卡片生成（旧版）
export { generateCard } from "./card"

// 大纲生成
export { generateOutline } from "./outline"

// 翻译
export { translateToChineseStream } from "./translate"

// 风格家封面生成（火山引擎）
export { generateCoverImageStylist } from "./cover-stylist"
