import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { GenerateChapterInput, UpdateChapterInput } from "@/lib/validations/chapter"
import type { Chapter } from "./use-novels"

// 获取章节详情
async function fetchChapter(novelId: string, chapterId: string): Promise<Chapter> {
  const response = await fetch(`/api/novels/${novelId}/chapters/${chapterId}`)
  if (!response.ok) {
    throw new Error("获取章节失败")
  }
  return response.json()
}

// AI 生成章节
async function generateChapter(
  novelId: string,
  data: GenerateChapterInput
): Promise<Chapter> {
  const response = await fetch(`/api/novels/${novelId}/chapters/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "生成失败")
  }
  return response.json()
}

// 更新章节
async function updateChapter(
  novelId: string,
  chapterId: string,
  data: UpdateChapterInput
): Promise<Chapter> {
  const response = await fetch(`/api/novels/${novelId}/chapters/${chapterId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "更新失败")
  }
  return response.json()
}

// Hook: 获取章节详情
export function useChapter(novelId: string, chapterId: string) {
  return useQuery({
    queryKey: ["chapter", novelId, chapterId],
    queryFn: () => fetchChapter(novelId, chapterId),
    enabled: !!novelId && !!chapterId,
  })
}

// Hook: AI 生成章节
export function useGenerateChapter(novelId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: GenerateChapterInput) => generateChapter(novelId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["novel", novelId] })
    },
  })
}

// Hook: 更新章节
export function useUpdateChapter(novelId: string, chapterId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateChapterInput) => updateChapter(novelId, chapterId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["novel", novelId] })
      queryClient.invalidateQueries({ queryKey: ["chapter", novelId, chapterId] })
    },
  })
}
