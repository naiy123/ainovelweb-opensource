/**
 * 火山引擎方舟客户端初始化
 *
 * 使用 OpenAI 兼容接口
 * 支持从数据库动态获取 API Key
 */

import OpenAI from "openai"
import { getDoubaoApiKey, getSeedreamApiKey } from "@/lib/settings"

// 火山引擎 API 基础 URL
export const VOLC_API_BASE_URL = "https://ark.cn-beijing.volces.com/api/v3"

// 环境变量（作为后备）
const VOLC_ARK_API_KEY_ENV = process.env.VOLC_ARK_API_KEY

if (!VOLC_ARK_API_KEY_ENV) {
  console.warn("[Volcengine] Missing API key: VOLC_ARK_API_KEY (will try database settings)")
}

/**
 * 创建火山引擎客户端
 * 优先使用传入的 API Key，否则使用环境变量
 */
export function createVolcClient(apiKey?: string): OpenAI {
  const key = apiKey || VOLC_ARK_API_KEY_ENV || ""
  return new OpenAI({
    baseURL: VOLC_API_BASE_URL,
    apiKey: key,
    timeout: 5 * 60 * 1000, // 5 分钟
  })
}

/**
 * 获取文本生成用的火山引擎客户端
 * 从数据库读取 doubao_api_key
 */
export async function getVolcTextClient(): Promise<OpenAI> {
  const apiKey = await getDoubaoApiKey()
  return createVolcClient(apiKey || undefined)
}

/**
 * 获取图片生成用的火山引擎客户端
 * 从数据库读取 seedream_api_key
 */
export async function getVolcImageClient(): Promise<OpenAI> {
  const apiKey = await getSeedreamApiKey()
  return createVolcClient(apiKey || undefined)
}

/**
 * 检查火山客户端是否可用
 * 检查环境变量或数据库是否配置了 API Key
 */
export async function isVolcengineAvailableAsync(): Promise<boolean> {
  if (VOLC_ARK_API_KEY_ENV) return true
  const apiKey = await getDoubaoApiKey()
  return !!apiKey
}

/**
 * 同步检查火山客户端是否可用（仅检查环境变量）
 * @deprecated 优先使用 isVolcengineAvailableAsync
 */
export function isVolcengineAvailable(): boolean {
  return !!VOLC_ARK_API_KEY_ENV
}

// 保持向后兼容：旧的 volcClient（使用环境变量）
export const volcClient = createVolcClient()
