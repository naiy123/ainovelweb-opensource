export type NovelStatus = "active" | "archived"
export type ChannelType = "male" | "female"

export interface WorkCardProps {
  id: string
  title: string
  description?: string | null
  status: NovelStatus
  tags?: string[]
  wordCount: number
  updatedAt: string
  coverUrl?: string
}

export interface CreateWorkCardProps {
  onClick?: () => void
}

export function formatWordCount(count: number): string {
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)}万字`
  }
  return `${count.toLocaleString()} 字`
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toISOString().split("T")[0]
}
