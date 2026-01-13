"use client"

import { useState, useCallback, useEffect, useRef, useMemo } from "react"
import { useNovel, useCreateChapter, useUpdateChapter, useGenerateContentStream, type Chapter } from "@/hooks/use-novels"
import { useCards, useCreateCard, useUpdateCard, useDeleteCard, type Card, type CardCategory } from "@/hooks/use-cards"
import {
  useOutlineNodes,
  useCreateOutlineNode,
  useUpdateOutlineNode,
  useDeleteOutlineNode,
  findChapterOutlineNode,
  getPlotPoints,
  type OutlineNode,
  type OutlineNodeType,
} from "@/hooks/use-outline"
import { useUserStore } from "@/stores/user-store"
import { useContactAdminStore } from "@/components/contact-admin-modal"
import type { EditorMode, SaveStatus, GeneratedCardData, GeneratedOutlineData, GenerateParams } from "../types"

export function useEditorState(novelId: string) {
  // Data fetching
  const { data: novel, isLoading } = useNovel(novelId)
  const { mutate: createChapter } = useCreateChapter()
  const { mutate: updateChapter, isPending: isSaving } = useUpdateChapter()
  const { generate: generateContent, isGenerating, thinking } = useGenerateContentStream()
  const { data: cards = [] } = useCards(novelId)
  const { mutate: createCard } = useCreateCard()
  const { mutate: updateCard, isPending: isCardSaving } = useUpdateCard()
  const { mutate: deleteCard } = useDeleteCard()

  // 大纲 hooks
  const { data: outlineNodes = [] } = useOutlineNodes(novelId)
  const { mutate: createOutlineNode } = useCreateOutlineNode()
  const { mutate: updateOutlineNode, isPending: isOutlineSaving } = useUpdateOutlineNode()
  const { mutate: deleteOutlineNode } = useDeleteOutlineNode()

  const chapters = novel?.chapters || []

  // 全局余额刷新
  const refreshBalance = useUserStore((state) => state.refreshBalance)
  const openContactAdmin = useContactAdminStore((state) => state.openContactAdmin)

  // Editor mode state
  const [editorMode, setEditorMode] = useState<EditorMode>("chapter")
  const [selectedChapterId, setSelectedChapterId] = useState<string>("")
  const [selectedCardId, setSelectedCardId] = useState<string>("")
  const [newCardCategory, setNewCardCategory] = useState<CardCategory | null>(null)

  // 大纲状态
  const [selectedOutlineNodeId, setSelectedOutlineNodeId] = useState<string>("")
  const [newOutlineParentId, setNewOutlineParentId] = useState<string | null>(null)
  const [outlineSaveStatus, setOutlineSaveStatus] = useState<SaveStatus>("saved")

  // Chapter editing state
  const [content, setContent] = useState("")
  const [chapterTitle, setChapterTitle] = useState("")

  // Save status
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved")
  const [cardSaveStatus, setCardSaveStatus] = useState<SaveStatus>("saved")

  // Generated card data for prefilling CardEditor
  const [generatedCardData, setGeneratedCardData] = useState<GeneratedCardData | null>(null)

  // Generated outline data for prefilling OutlineEditor
  const [generatedOutlineData, setGeneratedOutlineData] = useState<GeneratedOutlineData | null>(null)

  // Refs for streaming
  const baseContentRef = useRef<string>("")
  const streamBufferRef = useRef<string>("")

  // Auto-save refs
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedContentRef = useRef<string>("")
  const lastSavedTitleRef = useRef<string>("")

  // Select first chapter when data loads
  useEffect(() => {
    if (chapters.length > 0 && !selectedChapterId && editorMode === "chapter") {
      const firstChapter = chapters[0]
      setSelectedChapterId(firstChapter.id)
      setChapterTitle(firstChapter.title)
      setContent(firstChapter.content)
      lastSavedContentRef.current = firstChapter.content
      lastSavedTitleRef.current = firstChapter.title
    }
  }, [chapters, selectedChapterId, editorMode])

  // Auto-save with 3s delay
  useEffect(() => {
    if (!selectedChapterId || editorMode !== "chapter") return

    const hasChanges = content !== lastSavedContentRef.current || chapterTitle !== lastSavedTitleRef.current
    if (!hasChanges) return

    setSaveStatus("unsaved")

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    autoSaveTimerRef.current = setTimeout(() => {
      setSaveStatus("saving")
      updateChapter(
        { novelId, chapterId: selectedChapterId, title: chapterTitle, content },
        {
          onSuccess: () => {
            lastSavedContentRef.current = content
            lastSavedTitleRef.current = chapterTitle
            setSaveStatus("saved")
          },
          onError: () => setSaveStatus("unsaved"),
        }
      )
    }, 3000)

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    }
  }, [content, chapterTitle, selectedChapterId, novelId, updateChapter, editorMode])

  // Text to HTML conversion
  const textToHtml = useCallback((text: string): string => {
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim())
    if (paragraphs.length === 0) {
      const lines = text.split(/\n/).filter(l => l.trim())
      if (lines.length > 1) {
        return lines.map(line =>
          `<p style="text-indent: 2em; line-height: 2; margin: 0 0 1em 0;">${line.trim()}</p>`
        ).join("")
      }
      return text.trim() ? `<p style="text-indent: 2em; line-height: 2; margin: 0 0 1em 0;">${text.trim()}</p>` : ""
    }
    return paragraphs.map(p =>
      `<p style="text-indent: 2em; line-height: 2; margin: 0 0 1em 0;">${p.trim().replace(/\n/g, "")}</p>`
    ).join("")
  }, [])

  // Handlers
  const handleSave = useCallback(() => {
    if (!selectedChapterId) return
    updateChapter({ novelId, chapterId: selectedChapterId, title: chapterTitle, content })
  }, [novelId, selectedChapterId, chapterTitle, content, updateChapter])

  const handleSelectChapter = useCallback((chapterId: string) => {
    if (chapterId === selectedChapterId && editorMode === "chapter") return

    if (selectedChapterId && editorMode === "chapter") {
      updateChapter({ novelId, chapterId: selectedChapterId, title: chapterTitle, content })
    }

    const targetChapter = chapters.find((c) => c.id === chapterId)
    if (targetChapter) {
      setEditorMode("chapter")
      setSelectedChapterId(chapterId)
      setSelectedCardId("")
      setNewCardCategory(null)
      setChapterTitle(targetChapter.title)
      setContent(targetChapter.content)
      lastSavedContentRef.current = targetChapter.content
      lastSavedTitleRef.current = targetChapter.title
    }
  }, [chapters, selectedChapterId, chapterTitle, content, novelId, updateChapter, editorMode])

  const handleSelectCard = useCallback((cardId: string) => {
    if (cardId === selectedCardId && editorMode === "card") return

    if (selectedChapterId && editorMode === "chapter") {
      updateChapter({ novelId, chapterId: selectedChapterId, title: chapterTitle, content })
    }

    setEditorMode("card")
    setSelectedCardId(cardId)
    setNewCardCategory(null)
    setCardSaveStatus("saved")
  }, [selectedCardId, selectedChapterId, editorMode, novelId, chapterTitle, content, updateChapter])

  const handleCreateCard = useCallback((category: CardCategory) => {
    if (selectedChapterId && editorMode === "chapter") {
      updateChapter({ novelId, chapterId: selectedChapterId, title: chapterTitle, content })
    }

    setEditorMode("card")
    setSelectedCardId("")
    setNewCardCategory(category)
    setCardSaveStatus("saved")
  }, [selectedChapterId, editorMode, novelId, chapterTitle, content, updateChapter])

  const handleSaveCard = useCallback((data: Partial<Card>) => {
    if (newCardCategory) {
      setCardSaveStatus("saving")
      createCard(
        {
          novelId,
          name: data.name || "",
          category: newCardCategory,
          description: data.description,
          tags: data.tags,
          isPinned: data.isPinned,
          attributes: data.attributes as Record<string, unknown>,
        },
        {
          onSuccess: (newCard) => {
            setSelectedCardId(newCard.id)
            setNewCardCategory(null)
            setCardSaveStatus("saved")
          },
          onError: () => setCardSaveStatus("unsaved"),
        }
      )
    } else if (selectedCardId) {
      setCardSaveStatus("saving")
      updateCard(
        {
          novelId,
          cardId: selectedCardId,
          name: data.name,
          category: data.category,
          description: data.description,
          tags: data.tags,
          isPinned: data.isPinned,
          attributes: data.attributes as Record<string, unknown> | null | undefined,
        },
        {
          onSuccess: () => setCardSaveStatus("saved"),
          onError: () => setCardSaveStatus("unsaved"),
        }
      )
    }
  }, [novelId, newCardCategory, selectedCardId, createCard, updateCard])

  const handleDeleteCard = useCallback(() => {
    if (!selectedCardId) return

    deleteCard(
      { novelId, cardId: selectedCardId },
      {
        onSuccess: () => {
          setSelectedCardId("")
          setEditorMode("chapter")
          if (chapters.length > 0) {
            const firstChapter = chapters[0]
            setSelectedChapterId(firstChapter.id)
            setChapterTitle(firstChapter.title)
            setContent(firstChapter.content)
          }
        },
      }
    )
  }, [novelId, selectedCardId, deleteCard, chapters])

  const handleCancelCard = useCallback(() => {
    setNewCardCategory(null)
    setEditorMode("chapter")
    if (chapters.length > 0) {
      const firstChapter = chapters[0]
      setSelectedChapterId(firstChapter.id)
      setChapterTitle(firstChapter.title)
      setContent(firstChapter.content)
    }
  }, [chapters])

  const handleCreateChapter = useCallback(() => {
    // 根据当前选中章节的状态决定新章节状态
    const currentChapter = chapters.find((c) => c.id === selectedChapterId)
    const newStatus = currentChapter?.status === "draft" ? "draft" : "published"

    // 计算章节编号（只计算同状态的章节）
    const sameStatusChapters = chapters.filter((c) => c.status === newStatus)
    const chapterNumber = sameStatusChapters.length + 1

    createChapter(
      {
        novelId,
        title: newStatus === "draft" ? `草稿 ${chapterNumber}` : `第${chapterNumber}章`,
        status: newStatus,
      },
      {
        onSuccess: (newChapter) => {
          setEditorMode("chapter")
          setSelectedChapterId(newChapter.id)
          setSelectedCardId("")
          setNewCardCategory(null)
          setChapterTitle(newChapter.title)
          setContent(newChapter.content)
        },
      }
    )
  }, [novelId, chapters, selectedChapterId, createChapter])

  const handleMoveChapter = useCallback((chapterId: string, newStatus: "published" | "draft") => {
    updateChapter(
      { novelId, chapterId, status: newStatus },
      {
        onSuccess: () => {
          // 如果移动的是当前选中的章节，保持选中状态
          // 数据会通过 react-query 自动刷新
        },
      }
    )
  }, [novelId, updateChapter])

  const handleGenerate = useCallback((params: GenerateParams) => {
    if (!params.chapterPlot.trim()) {
      alert("请输入本章剧情")
      return
    }

    baseContentRef.current = content
    streamBufferRef.current = ""

    generateContent(
      {
        novelId,
        aiModel: params.aiModel,
        storyBackground: params.storyBackground || undefined,
        chapterPlot: params.chapterPlot,
        writingStyle: params.writingStyle || undefined,
        wordCount: 2000,
        characters: params.characters,
        terms: params.terms,
        characterRelations: params.characterRelations,
        linkedChapters: params.linkedChapters,
      },
      {
        onCredit: () => refreshBalance(),
        onContent: (text) => {
          streamBufferRef.current += text
          const streamHtml = textToHtml(streamBufferRef.current)
          setContent(baseContentRef.current + streamHtml)
        },
        onDone: () => {
          const finalHtml = textToHtml(streamBufferRef.current)
          setContent(baseContentRef.current + finalHtml)
        },
        onError: (error) => {
          // 检查是否是灵感点不足的错误
          if (error && error.includes("灵感点不足")) {
            openContactAdmin(error)
          } else {
            alert(error || "生成失败，请稍后重试")
          }
        },
      }
    )
  }, [novelId, generateContent, content, textToHtml, refreshBalance, openContactAdmin])

  const handleAutoFormat = useCallback(() => {
    if (!content) return

    const tempDiv = document.createElement("div")
    tempDiv.innerHTML = content

    const paragraphs: string[] = []

    const extractParagraphs = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim()
        if (text) paragraphs.push(text)
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement
        const blockTags = ["P", "DIV", "H1", "H2", "H3", "H4", "H5", "H6", "LI"]

        if (el.tagName === "BR") return

        if (blockTags.includes(el.tagName)) {
          const text = el.textContent?.trim()
          if (text) paragraphs.push(text)
        } else {
          Array.from(el.childNodes).forEach(extractParagraphs)
        }
      }
    }

    Array.from(tempDiv.childNodes).forEach(extractParagraphs)

    if (paragraphs.length === 0) {
      const text = tempDiv.textContent?.trim()
      if (text) paragraphs.push(...text.split(/\n+/).filter(Boolean))
    }

    const formattedHtml = paragraphs
      .map((p) => `<p style="text-indent: 2em; line-height: 2; margin: 0 0 1em 0;">${p}</p>`)
      .join("")

    setContent(formattedHtml)
  }, [content])

  // ==================== 大纲 Handlers ====================

  const handleSelectOutlineNode = useCallback((nodeId: string) => {
    if (nodeId === selectedOutlineNodeId && editorMode === "outline") return

    // 保存当前章节
    if (selectedChapterId && editorMode === "chapter") {
      updateChapter({ novelId, chapterId: selectedChapterId, title: chapterTitle, content })
    }

    setEditorMode("outline")
    setSelectedOutlineNodeId(nodeId)
    setSelectedCardId("")
    setNewCardCategory(null)
    setNewOutlineParentId(null)
  }, [selectedOutlineNodeId, editorMode, selectedChapterId, novelId, chapterTitle, content, updateChapter])

  const handleCreateOutlineNode = useCallback((parentId?: string) => {
    // 保存当前章节
    if (selectedChapterId && editorMode === "chapter") {
      updateChapter({ novelId, chapterId: selectedChapterId, title: chapterTitle, content })
    }

    setEditorMode("outline")
    setSelectedOutlineNodeId("")
    setNewOutlineParentId(parentId ?? null)
    setSelectedCardId("")
    setNewCardCategory(null)
  }, [selectedChapterId, editorMode, novelId, chapterTitle, content, updateChapter])

  const handleSaveOutlineNode = useCallback((data: {
    title: string
    content: string | null
    parentId?: string | null
    linkedChapterId?: string | null
    completed?: boolean
  }) => {
    if (newOutlineParentId !== null || selectedOutlineNodeId === "") {
      // 创建新节点
      setOutlineSaveStatus("saving")
      createOutlineNode(
        {
          novelId,
          parentId: data.parentId ?? newOutlineParentId,
          title: data.title,
          content: data.content,
          linkedChapterId: data.linkedChapterId,
        },
        {
          onSuccess: (newNode) => {
            setSelectedOutlineNodeId(newNode.id)
            setNewOutlineParentId(null)
            setOutlineSaveStatus("saved")
          },
          onError: () => setOutlineSaveStatus("unsaved"),
        }
      )
    } else if (selectedOutlineNodeId) {
      // 更新现有节点
      setOutlineSaveStatus("saving")
      updateOutlineNode(
        {
          novelId,
          nodeId: selectedOutlineNodeId,
          title: data.title,
          content: data.content,
          linkedChapterId: data.linkedChapterId,
          completed: data.completed,
        },
        {
          onSuccess: () => setOutlineSaveStatus("saved"),
          onError: () => setOutlineSaveStatus("unsaved"),
        }
      )
    }
  }, [novelId, newOutlineParentId, selectedOutlineNodeId, createOutlineNode, updateOutlineNode])

  const handleDeleteOutlineNode = useCallback((nodeId?: string) => {
    const targetId = nodeId || selectedOutlineNodeId
    if (!targetId) return

    deleteOutlineNode(
      { novelId, nodeId: targetId },
      {
        onSuccess: () => {
          if (targetId === selectedOutlineNodeId) {
            setSelectedOutlineNodeId("")
            // 返回章节模式
            setEditorMode("chapter")
            if (chapters.length > 0) {
              const firstChapter = chapters[0]
              setSelectedChapterId(firstChapter.id)
              setChapterTitle(firstChapter.title)
              setContent(firstChapter.content)
            }
          }
        },
      }
    )
  }, [novelId, selectedOutlineNodeId, deleteOutlineNode, chapters])

  // ==================== 章节情节点 Handlers ====================
  // 这些 handler 用于在 TextEditor 的章纲区域直接操作情节点

  // 查找关联到当前章节的章纲节点
  const currentChapterOutlineNode = selectedChapterId
    ? findChapterOutlineNode(outlineNodes, selectedChapterId)
    : null

  // 获取当前章纲下的情节点
  const chapterPlotPoints = currentChapterOutlineNode
    ? getPlotPoints(currentChapterOutlineNode)
    : []

  // 添加情节点（在当前章纲下）
  const handleAddPlotPoint = useCallback(() => {
    if (!currentChapterOutlineNode) return

    createOutlineNode(
      {
        novelId,
        parentId: currentChapterOutlineNode.id,
        title: "新情节点",
        content: null,
      },
      {
        onSuccess: () => {
          // 数据会通过 react-query 自动刷新
        },
      }
    )
  }, [novelId, currentChapterOutlineNode, createOutlineNode])

  // 更新情节点
  const handleUpdatePlotPoint = useCallback((
    nodeId: string,
    data: { title?: string; content?: string; completed?: boolean }
  ) => {
    updateOutlineNode({
      novelId,
      nodeId,
      title: data.title,
      content: data.content,
      completed: data.completed,
    })
  }, [novelId, updateOutlineNode])

  // 删除情节点
  const handleDeletePlotPoint = useCallback((nodeId: string) => {
    deleteOutlineNode({ novelId, nodeId })
  }, [novelId, deleteOutlineNode])

  // ==================== 章纲关联 Handlers ====================
  // 用于在 AI 写作面板中关联/解除关联章纲

  // 获取所有章纲节点（包括已关联和未关联的）
  const getAllChapterOutlines = useCallback((nodes: OutlineNode[]): OutlineNode[] => {
    const result: OutlineNode[] = []
    for (const node of nodes) {
      if (node.type === "chapter_outline") {
        result.push(node)
      }
      if (node.children) {
        result.push(...getAllChapterOutlines(node.children))
      }
    }
    return result
  }, [])

  // 可用的章纲列表（未关联其他章节的，或已关联当前章节的）
  const availableChapterOutlines = useMemo(() => {
    const allOutlines = getAllChapterOutlines(outlineNodes)
    return allOutlines.filter(
      (node) => !node.linkedChapterId || node.linkedChapterId === selectedChapterId
    )
  }, [outlineNodes, selectedChapterId, getAllChapterOutlines])

  // 关联章纲到当前章节
  const handleLinkChapterOutline = useCallback((outlineNodeId: string) => {
    if (!selectedChapterId) return

    updateOutlineNode(
      {
        novelId,
        nodeId: outlineNodeId,
        linkedChapterId: selectedChapterId,
      },
      {
        onSuccess: () => {
          // 数据会通过 react-query 自动刷新
        },
      }
    )
  }, [novelId, selectedChapterId, updateOutlineNode])

  // 解除章纲与当前章节的关联
  const handleUnlinkChapterOutline = useCallback(() => {
    if (!currentChapterOutlineNode) return

    updateOutlineNode(
      {
        novelId,
        nodeId: currentChapterOutlineNode.id,
        linkedChapterId: null,
      },
      {
        onSuccess: () => {
          // 数据会通过 react-query 自动刷新
        },
      }
    )
  }, [novelId, currentChapterOutlineNode, updateOutlineNode])

  // Computed values
  const wordCount = content.replace(/<[^>]*>/g, "").replace(/\s/g, "").length
  const currentChapter = chapters.find((c) => c.id === selectedChapterId)
  const createdAt = currentChapter?.createdAt?.split("T")[0] || new Date().toISOString().split("T")[0]
  const currentCard = cards.find((c) => c.id === selectedCardId) || null
  const currentCardCategory = newCardCategory || currentCard?.category || "character"

  // 大纲相关计算
  const findOutlineNode = (nodes: OutlineNode[], id: string): OutlineNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node
      if (node.children) {
        const found = findOutlineNode(node.children, id)
        if (found) return found
      }
    }
    return null
  }

  const currentOutlineNode = selectedOutlineNodeId ? findOutlineNode(outlineNodes, selectedOutlineNodeId) : null
  const isNewOutlineNode = newOutlineParentId !== null || (editorMode === "outline" && !selectedOutlineNodeId)

  // 计算新建节点的父节点类型
  const getParentType = (): OutlineNodeType | null => {
    if (!isNewOutlineNode) return null
    if (!newOutlineParentId) return null // 顶级节点，父类型为 null
    const parentNode = findOutlineNode(outlineNodes, newOutlineParentId)
    return parentNode?.type as OutlineNodeType || null
  }
  const newOutlineParentType = getParentType()

  return {
    // Data
    novel,
    chapters,
    cards,
    outlineNodes,
    isLoading,

    // State
    editorMode,
    selectedChapterId,
    selectedCardId,
    selectedOutlineNodeId,
    newCardCategory,
    newOutlineParentId,
    content,
    chapterTitle,
    saveStatus,
    cardSaveStatus,
    outlineSaveStatus,
    generatedCardData,
    generatedOutlineData,
    isGenerating,
    thinking,

    // Computed
    wordCount,
    createdAt,
    currentCard,
    currentCardCategory,
    currentOutlineNode,
    isNewOutlineNode,
    newOutlineParentType,
    currentChapterOutlineNode,
    chapterPlotPoints,
    availableChapterOutlines,

    // Setters
    setContent,
    setChapterTitle,
    setGeneratedCardData,
    setGeneratedOutlineData,

    // Chapter Handlers
    handleSave,
    handleSelectChapter,
    handleCreateChapter,
    handleMoveChapter,
    handleGenerate,
    handleAutoFormat,

    // Card Handlers
    handleSelectCard,
    handleCreateCard,
    handleSaveCard,
    handleDeleteCard,
    handleCancelCard,

    // Outline Handlers
    handleSelectOutlineNode,
    handleCreateOutlineNode,
    handleSaveOutlineNode,
    handleDeleteOutlineNode,

    // Plot Point Handlers (for chapter outline section)
    handleAddPlotPoint,
    handleUpdatePlotPoint,
    handleDeletePlotPoint,

    // Chapter Outline Link Handlers (for AI writing panel)
    handleLinkChapterOutline,
    handleUnlinkChapterOutline,

    // Summary Mode Handler
    handleOpenSummary: useCallback(() => {
      // 保存当前章节
      if (selectedChapterId && editorMode === "chapter") {
        updateChapter({ novelId, chapterId: selectedChapterId, title: chapterTitle, content })
      }
      setEditorMode("summary")
      setSelectedCardId("")
      setNewCardCategory(null)
      setSelectedOutlineNodeId("")
    }, [selectedChapterId, editorMode, novelId, chapterTitle, content, updateChapter]),
  }
}
