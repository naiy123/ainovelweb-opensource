"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Pencil,
  Check,
  X,
  Hash,
  Copy,
  Key,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useUserStore } from "@/stores/user-store"

interface UserProfile {
  id: string
  shortId: number
  nickname: string | null
  createdAt: string
  _count: {
    novels: number
  }
}

interface Settings {
  doubao_api_key?: string
  seedream_api_key?: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [nickname, setNickname] = useState("")
  const [saving, setSaving] = useState(false)
  const { updateNickname: updateGlobalNickname } = useUserStore()

  // Settings state
  const [settings, setSettings] = useState<Settings | null>(null)
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)

  // API Key inputs
  const [apiKeys, setApiKeys] = useState({
    doubao_api_key: "",
    seedream_api_key: "",
  })

  useEffect(() => {
    fetchProfile()
    fetchSettings()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/user/profile")
      if (res.ok) {
        const data = await res.json()
        setProfile(data)
        setNickname(data.nickname || "")
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error)
      toast.error("获取用户信息失败")
    } finally {
      setLoading(false)
    }
  }

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings")
      if (res.ok) {
        const data = await res.json()
        setSettings(data)
        // 填充已保存的值到输入框
        setApiKeys({
          doubao_api_key: data.doubao_api_key || "",
          seedream_api_key: data.seedream_api_key || "",
        })
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error)
    } finally {
      setSettingsLoading(false)
    }
  }

  const handleSaveNickname = async () => {
    if (!nickname.trim()) {
      toast.error("昵称不能为空")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: nickname.trim() }),
      })

      if (res.ok) {
        const data = await res.json()
        setProfile((prev) => (prev ? { ...prev, nickname: data.nickname } : null))
        updateGlobalNickname(data.nickname)
        setEditing(false)
        toast.success("昵称已更新")
      } else {
        toast.error("更新失败")
      }
    } catch (error) {
      console.error("Failed to update nickname:", error)
      toast.error("更新失败")
    } finally {
      setSaving(false)
    }
  }

  const handleSaveApiKey = async (key: string, value: string) => {
    if (!value.trim()) {
      toast.error("请输入 API Key")
      return
    }

    setSavingSettings(true)
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value.trim() }),
      })

      if (res.ok) {
        toast.success("API Key 已保存")
        fetchSettings()
        setApiKeys((prev) => ({ ...prev, [key]: "" }))
      } else {
        toast.error("保存失败")
      }
    } catch (error) {
      console.error("Failed to save API key:", error)
      toast.error("保存失败")
    } finally {
      setSavingSettings(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-[#2b7fff] border-t-transparent" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500">无法加载用户信息</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="shrink-0"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <h1 className="text-2xl font-semibold text-gray-900">设置</h1>
      </div>

      <div className="space-y-6">
        {/* API Keys */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-2 mb-4">
            <Key className="size-5 text-[#2b7fff]" />
            <h2 className="text-lg font-medium">API 密钥配置</h2>
          </div>

          <p className="text-sm text-gray-500 mb-4">
            在 <a href="https://console.volcengine.com/ark" target="_blank" rel="noopener noreferrer" className="text-[#2b7fff] hover:underline">火山引擎方舟平台</a> 获取 API Key
          </p>

          {settingsLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-10 bg-gray-100 rounded" />
              <div className="h-10 bg-gray-100 rounded" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Doubao API Key */}
              <div className="space-y-2">
                <Label>
                  豆包 API Key
                  <span className="text-xs text-gray-400 ml-2">（文字生成）</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={apiKeys.doubao_api_key}
                    onChange={(e) =>
                      setApiKeys((prev) => ({ ...prev, doubao_api_key: e.target.value }))
                    }
                    placeholder="输入 API Key"
                    className="flex-1 font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    onClick={() => handleSaveApiKey("doubao_api_key", apiKeys.doubao_api_key)}
                    disabled={savingSettings || !apiKeys.doubao_api_key}
                  >
                    保存
                  </Button>
                </div>
              </div>

              {/* Seedream API Key */}
              <div className="space-y-2">
                <Label>
                  Seedream API Key
                  <span className="text-xs text-gray-400 ml-2">（图片生成）</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={apiKeys.seedream_api_key}
                    onChange={(e) =>
                      setApiKeys((prev) => ({ ...prev, seedream_api_key: e.target.value }))
                    }
                    placeholder="输入 API Key"
                    className="flex-1 font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    onClick={() => handleSaveApiKey("seedream_api_key", apiKeys.seedream_api_key)}
                    disabled={savingSettings || !apiKeys.seedream_api_key}
                  >
                    保存
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Profile Card */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-medium mb-4">个人资料</h2>

          {/* Nickname */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <p className="text-sm text-gray-500 mb-1">昵称</p>
              {editing ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="h-9 max-w-[200px]"
                    placeholder="输入昵称"
                    maxLength={20}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleSaveNickname}
                    disabled={saving}
                    className="size-8 text-green-600 hover:text-green-700"
                  >
                    <Check className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEditing(false)
                      setNickname(profile.nickname || "")
                    }}
                    className="size-8 text-gray-500"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-base font-medium text-gray-900">
                    {profile.nickname || "未设置昵称"}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setEditing(true)}
                    className="size-7 text-gray-400 hover:text-gray-600"
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Info List */}
          <div className="space-y-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-3">
              <Hash className="size-4 text-gray-400" />
              <span className="text-sm text-gray-500">用户 ID:</span>
              <span className="text-sm font-mono text-gray-700">{profile.id.slice(0, 12)}...</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-gray-500"
                onClick={() => {
                  navigator.clipboard.writeText(profile.id)
                  toast.success("已复制")
                }}
              >
                <Copy className="size-3 mr-1" />
                复制
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <BookOpen className="size-4 text-gray-400" />
              <span className="text-sm text-gray-500">作品数量:</span>
              <span className="text-sm text-gray-700">{profile._count.novels} 部</span>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="size-4 text-gray-400" />
              <span className="text-sm text-gray-500">创建时间:</span>
              <span className="text-sm text-gray-700">{formatDate(profile.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Version Info */}
        <div className="text-center text-sm text-gray-400">
          本地版本 · 数据存储在本地
        </div>
      </div>
    </div>
  )
}
