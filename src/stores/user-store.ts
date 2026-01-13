import { create } from "zustand"

interface UserProfile {
  nickname: string | null
}

interface UserStore {
  profile: UserProfile | null
  loading: boolean
  fetchProfile: () => Promise<void>
  updateNickname: (nickname: string) => void
  refreshBalance: () => Promise<void>
  reset: () => void
}

export const useUserStore = create<UserStore>((set, get) => ({
  profile: null,
  loading: false,

  fetchProfile: async () => {
    if (get().loading) return

    set({ loading: true })
    try {
      const res = await fetch("/api/user/profile")
      if (res.ok) {
        const data = await res.json()
        set({
          profile: {
            nickname: data.nickname,
          },
        })
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error)
    } finally {
      set({ loading: false })
    }
  },

  updateNickname: (nickname: string) => {
    set((state) => ({
      profile: state.profile ? { ...state.profile, nickname } : null,
    }))
  },

  // 简化版 - 无需刷新余额
  refreshBalance: async () => {
    // 本地版本不需要余额管理
  },

  reset: () => {
    set({ profile: null, loading: false })
  },
}))

// 派生数据的 hooks
export const useUserDisplayName = () => {
  const profile = useUserStore((state) => state.profile)
  if (!profile) return "本地用户"
  return profile.nickname || "本地用户"
}

// 保留这个 hook 以保持 API 兼容性，但始终返回 "本地版"
export const useUserPlanName = () => {
  return "本地版"
}
