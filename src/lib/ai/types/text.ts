/**
 * AI Provider 统一类型定义 - 文本生成
 */

import type { BaseGenerateParams, ThinkingOptions, TokenUsage } from "./common"

// ============ 文本生成参数 ============
export interface TextGenerateParams extends BaseGenerateParams {
  /** 模型 ID（可选，使用 Provider 默认模型） */
  model?: string

  /** 系统提示词 */
  systemPrompt?: string

  /** 用户提示词 */
  userPrompt: string

  /** 深度思考选项 */
  thinking?: ThinkingOptions

  /** JSON 模式（部分 Provider 支持） */
  jsonMode?: boolean

  /** Provider 原生参数覆盖（高级用户） */
  nativeOptions?: Record<string, unknown>
}

// ============ 文本生成结果 ============
export interface UnifiedTextResult {
  /** 生成的文本内容 */
  content: string

  /** 深度思考内容（如果启用且返回） */
  thinking?: string

  /** Token 使用统计 */
  usage: TokenUsage

  /** 结束原因 */
  finishReason?: string

  /** 原始响应（调试用） */
  raw?: unknown
}

// ============ 流式输出 ============
export type TextStreamChunkType = "thinking" | "content" | "usage" | "error"

export interface TextStreamChunk {
  /** chunk 类型 */
  type: TextStreamChunkType

  /** 文本内容（thinking 或 content 类型） */
  text?: string

  /** Token 统计（usage 类型，通常在流结束时） */
  usage?: TokenUsage

  /** 错误信息（error 类型） */
  error?: string
}

// ============ 流式响应聚合结果 ============
export interface StreamAggregatedResult {
  /** 完整内容 */
  content: string

  /** 完整思考内容 */
  thinking?: string

  /** Token 统计 */
  usage?: TokenUsage
}
