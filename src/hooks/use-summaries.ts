import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

// 章节摘要类型
export interface ChapterSummary {
  id: string
  summary: string
  keyPoints: string[]
  tokenCount: number | null
  isManual: boolean
  updatedAt: string
}

// 带摘要的章节信息
export interface ChapterWithSummary {
  id: string
  number: number
  title: string
  wordCount: number
  summary: ChapterSummary | null
}

// 摘要列表响应
export interface SummariesResponse {
  novelSummary: string | null
  chapters: ChapterWithSummary[]
}

// 获取摘要列表
async function fetchSummaries(novelId: string): Promise<SummariesResponse> {
  const response = await fetch(`/api/novels/${novelId}/summaries`)
  if (!response.ok) {
    throw new Error("获取摘要列表失败")
  }
  return response.json()
}

// 更新全书概要
async function updateNovelSummary(novelId: string, summary: string): Promise<void> {
  const response = await fetch(`/api/novels/${novelId}/summaries`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ summary }),
  })
  if (!response.ok) {
    throw new Error("更新全书概要失败")
  }
}

// 更新章节摘要
async function updateChapterSummary(
  novelId: string,
  chapterId: string,
  data: { summary: string; keyPoints?: string[]; isManual?: boolean }
): Promise<ChapterSummary> {
  const response = await fetch(`/api/novels/${novelId}/summaries/${chapterId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error("更新章节摘要失败")
  }
  return response.json()
}

// 生成章节摘要
async function generateChapterSummary(
  novelId: string,
  chapterId: string
): Promise<ChapterSummary> {
  const response = await fetch(`/api/novels/${novelId}/summaries/${chapterId}/generate`, {
    method: "POST",
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "生成摘要失败")
  }
  return response.json()
}

// 删除章节摘要
async function deleteChapterSummary(novelId: string, chapterId: string): Promise<void> {
  const response = await fetch(`/api/novels/${novelId}/summaries/${chapterId}`, {
    method: "DELETE",
  })
  if (!response.ok) {
    throw new Error("删除摘要失败")
  }
}

// Hook: 获取摘要列表
export function useSummaries(novelId: string) {
  return useQuery({
    queryKey: ["summaries", novelId],
    queryFn: () => fetchSummaries(novelId),
    enabled: !!novelId,
  })
}

// Hook: 更新全书概要
export function useUpdateNovelSummary() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ novelId, summary }: { novelId: string; summary: string }) =>
      updateNovelSummary(novelId, summary),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["summaries", variables.novelId] })
    },
  })
}

// Hook: 更新章节摘要
export function useUpdateChapterSummary() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      novelId,
      chapterId,
      data,
    }: {
      novelId: string
      chapterId: string
      data: { summary: string; keyPoints?: string[]; isManual?: boolean }
    }) => updateChapterSummary(novelId, chapterId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["summaries", variables.novelId] })
    },
  })
}

// Hook: 生成章节摘要
export function useGenerateChapterSummary() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ novelId, chapterId }: { novelId: string; chapterId: string }) =>
      generateChapterSummary(novelId, chapterId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["summaries", variables.novelId] })
    },
  })
}

// Hook: 删除章节摘要
export function useDeleteChapterSummary() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ novelId, chapterId }: { novelId: string; chapterId: string }) =>
      deleteChapterSummary(novelId, chapterId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["summaries", variables.novelId] })
    },
  })
}
