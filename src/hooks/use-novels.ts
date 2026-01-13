import { useState, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { CreateNovelInput } from "@/lib/validations/novel"
import type { TokenUsage } from "@/lib/ai/types"

export interface Novel {
  id: string
  userId: string
  title: string
  description: string | null
  coverUrl: string | null
  status: string
  totalWords: number
  createdAt: string
  updatedAt: string
  _count?: {
    chapters: number
  }
}

export interface Chapter {
  id: string
  novelId: string
  number: number
  title: string
  content: string
  wordCount: number
  status: "published" | "draft"
  aiGenerated: boolean
  aiModel: string | null
  createdAt: string
  updatedAt: string
}

export interface NovelWithChapters extends Novel {
  chapters: Chapter[]
}

// 获取小说列表
async function fetchNovels(): Promise<Novel[]> {
  const response = await fetch("/api/novels")
  if (!response.ok) {
    throw new Error("获取小说列表失败")
  }
  return response.json()
}

// 获取小说详情
async function fetchNovel(novelId: string): Promise<NovelWithChapters> {
  const response = await fetch(`/api/novels/${novelId}`)
  if (!response.ok) {
    throw new Error("获取小说详情失败")
  }
  return response.json()
}

// 创建小说
async function createNovel(data: CreateNovelInput): Promise<Novel> {
  const response = await fetch("/api/novels", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "创建小说失败")
  }
  return response.json()
}

// Hook: 获取小说列表
export function useNovels() {
  return useQuery({
    queryKey: ["novels"],
    queryFn: fetchNovels,
  })
}

// Hook: 获取小说详情
export function useNovel(novelId: string) {
  return useQuery({
    queryKey: ["novel", novelId],
    queryFn: () => fetchNovel(novelId),
    enabled: !!novelId,
  })
}

// Hook: 创建小说
export function useCreateNovel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createNovel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["novels"] })
    },
  })
}

// 更新小说
interface UpdateNovelInput {
  novelId: string
  title?: string
  description?: string
  status?: string
  tags?: string
}

async function updateNovel({ novelId, ...data }: UpdateNovelInput): Promise<Novel> {
  const response = await fetch(`/api/novels/${novelId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "更新小说失败")
  }
  return response.json()
}

// 删除小说
async function deleteNovel(novelId: string): Promise<void> {
  const response = await fetch(`/api/novels/${novelId}`, {
    method: "DELETE",
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "删除小说失败")
  }
}

// Hook: 更新小说
export function useUpdateNovel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateNovel,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["novels"] })
      queryClient.invalidateQueries({ queryKey: ["novel", variables.novelId] })
    },
  })
}

// Hook: 删除小说
export function useDeleteNovel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteNovel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["novels"] })
    },
  })
}

// ============ Chapter Hooks ============

interface CreateChapterInput {
  novelId: string
  title: string
  content?: string
  status?: "published" | "draft"
}

interface UpdateChapterInput {
  novelId: string
  chapterId: string
  title?: string
  content?: string
  status?: "published" | "draft"
}

interface GenerateContentInput {
  novelId: string
  aiModel?: string
  storyBackground?: string
  chapterPlot: string
  writingStyle?: string
  wordCount?: number
  // 角色和词条信息
  characters?: { name: string; gender?: string; age?: string; personality?: string; background?: string; abilities?: string }[]
  terms?: { name: string; description?: string }[]
  characterRelations?: string
  // 关联章节（提供上下文）
  linkedChapters?: { title: string; content: string }[]
}

interface StreamCallbacks {
  onThinking?: (text: string) => void
  onContent?: (text: string) => void
  onUsage?: (usage: TokenUsage) => void
  onCredit?: (data: { credits: number; balance: number }) => void
  onDone?: () => void
  onError?: (error: string) => void
}

// 创建章节
async function createChapter({ novelId, ...data }: CreateChapterInput): Promise<Chapter> {
  const response = await fetch(`/api/novels/${novelId}/chapters`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "创建章节失败")
  }
  return response.json()
}

// 更新章节
async function updateChapter({ novelId, chapterId, ...data }: UpdateChapterInput): Promise<Chapter> {
  const response = await fetch(`/api/novels/${novelId}/chapters/${chapterId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "更新章节失败")
  }
  return response.json()
}

// AI 流式生成内容
async function generateContentStream(
  { novelId, ...data }: GenerateContentInput,
  callbacks: StreamCallbacks
): Promise<void> {
  const response = await fetch(`/api/novels/${novelId}/chapters/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    callbacks.onError?.(error.error || "生成内容失败")
    return
  }

  const reader = response.body?.getReader()
  if (!reader) {
    callbacks.onError?.("无法读取响应流")
    return
  }

  const decoder = new TextDecoder()
  let buffer = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split("\n\n")
    buffer = lines.pop() || ""

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const data = JSON.parse(line.slice(6))
          if (data.type === "thinking") {
            callbacks.onThinking?.(data.text)
          } else if (data.type === "content") {
            callbacks.onContent?.(data.text)
          } else if (data.type === "usage") {
            callbacks.onUsage?.(data.usage)
          } else if (data.type === "credit") {
            callbacks.onCredit?.({ credits: data.credits, balance: data.balance })
          } else if (data.type === "done") {
            callbacks.onDone?.()
          } else if (data.type === "error") {
            callbacks.onError?.(data.message)
          }
        } catch {
          // 忽略解析错误
        }
      }
    }
  }
}

// Hook: 创建章节
export function useCreateChapter() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createChapter,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["novel", variables.novelId] })
    },
  })
}

// Hook: 更新章节
export function useUpdateChapter() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateChapter,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["novel", variables.novelId] })
    },
  })
}

// Hook: AI 流式生成内容
export function useGenerateContentStream() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [thinking, setThinking] = useState("")
  const [content, setContent] = useState("")
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null)

  const generate = useCallback(
    async (input: GenerateContentInput, callbacks?: StreamCallbacks) => {
      setIsGenerating(true)
      setThinking("")
      setContent("")
      setTokenUsage(null)

      await generateContentStream(input, {
        onThinking: (text) => {
          setThinking((prev) => prev + text)
          callbacks?.onThinking?.(text)
        },
        onContent: (text) => {
          setContent((prev) => prev + text)
          callbacks?.onContent?.(text)
        },
        onUsage: (usage) => {
          setTokenUsage(usage)
          callbacks?.onUsage?.(usage)
        },
        onCredit: (data) => {
          callbacks?.onCredit?.(data)
        },
        onDone: () => {
          setIsGenerating(false)
          callbacks?.onDone?.()
        },
        onError: (error) => {
          setIsGenerating(false)
          callbacks?.onError?.(error)
        },
      })
    },
    []
  )

  const reset = useCallback(() => {
    setThinking("")
    setContent("")
    setTokenUsage(null)
    setIsGenerating(false)
  }, [])

  return {
    generate,
    reset,
    isGenerating,
    thinking,
    content,
    tokenUsage,
  }
}
