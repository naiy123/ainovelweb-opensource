import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"
import { ZodError } from "zod"
import { generateCard } from "@/lib/ai/gemini"
import { requireUserId } from "@/lib/auth/get-user"
import { rateLimit } from "@/lib/rate-limit"
import { sanitizePromptInput, validateOrigin, csrfErrorResponse } from "@/lib/security"
import { getCardModelConfig, DEFAULT_CARD_MODEL_ID } from "@/lib/ai/models"
import { withCredits, getCreditsErrorStatus } from "@/lib/credits"

const generateCardSchema = z.object({
  category: z.enum(["character", "term"]),
  keywords: z.string().min(1, "请输入关键词或描述").max(500, "描述不能超过500字"),
  style: z.string().optional(),
  model: z.string().optional(),
})

// POST /api/novels/[novelId]/cards/generate - AI 生成卡片
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ novelId: string }> }
) {
  try {
    // CSRF 验证
    if (!validateOrigin(request)) {
      return csrfErrorResponse()
    }

    const userId = await requireUserId()

    // 速率限制：每用户每分钟 10 次（卡片生成较轻量）
    const rateLimitKey = `ai:card:${userId}`
    const rateLimitResult = await rateLimit(rateLimitKey, 10, 60)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: `请求过于频繁，请 ${rateLimitResult.resetIn} 秒后重试` },
        { status: 429 }
      )
    }

    const { novelId } = await params
    const body = await request.json()

    const validatedData = generateCardSchema.parse(body)

    // 清理用户输入
    const sanitizedKeywords = sanitizePromptInput(validatedData.keywords, 500)
    const sanitizedStyle = validatedData.style ? sanitizePromptInput(validatedData.style, 200) : undefined

    // 获取模型配置
    const modelConfig = getCardModelConfig(validatedData.model || DEFAULT_CARD_MODEL_ID)
    const requiredCredits = modelConfig.credits

    // 验证小说属于当前用户
    const novel = await db.novel.findUnique({
      where: { id: novelId, userId },
    })

    if (!novel) {
      return NextResponse.json({ error: "小说不存在" }, { status: 404 })
    }

    // 获取已有卡片名称，避免重复
    const existingCards = await db.card.findMany({
      where: { novelId, category: validatedData.category },
      select: { name: true },
    })
    const existingNames = existingCards.map((c) => c.name)

    // 使用 withCredits 统一处理扣费逻辑
    const result = await withCredits(
      {
        userId,
        amount: requiredCredits,
        category: "card",
        description: `${validatedData.category === "character" ? "角色" : "词条"}生成 (${modelConfig.name})`,
      },
      async () => {
        return await generateCard({
          category: validatedData.category,
          keywords: sanitizedKeywords,
          style: sanitizedStyle,
          novelTitle: novel.title,
          existingCards: existingNames,
          model: validatedData.model,
        })
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
    console.error("Generate card error:", error)

    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ error: "生成失败" }, { status: 500 })
  }
}
