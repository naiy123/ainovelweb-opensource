import { NextRequest, NextResponse } from "next/server"
import { ai } from "@/lib/ai/client"
import { requireUserId } from "@/lib/auth/get-user"
import { rateLimit } from "@/lib/rate-limit"
import { sanitizePromptInput, validateOrigin, csrfErrorResponse } from "@/lib/security"

// POST /api/cover/generate-final - 合成最终封面（背景 + 文字）
export async function POST(request: NextRequest) {
  try {
    // CSRF 验证
    if (!validateOrigin(request)) {
      return csrfErrorResponse()
    }

    const userId = await requireUserId()

    // 速率限制：每用户每分钟 5 次（与 generate-background 共享限制）
    const rateLimitKey = `ai:generate:${userId}`
    const rateLimitResult = await rateLimit(rateLimitKey, 5, 60)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: `请求过于频繁，请 ${rateLimitResult.resetIn} 秒后重试` },
        { status: 429 }
      )
    }

    const { imageBase64, title, author, styleDescription } = await request.json()

    if (!imageBase64 || !title) {
      return NextResponse.json(
        { error: "请提供背景图和书名" },
        { status: 400 }
      )
    }

    // 清理用户输入，防止提示注入
    const sanitizedTitle = sanitizePromptInput(title, 100)
    const sanitizedAuthor = sanitizePromptInput(author || "", 50)
    const sanitizedStyle = sanitizePromptInput(styleDescription || "", 200)

    const prompt = `
      You are a professional book cover designer.
      I will provide a background image. Your task is to overlay the Book Title and Author Name onto this image to create a final, production-ready book cover.

      Details:
      - Title: "${sanitizedTitle}"
      - Author: "${sanitizedAuthor}"
      - Typography Style: ${sanitizedStyle || "Modern, elegant Chinese typography"}

      Instructions:
      - Seamlessly integrate the text into the image using the requested style.
      - Ensure the text is legible and follows a professional layout (Vertical or Horizontal based on what fits the art best, but traditionally vertical for Chinese fantasy).
      - Add appropriate shadows, glows, or lighting effects to the text to make it pop.
      - Maintain the aspect ratio of 3:4.
      - Output the final composited image.
      - All text MUST be rendered in **Simplified Chinese characters**
      - Text must be **perfectly legible, crisp, and without any garbled characters**
    `

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-preview-image-generation",
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: "image/png", data: imageBase64 } },
            { text: prompt },
          ],
        },
      ],
      config: {
        responseModalities: ["IMAGE"],
        imageConfig: {
          aspectRatio: "3:4",
        },
      },
    })

    const candidates = response.candidates
    if (!candidates || candidates.length === 0) {
      throw new Error("No response from Gemini")
    }

    const parts = candidates[0].content?.parts
    if (!parts) {
      throw new Error("No content parts in response")
    }

    for (const part of parts) {
      if (part.inlineData) {
        const base64Data = part.inlineData.data
        const mimeType = part.inlineData.mimeType || "image/png"
        return NextResponse.json({
          finalUrl: `data:${mimeType};base64,${base64Data}`,
        })
      }
    }

    throw new Error("No image data in response")
  } catch (error) {
    console.error("Generate final cover error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "封面合成失败" },
      { status: 500 }
    )
  }
}
