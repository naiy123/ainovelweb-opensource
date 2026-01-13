import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { generateCoverImage } from "@/lib/ai/cover"
import { saveGeneratedImage } from "@/lib/ai/save-image"
import { withCredits, getCreditsErrorStatus } from "@/lib/credits"
import { IMAGE_CREDITS } from "@/lib/pricing/credits"
import { requireUserId } from "@/lib/auth/get-user"
import { sanitizePromptInput } from "@/lib/security"

// POST /api/novels/[novelId]/generate-cover - 生成封面
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ novelId: string }> }
) {
  try {
    const userId = await requireUserId()
    const { novelId } = await params
    const body = await request.json().catch(() => ({}))

    // 获取小说信息
    const novel = await prisma.novel.findUnique({
      where: { id: novelId, userId },
    })

    if (!novel) {
      return NextResponse.json({ error: "小说不存在" }, { status: 404 })
    }

    // 解析 tags
    const tags = novel.tags ? novel.tags.split(",").map((t) => t.trim()) : []

    // 使用前端传来的参数，并清理输入
    const coverTitle = sanitizePromptInput(body.title || novel.title, 100)
    const coverAuthor = sanitizePromptInput(body.author || "", 50)
    const coverChannel = sanitizePromptInput(body.channel || "男频", 10)
    const coverGenre = sanitizePromptInput(body.genre || tags[0] || "", 20)
    const coverDescription = sanitizePromptInput(body.description || novel.description || "", 500)

    // 获取所需灵感点
    const requiredCredits = IMAGE_CREDITS.COVER_DESIGNER

    // 使用 withCredits 统一处理扣费逻辑
    const result = await withCredits(
      {
        userId,
        amount: requiredCredits,
        category: "cover",
        description: `小说封面生成: ${coverTitle}`,
      },
      async () => {
        // 调用 Gemini 生成封面
        const generated = await generateCoverImage({
          title: coverTitle,
          author: coverAuthor,
          channel: coverChannel,
          genre: coverGenre,
          description: coverDescription || undefined,
        })

        // 保存到文件和数据库
        const saved = await saveGeneratedImage({
          userId,
          type: "cover",
          imageBase64: generated.imageBase64,
          title: coverTitle,
          author: coverAuthor,
        })

        // 更新小说的 coverUrl
        await prisma.novel.update({
          where: { id: novelId },
          data: { coverUrl: saved.imageUrl },
        })

        return {
          coverUrl: saved.imageUrl,
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
    console.error("Generate cover error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "生成封面失败" },
      { status: 500 }
    )
  }
}
