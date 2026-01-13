/**
 * 火山引擎图片生成适配器
 *
 * 使用 Seedream 系列模型
 * 特点：
 * - 通过独立的 /images/generations 接口
 * - 支持多种尺寸和宽高比
 * - 返回 base64 编码的 JPEG 图片
 */

import { VOLC_API_BASE_URL } from "./client"
import type { ImageProvider } from "../types"
import type {
  ImageGenerateParams,
  UnifiedImageResult,
  ImageAspectRatio,
} from "../../types/image"
import { PROVIDER_CAPABILITIES } from "../../capabilities"
import { logAIRequest, logAIResponse } from "../../logger"

// Seedream 支持的尺寸映射（宽x高）
const SEEDREAM_SIZES: Record<ImageAspectRatio, string> = {
  "1:1": "1024x1024",
  "3:4": "1728x2304",   // 适合封面
  "4:3": "2304x1728",
  "16:9": "1920x1080",
  "9:16": "1080x1920",
}

// 更大尺寸选项（2K）
const SEEDREAM_SIZES_2K: Record<ImageAspectRatio, string> = {
  "1:1": "2048x2048",
  "3:4": "1728x2304",   // Seedream 最大支持这个尺寸
  "4:3": "2304x1728",
  "16:9": "2048x1152",
  "9:16": "1152x2048",
}

export class VolcImageProvider implements ImageProvider {
  readonly name = "volcengine" as const
  readonly capabilities = PROVIDER_CAPABILITIES.volcengine

  /**
   * 生成图片
   */
  async generate(params: ImageGenerateParams): Promise<UnifiedImageResult> {
    const model = params.model || this.capabilities.defaultImageModel
    const aspectRatio = params.aspectRatio || "1:1"
    const use2K = params.size === "2K" || params.size === "4K"

    // 选择尺寸
    const sizeMap = use2K ? SEEDREAM_SIZES_2K : SEEDREAM_SIZES
    const size = sizeMap[aspectRatio] || SEEDREAM_SIZES["1:1"]
    const [width, height] = size.split("x").map(Number)

    // 打印请求日志
    logAIRequest({
      title: "火山引擎图片生成",
      model,
      modelDisplayName: "Seedream",
      prompt: params.prompt,
      extraParams: {
        Provider: "火山引擎",
        AspectRatio: aspectRatio,
        Size: size,
        Watermark: false,
      },
    })

    const startTime = Date.now()

    // Seedream API 调用 - 使用原生 fetch（OpenAI SDK 不直接支持图像生成）
    const response = await fetch(`${VOLC_API_BASE_URL}/images/generations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.VOLC_ARK_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        prompt: params.prompt,
        size,
        response_format: "b64_json",
        watermark: false,
        // 原生参数覆盖
        ...(params.nativeOptions || {}),
      }),
    })

    const durationMs = Date.now() - startTime

    if (!response.ok) {
      const errorText = await response.text()
      logAIResponse({
        title: "火山引擎图片生成",
        success: false,
        durationMs,
        error: `Seedream API 调用失败: ${response.status} - ${errorText}`,
      })
      throw new Error(`Seedream API 调用失败: ${response.status}`)
    }

    const result = await response.json()

    if (!result.data || result.data.length === 0) {
      logAIResponse({
        title: "火山引擎图片生成",
        success: false,
        durationMs,
        error: "Seedream 未返回图片数据",
      })
      throw new Error("Seedream 未返回图片数据")
    }

    // 检查是否有错误
    const firstImage = result.data[0]
    if (firstImage.error) {
      logAIResponse({
        title: "火山引擎图片生成",
        success: false,
        durationMs,
        error: firstImage.error.message,
      })
      throw new Error(`图片生成失败: ${firstImage.error.message}`)
    }

    logAIResponse({
      title: "火山引擎图片生成",
      success: true,
      durationMs,
    })

    return {
      imageBase64: firstImage.b64_json,
      mimeType: "image/jpeg", // Seedream 返回 JPEG
      width,
      height,
      raw: result,
    }
  }
}
