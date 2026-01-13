/**
 * AI Provider 统一类型定义 - 基础类型
 */

// ============ 基础参数 ============
export interface BaseGenerateParams {
  /** 最大输出 token */
  maxTokens?: number
  /** 温度 0-2，各 Provider 内部转换 */
  temperature?: number
  /** 是否流式输出 */
  stream?: boolean
}

// ============ 深度思考能力 ============
export interface ThinkingOptions {
  /** 是否启用深度思考 */
  enabled: boolean
  /** 思考预算 token 数（Gemini 2.5 用） */
  budget?: number
  /** 思考级别（Gemini 3 用） */
  level?: "low" | "high"
  /** 是否在响应中返回思考过程 */
  includeInResponse?: boolean
}

// ============ 统一 Token 统计 ============
export interface TokenUsage {
  /** 输入 token 数 */
  inputTokens: number
  /** 输出 token 数 */
  outputTokens: number
  /** 思考 token 数（部分 Provider 支持） */
  thinkingTokens?: number
  /** 缓存命中 token 数 */
  cachedTokens?: number
  /** 总 token 数 */
  totalTokens: number
}

// ============ Provider 标识 ============
export type ProviderName = "gemini" | "volcengine" | "openai"

// ============ 错误类型 ============
export class AIProviderError extends Error {
  constructor(
    message: string,
    public readonly provider: ProviderName,
    public readonly code?: string,
    public readonly cause?: unknown
  ) {
    super(message)
    this.name = "AIProviderError"
  }
}

export class CapabilityNotSupportedError extends AIProviderError {
  constructor(provider: ProviderName, capability: string) {
    super(`Provider "${provider}" does not support capability: ${capability}`, provider, "CAPABILITY_NOT_SUPPORTED")
    this.name = "CapabilityNotSupportedError"
  }
}
