"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, ChevronRight, Plus, Check, Trash2, Target } from "lucide-react"
import { cn } from "@/lib/utils"
import type { OutlineNode } from "@/hooks/use-outline"

interface ChapterOutlineSectionProps {
  // 关联的章纲节点（如果存在）
  chapterOutlineNode: OutlineNode | null
  // 章纲下的情节点列表
  plotPoints: OutlineNode[]
  // 添加情节点
  onAdd: () => void
  // 更新情节点
  onUpdate: (nodeId: string, data: { title?: string; content?: string; completed?: boolean }) => void
  // 删除情节点
  onDelete: (nodeId: string) => void
  // 点击情节点跳转到大纲编辑
  onSelectNode?: (nodeId: string) => void
}

export function ChapterOutlineSection({
  chapterOutlineNode,
  plotPoints,
  onAdd,
  onUpdate,
  onDelete,
  onSelectNode,
}: ChapterOutlineSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  // 聚焦编辑输入框
  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingId])

  const handleStartEdit = (node: OutlineNode) => {
    setEditingId(node.id)
    setEditTitle(node.title)
  }

  const handleSaveEdit = () => {
    if (editingId && editTitle.trim()) {
      onUpdate(editingId, { title: editTitle.trim() })
    }
    setEditingId(null)
    setEditTitle("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveEdit()
    } else if (e.key === "Escape") {
      setEditingId(null)
      setEditTitle("")
    }
  }

  const completedCount = plotPoints.filter((node) => node.completed).length

  // 如果没有关联的章纲，显示提示
  if (!chapterOutlineNode) {
    return (
      <div className="border-b border-gray-200 bg-gray-50/50 px-6 py-3">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Target className="size-4" />
          <span>此章节未关联章纲</span>
        </div>
        <p className="mt-1 text-xs text-gray-400">
          在左侧大纲中创建章纲并关联到此章节，即可在这里管理情节点
        </p>
      </div>
    )
  }

  return (
    <div className="border-b border-gray-200 bg-gray-50/50">
      {/* Header */}
      <div className="flex w-full items-center justify-between px-6 py-2 text-sm text-gray-600 hover:bg-gray-100/50">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex flex-1 items-center gap-2"
        >
          {isExpanded ? (
            <ChevronDown className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          )}
          <span className="font-medium">章纲：{chapterOutlineNode.title}</span>
          {plotPoints.length > 0 && (
            <span className="text-gray-400">
              ({completedCount}/{plotPoints.length})
            </span>
          )}
        </button>
        <button
          onClick={onAdd}
          className="flex items-center gap-1 rounded px-2 py-1 text-xs text-[#2b7fff] hover:bg-[#2b7fff]/10"
        >
          <Plus className="size-3" />
          添加情节点
        </button>
      </div>

      {/* Items */}
      {isExpanded && (
        <div className="px-6 pb-3">
          {plotPoints.length === 0 ? (
            <p className="py-2 text-center text-xs text-gray-400">
              添加情节点帮助你规划本章内容
            </p>
          ) : (
            <div className="space-y-1">
              {plotPoints.map((node) => (
                <div
                  key={node.id}
                  className={cn(
                    "group flex items-start gap-2 rounded px-2 py-1.5 transition-colors",
                    "hover:bg-white"
                  )}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => onUpdate(node.id, { completed: !node.completed })}
                    className={cn(
                      "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border transition-colors",
                      node.completed
                        ? "border-green-500 bg-green-500 text-white"
                        : "border-gray-300 hover:border-gray-400"
                    )}
                  >
                    {node.completed && <Check className="size-3" />}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {editingId === node.id ? (
                      <input
                        ref={inputRef}
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={handleSaveEdit}
                        onKeyDown={handleKeyDown}
                        className="w-full rounded border border-[#2b7fff] px-1 py-0.5 text-sm outline-none"
                        maxLength={100}
                      />
                    ) : (
                      <button
                        onClick={() => handleStartEdit(node)}
                        onDoubleClick={() => onSelectNode?.(node.id)}
                        className={cn(
                          "block w-full text-left text-sm truncate",
                          node.completed ? "text-gray-400 line-through" : "text-gray-700"
                        )}
                        title="双击跳转到大纲编辑"
                      >
                        {node.title}
                      </button>
                    )}
                    {node.content && (
                      <p className="mt-0.5 text-xs text-gray-400 truncate">
                        {node.content}
                      </p>
                    )}
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => onDelete(node.id)}
                    className="shrink-0 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 transition-opacity"
                  >
                    <Trash2 className="size-3.5 text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
