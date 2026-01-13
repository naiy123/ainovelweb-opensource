import { auth } from "@/lib/auth"
import { isDevMode, getDevUserId } from "@/lib/dev-mode"

export async function getCurrentUserId(): Promise<string | null> {
  // 使用统一的开发模式检查（多重安全）
  if (isDevMode()) {
    return getDevUserId()
  }

  const session = await auth()
  return session?.user?.id ?? null
}

export async function requireUserId(): Promise<string> {
  const userId = await getCurrentUserId()
  if (!userId) {
    throw new Error("Unauthorized")
  }
  return userId
}

