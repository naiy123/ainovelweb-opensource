import { ai } from "./client"
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
返回 JSON 格式，包含以下字段：
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
- 避免与已有名称重复`
  } else {
    return `你是一位专业的小说设定助手，擅长创作丰富的世界观设定。
${styleHint}${novelHint}${existingHint}

请根据用户提供的关键词或描述，生成完整的词条设定。
返回 JSON 格式，包含以下字段：
- names: 数组，3-5个候选名字，每个包含 name（名称）和 meaning（含义/解释）
- description: 详细描述（300-500字），包括定义、来源、作用等
- suggestedTags: 建议标签数组（3-5个）

名称要求：
- 符合设定风格
- 名称要有内涵
- 避免与已有名称重复`
  }
}

function buildCardPrompt(params: CardGenerationParams): string {
  return `根据以下关键词/描述生成${params.category === "character" ? "角色" : "词条"}设定：

${params.keywords}`
}

/**
 * AI 生成角色/词条卡片
 */
export async function generateCard(params: CardGenerationParams): Promise<CardGenerationResult> {
  const prompt = buildCardPrompt(params)
  const systemInstruction = buildCardSystemInstruction(params)

  // 获取模型配置
  const modelConfig = getCardModelConfig(params.model || DEFAULT_CARD_MODEL_ID)

  // 根据模型配置思考参数
  const isGemini25 = modelConfig.model.includes("gemini-2.5")
  const isGemini25Lite = modelConfig.model.includes("flash-lite")

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const config: any = {
    systemInstruction,
    temperature: 0.9,
    maxOutputTokens: 4096,
    responseMimeType: "application/json",
  }

  // Gemini 2.5 (非 Lite) 需要配置最小思考预算
  if (isGemini25 && !isGemini25Lite) {
    config.thinkingConfig = {
      thinkingBudget: 128,  // 最小值，减少成本
      includeThoughts: false,
    }
  }

  // 打印请求日志
  logAIRequest({
    title: `卡片生成 (${params.category === "character" ? "角色" : "词条"})`,
    model: modelConfig.model,
    modelDisplayName: modelConfig.name,
    temperature: config.temperature,
    maxOutputTokens: config.maxOutputTokens,
    thinkingConfig: config.thinkingConfig,
    systemInstruction,
    prompt,
    extraParams: {
      Category: params.category,
      Keywords: params.keywords,
      Style: params.style,
      NovelTitle: params.novelTitle,
      ExistingCards: params.existingCards?.join(", "),
      ResponseMimeType: config.responseMimeType,
    },
  })

  const startTime = Date.now()

  const response = await ai.models.generateContent({
    model: modelConfig.model,
    contents: prompt,
    config,
  })

  const text = response.text || "{}"
  const durationMs = Date.now() - startTime

  // 打印响应日志
  const usage = response.usageMetadata
  const finishReason = response.candidates?.[0]?.finishReason

  logAIResponse({
    title: `卡片生成 (${params.category === "character" ? "角色" : "词条"})`,
    success: true,
    durationMs,
    finishReason: finishReason as string,
    contentLength: text.length,
    contentPreview: text.slice(0, 500) + (text.length > 500 ? "..." : ""),
    usage: usage ? {
      promptTokenCount: usage.promptTokenCount,
      candidatesTokenCount: usage.candidatesTokenCount,
      thoughtsTokenCount: usage.thoughtsTokenCount,
      cachedContentTokenCount: usage.cachedContentTokenCount,
      totalTokenCount: usage.totalTokenCount,
    } : undefined,
  })

  try {
    const data = JSON.parse(text)
    return {
      category: params.category,
      data,
    } as CardGenerationResult
  } catch (e) {
    console.error("JSON 解析失败:", e)
    throw new Error("AI 返回格式错误")
  }
}
