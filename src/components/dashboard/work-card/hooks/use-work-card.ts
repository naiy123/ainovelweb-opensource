"use client"

import { useState, useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useUpdateNovel, useDeleteNovel } from "@/hooks/use-novels"
import { toast } from "sonner"
import { GENRE_OPTIONS } from "../constants"
import type { ChannelType } from "../types"

export function useWorkCard(id: string, title: string, tags: string[]) {
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isCoverDialogOpen, setIsCoverDialogOpen] = useState(false)
  const [isGeneratingCover, setIsGeneratingCover] = useState(false)
  const [coverTitle, setCoverTitle] = useState(title)
  const [coverAuthor, setCoverAuthor] = useState("")
  const [coverChannel, setCoverChannel] = useState<ChannelType>("male")
  const [coverGenre, setCoverGenre] = useState(tags[0] || "")
  const [coverDescription, setCoverDescription] = useState("")

  const queryClient = useQueryClient()
  const { mutate: updateNovel } = useUpdateNovel()
  const { mutate: deleteNovel, isPending: isDeleting } = useDeleteNovel()

  const openCoverDialog = useCallback(() => {
    setCoverTitle(title)
    setCoverAuthor("")
    setCoverChannel("male")
    setCoverGenre(tags[0] || "")
    setCoverDescription("")
    setIsCoverDialogOpen(true)
  }, [title, tags])

  const handleGenerateCover = useCallback(async () => {
    if (isGeneratingCover) return

    setIsGeneratingCover(true)
    setIsCoverDialogOpen(false)
    toast.info("正在生成封面，请稍候...")

    try {
      const response = await fetch(`/api/novels/${id}/generate-cover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: coverTitle,
          author: coverAuthor,
          channel: GENRE_OPTIONS[coverChannel].label,
          genre: coverGenre,
          description: coverDescription,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "生成封面失败")
      }

      toast.success("封面生成成功！")
      queryClient.invalidateQueries({ queryKey: ["novels"] })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "生成封面失败")
    } finally {
      setIsGeneratingCover(false)
    }
  }, [id, coverTitle, coverAuthor, coverChannel, coverGenre, coverDescription, isGeneratingCover, queryClient])

  const handleDownloadCover = useCallback(async (coverUrl: string) => {
    if (!coverUrl) return
    try {
      const response = await fetch(coverUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${title}-封面.${coverUrl.split(".").pop() || "png"}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch {
      toast.error("下载封面失败")
    }
  }, [title])

  const handleArchive = useCallback(() => {
    updateNovel(
      { novelId: id, status: "archived" },
      {
        onSuccess: () => toast.success("作品已归档"),
        onError: (error) => toast.error(error.message),
      }
    )
  }, [id, updateNovel])

  const handleDelete = useCallback(() => {
    deleteNovel(id, {
      onSuccess: () => {
        toast.success("作品已删除")
        setIsDeleteOpen(false)
      },
      onError: (error) => toast.error(error.message),
    })
  }, [id, deleteNovel])

  return {
    // Dialog states
    isEditOpen,
    setIsEditOpen,
    isDeleteOpen,
    setIsDeleteOpen,
    isCoverDialogOpen,
    setIsCoverDialogOpen,
    isGeneratingCover,
    isDeleting,

    // Cover form state
    coverTitle,
    setCoverTitle,
    coverAuthor,
    setCoverAuthor,
    coverChannel,
    setCoverChannel,
    coverGenre,
    setCoverGenre,
    coverDescription,
    setCoverDescription,

    // Handlers
    openCoverDialog,
    handleGenerateCover,
    handleDownloadCover,
    handleArchive,
    handleDelete,
  }
}
