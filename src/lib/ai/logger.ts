/**
 * AI 调用统一日志工具
 * 仅在开发环境下输出详细日志
 */

const isDev = process.env.NODE_ENV === "development"

// 分隔线
const LINE = "=".repeat(70)
const DASH = "-".repeat(50)

/**
 * AI 请求日志参数
 */
export interface AIRequestLogParams {
  title: string                    // 日志标题，如 "章节生成", "卡片生成"
  model: string                    // 模型名称
  modelDisplayName?: string        // 模型显示名称
  temperature?: number             // 温度
  maxOutputTokens?: number         // 最大输出 token
  thinkingConfig?: {               // 思考配置
    thinkingBudget?: number
    thinkingLevel?: string
    includeThoughts?: boolean
  }
  systemInstruction?: string       // 系统指令
  prompt: string                   // 用户提示词
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extraParams?: Record<string, any> // 额外参数
}

/**
 * AI 响应日志参数
 */
export interface AIResponseLogParams {
  title: string                    // 日志标题
  success: boolean                 // 是否成功
  finishReason?: string            // 结束原因
  contentLength?: number           // 内容长度
  contentPreview?: string          // 内容预览
  usage?: {                        // Token 使用统计
    promptTokenCount?: number
    candidatesTokenCount?: number
    thoughtsTokenCount?: number
    cachedContentTokenCount?: number
    totalTokenCount?: number
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error?: any                      // 错误信息
  durationMs?: number              // 耗时（毫秒）
}

/**
 * 打印 AI 请求日志
 */
export function logAIRequest(params: AIRequestLogParams): void {
  if (!isDev) return

  console.log("\n" + LINE)
  console.log(`🤖 ${params.title} - API 请求`)
  console.log(LINE)

  // 模型信息
  console.log("📌 Model:", params.model, params.modelDisplayName ? `(${params.modelDisplayName})` : "")

  // 配置参数
  if (params.temperature !== undefined) {
    console.log("🌡️  Temperature:", params.temperature)
  }
  if (params.maxOutputTokens !== undefined) {
    console.log("📊 MaxOutputTokens:", params.maxOutputTokens)
  }

  // 思考配置
  if (params.thinkingConfig) {
    const tc = params.thinkingConfig
    if (tc.thinkingLevel) {
      console.log("🧠 ThinkingLevel:", tc.thinkingLevel)
    }
    if (tc.thinkingBudget !== undefined) {
      console.log("🧠 ThinkingBudget:", tc.thinkingBudget)
    }
    if (tc.includeThoughts !== undefined) {
      console.log("🧠 IncludeThoughts:", tc.includeThoughts)
    }
  }

  // 额外参数
  if (params.extraParams) {
    for (const [key, value] of Object.entries(params.extraParams)) {
      if (value !== undefined && value !== null && value !== "") {
        const displayValue = typeof value === "object" ? JSON.stringify(value) : value
        console.log(`📎 ${key}:`, displayValue)
      }
    }
  }

  // System Instruction
  if (params.systemInstruction) {
    console.log("\n📋 System Instruction:")
    console.log(DASH)
    console.log(params.systemInstruction)
  }

  // User Prompt
  console.log("\n💬 User Prompt:")
  console.log(DASH)
  console.log(params.prompt)

  console.log(LINE + "\n")
}

/**
 * 打印 AI 响应日志
 */
export function logAIResponse(params: AIResponseLogParams): void {
  if (!isDev) return

  console.log("\n" + LINE)
  console.log(`${params.success ? "✅" : "❌"} ${params.title} - API 响应`)
  console.log(LINE)

  // 耗时
  if (params.durationMs !== undefined) {
    console.log("⏱️  耗时:", params.durationMs, "ms")
  }

  // 结束原因
  if (params.finishReason) {
    const isNormal = params.finishReason === "STOP" || params.finishReason === "END_TURN"
    console.log("🏁 FinishReason:", params.finishReason, isNormal ? "" : "⚠️")
  }

  // 内容信息
  if (params.contentLength !== undefined) {
    console.log("📝 内容长度:", params.contentLength, "字符")
  }

  // Token 统计
  if (params.usage) {
    console.log("\n📊 Token 使用统计:")
    console.log(DASH)
    if (params.usage.promptTokenCount !== undefined) {
      console.log("  📥 输入 tokens:", params.usage.promptTokenCount)
    }
    if (params.usage.candidatesTokenCount !== undefined) {
      console.log("  📤 输出 tokens:", params.usage.candidatesTokenCount)
    }
    if (params.usage.thoughtsTokenCount) {
      console.log("  💭 思考 tokens:", params.usage.thoughtsTokenCount)
    }
    if (params.usage.cachedContentTokenCount) {
      console.log("  💾 缓存命中 tokens:", params.usage.cachedContentTokenCount)
    }
    if (params.usage.totalTokenCount !== undefined) {
      console.log("  📊 总计 tokens:", params.usage.totalTokenCount)
    }
  }

  // 内容预览
  if (params.contentPreview) {
    console.log("\n📄 内容预览:")
    console.log(DASH)
    console.log(params.contentPreview)
  }

  // 错误信息
  if (params.error) {
    console.log("\n❌ 错误信息:")
    console.log(DASH)
    console.error(params.error)
  }

  console.log(LINE + "\n")
}

/**
 * 流式响应完成日志参数
 */
export interface StreamCompleteLogParams {
  title: string
  usage?: AIResponseLogParams["usage"]
  thinkingContent?: string
  generatedContentLength?: number
  durationMs?: number
}

/**
 * 打印流式响应完成日志（在流结束时调用）
 */
export function logStreamComplete(params: StreamCompleteLogParams): void {
  if (!isDev) return

  const { title, usage, thinkingContent, generatedContentLength, durationMs } = params

  console.log("\n" + LINE)
  console.log(`✅ ${title} - 流式响应完成`)
  console.log(LINE)

  // 耗时
  if (durationMs !== undefined) {
    console.log("⏱️  耗时:", durationMs, "ms")
  }

  // 生成内容长度
  if (generatedContentLength !== undefined) {
    console.log("📝 生成内容:", generatedContentLength, "字符")
  }

  // Token 统计
  if (usage) {
    console.log("\n📊 Token 使用统计:")
    console.log(DASH)
    if (usage.promptTokenCount !== undefined) {
      console.log("  📥 输入 tokens:", usage.promptTokenCount)
    }
    if (usage.candidatesTokenCount !== undefined) {
      console.log("  📤 输出 tokens:", usage.candidatesTokenCount)
    }
    if (usage.thoughtsTokenCount) {
      console.log("  💭 思考 tokens:", usage.thoughtsTokenCount)
    }
    if (usage.cachedContentTokenCount) {
      console.log("  💾 缓存命中 tokens:", usage.cachedContentTokenCount)
    }
    if (usage.totalTokenCount !== undefined) {
      console.log("  📊 总计 tokens:", usage.totalTokenCount)
    }
  }

  // 思考内容
  if (thinkingContent) {
    console.log("\n🧠 思考内容:")
    console.log(DASH)
    if (thinkingContent.length > 1000) {
      console.log(thinkingContent.slice(0, 1000))
      console.log(`...(共 ${thinkingContent.length} 字)`)
    } else {
      console.log(thinkingContent)
    }
  }

  console.log(LINE + "\n")
}

/**
 * 打印流式响应的 Token 统计（在流结束时调用）
 * @deprecated 使用 logStreamComplete 代替
 */
export function logStreamUsage(title: string, usage: AIResponseLogParams["usage"]): void {
  if (!isDev || !usage) return

  console.log("\n" + LINE)
  console.log(`📊 ${title} - Token 使用统计`)
  console.log(LINE)
  if (usage.promptTokenCount !== undefined) {
    console.log("📥 输入 tokens:", usage.promptTokenCount)
  }
  if (usage.candidatesTokenCount !== undefined) {
    console.log("📤 输出 tokens:", usage.candidatesTokenCount)
  }
  if (usage.thoughtsTokenCount) {
    console.log("💭 思考 tokens:", usage.thoughtsTokenCount)
  }
  if (usage.cachedContentTokenCount) {
    console.log("💾 缓存命中 tokens:", usage.cachedContentTokenCount)
  }
  if (usage.totalTokenCount !== undefined) {
    console.log("📊 总计 tokens:", usage.totalTokenCount)
  }
  console.log(LINE + "\n")
}

/**
 * 简单的开发环境日志
 */
export function devLog(...args: unknown[]): void {
  if (!isDev) return
  console.log(...args)
}

/**
 * 简单的开发环境警告
 */
export function devWarn(...args: unknown[]): void {
  if (!isDev) return
  console.warn(...args)
}

/**
 * 简单的开发环境错误（始终输出）
 */
export function devError(...args: unknown[]): void {
  console.error(...args)
}
