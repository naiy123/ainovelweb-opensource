/**
 * 封面生成 - 风格家模式 (火山引擎)
 *
 * 两阶段流程：
 * 1. 使用 Doubao-Seed 生成画面描述
 * 2. 使用 Seedream 生成封面图片
 */

import { getTextProvider, getImageProvider } from "./factory"
import type { CoverGenerationParams, CoverGenerationResult } from "./types"
import { buildStylistMetaPrompt } from "./prompts/cover"
import { logAIRequest, logAIResponse, logStreamComplete, devLog } from "./logger"

// 火山引擎定价常量
const PRICING = {
  DOUBAO_INPUT_PER_MILLION: 0.4,
  DOUBAO_OUTPUT_PER_MILLION: 4,
  SEEDREAM_PER_IMAGE: 0.25,
}

interface PromptResult {
  prompt: string
  cost: number
}

/**
 * 阶段 1: 使用 Doubao-Seed 生成 Seedream 提示词
 */
async function generateImagePrompt(params: CoverGenerationParams): Promise<PromptResult> {
  const metaPrompt = buildStylistMetaPrompt({
    title: params.title,
    author: params.author,
    channel: params.channel,
    genre: params.genre,
    description: params.description,
  })

  // 获取火山 Text Provider
  const textProvider = getTextProvider("volcengine")
  const model = textProvider.capabilities.defaultTextModel

  // 打印请求日志（业务层 + 技术层合并）
  logAIRequest({
    title: "风格家 - 阶段1: 画面描述生成",
    model,
    modelDisplayName: "Doubao-Seed (深度思考)",
    prompt: metaPrompt,
    extraParams: {
      Provider: "火山引擎",
      Title: params.title,
      Author: params.author,
      Channel: params.channel,
      Genre: params.genre,
    },
  })

  const startTime = Date.now()

  // 直接调用底层 client，避免 Provider 内部重复打印日志
  const { volcClient } = await import("./providers/volcengine/client")

  const completion = await volcClient.chat.completions.create({
    model,
    messages: [{ role: "user", content: metaPrompt }],
  })

  const durationMs = Date.now() - startTime
  const message = completion.choices?.[0]?.message
  const imagePrompt = message?.content || ""
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reasoningContent = (message as any)?.reasoning_content

  // 计算成本
  let llmCost = 0
  const inputTokens = completion.usage?.prompt_tokens || 0
  const outputTokens = completion.usage?.completion_tokens || 0
  if (completion.usage) {
    const inputCost = (inputTokens / 1_000_000) * PRICING.DOUBAO_INPUT_PER_MILLION
    const outputCost = (outputTokens / 1_000_000) * PRICING.DOUBAO_OUTPUT_PER_MILLION
    llmCost = inputCost + outputCost
  }

  // 打印响应日志
  logAIResponse({
    title: "风格家 - 阶段1: 画面描述生成",
    success: true,
    durationMs,
    finishReason: completion.choices?.[0]?.finish_reason,
    contentLength: imagePrompt.length,
    contentPreview: imagePrompt.slice(0, 300) + (imagePrompt.length > 300 ? "..." : ""),
    usage: {
      promptTokenCount: inputTokens,
      candidatesTokenCount: outputTokens,
      totalTokenCount: completion.usage?.total_tokens || 0,
    },
  })

  // 打印思维链内容
  if (reasoningContent) {
    devLog("\n🧠 思维链内容:")
    devLog("-".repeat(40))
    devLog(reasoningContent.length > 1000
      ? reasoningContent.slice(0, 1000) + `...(共 ${reasoningContent.length} 字)`
      : reasoningContent)
    devLog("-".repeat(40))
  }

  devLog(`💰 LLM成本: ¥${llmCost.toFixed(6)}`)

  return { prompt: imagePrompt, cost: llmCost }
}

interface ImageResult {
  imageBase64: string
  mimeType: string
  cost: number
}

