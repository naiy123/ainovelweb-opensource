import OpenAI from "openai"

// 火山引擎方舟客户端（兼容 OpenAI SDK）
// 深度思考模型需要较长超时，设置 5 分钟（medium 配置）
export const volcClient = new OpenAI({
  baseURL: "https://ark.cn-beijing.volces.com/api/v3",
  apiKey: process.env.VOLC_ARK_API_KEY || "",
  timeout: 5 * 60 * 1000, // 5 分钟
})

// 模型 ID
export const VOLC_MODELS = {
  // 文本生成模型
  DOUBAO_SEED_1_6: "doubao-seed-1-6-251015",
  // 图像生成模型
  SEEDREAM_4_5: "doubao-seedream-4-5-251128",
} as const

// 日志输出
if (typeof window === "undefined" && process.env.VOLC_ARK_API_KEY) {
  console.log("✅ 火山引擎方舟客户端已初始化")
}
