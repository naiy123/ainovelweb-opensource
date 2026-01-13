import { NextRequest, NextResponse } from "next/server"
import { requireUserId } from "@/lib/auth/get-user"
import { saveGeneratedImage } from "@/lib/ai/save-image"
import { withCredits, getCreditsErrorStatus } from "@/lib/credits"
import { IMAGE_CREDITS } from "@/lib/pricing/credits"
import { rateLimit } from "@/lib/rate-limit"
import { sanitizePromptInput, validateOrigin, csrfErrorResponse } from "@/lib/security"
import { generateCoverImage } from "@/lib/ai/cover"
import { generateCoverImageStylist } from "@/lib/ai/cover-stylist"

// 模型类型映射
type QuickModel = "designer" | "stylist"

const MODEL_CREDITS: Record<QuickModel, number> = {
  designer: IMAGE_CREDITS.COVER_DESIGNER,
  stylist: IMAGE_CREDITS.COVER_STYLIST,
}

// 两个模型都可用
const AVAILABLE_MODELS: QuickModel[] = ["designer", "stylist"]

// POST /api/cover/generate-quick - 快速生成封面（一键生成）
export async function POST(request: NextRequest) {
  try {
    // CSRF 验证
    if (!validateOrigin(request)) {
      return csrfErrorResponse()
    }

    const userId = await requireUserId()

    // 速率限制：每用户每分钟 3 次
    const rateLimitKey = `ai:cover-quick:${userId}`
    const rateLimitResult = await rateLimit(rateLimitKey, 3, 60)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: `请求过于频繁，请 ${rateLimitResult.resetIn} 秒后重试` },
        { status: 429 }
      )
    }

    const { title, author, channel, genre, description, model = "designer" } = await request.json()

    if (!title) {
      return NextResponse.json(
        { error: "请提供书名" },
        { status: 400 }
      )
    }

    if (!genre) {
      return NextResponse.json(
        { error: "请选择小说类型" },
        { status: 400 }
      )
    }

    // 验证模型
    const selectedModel = model as QuickModel
    if (!AVAILABLE_MODELS.includes(selectedModel)) {
      return NextResponse.json(
        { error: "该模型暂未开放，请选择其他模型" },
        { status: 400 }
      )
    }

    // 清理用户输入
    const sanitizedTitle = sanitizePromptInput(title, 100)
    const sanitizedAuthor = sanitizePromptInput(author || "", 50)
    const sanitizedChannel = sanitizePromptInput(channel || "男频", 10)
    const sanitizedGenre = sanitizePromptInput(genre, 20)
    const sanitizedDescription = sanitizePromptInput(description || "", 500)

    // 获取所需灵感点（根据模型动态获取）
    const requiredCredits = MODEL_CREDITS[selectedModel]
    const modelName = selectedModel === "designer" ? "设计家" : "风格家"

    // 根据模型选择生成函数
    const generateFn = selectedModel === "stylist"
      ? generateCoverImageStylist
      : generateCoverImage

    // 使用 withCredits 统一处理扣费逻辑
    const result = await withCredits(
      {
        userId,
        amount: requiredCredits,
        category: "cover",
        description: `快速封面生成(${modelName}): ${sanitizedTitle}`,
      },
      async () => {
        // 生成封面
        const generated = await generateFn({
          title: sanitizedTitle,
          author: sanitizedAuthor,
          channel: sanitizedChannel,
          genre: sanitizedGenre,
          description: sanitizedDescription || undefined,
        })

        // 保存到文件和数据库
        const saved = await saveGeneratedImage({
          userId,
          type: "cover",
          imageBase64: generated.imageBase64,
          title: sanitizedTitle,
          author: sanitizedAuthor,
        })

        return {
          imageBase64: generated.imageBase64,
          imageUrl: saved.imageUrl,
          id: saved.id,
        }
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
    console.error("Generate quick cover error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "封面生成失败" },
      { status: 500 }
    )
  }
}
