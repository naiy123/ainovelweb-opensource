import { ai } from "./client"
import type { AIProvider, GenerateParams, StreamChunk, TokenUsage } from "./types"
import { logAIRequest, logAIResponse } from "./logger"

// 默认模型
const DEFAULT_MODEL = "gemini-2.5-flash"

/**
 * Gemini 写作生成器
 */
export class GeminiProvider implements AIProvider {
  async generateContent(params: GenerateParams): Promise<string> {
    const model = params.model || DEFAULT_MODEL
    const thinking = params.thinking ?? false
    const prompt = this.buildPrompt(params)
    const systemInstruction = this.buildSystemInstruction(params)
    const isGemini3 = model.includes("gemini-3")
    const isGemini25 = model.includes("gemini-2.5")

    // 内容所需 tokens（中文约 2 tokens/字）
    const contentTokens = params.wordCount * 2
    // 深度思考额外预算
    const thinkingExtra = thinking ? 2000 : 0
    // 总输出限制
    const maxOutputTokens = contentTokens + thinkingExtra

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config: any = {
      systemInstruction,
      temperature: isGemini3 ? 1.0 : 0.8, // Gemini 3 推荐使用 1.0
      maxOutputTokens,
    }

    // 根据模型版本选择思考配置方式
    if (isGemini3) {
      // Gemini 3 使用 thinkingLevel（思考不能完全关闭，只能调整级别）
      // LOW: 最小化延迟和成本，适合简单任务
      // HIGH: 最大化推理深度（默认）
      config.thinkingConfig = {
        thinkingLevel: thinking ? "HIGH" : "LOW",
        includeThoughts: thinking,
      }
    } else if (isGemini25) {
      // Gemini 2.5 是思考模型，最小 thinkingBudget 是 128，不能设为 0
      // thinking: true -> 额外 2000 预算进行深度思考
      // thinking: false -> 最小预算 128，减少延迟和成本
      config.thinkingConfig = {
        thinkingBudget: thinking ? 2000 : 128,
        includeThoughts: thinking,
      }
    } else {
      // Gemini 2.0 等非思考模型，不需要配置 thinkingConfig
      // 这些模型本身不支持思考功能
    }

    // 打印请求日志
    logAIRequest({
      title: "章节生成 (非流式)",
      model,
      temperature: config.temperature,
      maxOutputTokens: config.maxOutputTokens,
      thinkingConfig: config.thinkingConfig,
      systemInstruction,
      prompt,
      extraParams: {
        WordCount: params.wordCount,
        WritingStyle: params.writingStyle,
        LinkedChapters: params.linkedChapters?.length,
      },
    })

    const startTime = Date.now()
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config,
    })

    const text = response.text || ""
    const durationMs = Date.now() - startTime
    const usage = response.usageMetadata

    // 打印响应日志
    logAIResponse({
      title: "章节生成 (非流式)",
      success: true,
      durationMs,
      finishReason: response.candidates?.[0]?.finishReason as string,
      contentLength: text.length,
      usage: usage ? {
        promptTokenCount: usage.promptTokenCount,
        candidatesTokenCount: usage.candidatesTokenCount,
        thoughtsTokenCount: usage.thoughtsTokenCount,
        cachedContentTokenCount: usage.cachedContentTokenCount,
        totalTokenCount: usage.totalTokenCount,
      } : undefined,
    })

    return text
  }

  async *generateContentStream(params: GenerateParams): AsyncGenerator<StreamChunk, void, unknown> {
    const model = params.model || DEFAULT_MODEL
    const thinking = params.thinking ?? false
    const prompt = this.buildPrompt(params)
    const systemInstruction = this.buildSystemInstruction(params)
    const isGemini3 = model.includes("gemini-3")
    const isGemini25 = model.includes("gemini-2.5")

    // 内容所需 tokens（中文约 2 tokens/字）
    const contentTokens = params.wordCount * 2
    // 深度思考额外预算
    const thinkingExtra = thinking ? 2000 : 0
    // 总输出限制
    const maxOutputTokens = contentTokens + thinkingExtra

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config: any = {
      systemInstruction,
      temperature: isGemini3 ? 1.0 : 0.8, // Gemini 3 推荐使用 1.0
      maxOutputTokens,
    }

    // 根据模型版本选择思考配置方式
    if (isGemini3) {
      // Gemini 3 使用 thinkingLevel（思考不能完全关闭，只能调整级别）
      // LOW: 最小化延迟和成本，适合简单任务
      // HIGH: 最大化推理深度（默认）
      config.thinkingConfig = {
        thinkingLevel: thinking ? "HIGH" : "LOW",
        includeThoughts: thinking,
      }
    } else if (isGemini25) {
      // Gemini 2.5 是思考模型，最小 thinkingBudget 是 128，不能设为 0
      // thinking: true -> 额外 2000 预算进行深度思考
      // thinking: false -> 最小预算 128，减少延迟和成本
      config.thinkingConfig = {
        thinkingBudget: thinking ? 2000 : 128,
        includeThoughts: thinking,
      }
    } else {
      // Gemini 2.0 等非思考模型，不需要配置 thinkingConfig
      // 这些模型本身不支持思考功能
    }

    // 打印请求日志
    logAIRequest({
      title: "章节生成 (流式)",
      model,
      temperature: config.temperature,
      maxOutputTokens: config.maxOutputTokens,
      thinkingConfig: config.thinkingConfig,
      systemInstruction,
      prompt,
      extraParams: {
        WordCount: params.wordCount,
        WritingStyle: params.writingStyle,
        LinkedChapters: params.linkedChapters?.length,
        Characters: params.characters?.length,
        Terms: params.terms?.length,
      },
    })

    const response = await ai.models.generateContentStream({
      model,
      contents: prompt,
      config,
    })

    let usage: TokenUsage | null = null

    for await (const chunk of response) {
      // 捕获 usageMetadata（通常在最后一个 chunk 中）
      if (chunk.usageMetadata) {
        usage = {
          promptTokenCount: chunk.usageMetadata.promptTokenCount || 0,
          candidatesTokenCount: chunk.usageMetadata.candidatesTokenCount || 0,
          thoughtsTokenCount: chunk.usageMetadata.thoughtsTokenCount,
          cachedContentTokenCount: chunk.usageMetadata.cachedContentTokenCount,
          totalTokenCount: chunk.usageMetadata.totalTokenCount || 0,
        }
      }

      if (chunk.candidates && chunk.candidates.length > 0) {
        const candidate = chunk.candidates[0]
        if (candidate.content && candidate.content.parts) {
          for (const part of candidate.content.parts) {
            if ("thought" in part && part.thought === true) {
              if (part.text) {
                yield { type: "thinking", text: part.text }
              }
            } else if (part.text) {
              yield { type: "content", text: part.text }
            }
          }
        }
      }
    }

    // 流结束后返回 token 使用统计
    if (usage) {
      yield { type: "usage", usage }
    }
  }

  private buildSystemInstruction(params: GenerateParams): string {
    let instruction = `你是一位专业的网文作家，擅长创作引人入胜的小说内容。

写作要求：
- 字数约 ${params.wordCount} 字
- 情节紧凑，对话生动
- 保持与前文的连贯性
- 适当制造悬念
- 直接开始写作，不要添加标题或额外说明`

    if (params.writingStyle) {
      instruction += `\n- 写作风格：${params.writingStyle}`
    }

    return instruction
  }

  private buildPrompt(params: GenerateParams): string {
    let prompt = ""

    if (params.storyBackground) {
      prompt += `【故事背景】
${params.storyBackground}

`
    }

    // 添加角色设定
    if (params.characters && params.characters.length > 0) {
      prompt += `【本章角色】
`
      for (const char of params.characters) {
        prompt += `▸ ${char.name}`
        const details = []
        if (char.gender) details.push(char.gender)
        if (char.age) details.push(char.age)
        if (details.length > 0) prompt += `（${details.join("，")}）`
        prompt += "\n"
        if (char.personality) prompt += `  性格：${char.personality}\n`
        if (char.background) prompt += `  背景：${char.background}\n`
        if (char.abilities) prompt += `  能力：${char.abilities}\n`
      }
      prompt += "\n"
    }

    // 添加角色关系
    if (params.characterRelations) {
      prompt += `【角色关系】
${params.characterRelations}

`
    }

    // 添加词条设定
    if (params.terms && params.terms.length > 0) {
      prompt += `【相关设定】
`
      for (const term of params.terms) {
        prompt += `▸ ${term.name}`
        if (term.description) {
          prompt += `：${term.description}`
        }
        prompt += "\n"
      }
      prompt += "\n"
    }

    // 添加关联章节（上下文参考）
    if (params.linkedChapters && params.linkedChapters.length > 0) {
      prompt += `【参考章节】
以下是相关章节内容，请在写作时保持连贯性和一致性：

`
      for (const chapter of params.linkedChapters) {
        // 清理HTML标签，只保留纯文本
        let content = this.stripHtml(chapter.content)
        // 限制每章最多3000字，避免上下文过长
        if (content.length > 3000) {
          content = content.slice(0, 3000) + '...(已截断)'
        }
        prompt += `--- ${chapter.title} ---
${content}

`
      }
    }

    prompt += `【本章剧情】
${params.chapterPlot}
`

    if (params.previousContent) {
      prompt += `
【前文内容】
${params.previousContent}
`
    }

    prompt += `
请根据以上信息创作本章内容：`

    return prompt
  }

  /**
   * 清理HTML标签，只保留纯文本
   */
  private stripHtml(html: string): string {
    return html
      // 移除所有HTML标签
      .replace(/<[^>]*>/g, '')
      // 解码HTML实体
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      // 清理多余的空白
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim()
  }
}

// Default AI provider instance
export const aiProvider = new GeminiProvider()
