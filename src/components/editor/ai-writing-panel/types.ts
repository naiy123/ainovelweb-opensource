import type { Card, CharacterAttributes } from "@/hooks/use-cards"
import type { OutlineNode } from "@/hooks/use-outline"

// 章节类型
export interface ChapterInfo {
  id: string
  title: string
  wordCount: number
  content?: string
}

// 关联章节信息
export interface LinkedChapterInfo {
  title: string
  content: string
}

// 角色卡信息
export interface CharacterCardInfo {
  name: string
  gender?: string
  age?: string
  personality?: string
  background?: string
  abilities?: string
}

// 词条卡信息
export interface TermCardInfo {
  name: string
  description?: string
}

// AI 生成参数
export interface AIGenerateParams {
  aiModel: string
  storyBackground: string
  chapterPlot: string
  writingStyle: string
  writingRequirements: string[]
  characters?: CharacterCardInfo[]
  terms?: TermCardInfo[]
  characterRelations?: string
  linkedChapters?: LinkedChapterInfo[]
}

// 组件 Props
export interface AIWritingPanelProps {
  novelId?: string                            // 小说 ID（用于获取摘要数据）
  currentChapterId?: string                   // 当前编辑的章节 ID
  onGenerate: (params: AIGenerateParams) => void
  isGenerating?: boolean
  onClose?: () => void
  thinking?: string
  cards?: Card[]
  chapters?: ChapterInfo[]
  // 章纲关联
  linkedOutlineNode?: OutlineNode | null      // 已关联的章纲
  availableOutlines?: OutlineNode[]           // 可选的章纲列表（按卷分组）
  outlineNodes?: OutlineNode[]                // 完整大纲树（用于显示层级）
  onLinkOutline?: (nodeId: string) => void    // 关联章纲
  onUnlinkOutline?: () => void                // 解除关联
}

// 提取角色信息的辅助函数
export function extractCharacterInfo(character: Card): CharacterCardInfo {
  const attrs = character.attributes as CharacterAttributes | null
  return {
    name: character.name,
    gender: attrs?.gender,
    age: attrs?.age,
    personality: attrs?.personality,
    background: attrs?.background,
    abilities: attrs?.abilities,
  }
}

// 提取词条信息的辅助函数
export function extractTermInfo(term: Card): TermCardInfo {
  return {
    name: term.name,
    description: term.description || undefined,
  }
}
