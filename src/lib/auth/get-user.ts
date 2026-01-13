import { db } from "@/lib/db"

// 默认用户ID - 单用户本地模式
const DEFAULT_USER_ID = "local-user-001"

/**
 * 获取当前用户 (简化版 - 无认证模式)
 * 自动创建或返回默认用户
 */
export async function getCurrentUser() {
  // 尝试获取默认用户
  let user = await db.user.findUnique({
    where: { id: DEFAULT_USER_ID },
  })

  // 如果不存在则创建
  if (!user) {
    user = await db.user.create({
      data: {
        id: DEFAULT_USER_ID,
        nickname: "本地用户",
      },
    })
  }

  return user
}

/**
 * 获取用户ID (简化版)
 */
export async function getCurrentUserId(): Promise<string> {
  const user = await getCurrentUser()
  return user.id
}

/**
 * 要求用户ID - 用于 API 路由 (简化版 - 始终返回默认用户ID)
 */
export async function requireUserId(): Promise<string> {
  return getCurrentUserId()
}

/**
 * 检查用户是否已登录 (简化版 - 始终返回 true)
 */
export function isAuthenticated(): boolean {
  return true
}
