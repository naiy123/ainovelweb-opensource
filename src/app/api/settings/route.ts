/**
 * 设置 API
 * GET - 获取所有设置
 * PUT - 更新设置
 */
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { clearSettingsCache } from "@/lib/settings"

// 设置键名常量（内部使用）
const SETTINGS_KEYS = {
  DOUBAO_API_KEY: "doubao_api_key",
  SEEDREAM_API_KEY: "seedream_api_key",
} as const

// GET - 获取所有设置
export async function GET() {
  try {
    const settings = await db.settings.findMany()

    // 转换为对象格式，本地版本直接返回完整值
    const settingsObj: Record<string, string> = {}
    for (const setting of settings) {
      settingsObj[setting.key] = setting.value
    }

    return NextResponse.json(settingsObj)
  } catch (error) {
    console.error("[Settings API] Error fetching settings:", error)
    return NextResponse.json({ error: "获取设置失败" }, { status: 500 })
  }
}

// PUT - 更新设置
export async function PUT(request: Request) {
  try {
    const body = await request.json()

    // 验证输入
    if (typeof body !== "object" || body === null) {
      return NextResponse.json({ error: "无效的请求数据" }, { status: 400 })
    }

    const allowedKeys = Object.values(SETTINGS_KEYS)

    // SQLite 不支持并发写入，顺序执行 upsert
    for (const [key, value] of Object.entries(body)) {
      // 跳过空值
      if (value === undefined || value === null || value === "") continue

      // 只允许更新已知的设置键
      if (!allowedKeys.includes(key as typeof SETTINGS_KEYS[keyof typeof SETTINGS_KEYS])) {
        continue
      }

      await db.settings.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
    }

    // 清除设置缓存
    clearSettingsCache()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Settings API] Error updating settings:", error)
    return NextResponse.json({ error: "更新设置失败" }, { status: 500 })
  }
}

