import { NextRequest } from "next/server"
import { humanizeTextStream, isVertexAIConfigured, type HumanizeParams } from "@/lib/ai/humanize"
import { requireUserId } from "@/lib/auth/get-user"
import { rateLimit } from "@/lib/rate-limit"
import { validateOrigin } from "@/lib/security"
import { z } from "zod"
import { ZodError } from "zod"

// 请求参数验证
const humanizeSchema = z.object({
  text: z.string().min(10, "文本至少10个字符").max(50000, "文本最多50000个字符"),
})

// POST /api/humanize - 降AI率改写（流式）
export async function POST(request: NextRequest) {
  try {
    // CSRF 验证
    if (!validateOrigin(request)) {
      return Response.json({ error: "Invalid request origin" }, { status: 403 })
    }

    // 检查 Vertex AI 配置
    if (!isVertexAIConfigured()) {
      return Response.json(
        { error: "降AI率功能未配置，请联系管理员" },
        { status: 503 }
      )
    }

    // 获取用户 ID（必须登录）
    const userId = await requireUserId()

    // 速率限制：每用户每分钟 5 次
    const rateLimitKey = `ai:humanize:${userId}`
    const rateLimitResult = await rateLimit(rateLimitKey, 5, 60)
    if (!rateLimitResult.success) {
      return Response.json(
        { error: `请求过于频繁，请 ${rateLimitResult.resetIn} 秒后重试` },
        { status: 429 }
      )
    }

    const body = await request.json()

    // 验证输入
    const validatedData = humanizeSchema.parse(body)

    console.log("🐦 朱雀降重请求:", {
      textLength: validatedData.text.length,
    })

    // 构建参数
    const params: HumanizeParams = {
      text: validatedData.text,
    }

    // 创建流式响应
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let generatedText = ""

          // 调用降AI率流式生成
          const generator = humanizeTextStream(params)

          for await (const chunk of generator) {
            if (chunk.type === "content" && chunk.text) {
              generatedText += chunk.text
              const data = JSON.stringify({ type: "content", text: chunk.text })
              controller.enqueue(encoder.encode(`data: ${data}\n\n`))
            } else if (chunk.type === "done") {
              const doneData = JSON.stringify({
                type: "done",
                originalLength: validatedData.text.length,
                humanizedLength: generatedText.length,
              })
              controller.enqueue(encoder.encode(`data: ${doneData}\n\n`))
            }
          }

          console.log("✅ 降AI率完成:", {
            originalLength: validatedData.text.length,
            humanizedLength: generatedText.length,
          })

          controller.close()
        } catch (error) {
          console.error("Humanize stream error:", error)

          const errorData = JSON.stringify({
            type: "error",
            message: error instanceof Error ? error.message : "改写失败",
          })
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("Humanize error:", error)

    if (error instanceof ZodError) {
      return Response.json({ error: error.issues }, { status: 400 })
    }

    return Response.json({ error: "处理失败，请稍后重试" }, { status: 500 })
  }
}
