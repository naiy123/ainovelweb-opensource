"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { BookOpen, Layers, Target, Trash2, Link, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { getChildNodeType, OUTLINE_NODE_TYPE_LABELS, type OutlineNode, type OutlineNodeType } from "@/hooks/use-outline"

interface Chapter {
  id: string
  title: string
}

interface PrefillData {
  title: string
  content: string
}

interface OutlineEditorProps {
  node: OutlineNode | null
  isNew?: boolean
  parentId?: string | null
  parentType?: OutlineNodeType | null
  chapters?: Chapter[]
  onSave: (data: {
    title: string
    content: string | null
    parentId?: string | null
    linkedChapterId?: string | null
    completed?: boolean
  }) => void
  onDelete?: () => void
  saveStatus?: "saved" | "unsaved" | "saving"
  prefillData?: PrefillData | null
  onPrefillConsumed?: () => void
}

const TYPE_ICONS: Record<OutlineNodeType, typeof BookOpen> = {
  volume: BookOpen,
  chapter_outline: Layers,
  plot_point: Target,
}

const TYPE_COLORS: Record<OutlineNodeType, string> = {
  volume: "text-purple-600 bg-purple-50 border-purple-200",
  chapter_outline: "text-blue-600 bg-blue-50 border-blue-200",
  plot_point: "text-green-600 bg-green-50 border-green-200",
}

// 标题占位符提示
const TITLE_PLACEHOLDERS: Record<OutlineNodeType, string> = {
  volume: "例如：第一卷 初入江湖",
  chapter_outline: "例如：第一章 意外相遇",
  plot_point: "例如：主角初次登场",
}

// 内容占位符提示
const CONTENT_PLACEHOLDERS: Record<OutlineNodeType, string> = {
  volume: "描述本卷的主题、主要冲突、核心事件...\n例如：本卷讲述主角从普通人成长为初级修士的过程，主要冲突是与当地恶霸势力的对抗...",
  chapter_outline: "描述本章的主要情节、人物出场、场景转换...\n例如：本章主角在集市偶遇女主，因误会产生冲突，最终化解并建立初步联系...",
  plot_point: "描述具体的情节内容、对话要点、情感变化...\n例如：主角在茶馆听到关于宝藏的传闻，决定前往探险，内心充满期待与不安...",
}

