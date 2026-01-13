/**
 * AI Provider 统一类型定义 - 图片生成
 */

import type { BaseGenerateParams, TokenUsage } from "./common"

// ============ 图片宽高比 ============
export type ImageAspectRatio = "1:1" | "3:4" | "4:3" | "16:9" | "9:16"

// ============ 图片尺寸 ============
export type ImageSize = "1K" | "2K" | "4K"

// ============ 图片生成参数 ============
export interface ImageGenerateParams extends BaseGenerateParams {
  /** 模型 ID（可选，使用 Provider 默认模型） */
  model?: string

  /** 图片描述提示词 */
  prompt: string

  /** 宽高比 */
  aspectRatio?: ImageAspectRatio

  /** 图片尺寸 */
  size?: ImageSize

  /** 参考图片 base64（部分 Provider 支持） */
  referenceImage?: string

  /** 参考图片强度 0-1（图生图时使用） */
  referenceStrength?: number

  /** Provider 原生参数覆盖（高级用户） */
  nativeOptions?: Record<string, unknown>
}

// ============ 图片生成结果 ============
export interface UnifiedImageResult {
  /** 图片 base64 编码 */
  imageBase64: string

  /** MIME 类型 */
  mimeType: string

  /** 图片宽度 */
  width?: number

  /** 图片高度 */
  height?: number

  /** Token 使用统计（如果适用） */
  usage?: TokenUsage

  /** 原始响应（调试用） */
  raw?: unknown
}

// ============ 宽高比到像素尺寸映射 ============
export const ASPECT_RATIO_SIZES: Record<ImageAspectRatio, Record<ImageSize, { width: number; height: number }>> = {
  "1:1": {
    "1K": { width: 1024, height: 1024 },
    "2K": { width: 2048, height: 2048 },
    "4K": { width: 4096, height: 4096 },
  },
  "3:4": {
    "1K": { width: 768, height: 1024 },
    "2K": { width: 1536, height: 2048 },
    "4K": { width: 3072, height: 4096 },
  },
  "4:3": {
    "1K": { width: 1024, height: 768 },
    "2K": { width: 2048, height: 1536 },
    "4K": { width: 4096, height: 3072 },
  },
  "16:9": {
    "1K": { width: 1024, height: 576 },
    "2K": { width: 2048, height: 1152 },
    "4K": { width: 4096, height: 2304 },
  },
  "9:16": {
    "1K": { width: 576, height: 1024 },
    "2K": { width: 1152, height: 2048 },
    "4K": { width: 2304, height: 4096 },
  },
}

/**
 * 获取宽高比对应的像素尺寸
 */
export function getImageDimensions(
  aspectRatio: ImageAspectRatio = "1:1",
  size: ImageSize = "1K"
): { width: number; height: number } {
  return ASPECT_RATIO_SIZES[aspectRatio][size]
}
