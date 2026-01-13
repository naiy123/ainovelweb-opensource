/**
 * Gemini 客户端初始化 (Vertex AI)
 */

import { GoogleGenAI } from "@google/genai"

// Vertex AI 环境变量
const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT
// Gemini 3 Pro Image 需要 global location
const GOOGLE_CLOUD_LOCATION = process.env.GOOGLE_CLOUD_LOCATION || "global"

if (!GOOGLE_CLOUD_PROJECT) {
  console.warn("[Gemini] Missing GOOGLE_CLOUD_PROJECT for Vertex AI")
}

/**
 * Gemini AI 客户端单例 (Vertex AI 模式)
 */
export const geminiClient = new GoogleGenAI({
  vertexai: true,
  project: GOOGLE_CLOUD_PROJECT || "",
  location: GOOGLE_CLOUD_LOCATION,
})

/**
 * 检查 Gemini 客户端是否可用
 */
export function isGeminiAvailable(): boolean {
  return !!GOOGLE_CLOUD_PROJECT
}
