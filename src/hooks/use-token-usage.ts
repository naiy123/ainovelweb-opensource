import { useQuery } from "@tanstack/react-query"

export interface TokenUsageStats {
  inputTokens: number
  outputTokens: number
  thoughtsTokens: number
  totalTokens: number
  count: number
  estimatedCost: number
}

export interface TokenUsageResponse {
  total: TokenUsageStats
  today: TokenUsageStats
  month: TokenUsageStats
}

async function fetchTokenUsage(): Promise<TokenUsageResponse> {
  const response = await fetch("/api/user/token-usage")
  if (!response.ok) {
    throw new Error("获取 Token 使用统计失败")
  }
  return response.json()
}

export function useTokenUsage() {
  return useQuery({
    queryKey: ["token-usage"],
    queryFn: fetchTokenUsage,
    staleTime: 30000, // 30秒内不重新获取
    refetchOnWindowFocus: false,
  })
}
