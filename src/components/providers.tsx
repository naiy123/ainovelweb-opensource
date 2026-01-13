"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { SessionProvider, useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { Toaster } from "@/components/ui/sonner"
import { useUserStore } from "@/stores/user-store"
import { ContactAdminModal, useContactAdminStore } from "@/components/contact-admin-modal"

// 用户信息初始化组件 - 登录后或开发模式下获取
function UserInitializer({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  const { fetchProfile, profile, reset } = useUserStore()

  useEffect(() => {
    // 如果已认证，获取用户信息
    if (status === "authenticated" && !profile) {
      fetchProfile()
    }
    // 开发模式：session 可能为空但 API 仍可访问
    // 尝试获取 profile，如果成功说明开发模式生效
    if (status === "unauthenticated" && !profile) {
      // 尝试获取，如果失败会静默处理
      fetchProfile()
    }
  }, [status, profile, fetchProfile])

  // 登出时重置（仅在生产模式下）
  useEffect(() => {
    if (status === "unauthenticated" && profile) {
      // 检查是否真的登出了（profile 获取失败）
      fetch("/api/user/profile").then(res => {
        if (!res.ok) {
          reset()
        }
      }).catch(() => reset())
    }
  }, [status, profile, reset])

  return <>{children}</>
}

// 全局联系管理员弹窗
function GlobalContactAdminModal() {
  const { isOpen, message, closeContactAdmin } = useContactAdminStore()
  return <ContactAdminModal isOpen={isOpen} onClose={closeContactAdmin} message={message} />
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
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <UserInitializer>{children}</UserInitializer>
        <Toaster />
        <GlobalContactAdminModal />
      </QueryClientProvider>
    </SessionProvider>
  )
}
