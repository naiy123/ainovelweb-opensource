import { NextRequest } from "next/server"
import { translateToChineseStream } from "@/lib/ai/gemini"

// POST /api/translate - 翻译文本
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text } = body

    if (!text || typeof text !== "string") {
      return Response.json({ error: "缺少文本参数" }, { status: 400 })
    }

    console.log("🔄 开始翻译，文本长度:", text.length)
    const translated = await translateToChineseStream(text)
    console.log("✅ 翻译完成，结果长度:", translated.length)

    return Response.json({ translated })
  } catch (error) {
    console.error("翻译失败:", error)
    return Response.json({ error: "翻译失败，请稍后重试" }, { status: 500 })
  }
}
