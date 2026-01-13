import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

// 卡片分类
export const CARD_CATEGORIES = ["character", "term", "item", "skill", "location", "faction", "event"] as const
export type CardCategory = typeof CARD_CATEGORIES[number]

// 分类显示名称
export const CARD_CATEGORY_LABELS: Record<CardCategory, string> = {
  character: "角色",
  term: "词条",
  item: "物品",
  skill: "技能",
  location: "地点",
  faction: "势力",
  event: "事件",
}

// 角色卡扩展属性
export interface CharacterAttributes {
  gender?: string
  age?: string
  personality?: string
  background?: string
  abilities?: string
  relations?: string
}

// 卡片类型
export interface Card {
  id: string
  novelId: string
  name: string
  category: CardCategory
  description: string | null
  avatar: string | null
  tags: string | null
  triggers: string[]  // 触发词数组，用于 Lorebook 自动关联
  sortOrder: number
  isPinned: boolean
  attributes: CharacterAttributes | Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

// 创建卡片输入
export interface CreateCardInput {
  novelId: string
  name: string
  category: CardCategory
  description?: string | null
  avatar?: string | null
  tags?: string | null
  triggers?: string[]
  isPinned?: boolean
  attributes?: Record<string, unknown> | null
}

// 更新卡片输入
export interface UpdateCardInput {
  novelId: string
  cardId: string
  name?: string
  category?: CardCategory
  description?: string | null
  avatar?: string | null
  tags?: string | null
  triggers?: string[]
  isPinned?: boolean
  sortOrder?: number
  attributes?: Record<string, unknown> | null
}

// 获取卡片列表
async function fetchCards(novelId: string, category?: CardCategory): Promise<Card[]> {
  const url = category
    ? `/api/novels/${novelId}/cards?category=${category}`
    : `/api/novels/${novelId}/cards`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error("获取卡片列表失败")
  }
  return response.json()
}

// 获取卡片详情
async function fetchCard(novelId: string, cardId: string): Promise<Card> {
  const response = await fetch(`/api/novels/${novelId}/cards/${cardId}`)
  if (!response.ok) {
    throw new Error("获取卡片详情失败")
  }
  return response.json()
}

// 创建卡片
async function createCard({ novelId, ...data }: CreateCardInput): Promise<Card> {
  const response = await fetch(`/api/novels/${novelId}/cards`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "创建卡片失败")
  }
  return response.json()
}

// 更新卡片
async function updateCard({ novelId, cardId, ...data }: UpdateCardInput): Promise<Card> {
  const response = await fetch(`/api/novels/${novelId}/cards/${cardId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "更新卡片失败")
  }
  return response.json()
}

// 删除卡片
async function deleteCard(novelId: string, cardId: string): Promise<void> {
  const response = await fetch(`/api/novels/${novelId}/cards/${cardId}`, {
    method: "DELETE",
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "删除卡片失败")
  }
}

// Hook: 获取卡片列表
export function useCards(novelId: string, category?: CardCategory) {
  return useQuery({
    queryKey: ["cards", novelId, category],
    queryFn: () => fetchCards(novelId, category),
    enabled: !!novelId,
  })
}

// Hook: 获取卡片详情
export function useCard(novelId: string, cardId: string) {
  return useQuery({
    queryKey: ["card", novelId, cardId],
    queryFn: () => fetchCard(novelId, cardId),
    enabled: !!novelId && !!cardId,
  })
}

// Hook: 创建卡片
export function useCreateCard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createCard,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["cards", variables.novelId] })
    },
  })
}

// Hook: 更新卡片
export function useUpdateCard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateCard,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["cards", variables.novelId] })
      queryClient.invalidateQueries({ queryKey: ["card", variables.novelId, variables.cardId] })
    },
  })
}

// Hook: 删除卡片
export function useDeleteCard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ novelId, cardId }: { novelId: string; cardId: string }) =>
      deleteCard(novelId, cardId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["cards", variables.novelId] })
    },
  })
}
