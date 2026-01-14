import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireUserId } from "@/lib/auth/get-user"
import { getTextProvider } from "@/lib/ai"

// 辅助函数：将数组转为 JSON 字符串存储
function serializeArray(arr: string[] | null | undefined): string | null {
  if (!arr || arr.length === 0) return null
  return JSON.stringify(arr)
}

// 辅助函数：将 JSON 字符串解析为数组
function parseArray(str: string | null | undefined): string[] {
  if (!str) return []
  try {
    return JSON.parse(str)
  } catch {
    return []
  }
}

// 辅助函数：转换摘要数据
function transformSummary(summary: { keyPoints?: string | null; [key: string]: unknown }) {
  return {
    ...summary,
    keyPoints: parseArray(summary.keyPoints),
  }
}

// POST /api/novels/[novelId]/summaries/[chapterId]/generate - AI 生成章节摘要
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ novelId: string; chapterId: string }> }
) {
  try {
    const userId = await requireUserId()
    const { novelId, chapterId } = await params

    // 验证章节属于当前用户
    const chapter = await db.chapter.findFirst({
      where: {
        id: chapterId,
        novelId,
        novel: { userId },
      },
      include: {
        novel: { select: { title: true } },
      },
    })

    if (!chapter) {
      return NextResponse.json({ error: "章节不存在" }, { status: 404 })
    }

    if (!chapter.content || chapter.content.length < 100) {
      return NextResponse.json({ error: "章节内容过短，无法生成摘要" }, { status: 400 })
    }

    // 使用项目的 AI 提供者生成摘要
    const textProvider = getTextProvider()
    const response = await textProvider.generate({
      model: "gemini-2.0-flash", // 使用快速模型生成摘要
      systemPrompt: "你是一个专业的小说摘要生成助手。请严格按照要求的 JSON 格式返回结果。",
      userPrompt: `请为以下小说章节生成一个简洁的摘要（200字以内），并提取3-5个关键点。

小说名：${chapter.novel.title}
章节名：${chapter.title}

章节内容：
${chapter.content.slice(0, 8000)}

请按以下 JSON 格式返回：
{
  "summary": "摘要内容",
  "keyPoints": ["关键点1", "关键点2", "关键点3"]
}

要求：
1. 摘要应包含主要事件、角色状态变化、情节转折
2. 关键点应标注重要的伏笔、新角色登场、关键决定等
3. 只返回 JSON，不要其他内容`,
      maxTokens: 1024,
    })

    let result: { summary: string; keyPoints: string[] }
    try {
      // 尝试提取 JSON
      const jsonMatch = response.content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error("未找到 JSON")
      }
      result = JSON.parse(jsonMatch[0])
    } catch {
      // 如果解析失败，使用整个内容作为摘要
      result = {
        summary: response.content.slice(0, 500),
        keyPoints: [],
      }
    }

    // 估算 token 数（简单估算：中文约 2 字符/token）
    const tokenCount = Math.ceil(result.summary.length / 2)

    // 保存摘要
    const summary = await db.chapterSummary.upsert({
      where: { chapterId },
      update: {
        summary: result.summary,
        keyPoints: serializeArray(result.keyPoints),
        tokenCount,
        isManual: false,
      },
      create: {
        novelId,
        chapterId,
        summary: result.summary,
        keyPoints: serializeArray(result.keyPoints),
        tokenCount,
        isManual: false,
      },
    })

    return NextResponse.json(transformSummary(summary))
  } catch (error) {
    console.error("Generate summary error:", error)
    return NextResponse.json({ error: "生成摘要失败" }, { status: 500 })
  }
}
