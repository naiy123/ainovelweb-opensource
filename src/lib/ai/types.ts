// ============================================
// 写作生成相关类型
// ============================================

export interface AIProvider {
  generateContent(params: GenerateParams): Promise<string>
  generateContentStream(
    params: GenerateParams,
    onThinking?: (text: string) => void,
    onContent?: (text: string) => void
  ): AsyncGenerator<StreamChunk, void, unknown>
}

// 角色卡信息（用于写作）
export interface CharacterCardInfo {
  name: string
  gender?: string
  age?: string
  personality?: string
  background?: string
  abilities?: string
}

// 词条卡信息（用于写作）
export interface TermCardInfo {
  name: string
  description?: string
}

// 关联章节信息（用于上下文）
export interface LinkedChapterInfo {
  title: string
  content: string
}

export interface GenerateParams {
  storyBackground?: string
  chapterPlot: string
  writingStyle?: string
  previousContent?: string
  wordCount: number
  // 新增：角色和词条信息
  characters?: CharacterCardInfo[]
  terms?: TermCardInfo[]
  characterRelations?: string
  // 关联章节（提供上下文）
  linkedChapters?: LinkedChapterInfo[]
  // AI 模型配置
  model?: string       // 模型 ID，如 gemini-2.5-pro
  thinking?: boolean   // 是否开启深度思考
}

// Token 使用统计
export interface TokenUsage {
  promptTokenCount: number      // 输入 token
  candidatesTokenCount: number  // 输出 token
  thoughtsTokenCount?: number   // 思考 token
  cachedContentTokenCount?: number // 缓存命中 token
  totalTokenCount: number       // 总计
}

export interface StreamChunk {
  type: "thinking" | "content" | "usage"
  text?: string
  usage?: TokenUsage
}

// ============================================
// 封面生成相关类型
// ============================================

export interface CoverGenerationParams {
  title: string
  author?: string
  channel?: string  // 男频 / 女频
  genre: string
  description?: string
}

export interface CoverGenerationResult {
  imageBase64: string
  mimeType: string
}

// ============================================
// 卡片生成相关类型
// ============================================

export interface CardGenerationParams {
  category: "character" | "term"
  keywords: string
  style?: string
  novelTitle?: string
  existingCards?: string[]
  model?: string  // 模型 ID，如 fast, balanced
}

export interface GeneratedCharacter {
  names: Array<{ name: string; meaning: string }>
  gender: string
  age: string
  personality: string
  background: string
  abilities: string
  suggestedTags: string[]
}

export interface GeneratedTerm {
  names: Array<{ name: string; meaning: string }>
  description: string
  suggestedTags: string[]
}

export type CardGenerationResult =
  | { category: "character"; data: GeneratedCharacter }
  | { category: "term"; data: GeneratedTerm }

// ============================================
// 大纲生成相关类型
// ============================================

export type OutlineNodeType = "volume" | "chapter_outline" | "plot_point"

export interface OutlineGenerationParams {
  nodeType: OutlineNodeType
  keywords: string
  style?: string
  novelTitle?: string
  novelDescription?: string
  model?: string
  // 父节点上下文（章纲和情节点需要）
  parentNode?: {
    title: string
    content?: string
    type: string
  }
  // 同级节点（避免重复）
  siblingTitles?: string[]
}

export interface GeneratedOutlineNode {
  titles: Array<{ name: string; meaning: string }>
  content: string
  childSuggestions?: string[]  // 子节点建议（卷纲→章纲，章纲→情节点）
}

export interface OutlineGenerationResult {
  nodeType: OutlineNodeType
  data: GeneratedOutlineNode
}
