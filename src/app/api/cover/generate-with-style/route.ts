import { NextRequest, NextResponse } from "next/server"
import { ai } from "@/lib/ai/client"
import { requireUserId } from "@/lib/auth/get-user"
import { saveGeneratedImage } from "@/lib/ai/save-image"
import { withCredits, getCreditsErrorStatus } from "@/lib/credits"
import { IMAGE_CREDITS } from "@/lib/pricing/credits"
import { rateLimit } from "@/lib/rate-limit"
import { sanitizePromptInput, validateOrigin, csrfErrorResponse } from "@/lib/security"
import { getAccessibleImageUrl, isOSSConfigured } from "@/lib/aliyun-oss"

// POST /api/cover/generate-with-style - 使用背景图+字体风格参考图生成封面
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

    const { backgroundBase64, styleImageBase64, title, author, description } = await request.json()

    if (!backgroundBase64 || !styleImageBase64 || !title) {
      return NextResponse.json(
        { error: "请提供背景图、字体风格参考图和书名" },
        { status: 400 }
      )
    }

    // 清理用户输入
    const sanitizedTitle = sanitizePromptInput(title, 100)
    const sanitizedAuthor = sanitizePromptInput(author || "", 50)
    const sanitizedDescription = sanitizePromptInput(description || "", 200)

    const requiredCredits = IMAGE_CREDITS.COVER_1K

    const descriptionSection = sanitizedDescription
      ? `- Description/Style: "${sanitizedDescription}"`
      : ""

    const prompt = `
You are a professional Chinese book cover designer.

I am providing you with TWO reference images:
1. **First image (Background)**: This is the background artwork for the book cover.
2. **Second image (Typography Style Reference)**: This shows the desired text/typography style I want you to mimic.

Your task is to create a final book cover by:
1. Using the FIRST image as the background
2. Adding the book title and author name in a style that matches/mimics the typography shown in the SECOND image

**Book Information:**
- Title: "${sanitizedTitle}"
- Author: "${sanitizedAuthor}"
${descriptionSection}

**Critical Instructions:**
- The text MUST be rendered in **Simplified Chinese characters (简体中文)**
- Analyze the second image carefully to understand the typography style (font weight, effects, color scheme, layout, shadows, glows, etc.)
- Apply a SIMILAR typography style to the title "${title}" and author "${author || ""}"
${sanitizedDescription ? `- The cover should reflect the atmosphere and style described: "${sanitizedDescription}"` : ""}
- Position the text appropriately on the background - typically vertical layout for Chinese fantasy novels
- Ensure text is **perfectly legible, crisp, and professional**
- Add appropriate visual effects (shadows, glows, gradients) that match the style reference
- Maintain aspect ratio of 3:4
- The final output should look like a professional Chinese web novel cover

**Output:** A single composited book cover image with the background and styled text.
`

    // 使用 withCredits 统一处理扣费逻辑
    const result = await withCredits(
      {
        userId,
        amount: requiredCredits,
        category: "cover",
        description: `封面生成: ${sanitizedTitle}`,
      },
      async () => {
        const response = await ai.models.generateContent({
          model: "gemini-2.0-flash-preview-image-generation",
          contents: [
            {
              role: "user",
              parts: [
                // 第一张图：背景
                { inlineData: { mimeType: "image/png", data: backgroundBase64 } },
                // 第二张图：字体风格参考
                { inlineData: { mimeType: "image/png", data: styleImageBase64 } },
                // 提示词
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
            const base64Data = part.inlineData.data as string

            // 保存到文件和数据库
            const saved = await saveGeneratedImage({
              userId,
              type: "cover",
              imageBase64: base64Data,
              title,
              author,
            })

            // 转换为可访问的URL
            const accessibleUrl = isOSSConfigured()
              ? getAccessibleImageUrl(saved.imageUrl)
              : saved.imageUrl

            return {
              imageBase64: base64Data,
              imageUrl: accessibleUrl,
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
    console.error("Generate cover with style error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "封面生成失败" },
      { status: 500 }
    )
  }
}
