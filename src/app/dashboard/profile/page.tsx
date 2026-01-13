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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [nickname, setNickname] = useState("")
  const [saving, setSaving] = useState(false)
  const { updateNickname: updateGlobalNickname } = useUserStore()

  useEffect(() => {
    fetchProfile()
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
        <h1 className="text-2xl font-semibold text-gray-900">个人资料</h1>
      </div>

      {/* Profile Card */}
      <div className="space-y-6">
        {/* Nickname */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
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
                  <span className="text-xl font-medium text-gray-900">
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
        </div>

        {/* User ID */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Hash className="size-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">用户 ID</p>
                <p className="text-sm font-mono text-gray-900">
                  {profile.id}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-gray-700"
              onClick={() => {
                navigator.clipboard.writeText(profile.id)
                toast.success("已复制用户 ID")
              }}
            >
              <Copy className="size-4 mr-1" />
              复制
            </Button>
          </div>
        </div>

        {/* Info List */}
        <div className="rounded-xl border border-gray-200 bg-white">
          {/* Novels Count */}
          <div className="flex items-center gap-4 border-b border-gray-100 px-6 py-4">
            <BookOpen className="size-5 text-gray-400" />
            <div className="flex-1">
              <p className="text-sm text-gray-500">作品数量</p>
              <p className="text-base text-gray-900">{profile._count.novels} 部</p>
            </div>
          </div>

          {/* Join Date */}
          <div className="flex items-center gap-4 px-6 py-4">
            <Calendar className="size-5 text-gray-400" />
            <div className="flex-1">
              <p className="text-sm text-gray-500">创建时间</p>
              <p className="text-base text-gray-900">{formatDate(profile.createdAt)}</p>
            </div>
          </div>
        </div>

        {/* Version Info */}
        <div className="text-center text-sm text-gray-400">
          本地版本 · 无需登录
        </div>
      </div>
    </div>
  )
}
