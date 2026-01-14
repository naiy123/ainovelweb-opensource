import { useState, useRef, useCallback, useEffect } from "react"
import { toast } from "sonner"
import type {
  Step,
  BgMode,
  GenerateMode,
  ChannelType,
  ImageData,
  HistoryImage,
} from "../types"
import { GENRE_OPTIONS } from "../constants"
export function useCoverGenerator() {
  // 处理错误
  const handleError = useCallback((error: unknown) => {
    const message = error instanceof Error ? error.message : "生成失败"
    toast.error(message)
  }, [])

  // 生成模式
  const [generateMode, setGenerateMode] = useState<GenerateMode>("quick")
  const [step, setStep] = useState<Step>("background")

  // 基础信息
  const [title, setTitle] = useState("")
  const [author, setAuthor] = useState("")
  const [channel, setChannel] = useState<ChannelType>("male")
  const [genre, setGenre] = useState("")
  const [description, setDescription] = useState("")

  // 快速生成状态
  const [isGeneratingQuick, setIsGeneratingQuick] = useState(false)
  const [selectedModel, setSelectedModel] = useState<string>("seedream")

  // 背景相关
  const [bgMode, setBgMode] = useState<BgMode>("preset")
  const [backgroundImage, setBackgroundImage] = useState<ImageData | null>(null)
  const [aiPrompt, setAiPrompt] = useState("")
  const [isGeneratingBg, setIsGeneratingBg] = useState(false)

  // 字体风格
  const [styleImage, setStyleImage] = useState<ImageData | null>(null)

  // 结果
  const [resultImage, setResultImage] = useState<string | null>(null)
  const [isGeneratingFinal, setIsGeneratingFinal] = useState(false)

  // 历史记录
  const [historyImages, setHistoryImages] = useState<HistoryImage[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyNextCursor, setHistoryNextCursor] = useState<string | null>(null)
  const [historyHasMore, setHistoryHasMore] = useState(false)
  const [previewImage, setPreviewImage] = useState<HistoryImage | null>(null)
  const [historyExpanded, setHistoryExpanded] = useState(false)

  // Refs
  const bgInputRef = useRef<HTMLInputElement>(null)
  const styleInputRef = useRef<HTMLInputElement>(null)

  const loadHistory = useCallback(async (cursor?: string) => {
    setHistoryLoading(true)
    try {
      const params = new URLSearchParams()
      if (cursor) params.set("cursor", cursor)
      params.set("limit", "12")

      const response = await fetch(`/api/cover/history?${params}`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      if (cursor) {
        setHistoryImages(prev => [...prev, ...data.images])
      } else {
        setHistoryImages(data.images)
      }
      setHistoryNextCursor(data.nextCursor)
      setHistoryHasMore(data.hasMore)
    } catch (error) {
      console.error("Load history error:", error)
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const handleImageUpload = useCallback((file: File, setImage: (data: ImageData | null) => void) => {
    if (!file.type.startsWith("image/")) {
      toast.error("请上传图片文件")
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      const base64 = result.split(",")[1]
      setImage({ base64, preview: result })
    }
    reader.readAsDataURL(file)
  }, [])

  const loadImageFromUrl = useCallback(async (url: string, setImage: (data: ImageData | null) => void) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        const base64 = result.split(",")[1]
        setImage({ base64, preview: result })
      }
      reader.readAsDataURL(blob)
    } catch (error) {
      toast.error("加载图片失败")
      console.error(error)
    }
  }, [])

  const handleGenerateBackground = useCallback(async () => {
    if (!aiPrompt.trim()) {
      toast.error("请输入背景描述或选择预设")
      return
    }
    setIsGeneratingBg(true)
    try {
      const response = await fetch("/api/cover/generate-background", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ synopsis: aiPrompt }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "生成失败")

      setBackgroundImage({
        base64: data.imageBase64,
        preview: data.imageUrl || `data:image/png;base64,${data.imageBase64}`,
      })
      toast.success("背景生成成功！")
      loadHistory()
          } catch (error) {
      handleError(error)
    } finally {
      setIsGeneratingBg(false)
    }
  }, [aiPrompt, loadHistory, handleError])

  const handleQuickGenerate = useCallback(async () => {
    if (isGeneratingQuick) return
    if (!title) { toast.error("请输入书名"); return }
    if (!genre) { toast.error("请选择小说类型"); return }
    if (!selectedModel) { toast.error("请选择图片生成模型"); return }

    setIsGeneratingQuick(true)
    setResultImage(null)

    try {
      const response = await fetch("/api/cover/generate-quick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, author,
          channel: GENRE_OPTIONS[channel].label,
          genre, description,
          model: selectedModel,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "生成失败")

      setResultImage(data.imageUrl)
      toast.success("封面生成成功！")
      loadHistory()
    } catch (error) {
      handleError(error)
    } finally {
      setIsGeneratingQuick(false)
    }
  }, [isGeneratingQuick, title, genre, selectedModel, author, channel, description, loadHistory, handleError])

  const handleGenerateFinal = useCallback(async () => {
    if (!title) { toast.error("请输入书名"); return }
    if (!backgroundImage) { toast.error("请先选择或生成背景图"); return }
    if (!styleImage) { toast.error("请选择字体风格参考图"); return }

    setIsGeneratingFinal(true)
    setResultImage(null)
    try {
      const response = await fetch("/api/cover/generate-with-style", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          backgroundBase64: backgroundImage.base64,
          styleImageBase64: styleImage.base64,
          title, author, description,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "生成失败")

      setResultImage(data.imageUrl)
      toast.success("封面生成成功！")
      loadHistory()
          } catch (error) {
      handleError(error)
    } finally {
      setIsGeneratingFinal(false)
    }
  }, [title, backgroundImage, styleImage, author, description, loadHistory, handleError])

  const handleDownload = useCallback((url: string, filename: string) => {
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    link.click()
  }, [])

  const handleChannelChange = useCallback((ch: ChannelType) => {
    setChannel(ch)
    setGenre("")
  }, [])

  return {
    // State
    generateMode, step, title, author, channel, genre, description,
    isGeneratingQuick, selectedModel, bgMode, backgroundImage, aiPrompt,
    isGeneratingBg, styleImage, resultImage, isGeneratingFinal,
    historyImages, historyLoading, historyNextCursor, historyHasMore,
    previewImage, historyExpanded,
    // Refs
    bgInputRef, styleInputRef,
    // Setters
    setGenerateMode, setStep, setTitle, setAuthor, setGenre, setDescription,
    setSelectedModel, setBgMode, setBackgroundImage, setAiPrompt, setStyleImage,
    setResultImage, setPreviewImage, setHistoryExpanded,
    // Actions
    handleChannelChange, handleImageUpload, loadImageFromUrl,
    handleGenerateBackground, handleQuickGenerate, handleGenerateFinal,
    handleDownload, loadHistory,
  }
}
