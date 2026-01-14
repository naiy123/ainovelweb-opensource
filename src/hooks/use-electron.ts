"use client"

import { useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"

/**
 * 检查是否在 Electron 环境中运行
 */
export function isElectron(): boolean {
  return typeof window !== "undefined" && !!window.electronAPI
}

/**
 * Electron API Hook
 *
 * 提供对 Electron API 的访问，并自动处理菜单操作和导航
 */
export function useElectron() {
  const router = useRouter()

  // 检查是否在 Electron 中
  const inElectron = isElectron()

  // 导航到指定路径
  const navigate = useCallback((path: string) => {
    router.push(path)
  }, [router])

  // 显示系统通知
  const notify = useCallback((title: string, body: string) => {
    if (inElectron) {
      window.electronAPI?.notify(title, body)
    } else if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body })
    }
  }, [inElectron])

  // 保存文件
  const saveFile = useCallback(async (content: string, defaultName: string, fileType: "txt" | "epub" | "json" = "txt") => {
    if (inElectron) {
      return window.electronAPI?.saveFile({ content, defaultName, fileType })
    }
    // Web fallback: 使用 download link
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = defaultName
    a.click()
    URL.revokeObjectURL(url)
    return { success: true }
  }, [inElectron])

  // 获取应用版本
  const getVersion = useCallback(async () => {
    if (inElectron) {
      return window.electronAPI?.getVersion()
    }
    return "web"
  }, [inElectron])

  // 获取应用信息
  const getAppInfo = useCallback(async () => {
    if (inElectron) {
      return window.electronAPI?.getAppInfo()
    }
    return null
  }, [inElectron])

  return {
    isElectron: inElectron,
    navigate,
    notify,
    saveFile,
    getVersion,
    getAppInfo,
    // 直接暴露 API（如果存在）
    api: inElectron ? window.electronAPI : null,
  }
}

/**
 * 菜单操作处理 Hook
 *
 * 监听 Electron 菜单操作并执行相应的回调
 */
export function useElectronMenuActions(handlers: {
  onNewNovel?: () => void
  onExportTxt?: () => void
  onFind?: () => void
  onReplace?: () => void
  onAiGenerate?: () => void
  onAiSummary?: () => void
  onAiGenerateCard?: () => void
  onAiGenerateCover?: () => void
  onShowShortcuts?: () => void
  onShowAbout?: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    if (!isElectron()) return

    // 菜单操作处理
    const handleMenuAction = (action: string) => {
      switch (action) {
        case "new-novel":
          handlers.onNewNovel?.()
          break
        case "export-txt":
          handlers.onExportTxt?.()
          break
        case "find":
          handlers.onFind?.()
          break
        case "replace":
          handlers.onReplace?.()
          break
        case "ai-generate":
          handlers.onAiGenerate?.()
          break
        case "ai-summary":
          handlers.onAiSummary?.()
          break
        case "ai-generate-card":
          handlers.onAiGenerateCard?.()
          break
        case "ai-generate-cover":
          handlers.onAiGenerateCover?.()
          break
        case "show-shortcuts":
          handlers.onShowShortcuts?.()
          break
        case "show-about":
          handlers.onShowAbout?.()
          break
        default:
          console.log("[Electron] Unknown menu action:", action)
      }
    }

    // 导航处理
    const handleNavigate = (path: string) => {
      router.push(path)
    }

    // 注册监听器
    window.electronAPI?.onMenuAction(handleMenuAction)
    window.electronAPI?.onNavigate(handleNavigate)

    // 清理
    return () => {
      window.electronAPI?.removeMenuActionListener()
      window.electronAPI?.removeNavigateListener()
    }
  }, [router, handlers])
}

/**
 * 快捷键 Hook
 *
 * 在 Web 环境中也支持常用快捷键
 */
export function useKeyboardShortcuts(handlers: {
  onSave?: () => void
  onNew?: () => void
  onFind?: () => void
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey

      if (isMod && e.key === "s") {
        e.preventDefault()
        handlers.onSave?.()
      } else if (isMod && e.key === "n") {
        e.preventDefault()
        handlers.onNew?.()
      } else if (isMod && e.key === "f") {
        e.preventDefault()
        handlers.onFind?.()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handlers])
}
