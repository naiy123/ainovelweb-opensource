"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import { Toaster } from "@/components/ui/sonner"
import { useUserStore } from "@/stores/user-store"

// 用户信息初始化组件 - 本地版本自动获取
function UserInitializer({ children }: { children: React.ReactNode }) {
  const { fetchProfile, profile } = useUserStore()

  useEffect(() => {
    // 本地版本：始终尝试获取用户信息
    if (!profile) {
      fetchProfile()
    }
  }, [profile, fetchProfile])

  return <>{children}</>
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <UserInitializer>{children}</UserInitializer>
      <Toaster />
    </QueryClientProvider>
  )
}
