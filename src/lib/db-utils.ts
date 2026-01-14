/**
 * SQLite 数组字段序列化工具
 * SQLite 不支持原生数组，需要用 JSON 字符串存储
 */

/**
 * 将数组序列化为 JSON 字符串（存入数据库）
 */
export function serializeArray(arr: string[] | null | undefined): string | null {
  if (!arr || arr.length === 0) return null
  return JSON.stringify(arr)
}

/**
 * 将 JSON 字符串解析为数组（从数据库读取）
 */
export function parseArray(str: string | null | undefined): string[] {
  if (!str) return []
  try {
    return JSON.parse(str)
  } catch {
    return []
  }
}

/**
 * 转换卡片数据（将 triggers 从 JSON 字符串转为数组）
 */
export function transformCard<T extends { triggers?: string | null }>(card: T): Omit<T, 'triggers'> & { triggers: string[] } {
  return {
    ...card,
    triggers: parseArray(card.triggers),
  }
}

/**
 * 批量转换卡片数据
 */
export function transformCards<T extends { triggers?: string | null }>(cards: T[]): (Omit<T, 'triggers'> & { triggers: string[] })[] {
  return cards.map(transformCard)
}

/**
 * 转换摘要数据（将 keyPoints 从 JSON 字符串转为数组）
 */
export function transformSummary<T extends { keyPoints?: string | null }>(summary: T): Omit<T, 'keyPoints'> & { keyPoints: string[] } {
  return {
    ...summary,
    keyPoints: parseArray(summary.keyPoints),
  }
}

/**
 * 批量转换摘要数据
 */
export function transformSummaries<T extends { keyPoints?: string | null }>(summaries: T[]): (Omit<T, 'keyPoints'> & { keyPoints: string[] })[] {
  return summaries.map(transformSummary)
}