/**
 * 阶段 2: 使用 Seedream 生成封面图片
 */
async function generateImageWithSeedream(prompt: string): Promise<ImageResult> {
  // 获取火山 Image Provider
  const imageProvider = getImageProvider("volcengine")
  const model = imageProvider.capabilities.defaultImageModel

  // 打印请求日志
  logAIRequest({
    title: "风格家 - 阶段2: 图片生成",
    model,
    modelDisplayName: "Seedream",
    prompt,
    extraParams: {
      Provider: "火山引擎",
      AspectRatio: "3:4",
      Size: "1728x2304",
      Watermark: false,
    },
  })

  const startTime = Date.now()

  // 直接调用底层 API，避免 Provider 内部重复打印日志
  const { VOLC_API_BASE_URL } = await import("./providers/volcengine/client")

  const response = await fetch(`${VOLC_API_BASE_URL}/images/generations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.VOLC_ARK_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      prompt,
      size: "1728x2304",
      response_format: "b64_json",
      watermark: false,
    }),
  })

  const durationMs = Date.now() - startTime

  if (!response.ok) {
    const errorText = await response.text()
    logAIResponse({
      title: "风格家 - 阶段2: 图片生成",
      success: false,
      durationMs,
      error: `Seedream API 调用失败: ${response.status} - ${errorText}`,
    })
    throw new Error(`Seedream API 调用失败: ${response.status}`)
  }

  const result = await response.json()

  if (!result.data || result.data.length === 0) {
    logAIResponse({
      title: "风格家 - 阶段2: 图片生成",
      success: false,
      durationMs,
      error: "Seedream 未返回图片数据",
    })
    throw new Error("Seedream 未返回图片数据")
  }

  const firstImage = result.data[0]
  if (firstImage.error) {
    logAIResponse({
      title: "风格家 - 阶段2: 图片生成",
      success: false,
      durationMs,
      error: firstImage.error.message,
    })
    throw new Error(`图片生成失败: ${firstImage.error.message}`)
  }

  const imageCost = PRICING.SEEDREAM_PER_IMAGE

  logAIResponse({
    title: "风格家 - 阶段2: 图片生成",
    success: true,
    durationMs,
  })

  devLog(`💰 图片成本: ¥${imageCost.toFixed(2)}`)

  return {
    imageBase64: firstImage.b64_json,
    mimeType: "image/jpeg",
    cost: imageCost,
  }
}

/**
 * 风格家封面生成 - 两阶段流程
 *
 * 1. 使用 Doubao-Seed 生成画面描述
 * 2. 使用 Seedream 生成封面图片
 */
export async function generateCoverImageStylist(
  params: CoverGenerationParams
): Promise<CoverGenerationResult> {
  devLog("\n" + "=".repeat(60))
  devLog("🚀 风格家封面生成开始")
  devLog("=".repeat(60))

  // 第一阶段：生成画面描述
  const promptResult = await generateImagePrompt(params)

  if (!promptResult.prompt.trim()) {
    throw new Error("画面描述生成失败")
  }

  // 第二阶段：生成封面图片
  const imageResult = await generateImageWithSeedream(promptResult.prompt)

  // 汇总总成本
  const totalCost = promptResult.cost + imageResult.cost
  devLog("\n" + "=".repeat(60))
  devLog("💰 风格家总成本汇总")
  devLog("=".repeat(60))
  devLog(`   LLM (Doubao-Seed): ¥${promptResult.cost.toFixed(6)}`)
  devLog(`   图片 (Seedream):   ¥${imageResult.cost.toFixed(2)}`)
  devLog(`   ────────────────────────`)
  devLog(`   总计: ¥${totalCost.toFixed(6)}`)
  devLog("=".repeat(60) + "\n")

  return {
    imageBase64: imageResult.imageBase64,
    mimeType: imageResult.mimeType,
  }
}
