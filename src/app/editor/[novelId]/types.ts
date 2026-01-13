import type { Chapter } from "@/hooks/use-novels"
import type { CardCategory } from "@/hooks/use-cards"

export interface ChapterGroup {
  id: string
  title: string
  isExpanded: boolean
  chapters: { id: string; title: string; wordCount: number; status: string }[]
}

export type EditorMode = "chapter" | "card" | "outline" | "summary"
export type SaveStatus = "saved" | "unsaved" | "saving"
export type ChapterStatus = "published" | "draft"

export interface GeneratedCardData {
  name: string
  description?: string
  tags?: string
  attributes?: Record<string, unknown>
}

export interface GeneratedOutlineData {
  title: string
  content: string
}

export interface GenerateParams {
  aiModel: string
  storyBackground: string
  chapterPlot: string
  writingStyle: string
  writingRequirements: string[]
  characters?: { name: string; gender?: string; age?: string; personality?: string; background?: string; abilities?: string }[]
  terms?: { name: string; description?: string }[]
  characterRelations?: string
  linkedChapters?: { title: string; content: string }[]
}

export function getChapterGroups(chapters: Chapter[]): ChapterGroup[] {
  const published = chapters.filter((c) => c.status !== "draft")
  const drafts = chapters.filter((c) => c.status === "draft")

  return [
    {
      id: "main",
      title: "正文",
      isExpanded: true,
      chapters: published.map((c) => ({
        id: c.id,
        title: c.title,
        wordCount: c.wordCount,
        status: c.status || "published",
      })),
    },
    {
      id: "drafts",
      title: "草稿箱",
      isExpanded: drafts.length > 0,
      chapters: drafts.map((c) => ({
        id: c.id,
        title: c.title,
        wordCount: c.wordCount,
        status: c.status || "draft",
      })),
    },
    {
      id: "settings",
      title: "设定",
      isExpanded: false,
      chapters: [],
    },
  ]
}
