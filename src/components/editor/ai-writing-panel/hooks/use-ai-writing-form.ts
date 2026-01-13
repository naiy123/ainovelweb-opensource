import { useState, useEffect, useRef, useCallback } from "react"
import type { Card, CharacterAttributes } from "@/hooks/use-cards"
import { DEFAULT_MODEL_ID } from "@/lib/ai/models"
import { useUserStore } from "@/stores/user-store"
import type { ChapterInfo, CharacterCardInfo, TermCardInfo, LinkedChapterInfo } from "../types"

interface UseAIWritingFormOptions {
  cards: Card[]
  chapters: ChapterInfo[]
  thinking?: string
  isGenerating?: boolean
}

export function useAIWritingForm({
  cards,
  chapters,
  thinking = "",
  isGenerating = false,
}: UseAIWritingFormOptions) {
  // 从 cards 中派生角色和词条
  const characters = cards.filter(c => c.category === "character")
  const terms = cards.filter(c => c.category === "term")

  // UI 状态
  const [showThinking, setShowThinking] = useState(true)
  const [advancedMode, setAdvancedMode] = useState(false)
  const thinkingRef = useRef<HTMLDivElement>(null)

  // 表单状态
  const [aiModel, setAiModel] = useState(DEFAULT_MODEL_ID)
  const [storyBackground, setStoryBackground] = useState("")
  const [chapterPlot, setChapterPlot] = useState("")
  const [customStyle, setCustomStyle] = useState("")
  const [writingRequirements, setWritingRequirements] = useState("")

  // 高级功能状态
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([])
  const [characterRelations, setCharacterRelations] = useState("")
  const [selectedTerms, setSelectedTerms] = useState<string[]>([])
  const [selectedChapters, setSelectedChapters] = useState<string[]>([])

  // 弹窗状态
  const [showCharacterPicker, setShowCharacterPicker] = useState(false)
  const [showTermPicker, setShowTermPicker] = useState(false)
  const [showChapterPicker, setShowChapterPicker] = useState(false)
  const [showModelPicker, setShowModelPicker] = useState(false)

  // 翻译状态
  const [translatedThinking, setTranslatedThinking] = useState("")
  const [isTranslating, setIsTranslating] = useState(false)
  const [showTranslated, setShowTranslated] = useState(false)

  // 浮窗展开状态
  const [isExpanded, setIsExpanded] = useState(false)

  // 从全局 store 获取余额
  const balance = useUserStore((state) => state.profile?.creditBalance ?? null)

  // 自动滚动思考区域
  useEffect(() => {
    if (thinkingRef.current && thinking) {
      thinkingRef.current.scrollTop = thinkingRef.current.scrollHeight
    }
  }, [thinking])

  // 重置翻译状态
  useEffect(() => {
    if (isGenerating) {
      setTranslatedThinking("")
      setShowTranslated(false)
    }
  }, [isGenerating])

  // 翻译思考内容
  const handleTranslate = useCallback(async () => {
    if (!thinking || isTranslating) return

    setIsTranslating(true)
    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: thinking }),
      })

      if (response.ok) {
        const data = await response.json()
        setTranslatedThinking(data.translated)
        setShowTranslated(true)
      }
    } catch (error) {
      console.error("翻译失败:", error)
    } finally {
      setIsTranslating(false)
    }
  }, [thinking, isTranslating])

  // 构建生成参数
  const buildGenerateParams = useCallback(() => {
    const selectedCharacterInfos: CharacterCardInfo[] = characters
      .filter(c => selectedCharacters.includes(c.id))
      .map(c => {
        const attrs = c.attributes as CharacterAttributes | null
        return {
          name: c.name,
          gender: attrs?.gender,
          age: attrs?.age,
          personality: attrs?.personality,
          background: attrs?.background,
          abilities: attrs?.abilities,
        }
      })

    const selectedTermInfos: TermCardInfo[] = terms
      .filter(t => selectedTerms.includes(t.id))
      .map(t => ({
        name: t.name,
        description: t.description || undefined,
      }))

    const selectedChapterInfos: LinkedChapterInfo[] = chapters
      .filter(c => selectedChapters.includes(c.id) && c.content)
      .map(c => ({
        title: c.title,
        content: c.content!,
      }))

    return {
      aiModel,
      storyBackground,
      chapterPlot,
      writingStyle: customStyle,
      writingRequirements: writingRequirements ? [writingRequirements] : [],
      characters: selectedCharacterInfos.length > 0 ? selectedCharacterInfos : undefined,
      terms: selectedTermInfos.length > 0 ? selectedTermInfos : undefined,
      characterRelations: characterRelations || undefined,
      linkedChapters: selectedChapterInfos.length > 0 ? selectedChapterInfos : undefined,
    }
  }, [
    characters, terms, chapters,
    selectedCharacters, selectedTerms, selectedChapters,
    aiModel, storyBackground, chapterPlot, customStyle,
    writingRequirements, characterRelations,
  ])

  return {
    // 派生数据
    characters,
    terms,
    // UI 状态
    showThinking, setShowThinking,
    advancedMode, setAdvancedMode,
    thinkingRef,
    isExpanded, setIsExpanded,
    // 表单状态
    aiModel, setAiModel,
    storyBackground, setStoryBackground,
    chapterPlot, setChapterPlot,
    customStyle, setCustomStyle,
    writingRequirements, setWritingRequirements,
    // 高级功能
    selectedCharacters, setSelectedCharacters,
    characterRelations, setCharacterRelations,
    selectedTerms, setSelectedTerms,
    selectedChapters, setSelectedChapters,
    // 弹窗
    showCharacterPicker, setShowCharacterPicker,
    showTermPicker, setShowTermPicker,
    showChapterPicker, setShowChapterPicker,
    showModelPicker, setShowModelPicker,
    // 翻译
    translatedThinking,
    isTranslating,
    showTranslated, setShowTranslated,
    handleTranslate,
    // 余额
    balance,
    // Actions
    buildGenerateParams,
  }
}
