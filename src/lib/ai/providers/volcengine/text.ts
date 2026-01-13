/**
 * 火山引擎文本生成适配器
 *
 * 使用 OpenAI 兼容接口，支持 Doubao 系列模型
 * 特点：
 * - 深度思考模型 (doubao-seed-*) 自动触发推理，不支持 temperature/max_tokens
 * - 思考内容通过 reasoning_content 字段返回
 */

import { volcClient } from "./client"
import type { TextProvider } from "../types"
import type {
  TextGenerateParams,
  UnifiedTextResult,
  TextStreamChunk,
} from "../../types/text"
import type { TokenUsage } from "../../types/common"
import { PROVIDER_CAPABILITIES, supportsThinking } from "../../capabilities"
import { logAIRequest, logAIResponse, logStreamComplete, devLog } from "../../logger"

export class VolcTextProvider implements TextProvider {
  readonly name = "volcengine" as const
  readonly capabilities = PROVIDER_CAPABILITIES.volcengine

  /**
   * 将统一参数转换为火山原生参数
   *
   * 注意：深度思考模型不支持 temperature/max_tokens 参数
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private translateParams(params: TextGenerateParams, model: string): any {
    const isThinkingModel = supportsThinking("volcengine", model) || model.includes("seed")

    // 构建消息
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const messages: any[] = []
    if (params.systemPrompt) {
      messages.push({ role: "system", content: params.systemPrompt })
    }
    messages.push({ role: "user", content: params.userPrompt })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const options: any = {
      model,
      messages,
      stream: params.stream ?? false,
    }

    // 深度思考模型不支持这些参数
    if (!isThinkingModel) {
      if (params.maxTokens) {
        options.max_tokens = params.maxTokens
      }
      if (params.temperature !== undefined) {
        options.temperature = params.temperature
      }
    }

    // 原生参数覆盖
    if (params.nativeOptions) {
      Object.assign(options, params.nativeOptions)
    }

    return options
  }

  /**
   * 将火山响应转换为统一格式
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private translateResponse(completion: any): UnifiedTextResult {
    const message = completion.choices?.[0]?.message

    return {
      content: message?.content || "",
      // 火山深度思考模型返回 reasoning_content
      thinking: message?.reasoning_content || undefined,
      usage: {
        inputTokens: completion.usage?.prompt_tokens || 0,
        outputTokens: completion.usage?.completion_tokens || 0,
        // 火山的思考 token 包含在 completion_tokens 里，无法单独获取
        totalTokens: completion.usage?.total_tokens || 0,
      },
      finishReason: completion.choices?.[0]?.finish_reason,
      raw: completion,
    }
  }

  /**
   * 生成文本（非流式）
   */
  async generate(params: TextGenerateParams): Promise<UnifiedTextResult> {
    const model = params.model || this.capabilities.defaultTextModel
    const options = this.translateParams(params, model)

    // 打印请求日志
    logAIRequest({
      title: "火山引擎文本生成",
      model,
      modelDisplayName: model,
      temperature: options.temperature,
      maxOutputTokens: options.max_tokens,
      systemInstruction: params.systemPrompt,
      prompt: params.userPrompt,
      extraParams: {
        Provider: "火山引擎",
        IsThinkingModel: model.includes("seed"),
      },
    })

    const startTime = Date.now()

    const completion = await volcClient.chat.completions.create(options)

    const result = this.translateResponse(completion)
    const durationMs = Date.now() - startTime

    // 打印思维链内容
    if (result.thinking) {
      devLog("\n🧠 思维链内容:")
      devLog("-".repeat(40))
      devLog(result.thinking.length > 1000
        ? result.thinking.slice(0, 1000) + `...(共 ${result.thinking.length} 字)`
        : result.thinking)
      devLog("-".repeat(40))
    }

    // 打印响应日志
    logAIResponse({
      title: "火山引擎文本生成",
      success: true,
      durationMs,
      finishReason: result.finishReason,
      contentLength: result.content.length,
      usage: {
        promptTokenCount: result.usage.inputTokens,
        candidatesTokenCount: result.usage.outputTokens,
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
    const options = this.translateParams({ ...params, stream: true }, model)

    // 打印请求日志
    logAIRequest({
      title: "火山引擎文本生成 (流式)",
      model,
      modelDisplayName: model,
      temperature: options.temperature,
      maxOutputTokens: options.max_tokens,
      systemInstruction: params.systemPrompt,
      prompt: params.userPrompt,
      extraParams: {
        Provider: "火山引擎",
        IsThinkingModel: model.includes("seed"),
      },
    })

    const startTime = Date.now()

    const stream = await volcClient.chat.completions.create(options)

    let usage: TokenUsage | undefined
    let contentLength = 0
    let thinkingLength = 0

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for await (const chunk of stream as any) {
      const delta = chunk.choices?.[0]?.delta

      // 火山流式返回 reasoning_content（思考内容）
      if (delta?.reasoning_content) {
        thinkingLength += delta.reasoning_content.length
        yield { type: "thinking", text: delta.reasoning_content }
      }

      // 正常内容
      if (delta?.content) {
        contentLength += delta.content.length
        yield { type: "content", text: delta.content }
      }

      // 最后一个 chunk 可能包含 usage
      if (chunk.usage) {
        usage = {
          inputTokens: chunk.usage.prompt_tokens || 0,
          outputTokens: chunk.usage.completion_tokens || 0,
          totalTokens: chunk.usage.total_tokens || 0,
        }
      }
    }

    // 流结束后返回 token 使用统计
    if (usage) {
      yield { type: "usage", usage }
    }

    // 打印流完成日志
    logStreamComplete({
      title: "火山引擎文本生成 (流式)",
      durationMs: Date.now() - startTime,
      generatedContentLength: contentLength,
      usage: usage
        ? {
            promptTokenCount: usage.inputTokens,
            candidatesTokenCount: usage.outputTokens,
            totalTokenCount: usage.totalTokens,
          }
        : undefined,
      thinkingContent:
        thinkingLength > 0 ? `(${thinkingLength} 字思考内容)` : undefined,
    })
  }
}
