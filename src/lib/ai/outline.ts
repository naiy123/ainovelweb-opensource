import { ai } from "./client"
import type { OutlineGenerationParams, OutlineGenerationResult, OutlineNodeType } from "./types"
import { getCardModelConfig, DEFAULT_CARD_MODEL_ID } from "./models"
import { logAIRequest, logAIResponse } from "./logger"

// 节点类型中文名
const NODE_TYPE_LABELS: Record<OutlineNodeType, string> = {
  volume: "卷纲",
  chapter_outline: "章纲",
  plot_point: "情节点",
}

// 子节点类型
const CHILD_NODE_TYPES: Record<OutlineNodeType, string> = {
  volume: "章节",
  chapter_outline: "情节点",
  plot_point: "",
}

function buildOutlineSystemInstruction(params: OutlineGenerationParams): string {
  const { nodeType, style, novelTitle, novelDescription, parentNode } = params

  const styleHint = style ? `风格设定：${style}。` : ""
  const novelHint = novelTitle ? `小说名称：《${novelTitle}》。` : ""
  const descHint = novelDescription ? `故事简介：${novelDescription}` : ""

  const nodeLabel = NODE_TYPE_LABELS[nodeType]
  const childLabel = CHILD_NODE_TYPES[nodeType]

  // 父节点上下文
  let parentContext = ""
  if (parentNode) {
    parentContext = `
【上级${NODE_TYPE_LABELS[parentNode.type as OutlineNodeType] || "节点"}】
标题：${parentNode.title}
${parentNode.content ? `内容：${parentNode.content}` : ""}
`
  }

  if (nodeType === "volume") {
    return `你是专业的小说大纲策划师，擅长构建宏观叙事结构。
${styleHint}${novelHint}${descHint}

请根据用户提供的关键词或描述，生成卷级大纲。
返回 JSON 格式，包含以下字段：
- titles: 数组，3个候选卷名，每个包含 name（卷名）和 meaning（寓意/说明）
- content: 本卷概述（200-400字），包括：
  · 核心主题
  · 主要冲突
  · 关键角色
  · 故事走向
- childSuggestions: 建议的${childLabel}标题（3-5个）

卷名要求：
- 体现本卷核心主题
- 与小说风格一致`
  }

  if (nodeType === "chapter_outline") {
    return `你是专业的小说章节规划师，擅长设计精彩的章节结构。
${styleHint}${novelHint}
${parentContext}

请根据用户提供的关键词或描述，生成章节大纲。
返回 JSON 格式，包含以下字段：
- titles: 数组，3个候选章节标题，每个包含 name（标题）和 meaning（寓意/说明）
- content: 章节概述（150-300字），包括：
  · 主要情节
  · 人物出场
  · 场景设定
  · 与上下文的衔接
- childSuggestions: 建议的${childLabel}（3-5个简短描述）

章节标题要求：
- 概括本章核心事件
- 有一定悬念或吸引力`
  }

  // plot_point - 只需要父节点（章纲）信息
  return `你是专业的小说情节设计师，擅长细化精彩的情节点。
${styleHint}
${parentContext}

请根据用户提供的关键词或描述，生成情节点内容。
返回 JSON 格式，包含以下字段：
- titles: 数组，3个候选情节点标题，每个包含 name（标题）和 meaning（说明）
- content: 情节详述（100-200字），包括：
  · 具体场景描写要点
  · 关键对话/动作
  · 情感变化
  · 伏笔/呼应（如有）

情节点标题要求：
- 简洁明了
- 体现情节核心`
}

function buildOutlinePrompt(params: OutlineGenerationParams): string {
  const nodeLabel = NODE_TYPE_LABELS[params.nodeType]
  return `根据以下关键词/描述生成${nodeLabel}：

${params.keywords}`
}

/**
 * AI 生成大纲节点
 */
export async function generateOutline(params: OutlineGenerationParams): Promise<OutlineGenerationResult> {
  const prompt = buildOutlinePrompt(params)
  const systemInstruction = buildOutlineSystemInstruction(params)

  // 获取模型配置（复用卡片生成的模型配置）
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
      thinkingBudget: 128,
      includeThoughts: false,
    }
  }

  const nodeLabel = NODE_TYPE_LABELS[params.nodeType]

  // 打印请求日志
  logAIRequest({
    title: `大纲生成 (${nodeLabel})`,
    model: modelConfig.model,
    modelDisplayName: modelConfig.name,
    temperature: config.temperature,
    maxOutputTokens: config.maxOutputTokens,
    thinkingConfig: config.thinkingConfig,
    systemInstruction,
    prompt,
    extraParams: {
      NodeType: params.nodeType,
      Keywords: params.keywords,
      Style: params.style,
      NovelTitle: params.novelTitle,
      ParentNode: params.parentNode?.title,
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
    title: `大纲生成 (${nodeLabel})`,
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
      nodeType: params.nodeType,
      data,
    }
  } catch (e) {
    console.error("JSON 解析失败:", e)
    throw new Error("AI 返回格式错误")
  }
}
