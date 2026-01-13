/**
 * 图片存储 - 开源版本（本地存储）
 *
 * 开源版本使用本地 public 目录存储图片
 */

import fs from "fs/promises"
import path from "path"

const UPLOAD_DIR = "public/uploads"

/**
 * 检查 OSS 是否配置（开源版：始终返回 false）
 */
export function isOSSConfigured(): boolean {
  return false
}

/**
 * 上传图片到 OSS（开源版：保存到本地）
 */
export async function uploadImageToOSS(
  imageData: Buffer,
  filename: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const uploadPath = path.join(process.cwd(), UPLOAD_DIR)
    await fs.mkdir(uploadPath, { recursive: true })
    
    const filePath = path.join(uploadPath, filename)
    await fs.writeFile(filePath, imageData)
    
    return {
      success: true,
      url: `/uploads/${filename}`,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "保存失败",
    }
  }
}

/**
 * 获取可访问的图片 URL（开源版：返回原 URL）
 */
export function getAccessibleImageUrl(url: string): string {
  return url
}
