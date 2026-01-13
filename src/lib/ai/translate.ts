import { ai } from "./client"

/**
 * 使用便宜快速的模型翻译思考内容
 */
export async function translateToChineseStream(text: string): Promise<string> {
  if (!text.trim()) return text

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: text,
      config: {
        systemInstruction: `你是一个翻译助手。将以下英文内容翻译成中文，保持原有的格式（如 **加粗**、换行等）。只输出翻译结果，不要添加任何解释。`,
        temperature: 0.1,
        maxOutputTokens: 4000,
      },
    })
    return response.text || text
  } catch (error) {
    console.error("翻译失败:", error)
    return text // 翻译失败时返回原文
  }
}
