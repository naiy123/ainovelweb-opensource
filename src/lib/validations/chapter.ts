import { z } from "zod"

// 角色卡信息 schema
const characterInfoSchema = z.object({
  name: z.string(),
  gender: z.string().optional(),
  age: z.string().optional(),
  personality: z.string().optional(),
  background: z.string().optional(),
  abilities: z.string().optional(),
})

// 词条卡信息 schema
const termInfoSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
})

// 关联章节信息 schema
const linkedChapterSchema = z.object({
  title: z.string(),
  content: z.string(),
})

export const generateChapterSchema = z.object({
  aiModel: z.string().default("balanced"), // AI 模型 ID
  storyBackground: z.string().max(500, "故事背景不能超过500字").optional(),
  chapterPlot: z.string().max(3000, "章节剧情不能超过3000字"),
  writingStyle: z.string().max(200, "写作风格不能超过200字").optional(),
  wordCount: z.number().min(500, "至少500字").max(5000, "最多5000字").default(2000),
  // 新增：角色和词条信息
  characters: z.array(characterInfoSchema).optional(),
  terms: z.array(termInfoSchema).optional(),
  characterRelations: z.string().optional(),
  // 关联章节（提供上下文）
  linkedChapters: z.array(linkedChapterSchema).optional(),
})

export const updateChapterSchema = z.object({
  title: z.string().min(1, "章节标题不能为空").max(100).optional(),
  content: z.string().optional(),
  status: z.enum(["published", "draft"]).optional(),
})

export type GenerateChapterInput = z.infer<typeof generateChapterSchema>
export type UpdateChapterInput = z.infer<typeof updateChapterSchema>
