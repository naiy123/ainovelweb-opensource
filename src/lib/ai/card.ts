/**
 * AI 生成角色/词条卡片
 * 使用火山引擎豆包模型（与正文生成一致）
 */

import { getTextProviderAsync } from "./factory"
import type { CardGenerationParams, CardGenerationResult } from "./types"
import { getCardModelConfig, DEFAULT_CARD_MODEL_ID } from "./models"
import { logAIRequest, logAIResponse } from "./logger"

function buildCardSystemInstruction(params: CardGenerationParams): string {
  const styleHint = params.style ? `风格设定：${params.style}。` : ""
  const novelHint = params.novelTitle ? `这是小说《${params.novelTitle}》中的设定。` : ""
  const existingHint = params.existingCards?.length
    ? `已有名称（避免重复）：${params.existingCards.join("、")}。`
    : ""

  if (params.category === "character") {
    return `你是一位专业的小说设定助手，擅长创作生动的角色设定。
${styleHint}${novelHint}${existingHint}

请根据用户提供的关键词或描述，生成完整的角色设定。
必须返回纯 JSON 格式（不要包含 markdown 代码块），包含以下字段：
- names: 数组，3-5个候选名字，每个包含 name（名字）和 meaning（寓意/解释）
- gender: 性别
- age: 年龄描述
- personality: 性格特点（100-200字）
- background: 背景故事（200-400字）
- abilities: 能力设定（100-200字）
- suggestedTags: 建议标签数组（3-5个）

名字要求：
- 符合设定风格（玄幻用古风名，都市用现代名等）
- 名字要有寓意，与角色特点呼应
- 避免与已有名称重复

直接输出 JSON，不要有任何前缀或解释。`
  } else {
    return `你是一位专业的小说设定助手，擅长创作丰富的世界观设定。
${styleHint}${novelHint}${existingHint}

请根据用户提供的关键词或描述，生成完整的词条设定。
必须返回纯 JSON 格式（不要包含 markdown 代码块），包含以下字段：
- names: 数组，3-5个候选名字，每个包含 name（名称）和 meaning（含义/解释）
- description: 详细描述（300-500字），包括定义、来源、作用等
- suggestedTags: 建议标签数组（3-5个）

名称要求：
- 符合设定风格
- 名称要有内涵
- 避免与已有名称重复

直接输出 JSON，不要有任何前缀或解释。`
  }
}

function buildCardPrompt(params: CardGenerationParams): string {
  return `根据以下关键词/描述生成${params.category === "character" ? "角色" : "词条"}设定：

${params.keywords}`
}

/**
 * 从文本中提取 JSON
 */
function extractJSON(text: string): string {
  // 尝试直接解析
  try {
    JSON.parse(text)
    return text
  } catch {
    // 继续尝试提取
  }

  // 移除 markdown 代码块
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim()
  }

  // 尝试找到 JSON 对象
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    return jsonMatch[0]
  }

  return text
}

/**
 * AI 生成角色/词条卡片
 */
export async function generateCard(params: CardGenerationParams): Promise<CardGenerationResult> {
  const userPrompt = buildCardPrompt(params)
  const systemPrompt = buildCardSystemInstruction(params)

  // 获取模型配置
  const modelConfig = getCardModelConfig(params.model || DEFAULT_CARD_MODEL_ID)

  // 打印请求日志
  logAIRequest({
    title: `卡片生成 (${params.category === "character" ? "角色" : "词条"})`,
    model: modelConfig.model,
    modelDisplayName: modelConfig.name,
    systemInstruction: systemPrompt,
    prompt: userPrompt,
    extraParams: {
      Provider: "火山引擎",
      Category: params.category,
      Keywords: params.keywords,
      Style: params.style,
      NovelTitle: params.novelTitle,
      ExistingCards: params.existingCards?.join(", "),
    },
  })

  const startTime = Date.now()

  // 使用火山引擎 provider（与正文生成一致）
  const textProvider = await getTextProviderAsync()
  const result = await textProvider.generate({
    model: modelConfig.model,
    systemPrompt,
    userPrompt,
  })

  const durationMs = Date.now() - startTime
  const text = result.content || "{}"

  // 打印响应日志
  logAIResponse({
    title: `卡片生成 (${params.category === "character" ? "角色" : "词条"})`,
    success: true,
    durationMs,
    finishReason: result.finishReason,
    contentLength: text.length,
    contentPreview: text.slice(0, 500) + (text.length > 500 ? "..." : ""),
    usage: {
      promptTokenCount: result.usage.inputTokens,
      candidatesTokenCount: result.usage.outputTokens,
      totalTokenCount: result.usage.totalTokens,
    },
  })

  try {
    const jsonText = extractJSON(text)
    const data = JSON.parse(jsonText)
    return {
      category: params.category,
      data,
    } as CardGenerationResult
  } catch (e) {
    console.error("JSON 解析失败:", e)
    console.error("原始响应:", text)
    throw new Error("AI 返回格式错误")
  }
}
