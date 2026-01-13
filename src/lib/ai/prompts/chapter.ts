/**
 * 章节生成 Prompt 构建
 */

// ============ 类型定义 ============

export interface ChapterCharacter {
  name: string
  gender?: string
  age?: string
  personality?: string
  background?: string
  abilities?: string
}

export interface ChapterTerm {
  name: string
  description?: string
}

export interface LinkedChapter {
  title: string
  content: string
}

// 章节摘要
export interface ChapterSummaryInfo {
  title: string
  summary: string
}

// 通过触发词匹配的卡片
export interface MatchedCard {
  name: string
  category: "character" | "term"
  description?: string
  // 角色特有属性
  gender?: string
  age?: string
  personality?: string
  background?: string
  abilities?: string
}

export interface ChapterGenerateInput {
  storyBackground?: string
  chapterPlot: string
  writingStyle?: string
  wordCount: number
  characters?: ChapterCharacter[]
  terms?: ChapterTerm[]
  characterRelations?: string
  linkedChapters?: LinkedChapter[]
  previousContent?: string
  // 新增：摘要上下文
  novelSummary?: string           // 全书概要
  chapterSummaries?: ChapterSummaryInfo[]  // 历史章节摘要
  matchedCards?: MatchedCard[]    // 通过触发词匹配的卡片
}

// ============ Prompt 构建 ============

/**
 * 构建章节生成的系统指令
 */
export function buildChapterSystemPrompt(params: ChapterGenerateInput): string {
  let instruction = `你是一位专业的网文作家，擅长创作引人入胜的小说内容。

写作要求：
- 字数约 ${params.wordCount} 字
- 情节紧凑，对话生动
- 保持与前文的连贯性
- 适当制造悬念
- 直接开始写作，不要添加标题或额外说明`

  if (params.writingStyle) {
    instruction += `\n- 写作风格：${params.writingStyle}`
  }

  return instruction
}

/**
 * 构建章节生成的用户提示词
 */
export function buildChapterUserPrompt(params: ChapterGenerateInput): string {
  let prompt = ""

  // 全书概要（新增）
  if (params.novelSummary) {
    prompt += `【全书概要】
${params.novelSummary}

`
  }

  // 故事背景
  if (params.storyBackground) {
    prompt += `【故事背景】
${params.storyBackground}

`
  }

  // 历史章节摘要（新增 - 替代部分关联章节全文）
  if (params.chapterSummaries && params.chapterSummaries.length > 0) {
    prompt += `【前情回顾】
以下是近期章节的摘要，请保持剧情连贯性：

`
    for (const summary of params.chapterSummaries) {
      prompt += `▸ ${summary.title}
${summary.summary}

`
    }
  }

  // 通过触发词匹配的卡片（新增 - 自动注入相关设定）
  if (params.matchedCards && params.matchedCards.length > 0) {
    const matchedCharacters = params.matchedCards.filter(c => c.category === "character")
    const matchedTerms = params.matchedCards.filter(c => c.category === "term")

    // 匹配的角色
    if (matchedCharacters.length > 0) {
      prompt += `【相关角色】（根据剧情自动匹配）
`
      for (const char of matchedCharacters) {
        prompt += `▸ ${char.name}`
        const details = []
        if (char.gender) details.push(char.gender)
        if (char.age) details.push(char.age)
        if (details.length > 0) prompt += `（${details.join("，")}）`
        prompt += "\n"
        if (char.personality) prompt += `  性格：${char.personality}\n`
        if (char.background) prompt += `  背景：${char.background}\n`
        if (char.abilities) prompt += `  能力：${char.abilities}\n`
      }
      prompt += "\n"
    }

    // 匹配的词条
    if (matchedTerms.length > 0) {
      prompt += `【相关设定】（根据剧情自动匹配）
`
      for (const term of matchedTerms) {
        prompt += `▸ ${term.name}`
        if (term.description) {
          prompt += `：${term.description}`
        }
        prompt += "\n"
      }
      prompt += "\n"
    }
  }

  // 手动选择的角色设定
  if (params.characters && params.characters.length > 0) {
    prompt += `【本章角色】
`
    for (const char of params.characters) {
      prompt += `▸ ${char.name}`
      const details = []
      if (char.gender) details.push(char.gender)
      if (char.age) details.push(char.age)
      if (details.length > 0) prompt += `（${details.join("，")}）`
      prompt += "\n"
      if (char.personality) prompt += `  性格：${char.personality}\n`
      if (char.background) prompt += `  背景：${char.background}\n`
      if (char.abilities) prompt += `  能力：${char.abilities}\n`
    }
    prompt += "\n"
  }

  // 角色关系
  if (params.characterRelations) {
    prompt += `【角色关系】
${params.characterRelations}

`
  }

  // 手动选择的词条设定
  if (params.terms && params.terms.length > 0) {
    prompt += `【相关设定】
`
    for (const term of params.terms) {
      prompt += `▸ ${term.name}`
      if (term.description) {
        prompt += `：${term.description}`
      }
      prompt += "\n"
    }
    prompt += "\n"
  }

  // 关联章节（保留，用于需要参考全文的情况）
  if (params.linkedChapters && params.linkedChapters.length > 0) {
    prompt += `【参考章节】
以下是相关章节内容，请在写作时保持连贯性和一致性：

`
    for (const chapter of params.linkedChapters) {
      let content = stripHtml(chapter.content)
      // 限制每章最多3000字
      if (content.length > 3000) {
        content = content.slice(0, 3000) + "...(已截断)"
      }
      prompt += `--- ${chapter.title} ---
${content}

`
    }
  }

  // 本章剧情
  prompt += `【本章剧情】
${params.chapterPlot}
`

  // 前文内容
  if (params.previousContent) {
    prompt += `
【前文内容】
${params.previousContent}
`
  }

  prompt += `
请根据以上信息创作本章内容：`

  return prompt
}

/**
 * 清理 HTML 标签
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n\s*\n\s*\n/g, "\n\n")
    .trim()
}
