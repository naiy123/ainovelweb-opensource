/**
 * 设置读取工具
 * 从数据库读取用户配置的 API 密钥
 */
import { db } from "@/lib/db"

// 设置键名常量
export const SETTINGS_KEYS = {
  DOUBAO_API_KEY: "doubao_api_key",
  SEEDREAM_API_KEY: "seedream_api_key",
} as const

// 缓存设置（避免频繁数据库查询）
let settingsCache: Record<string, string> | null = null
let cacheTime = 0
const CACHE_TTL = 60 * 1000 // 1 分钟缓存

/**
 * 获取所有设置
 */
export async function getSettings(): Promise<Record<string, string>> {
  // 检查缓存
  if (settingsCache && Date.now() - cacheTime < CACHE_TTL) {
    return settingsCache
  }

  try {
    const settings = await db.settings.findMany()

    const result: Record<string, string> = {}
    for (const setting of settings) {
      result[setting.key] = setting.value
    }

    // 也检查环境变量（优先级最高）
    if (process.env.VOLC_ARK_API_KEY) {
      result[SETTINGS_KEYS.DOUBAO_API_KEY] = process.env.VOLC_ARK_API_KEY
      result[SETTINGS_KEYS.SEEDREAM_API_KEY] = process.env.VOLC_ARK_API_KEY
    }

    // 更新缓存
    settingsCache = result
    cacheTime = Date.now()

    return result
  } catch (error) {
    console.error("[Settings] Error loading settings:", error)
    return {}
  }
}

/**
 * 获取单个设置值
 */
export async function getSetting(key: string): Promise<string | null> {
  const settings = await getSettings()
  return settings[key] || null
}

/**
 * 清除设置缓存（在设置更新后调用）
 */
export function clearSettingsCache() {
  settingsCache = null
  cacheTime = 0
}

/**
 * 获取豆包 API Key（文字生成）
 */
export async function getDoubaoApiKey(): Promise<string | null> {
  const settings = await getSettings()
  return settings[SETTINGS_KEYS.DOUBAO_API_KEY] || process.env.VOLC_ARK_API_KEY || null
}

/**
 * 获取 Seedream API Key（图片生成）
 */
export async function getSeedreamApiKey(): Promise<string | null> {
  const settings = await getSettings()
  return settings[SETTINGS_KEYS.SEEDREAM_API_KEY] || process.env.VOLC_ARK_API_KEY || null
}
