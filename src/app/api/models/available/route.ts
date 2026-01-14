/**
 * 获取可用模型 API
 * 根据用户已配置的 API Key 返回可用的模型列表
 */
import { NextResponse } from "next/server"
import { getSettings, SETTINGS_KEYS } from "@/lib/settings"

// 模型/提供商定义
export interface ModelInfo {
  id: string           // 唯一标识
  name: string         // 显示名称
  provider: string     // 提供商标识
  description: string  // 描述
  type: "text" | "image" | "both"  // 能力类型
  configured: boolean  // 是否已配置 API Key
}

// 所有支持的模型定义
const ALL_MODELS: Record<string, Omit<ModelInfo, "configured"> & { requiredKey: string }> = {
  doubao: {
    id: "doubao",
    name: "豆包",
    provider: "volcengine",
    description: "火山引擎豆包大模型，支持深度思考",
    type: "text",
    requiredKey: SETTINGS_KEYS.DOUBAO_API_KEY,
  },
  seedream: {
    id: "seedream",
    name: "Seedream",
    provider: "volcengine",
    description: "火山引擎图像生成模型",
    type: "image",
    requiredKey: SETTINGS_KEYS.SEEDREAM_API_KEY,
  },
  // 以后可以添加更多模型
  // deepseek: {
  //   id: "deepseek",
  //   name: "DeepSeek",
  //   provider: "deepseek",
  //   description: "DeepSeek 深度求索大模型",
  //   type: "text",
  //   requiredKey: "deepseek_api_key",
  // },
}

export async function GET() {
  try {
    const settings = await getSettings()

    // 返回所有模型，标记是否已配置
    const allModels: ModelInfo[] = Object.values(ALL_MODELS).map(model => ({
      id: model.id,
      name: model.name,
      provider: model.provider,
      description: model.description,
      type: model.type,
      configured: !!settings[model.requiredKey],
    }))

    // 已配置的模型
    const configuredModels = allModels.filter(m => m.configured)

    return NextResponse.json({
      // 所有模型（包含 configured 状态）
      allModels,
      // 已配置的模型
      configuredModels,
      // 分类：文本模型
      textModels: allModels.filter(m => m.type === "text" || m.type === "both"),
      // 分类：图像模型
      imageModels: allModels.filter(m => m.type === "image" || m.type === "both"),
    })
  } catch (error) {
    console.error("[Models API] Error:", error)
    return NextResponse.json({ error: "获取模型列表失败" }, { status: 500 })
  }
}
