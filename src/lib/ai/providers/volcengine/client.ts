/**
 * 火山引擎方舟客户端初始化
 *
 * 使用 OpenAI 兼容接口
 */

import OpenAI from "openai"

// 环境变量
const VOLC_ARK_API_KEY = process.env.VOLC_ARK_API_KEY

if (!VOLC_ARK_API_KEY) {
  console.warn("[Volcengine] Missing API key: VOLC_ARK_API_KEY")
}

/**
 * 火山引擎方舟客户端
 * 深度思考模型需要较长超时，设置 5 分钟
 */
export const volcClient = new OpenAI({
  baseURL: "https://ark.cn-beijing.volces.com/api/v3",
  apiKey: VOLC_ARK_API_KEY || "",
  timeout: 5 * 60 * 1000, // 5 分钟
})

/**
 * 检查火山客户端是否可用
 */
export function isVolcengineAvailable(): boolean {
  return !!VOLC_ARK_API_KEY
}

/**
 * 火山引擎 API 基础 URL
 */
export const VOLC_API_BASE_URL = "https://ark.cn-beijing.volces.com/api/v3"
