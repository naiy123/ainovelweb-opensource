import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"
import { ZodError } from "zod"
import { generateOutline } from "@/lib/ai/outline"
import { requireUserId } from "@/lib/auth/get-user"
import { rateLimit } from "@/lib/rate-limit"
import { sanitizePromptInput, validateOrigin, csrfErrorResponse } from "@/lib/security"

const generateOutlineSchema = z.object({
  nodeType: z.enum(["volume", "chapter_outline", "plot_point"]),
  keywords: z.string().min(1, "请输入关键词或描述").max(500, "描述不能超过500字"),
  style: z.string().optional(),
  model: z.string().optional(),
  parentNodeId: z.string().optional(),  // 父节点ID（用于获取上下文）
})

// POST /api/novels/[novelId]/outline/generate - AI 生成大纲节点
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

    // 速率限制：每用户每分钟 10 次
    const rateLimitKey = `ai:outline:${userId}`
    const rateLimitResult = await rateLimit(rateLimitKey, 10, 60)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: `请求过于频繁，请 ${rateLimitResult.resetIn} 秒后重试` },
        { status: 429 }
      )
    }

    const { novelId } = await params
    const body = await request.json()

    const validatedData = generateOutlineSchema.parse(body)

    // 清理用户输入
    const sanitizedKeywords = sanitizePromptInput(validatedData.keywords, 500)
    const sanitizedStyle = validatedData.style ? sanitizePromptInput(validatedData.style, 200) : undefined

    // 验证小说属于当前用户
    const novel = await db.novel.findUnique({
      where: { id: novelId, userId },
    })

    if (!novel) {
      return NextResponse.json({ error: "小说不存在" }, { status: 404 })
    }

    // 获取父节点上下文（如果有）
    let parentNode: { title: string; content?: string; type: string } | undefined
    if (validatedData.parentNodeId) {
      const parent = await db.outlineNode.findUnique({
        where: { id: validatedData.parentNodeId, novelId },
      })
      if (parent) {
        parentNode = {
          title: parent.title,
          content: parent.content || undefined,
          type: parent.type,
        }
      }
    }

    // 生成大纲（使用火山引擎豆包模型）
    const result = await generateOutline({
      nodeType: validatedData.nodeType,
      keywords: sanitizedKeywords,
      style: sanitizedStyle,
      novelTitle: novel.title,
      novelDescription: novel.description || undefined,
      model: validatedData.model,
      parentNode,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Generate outline error:", error)

    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ error: "生成失败" }, { status: 500 })
  }
}
