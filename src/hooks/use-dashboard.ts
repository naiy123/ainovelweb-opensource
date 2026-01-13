import { useQuery, useQueryClient } from "@tanstack/react-query"

// 灵感类型
export interface Inspiration {
  type: string
  content: string
}

// 动态类型
export interface UserActivity {
  id: string
  userId: string
  type: string
  title: string
  description: string
  metadata: Record<string, unknown> | null
  isRead: boolean
  createdAt: string
}

// 统计类型
export interface WeeklyStats {
  totalWords: string
  totalWordsRaw: number
  writingDays: number
}

// 获取随机灵感
async function fetchInspirations(): Promise<Inspiration[]> {
  const response = await fetch("/api/dashboard/inspirations")
  if (!response.ok) {
    throw new Error("获取灵感失败")
  }
  return response.json()
}

// 获取用户动态
async function fetchActivities(): Promise<UserActivity[]> {
  const response = await fetch("/api/dashboard/activities")
  if (!response.ok) {
    throw new Error("获取动态失败")
  }
  return response.json()
}

// 获取统计数据
async function fetchStats(): Promise<WeeklyStats> {
  const response = await fetch("/api/dashboard/stats")
  if (!response.ok) {
    throw new Error("获取统计失败")
  }
  return response.json()
}

// Hook: 获取每日灵感
export function useInspirations() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ["inspirations"],
    queryFn: fetchInspirations,
    staleTime: 1000 * 60 * 5, // 5分钟内不刷新
  })

  // 刷新灵感
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["inspirations"] })
  }

  return { ...query, refresh }
}

// Hook: 获取用户动态
export function useActivities() {
  return useQuery({
    queryKey: ["activities"],
    queryFn: fetchActivities,
    refetchInterval: 1000 * 60, // 每分钟自动刷新
  })
}

// Hook: 获取本周统计
export function useWeeklyStats() {
  return useQuery({
    queryKey: ["weeklyStats"],
    queryFn: fetchStats,
    staleTime: 1000 * 60 * 5, // 5分钟内不刷新
  })
}
