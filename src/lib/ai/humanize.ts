/**
 * AI 降重/人性化改写模块（朱雀降重）
 *
 * Pipeline:
 * 1. Gemini Flash 语义切割（300-400字/块）
 * 2. 微调模型逐块改写
 * 3. 拼接输出
 */

import { getVertexClient, getModelId, getTemperature, isVertexAIConfigured } from "./providers/vertex/client"

export { isVertexAIConfigured } from "./providers/vertex/client"

// 参数和结果类型
export interface HumanizeParams {
  text: string
}

export interface HumanizeResult {
  originalText: string
  humanizedText: string
}

export interface HumanizeStreamChunk {
  type: "content" | "done"
  text?: string
}

// Token 统计
interface TokenUsage {
  inputTokens: number
  outputTokens: number
}

interface CostSummary {
  flashInput: number
  flashOutput: number
  rewriteInput: number
  rewriteOutput: number
  totalTokens: number
  totalCost: number  // 美元
}

// 模型配置
const FLASH_MODEL = "gemini-2.5-flash"
const REWRITE_SYSTEM_PROMPT = "你是网文作者"

// 价格配置 (美元/百万token)
const PRICING = {
  flash: { input: 0.15, output: 0.60 },      // Gemini 2.5 Flash
  rewrite: { input: 0.50, output: 1.50 },    // 微调模型 (估算)
}

/**
 * 从响应中提取 token 使用量
 */
function extractTokenUsage(response: { usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number } }): TokenUsage {
  return {
    inputTokens: response.usageMetadata?.promptTokenCount || 0,
    outputTokens: response.usageMetadata?.candidatesTokenCount || 0,
  }
}

/**
 * Step 1: 语义切割 (Gemini Flash)
 * 将文本按语义完整性切割成 300-400 字的块
 */
async function semanticSplit(text: string): Promise<{ chunks: string[]; tokens: TokenUsage }> {
  const prompt = `将以下文本按语义完整性切割成多个段落块。

要求：
- 每块 500-800 字左右
- 在场景转换、时间跳跃、对话结束等自然边界切分
- 保持语义完整，不要切断对话或动作描写
- 保留原文的段落换行符

原文：
${text}

返回JSON数组，每个元素是一个文本块（保留换行）：
["第一块...", "第二块...", ...]`

  const client = getVertexClient()
  const model = client.getGenerativeModel({ model: FLASH_MODEL })

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
    },
  })

  const tokens = extractTokenUsage(result.response)
  const responseText = result.response.candidates?.[0]?.content?.parts?.[0]?.text || "[]"

  let chunks: string[]
  try {
    chunks = JSON.parse(responseText)
  } catch {
    console.error("   ✗ 切割JSON解析失败，使用简单分段")
    // 降级：按段落简单分割
    chunks = simpleSplit(text, 650)
  }

  return { chunks, tokens }
}

/**
 * 简单分割（降级方案）
 */
function simpleSplit(text: string, targetSize: number): string[] {
  const paragraphs = text.split(/\n+/)
  const chunks: string[] = []
  let current = ""

  for (const para of paragraphs) {
    if (current.length + para.length > targetSize && current.length > 0) {
      chunks.push(current.trim())
      current = para
    } else {
      current += (current ? "\n\n" : "") + para
    }
  }

  if (current.trim()) {
    chunks.push(current.trim())
  }

  return chunks
}

/**
 * Step 2: 改写单个块 (微调模型)
 */
async function rewriteChunk(chunk: string, index: number, total: number): Promise<{ text: string; tokens: TokenUsage }> {
  const prompt = `以网文作家的行文风格重写以下段落。

要求：
1. 长短句交替，打破原有节奏，节奏变快（如：长句拆成2-3短句，或短句合并）
2. 适当加入口语化表达
3. 变换句式结构
4. 避免连续使用相同句式开头
5. 保持原意，保留人名地名

${chunk}`

  const client = getVertexClient()
  const model = client.getGenerativeModel({
    model: getModelId(),
    systemInstruction: REWRITE_SYSTEM_PROMPT,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any)

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: getTemperature(),
      maxOutputTokens: chunk.length * 3,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      thinkingConfig: { thinkingBudget: Math.round(chunk.length * 1.5) },
    } as any,
  })

  const tokens = extractTokenUsage(result.response)
  const responseText = result.response.candidates?.[0]?.content?.parts?.[0]?.text || chunk

  console.log(`   → 块 ${index + 1}/${total} (${chunk.length}→${responseText.length}字)`)

  return { text: responseText, tokens }
}

/**
 * 计算成本
 */
