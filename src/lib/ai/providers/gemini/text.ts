/**
 * Gemini 文本生成适配器
 */

import { geminiClient } from "./client"
import type { TextProvider } from "../types"
import type {
  TextGenerateParams,
  UnifiedTextResult,
  TextStreamChunk,
} from "../../types/text"
import type { TokenUsage } from "../../types/common"
import { PROVIDER_CAPABILITIES, supportsThinking } from "../../capabilities"
import { logAIRequest, logAIResponse, logStreamComplete } from "../../logger"

export class GeminiTextProvider implements TextProvider {
  readonly name = "gemini" as const
  readonly capabilities = PROVIDER_CAPABILITIES.gemini

  /**
   * 将统一参数转换为 Gemini 原生参数
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private translateParams(params: TextGenerateParams, model: string): any {
    const isGemini3 = model.includes("gemini-3")
    const isGemini25 = model.includes("gemini-2.5")
    const isThinkingModel = supportsThinking("gemini", model)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config: any = {
      systemInstruction: params.systemPrompt,
      temperature: params.temperature ?? (isGemini3 ? 1.0 : 0.8),
      maxOutputTokens: params.maxTokens,
    }

    // JSON 模式
    if (params.jsonMode) {
      config.responseMimeType = "application/json"
    }

    // 深度思考配置
    if (isThinkingModel) {
      if (params.thinking?.enabled) {
        if (isGemini3) {
          // Gemini 3 使用 thinkingLevel
          config.thinkingConfig = {
            thinkingLevel: params.thinking.level === "low" ? "LOW" : "HIGH",
            includeThoughts: params.thinking.includeInResponse ?? true,
          }
        } else if (isGemini25) {
          // Gemini 2.5 使用 thinkingBudget
          config.thinkingConfig = {
            thinkingBudget: params.thinking.budget ?? 2000,
            includeThoughts: params.thinking.includeInResponse ?? true,
          }
        }
      } else {
        // 思考模型不能完全关闭思考，设置最小值
        if (isGemini3) {
          config.thinkingConfig = {
            thinkingLevel: "LOW",
            includeThoughts: false,
          }
        } else if (isGemini25) {
          config.thinkingConfig = {
            thinkingBudget: 128, // 最小值
            includeThoughts: false,
          }
        }
      }
    }

    // 原生参数覆盖
    if (params.nativeOptions) {
      Object.assign(config, params.nativeOptions)
    }

    return config
  }

  /**
   * 将 Gemini 响应转换为统一格式
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private translateResponse(response: any): UnifiedTextResult {
    const usageData = response.usageMetadata

    // 提取思考内容
    let thinking: string | undefined
    const parts = response.candidates?.[0]?.content?.parts || []
    const thoughtParts = parts
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((p: any) => p.thought === true)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((p: any) => p.text)
      .filter(Boolean)

    if (thoughtParts.length > 0) {
      thinking = thoughtParts.join("")
    }

    return {
      content: response.text || "",
      thinking,
      usage: {
        inputTokens: usageData?.promptTokenCount || 0,
        outputTokens: usageData?.candidatesTokenCount || 0,
        thinkingTokens: usageData?.thoughtsTokenCount,
        cachedTokens: usageData?.cachedContentTokenCount,
        totalTokens: usageData?.totalTokenCount || 0,
      },
      finishReason: response.candidates?.[0]?.finishReason,
      raw: response,
    }
  }

  /**
   * 生成文本（非流式）
   */
  async generate(params: TextGenerateParams): Promise<UnifiedTextResult> {
    const model = params.model || this.capabilities.defaultTextModel
    const config = this.translateParams(params, model)

    // 打印请求日志
    logAIRequest({
      title: "Gemini 文本生成",
      model,
      modelDisplayName: model,
      temperature: config.temperature,
      maxOutputTokens: config.maxOutputTokens,
      thinkingConfig: config.thinkingConfig,
      systemInstruction: params.systemPrompt,
      prompt: params.userPrompt,
      extraParams: {
        JsonMode: params.jsonMode,
        ThinkingEnabled: params.thinking?.enabled,
      },
    })

    const startTime = Date.now()

    const response = await geminiClient.models.generateContent({
      model,
      contents: params.userPrompt,
      config,
    })

    const result = this.translateResponse(response)
    const durationMs = Date.now() - startTime

    // 打印响应日志
    logAIResponse({
      title: "Gemini 文本生成",
      success: true,
      durationMs,
      finishReason: result.finishReason,
      contentLength: result.content.length,
      usage: {
        promptTokenCount: result.usage.inputTokens,
        candidatesTokenCount: result.usage.outputTokens,
        thoughtsTokenCount: result.usage.thinkingTokens,
        cachedContentTokenCount: result.usage.cachedTokens,
        totalTokenCount: result.usage.totalTokens,
      },
    })

    return result
  }

  /**
   * 生成文本（流式）
   */
  async *generateStream(
    params: TextGenerateParams
  ): AsyncGenerator<TextStreamChunk, void, unknown> {
    const model = params.model || this.capabilities.defaultTextModel
    const config = this.translateParams(params, model)

    // 打印请求日志
    logAIRequest({
      title: "Gemini 文本生成 (流式)",
      model,
      modelDisplayName: model,
      temperature: config.temperature,
      maxOutputTokens: config.maxOutputTokens,
      thinkingConfig: config.thinkingConfig,
      systemInstruction: params.systemPrompt,
      prompt: params.userPrompt,
      extraParams: {
        JsonMode: params.jsonMode,
        ThinkingEnabled: params.thinking?.enabled,
      },
    })

    const startTime = Date.now()

    const response = await geminiClient.models.generateContentStream({
      model,
      contents: params.userPrompt,
      config,
    })

    let usage: TokenUsage | undefined
    let contentLength = 0
    let thinkingLength = 0

    for await (const chunk of response) {
      // 捕获 usageMetadata（通常在最后一个 chunk 中）
      if (chunk.usageMetadata) {
        usage = {
          inputTokens: chunk.usageMetadata.promptTokenCount || 0,
          outputTokens: chunk.usageMetadata.candidatesTokenCount || 0,
          thinkingTokens: chunk.usageMetadata.thoughtsTokenCount,
          cachedTokens: chunk.usageMetadata.cachedContentTokenCount,
          totalTokens: chunk.usageMetadata.totalTokenCount || 0,
        }
      }

      // 处理内容 parts
      const parts = chunk.candidates?.[0]?.content?.parts || []
      for (const part of parts) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((part as any).thought === true && (part as any).text) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const text = (part as any).text
          thinkingLength += text.length
          yield { type: "thinking", text }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } else if ((part as any).text) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const text = (part as any).text
          contentLength += text.length
          yield { type: "content", text }
        }
      }
    }

    // 流结束后返回 token 使用统计
    if (usage) {
      yield { type: "usage", usage }
    }

    // 打印流完成日志
    logStreamComplete({
      title: "Gemini 文本生成 (流式)",
      durationMs: Date.now() - startTime,
      generatedContentLength: contentLength,
      usage: usage
        ? {
            promptTokenCount: usage.inputTokens,
            candidatesTokenCount: usage.outputTokens,
            thoughtsTokenCount: usage.thinkingTokens,
            cachedContentTokenCount: usage.cachedTokens,
            totalTokenCount: usage.totalTokens,
          }
        : undefined,
      thinkingContent:
        thinkingLength > 0 ? `(${thinkingLength} 字思考内容)` : undefined,
    })
  }
}
