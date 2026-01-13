/**
 * Vertex AI 客户端配置
 * 使用 Generative AI API 调用 Gemini 模型
 */

import { VertexAI } from "@google-cloud/vertexai"

// 从现有配置读取
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || ""
const LOCATION = process.env.GOOGLE_CLOUD_LOCATION || "us-central1"
const MODEL_ID = process.env.VERTEX_AI_MODEL || ""
const SUMMARY_MODEL_ID = process.env.VERTEX_AI_SUMMARY_MODEL || "gemini-2.5-pro-preview-06-05"
const TEMPERATURE = parseFloat(process.env.VERTEX_AI_TEMPERATURE || "1.0")

// 检查配置是否完整
export function isVertexAIConfigured(): boolean {
  return !!(PROJECT_ID && LOCATION && MODEL_ID)
}

// 创建 Vertex AI 客户端
let vertexClient: VertexAI | null = null

export function getVertexClient(): VertexAI {
  if (!vertexClient) {
    if (!isVertexAIConfigured()) {
      throw new Error("Vertex AI 未配置：请设置 GOOGLE_CLOUD_PROJECT 和 GOOGLE_CLOUD_LOCATION")
    }

    vertexClient = new VertexAI({
      project: PROJECT_ID,
      location: LOCATION,
    })
  }

  return vertexClient
}

export function getModelId(): string {
  return MODEL_ID
}

export function getTemperature(): number {
  return TEMPERATURE
}

export function getSummaryModelId(): string {
  return SUMMARY_MODEL_ID
}

export { PROJECT_ID, LOCATION, MODEL_ID, SUMMARY_MODEL_ID, TEMPERATURE }