function calculateCost(
  flashTokens: TokenUsage,
  rewriteTokens: TokenUsage
): CostSummary {
  const flashInputCost = (flashTokens.inputTokens / 1_000_000) * PRICING.flash.input
  const flashOutputCost = (flashTokens.outputTokens / 1_000_000) * PRICING.flash.output
  const rewriteInputCost = (rewriteTokens.inputTokens / 1_000_000) * PRICING.rewrite.input
  const rewriteOutputCost = (rewriteTokens.outputTokens / 1_000_000) * PRICING.rewrite.output

  return {
    flashInput: flashTokens.inputTokens,
    flashOutput: flashTokens.outputTokens,
    rewriteInput: rewriteTokens.inputTokens,
    rewriteOutput: rewriteTokens.outputTokens,
    totalTokens: flashTokens.inputTokens + flashTokens.outputTokens + rewriteTokens.inputTokens + rewriteTokens.outputTokens,
    totalCost: flashInputCost + flashOutputCost + rewriteInputCost + rewriteOutputCost,
  }
}

/**
 * 主函数：降AI率改写（流式）
 */
export async function* humanizeTextStream(
  params: HumanizeParams
): AsyncGenerator<HumanizeStreamChunk, void, unknown> {
  if (!isVertexAIConfigured()) {
    throw new Error("Vertex AI 未配置，无法使用朱雀降重功能")
  }

  const { text } = params

  console.log(`\n🐦 朱雀降重 | ${text.length}字`)

  // Step 1: 语义切割
  console.log(`\n   [Step 1] 语义切割`)
  console.log(`   [模型] ${FLASH_MODEL}`)
  console.log(`   [目标] 500-800字/块`)

  let chunks: string[]
  let flashTokens: TokenUsage = { inputTokens: 0, outputTokens: 0 }

  try {
    const result = await semanticSplit(text)
    chunks = result.chunks
    flashTokens = result.tokens
    console.log(`   → 完成，切分为 ${chunks.length} 块`)
    console.log(`   → Token: ${flashTokens.inputTokens} in / ${flashTokens.outputTokens} out`)
  } catch (error) {
    console.error("   ✗ 切割失败:", error)
    throw new Error("语义切割失败")
  }

  // Step 2: 逐块改写
  console.log(`\n   [Step 2] 逐块改写`)
  console.log(`   [模型] ${getModelId()}`)
  console.log(`   [System] ${REWRITE_SYSTEM_PROMPT}`)
  console.log(`   [温度] ${getTemperature()}`)

  const rewrittenChunks: string[] = []
  let rewriteTokens: TokenUsage = { inputTokens: 0, outputTokens: 0 }

  for (let i = 0; i < chunks.length; i++) {
    try {
      const result = await rewriteChunk(chunks[i], i, chunks.length)
      rewrittenChunks.push(result.text)
      rewriteTokens.inputTokens += result.tokens.inputTokens
      rewriteTokens.outputTokens += result.tokens.outputTokens
    } catch (error) {
      console.error(`   ✗ 块 ${i + 1} 失败:`, error)
      rewrittenChunks.push(chunks[i])  // 失败时保留原文
    }
  }

  // Step 3: 拼接输出
  const outputText = rewrittenChunks.join("\n\n")

  // 统计
  const cost = calculateCost(flashTokens, rewriteTokens)
  const diff = outputText.length - text.length
  const diffStr = diff >= 0 ? `+${diff}` : `${diff}`

  console.log(`\n   ✓ 完成 ${rewrittenChunks.length}/${chunks.length} 块`)
  console.log(`   ✓ 字数 ${text.length}→${outputText.length} (${diffStr})`)
  console.log(`\n   📊 Token 统计`)
  console.log(`   ┌─────────────┬──────────┬──────────┐`)
  console.log(`   │ 模型        │ Input    │ Output   │`)
  console.log(`   ├─────────────┼──────────┼──────────┤`)
  console.log(`   │ Flash       │ ${String(cost.flashInput).padStart(8)} │ ${String(cost.flashOutput).padStart(8)} │`)
  console.log(`   │ 微调模型    │ ${String(cost.rewriteInput).padStart(8)} │ ${String(cost.rewriteOutput).padStart(8)} │`)
  console.log(`   ├─────────────┼──────────┴──────────┤`)
  console.log(`   │ 总计        │ ${String(cost.totalTokens).padStart(19)} │`)
  console.log(`   └─────────────┴─────────────────────┘`)
  console.log(`   💰 预估成本: $${cost.totalCost.toFixed(4)}\n`)

  yield { type: "content", text: outputText }
  yield { type: "done" }
}

/**
 * 降AI率改写（非流式）
 */
export async function humanizeText(params: HumanizeParams): Promise<HumanizeResult> {
  const chunks: string[] = []
  for await (const chunk of humanizeTextStream(params)) {
    if (chunk.type === "content" && chunk.text) {
      chunks.push(chunk.text)
    }
  }
  return {
    originalText: params.text,
    humanizedText: chunks.join(""),
  }
}
