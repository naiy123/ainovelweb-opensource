import { create } from "zustand"

interface UserProfile {
  nickname: string | null
  phone: string | null
  creditBalance: number
  subscription: {
    plan: string
    expiresAt: string | null
  } | null
}

interface UserStore {
  // 状态
  profile: UserProfile | null
  loading: boolean

  // 记录弹窗状态
  showRecords: boolean
  openRecords: () => void
  closeRecords: () => void

  // 操作
  fetchProfile: () => Promise<void>
  refreshBalance: () => Promise<void>
  updateNickname: (nickname: string) => void
  reset: () => void
}

const initialProfile: UserProfile = {
  nickname: null,
  phone: null,
  creditBalance: 0,
  subscription: null,
}

export const useUserStore = create<UserStore>((set, get) => ({
  profile: null,
  loading: false,
  showRecords: false,

  openRecords: () => set({ showRecords: true }),
  closeRecords: () => set({ showRecords: false }),

  fetchProfile: async () => {
    // 防止重复请求
    if (get().loading) return

    set({ loading: true })
    try {
      const res = await fetch("/api/user/profile")
      if (res.ok) {
        const data = await res.json()
        set({
          profile: {
            nickname: data.nickname,
            phone: data.phone,
            creditBalance: data.creditBalance,
            subscription: data.subscription,
          },
        })
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error)
    } finally {
      set({ loading: false })
    }
  },

  refreshBalance: async () => {
    try {
      const res = await fetch("/api/user/profile")
      if (res.ok) {
        const data = await res.json()
        set((state) => ({
          profile: state.profile
            ? { ...state.profile, creditBalance: data.creditBalance }
            : null,
        }))
      }
    } catch (error) {
      console.error("Failed to refresh balance:", error)
    }
  },

  updateNickname: (nickname: string) => {
    set((state) => ({
      profile: state.profile ? { ...state.profile, nickname } : null,
    }))
  },

  reset: () => {
    set({ profile: null, loading: false })
  },
}))

// 派生数据的 hooks
export const useUserDisplayName = () => {
  const profile = useUserStore((state) => state.profile)
  if (!profile) return "用户"
  return (
    profile.nickname ||
    (profile.phone ? `用户${profile.phone.slice(-4)}` : "用户")
  )
}

export const useUserPlanName = () => {
  const profile = useUserStore((state) => state.profile)
  const planNames: Record<string, string> = {
    free: "免费版",
    gold: "黄金会员",
    platinum: "铂金会员",
    black: "黑金会员",
  }
  return planNames[profile?.subscription?.plan || "free"] || "免费版"
}
