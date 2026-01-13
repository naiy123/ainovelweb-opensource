import { NextRequest, NextResponse } from "next/server"
import { ai } from "@/lib/ai/client"
import { requireUserId } from "@/lib/auth/get-user"
import { saveGeneratedImage } from "@/lib/ai/save-image"
import { withCredits, getCreditsErrorStatus } from "@/lib/credits"
import { IMAGE_CREDITS } from "@/lib/pricing/credits"
import { rateLimit } from "@/lib/rate-limit"
import { sanitizePromptInput, validateOrigin, csrfErrorResponse } from "@/lib/security"

// POST /api/cover/generate-background - 生成背景图
export async function POST(request: NextRequest) {
  try {
    // CSRF 验证
    if (!validateOrigin(request)) {
      return csrfErrorResponse()
    }

    const userId = await requireUserId()

    // 速率限制：每用户每分钟 5 次
    const rateLimitKey = `ai:generate:${userId}`
    const rateLimitResult = await rateLimit(rateLimitKey, 5, 60)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: `请求过于频繁，请 ${rateLimitResult.resetIn} 秒后重试` },
        { status: 429 }
      )
    }

    const { synopsis } = await request.json()

    if (!synopsis) {
      return NextResponse.json(
        { error: "请提供背景描述" },
        { status: 400 }
      )
    }

    // 清理用户输入，防止提示注入
    const sanitizedSynopsis = sanitizePromptInput(synopsis, 500)

    const requiredCredits = IMAGE_CREDITS.BACKGROUND

    const prompt = `
      Generate a high-quality, text-free background illustration for a Chinese web novel cover.
      Theme/Synopsis: ${sanitizedSynopsis}
      Style: Digital art, highly detailed, atmospheric, suitable for book cover design.
      Aspect Ratio: 3:4.
      Do NOT include any text on the image.
    `

    // 使用 withCredits 统一处理（本地版本不扣费）
    const result = await withCredits(
      {
        userId,
        amount: requiredCredits,
        category: "background",
        description: "AI背景图生成",
      },
      async () => {
        const response = await ai.models.generateContent({
          model: "gemini-2.0-flash-preview-image-generation",
          contents: prompt,
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
            const imageBase64 = part.inlineData.data as string

            // 保存到本地文件和数据库
            const saved = await saveGeneratedImage({
              userId,
              type: "background",
              imageBase64,
              prompt: synopsis,
            })

            return {
              imageBase64,
              mimeType: part.inlineData.mimeType || "image/png",
              imageUrl: saved.imageUrl,
              id: saved.id,
            }
          }
        }

        throw new Error("No image data in response")
      }
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: getCreditsErrorStatus(result.code) }
      )
    }

    return NextResponse.json({
      ...result.data,
      creditsConsumed: result.creditsConsumed,
      balanceAfter: result.balanceAfter,
    })
  } catch (error) {
    console.error("Generate background error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "生成背景失败" },
      { status: 500 }
    )
  }
}
