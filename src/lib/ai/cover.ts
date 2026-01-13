/**
 * 封面生成 - 设计家模式 (Gemini 3 Pro Image)
 */

import type { CoverGenerationParams, CoverGenerationResult } from "./types"
import { buildGeminiCoverPrompt } from "./prompts/cover"
import { logAIRequest, logAIResponse, devLog } from "./logger"
import { PROVIDER_CAPABILITIES } from "./capabilities"

/**
 * 生成小说封面图片（设计家模式）
 *
 * 使用 Gemini 3 Pro Image 原生图片生成
 */
export async function generateCoverImage(
  params: CoverGenerationParams
): Promise<CoverGenerationResult> {
  const prompt = buildGeminiCoverPrompt({
    title: params.title,
    author: params.author,
    channel: params.channel,
    genre: params.genre,
    description: params.description,
  })

  const model = PROVIDER_CAPABILITIES.gemini.defaultImageModel
  const aspectRatio = "3:4"
  const imageSize = "2K"

  // 打印请求日志（业务层 + 技术层合并）
  logAIRequest({
    title: "设计家 - 封面生成",
    model,
    modelDisplayName: "Gemini 3 Pro Image",
    prompt,
    extraParams: {
      Provider: "Vertex AI",
      Title: params.title,
      Author: params.author,
      Channel: params.channel,
      Genre: params.genre,
      Description: params.description?.slice(0, 100),
      AspectRatio: aspectRatio,
      ImageSize: imageSize,
    },
  })

  const startTime = Date.now()

  try {
    // 直接调用底层 client，避免 Provider 内部重复打印日志
    const { geminiClient } = await import("./providers/gemini/client")

    // Gemini 3 Pro Image 使用 generateContent API
    const response = await geminiClient.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseModalities: ["IMAGE", "TEXT"],
        imageConfig: {
          aspectRatio,
          imageSize,
        },
      },
    })

    const durationMs = Date.now() - startTime

    // 检查响应
    const candidates = response.candidates
    if (!candidates || candidates.length === 0) {
      logAIResponse({
        title: "设计家 - 封面生成",
        success: false,
        durationMs,
        error: "Gemini 未返回响应",
      })
      throw new Error("Gemini 未返回响应")
    }

    // 检查 finish_reason
    const finishReason = candidates[0].finishReason
    if (finishReason !== "STOP") {
      logAIResponse({
        title: "设计家 - 封面生成",
        success: false,
        durationMs,
        error: `生成被中止: ${finishReason}`,
      })
      throw new Error(`生成被中止: ${finishReason}`)
    }

    const parts = candidates[0].content?.parts
    if (!parts) {
      logAIResponse({
        title: "设计家 - 封面生成",
        success: false,
        durationMs,
        error: "响应中无内容",
      })
      throw new Error("响应中无内容")
    }

    // 提取图片数据和思维链
    let imageBase64 = ""
    let mimeType = "image/png"
    let thinkingContent = ""

    for (const part of parts) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyPart = part as any

      // 思维链内容
      if (anyPart.thought && anyPart.text) {
        thinkingContent += anyPart.text
      }

      // 图片数据
      if (anyPart.inlineData) {
        imageBase64 = anyPart.inlineData.data || ""
        mimeType = anyPart.inlineData.mimeType || "image/png"
      }
    }

    if (!imageBase64) {
      logAIResponse({
        title: "设计家 - 封面生成",
        success: false,
        durationMs,
        error: "响应中无图片数据",
      })
      throw new Error("响应中无图片数据")
    }

    // 打印成功日志
    const usage = response.usageMetadata
    logAIResponse({
      title: "设计家 - 封面生成",
      success: true,
      durationMs,
      finishReason: finishReason as string,
      usage: usage ? {
        promptTokenCount: usage.promptTokenCount,
        candidatesTokenCount: usage.candidatesTokenCount,
        totalTokenCount: usage.totalTokenCount,
      } : undefined,
    })

    // 打印思维链
    if (thinkingContent) {
      devLog("\n🧠 Gemini 思维链:")
      devLog("-".repeat(40))
      devLog(thinkingContent.length > 500
        ? thinkingContent.slice(0, 500) + `...(共 ${thinkingContent.length} 字)`
        : thinkingContent)
      devLog("-".repeat(40))
    }

    return {
      imageBase64,
      mimeType,
    }
  } catch (error) {
    const durationMs = Date.now() - startTime

    logAIResponse({
      title: "设计家 - 封面生成",
      success: false,
      durationMs,
      error,
    })

    throw error
  }
}