export function OutlineEditor({
  node,
  isNew = false,
  parentId,
  parentType,
  chapters = [],
  onSave,
  onDelete,
  saveStatus = "saved",
  prefillData,
  onPrefillConsumed,
}: OutlineEditorProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [linkedChapterId, setLinkedChapterId] = useState<string | null>(null)
  const [completed, setCompleted] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedRef = useRef({ title: "", content: "", linkedChapterId: null as string | null, completed: false })

  // 计算节点类型（基于父节点自动确定）
  const nodeType: OutlineNodeType = isNew
    ? getChildNodeType(parentType ?? null)
    : (node?.type as OutlineNodeType) || "volume"

  const Icon = TYPE_ICONS[nodeType]
  const typeLabel = OUTLINE_NODE_TYPE_LABELS[nodeType]
  const typeColor = TYPE_COLORS[nodeType]

  // 初始化数据
  useEffect(() => {
    if (node) {
      setTitle(node.title)
      setContent(node.content || "")
      setLinkedChapterId(node.linkedChapterId)
      setCompleted(node.completed || false)
      lastSavedRef.current = {
        title: node.title,
        content: node.content || "",
        linkedChapterId: node.linkedChapterId,
        completed: node.completed || false,
      }
    } else if (isNew) {
      setTitle("")
      setContent("")
      setLinkedChapterId(null)
      setCompleted(false)
      lastSavedRef.current = { title: "", content: "", linkedChapterId: null, completed: false }
    }
  }, [node, isNew])

  // 处理 AI 生成的预填充数据
  useEffect(() => {
    if (prefillData) {
      setTitle(prefillData.title)
      setContent(prefillData.content)
      onPrefillConsumed?.()
    }
  }, [prefillData, onPrefillConsumed])

  // 自动保存
  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    autoSaveTimerRef.current = setTimeout(() => {
      const hasChanges =
        title !== lastSavedRef.current.title ||
        content !== lastSavedRef.current.content ||
        linkedChapterId !== lastSavedRef.current.linkedChapterId ||
        completed !== lastSavedRef.current.completed

      if (hasChanges && title.trim()) {
        onSave({
          title: title.trim(),
          content: content.trim() || null,
          parentId: isNew ? parentId : undefined,
          linkedChapterId: nodeType === "chapter_outline" ? linkedChapterId : undefined,
          completed: nodeType === "plot_point" ? completed : undefined,
        })
        lastSavedRef.current = { title, content, linkedChapterId, completed }
      }
    }, 1500)
  }, [title, content, linkedChapterId, completed, isNew, parentId, nodeType, onSave])

  useEffect(() => {
    if (!isNew && node) {
      triggerAutoSave()
    }
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [title, content, linkedChapterId, completed, isNew, node, triggerAutoSave])

  const handleCreate = () => {
    if (!title.trim()) return
    onSave({
      title: title.trim(),
      content: content.trim() || null,
      parentId,
      linkedChapterId: nodeType === "chapter_outline" ? linkedChapterId : undefined,
    })
  }

  if (!node && !isNew) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-white text-gray-400">
        <BookOpen className="size-12 mb-3" />
        <p>选择一个大纲节点进行编辑</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-medium text-gray-900">
            {isNew ? "新建" : "编辑"}
          </h2>
          {/* 类型标签（只读显示） */}
          <span className={cn(
            "flex items-center gap-1.5 rounded-md border px-2 py-1 text-sm",
            typeColor
          )}>
            <Icon className="size-4" />
            {typeLabel}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {!isNew && (
            <span className="text-sm text-gray-500">
              {saveStatus === "saving" && "保存中..."}
              {saveStatus === "unsaved" && "待保存"}
              {saveStatus === "saved" && "已保存"}
            </span>
          )}
          {!isNew && onDelete && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1 rounded px-2 py-1 text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 className="size-4" />
              删除
            </button>
          )}
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-4 max-w-2xl">
          {/* 标题 */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={TITLE_PLACEHOLDERS[nodeType]}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#2b7fff] placeholder:text-gray-400"
              maxLength={100}
            />
          </div>

          {/* 章纲：关联章节选择 */}
          {nodeType === "chapter_outline" && (
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                <Link className="size-4" />
                关联章节
              </label>
              <select
                value={linkedChapterId || ""}
                onChange={(e) => setLinkedChapterId(e.target.value || null)}
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#2b7fff]"
              >
                <option value="">不关联章节</option>
                {chapters.map((chapter) => (
                  <option key={chapter.id} value={chapter.id}>
                    {chapter.title}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-400">
                关联后，此章纲下的情节点会在章节编辑页面同步显示
              </p>
            </div>
          )}

          {/* 情节点：完成状态 */}
          {nodeType === "plot_point" && !isNew && (
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                <Check className="size-4" />
                完成状态
              </label>
              <button
                onClick={() => setCompleted(!completed)}
                className={cn(
                  "flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
                  completed
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                )}
              >
                <div className={cn(
                  "flex size-5 items-center justify-center rounded border",
                  completed ? "bg-green-500 border-green-500" : "border-gray-300"
                )}>
                  {completed && <Check className="size-3.5 text-white" />}
                </div>
                {completed ? "已完成" : "未完成"}
              </button>
            </div>
          )}

          {/* 内容描述 */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">详细描述</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={CONTENT_PLACEHOLDERS[nodeType]}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#2b7fff] min-h-[200px] resize-none placeholder:text-gray-400"
              maxLength={5000}
            />
            <p className="mt-1 text-xs text-gray-400">{content.length}/5000</p>
          </div>

          {/* 新建时的创建按钮 */}
          {isNew && (
            <div className="pt-4">
              <button
                onClick={handleCreate}
                disabled={!title.trim()}
                className={cn(
                  "rounded-md px-4 py-2 text-sm font-medium text-white transition-colors",
                  title.trim()
                    ? "bg-[#2b7fff] hover:bg-[#2b7fff]/90"
                    : "bg-gray-300 cursor-not-allowed"
                )}
              >
                创建{typeLabel}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 删除确认对话框 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-80 rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-medium text-gray-900">确认删除</h3>
            <p className="mb-4 text-sm text-gray-600">
              删除此{typeLabel}将同时删除所有子节点，此操作不可撤销。
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false)
                  onDelete?.()
                }}
                className="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
