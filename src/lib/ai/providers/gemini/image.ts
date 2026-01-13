/**
 * Gemini 图片生成适配器
 *
 * 支持两种图片生成模式：
 * 1. Gemini 3 多模态生成 (responseModalities: ["IMAGE"])
 * 2. Imagen 独立图片生成
 */

import { geminiClient } from "./client"
import type { ImageProvider } from "../types"
import type { ImageGenerateParams, UnifiedImageResult } from "../../types/image"
import { PROVIDER_CAPABILITIES } from "../../capabilities"
import { logAIRequest, logAIResponse } from "../../logger"
import { getImageDimensions } from "../../types/image"

// Gemini 支持的宽高比格式
const GEMINI_ASPECT_RATIOS: Record<string, string> = {
  "1:1": "1:1",
  "3:4": "3:4",
  "4:3": "4:3",
  "16:9": "16:9",
  "9:16": "9:16",
}

// Gemini 图片尺寸
const GEMINI_IMAGE_SIZES: Record<string, string> = {
  "1K": "1K",
  "2K": "2K",
  "4K": "4K", // 注意：不是所有模型都支持 4K
}

export class GeminiImageProvider implements ImageProvider {
  readonly name = "gemini" as const
  readonly capabilities = PROVIDER_CAPABILITIES.gemini

  /**
   * 生成图片
   *
   * 自动选择生成方式：
   * - gemini-3-* 模型：使用多模态生成
   * - imagen-* 模型：使用 Imagen API
   */
  async generate(params: ImageGenerateParams): Promise<UnifiedImageResult> {
    const model = params.model || this.capabilities.defaultImageModel

    if (model.startsWith("imagen-")) {
      return this.generateWithImagen(params, model)
    } else {
      return this.generateWithGemini3(params, model)
    }
  }

  /**
   * 使用 Gemini 3 多模态生成图片
   */
  private async generateWithGemini3(
    params: ImageGenerateParams,
    model: string
  ): Promise<UnifiedImageResult> {
    const aspectRatio = params.aspectRatio || "1:1"
    const size = params.size || "2K"

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config: any = {
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig: {
        aspectRatio: GEMINI_ASPECT_RATIOS[aspectRatio] || "1:1",
        imageSize: GEMINI_IMAGE_SIZES[size] || "2K",
      },
    }

    // 原生参数覆盖
    if (params.nativeOptions) {
      Object.assign(config, params.nativeOptions)
    }

    // 打印请求日志
    logAIRequest({
      title: "Gemini 图片生成",
      model,
      modelDisplayName: model,
      prompt: params.prompt,
      extraParams: {
        AspectRatio: aspectRatio,
        ImageSize: size,
        ResponseModalities: config.responseModalities,
      },
    })

    const startTime = Date.now()

    const response = await geminiClient.models.generateContent({
      model,
      contents: params.prompt,
      config,
    })

    const durationMs = Date.now() - startTime

    // 从响应中提取图片数据
    const candidates = response.candidates
    if (!candidates || candidates.length === 0) {
      logAIResponse({
        title: "Gemini 图片生成",
        success: false,
        durationMs,
        error: "No response from Gemini",
      })
      throw new Error("No response from Gemini")
    }

    const parts = candidates[0].content?.parts
    if (!parts) {
      logAIResponse({
        title: "Gemini 图片生成",
        success: false,
        durationMs,
        error: "No content parts in response",
      })
      throw new Error("No content parts in response")
    }

    for (const part of parts) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const inlineData = (part as any).inlineData
      if (inlineData) {
        const usage = response.usageMetadata
        const dimensions = getImageDimensions(aspectRatio, size)

        logAIResponse({
          title: "Gemini 图片生成",
          success: true,
          durationMs,
          finishReason: candidates[0].finishReason as string,
          usage: usage
            ? {
                promptTokenCount: usage.promptTokenCount,
                candidatesTokenCount: usage.candidatesTokenCount,
                totalTokenCount: usage.totalTokenCount,
              }
            : undefined,
        })

        return {
          imageBase64: inlineData.data || "",
          mimeType: inlineData.mimeType || "image/png",
          width: dimensions.width,
          height: dimensions.height,
          usage: usage
            ? {
                inputTokens: usage.promptTokenCount || 0,
                outputTokens: usage.candidatesTokenCount || 0,
                totalTokens: usage.totalTokenCount || 0,
              }
            : undefined,
          raw: response,
        }
      }
    }

    logAIResponse({
      title: "Gemini 图片生成",
      success: false,
      durationMs,
      error: "No image data in response",
    })
    throw new Error("No image data in response")
  }

  /**
   * 使用 Imagen API 生成图片
   */
  private async generateWithImagen(
    params: ImageGenerateParams,
    model: string
  ): Promise<UnifiedImageResult> {
    const aspectRatio = params.aspectRatio || "1:1"

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config: any = {
      numberOfImages: 1,
      aspectRatio: GEMINI_ASPECT_RATIOS[aspectRatio] || "1:1",
      // Imagen 特有参数
      ...(params.nativeOptions || {}),
    }

    // 打印请求日志
    logAIRequest({
      title: "Imagen 图片生成",
      model,
      modelDisplayName: model,
      prompt: params.prompt,
      extraParams: {
        AspectRatio: aspectRatio,
        NumberOfImages: config.numberOfImages,
      },
    })

    const startTime = Date.now()

    const response = await geminiClient.models.generateImages({
      model,
      prompt: params.prompt,
      config,
    })

    const durationMs = Date.now() - startTime

    // 检查响应
    if (!response.generatedImages || response.generatedImages.length === 0) {
      logAIResponse({
        title: "Imagen 图片生成",
        success: false,
        durationMs,
        error: "No images generated",
      })
      throw new Error("No images generated")
    }

    const image = response.generatedImages[0]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const imageData = (image as any).image

    if (!imageData || !imageData.imageBytes) {
      logAIResponse({
        title: "Imagen 图片生成",
        success: false,
        durationMs,
        error: "No image data in response",
      })
      throw new Error("No image data in response")
    }

    logAIResponse({
      title: "Imagen 图片生成",
      success: true,
      durationMs,
    })

    return {
      imageBase64: imageData.imageBytes,
      mimeType: imageData.mimeType || "image/png",
      raw: response,
    }
  }
}
