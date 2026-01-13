import { GoogleGenAI } from "@google/genai"

// 检测是否使用 Vertex AI（服务账号认证）或 Developer API（API Key）
const useVertexAI = !!process.env.GOOGLE_APPLICATION_CREDENTIALS

// 在服务器端配置 HTTP 代理（用于访问 Google APIs）
if (typeof window === "undefined" && process.env.HTTP_PROXY) {
  try {
    const { ProxyAgent, setGlobalDispatcher } = require("undici")
    const proxyAgent = new ProxyAgent(process.env.HTTP_PROXY)
    setGlobalDispatcher(proxyAgent)
    console.log("✅ Google API 代理已配置:", process.env.HTTP_PROXY)
  } catch {
    // undici 未安装时忽略
  }
}

// Google Gen AI 客户端 - 自动选择 Vertex AI 或 Developer API
export const ai = useVertexAI
  ? new GoogleGenAI({
      vertexai: true,
      project: process.env.GOOGLE_CLOUD_PROJECT || "",
      location: process.env.GOOGLE_CLOUD_LOCATION || "global",
    })
  : new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || "",
    })

// 日志输出当前使用的模式
if (typeof window === "undefined") {
  console.log(
    useVertexAI
      ? `✅ 使用 Vertex AI 模式 (项目: ${process.env.GOOGLE_CLOUD_PROJECT})`
      : "✅ 使用 Gemini Developer API 模式"
  )
}
