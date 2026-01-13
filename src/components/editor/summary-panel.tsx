"use client"

import { useState } from "react"
import { FileText, Sparkles, Check, AlertCircle, Edit2, X, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  useSummaries,
  useUpdateNovelSummary,
  useUpdateChapterSummary,
  useGenerateChapterSummary,
} from "@/hooks/use-summaries"
import type { ChapterWithSummary } from "@/hooks/use-summaries"

interface SummaryPanelProps {
  novelId: string
}

// 章节摘要卡片
function ChapterSummaryCard({
  chapter,
  novelId,
}: {
  chapter: ChapterWithSummary
  novelId: string
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedSummary, setEditedSummary] = useState("")
  const [isExpanded, setIsExpanded] = useState(false)

  const generateMutation = useGenerateChapterSummary()
  const updateMutation = useUpdateChapterSummary()

  const hasSummary = !!chapter.summary
  const isGenerating = generateMutation.isPending
  const isSaving = updateMutation.isPending

  const handleGenerate = () => {
    generateMutation.mutate({ novelId, chapterId: chapter.id })
  }

  const handleEdit = () => {
    setEditedSummary(chapter.summary?.summary || "")
    setIsEditing(true)
  }

  const handleSave = () => {
    updateMutation.mutate(
      {
        novelId,
        chapterId: chapter.id,
        data: {
          summary: editedSummary,
          keyPoints: chapter.summary?.keyPoints || [],
          isManual: true,
        },
      },
      {
        onSuccess: () => setIsEditing(false),
      }
    )
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditedSummary("")
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      {/* 标题栏 */}
      <div
        className="flex cursor-pointer items-center justify-between px-4 py-3"
        onClick={() => !isEditing && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <FileText className="size-4 text-gray-400" />
          <span className="font-medium text-gray-900">
            第{chapter.number}章 {chapter.title}
          </span>
          <span className="text-xs text-gray-400">{chapter.wordCount}字</span>
        </div>
        <div className="flex items-center gap-2">
          {hasSummary ? (
            <span className="flex items-center gap-1 text-xs text-green-600">
              <Check className="size-3" />
              已生成
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-amber-500">
              <AlertCircle className="size-3" />
              待生成
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="size-4 text-gray-400" />
          ) : (
            <ChevronDown className="size-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* 展开内容 */}
      {isExpanded && (
        <div className="border-t border-gray-100 px-4 py-3">
          {isEditing ? (
            // 编辑模式
            <div className="space-y-3">
              <textarea
                value={editedSummary}
                onChange={(e) => setEditedSummary(e.target.value)}
                placeholder="输入摘要内容..."
                rows={4}
                className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#2b7fff] focus:outline-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-1 rounded px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
                >
                  <X className="size-3" />
                  取消
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-1 rounded bg-[#2b7fff] px-3 py-1.5 text-sm text-white hover:bg-[#2b7fff]/90 disabled:opacity-50"
                >
                  <Check className="size-3" />
                  {isSaving ? "保存中..." : "保存"}
                </button>
              </div>
            </div>
          ) : hasSummary ? (
            // 显示摘要
            <div className="space-y-3">
              <p className="text-sm text-gray-700">{chapter.summary!.summary}</p>
              {chapter.summary!.keyPoints.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {chapter.summary!.keyPoints.map((point, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-[#2b7fff]"
                    >
                      {point}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>
                  {chapter.summary!.isManual ? "手动编辑" : "AI 生成"} ·{" "}
                  ~{chapter.summary!.tokenCount || 0} tokens
                </span>
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-1 text-gray-500 hover:text-[#2b7fff]"
                >
                  <Edit2 className="size-3" />
                  编辑
                </button>
              </div>
            </div>
          ) : (
            // 无摘要
            <div className="flex flex-col items-center gap-3 py-4">
              <p className="text-sm text-gray-500">暂无摘要</p>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex items-center gap-2 rounded-lg bg-[#2b7fff] px-4 py-2 text-sm text-white hover:bg-[#2b7fff]/90 disabled:opacity-50"
              >
                <Sparkles className="size-4" />
                {isGenerating ? "生成中..." : "AI 生成摘要"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function SummaryPanel({ novelId }: SummaryPanelProps) {
  const { data, isLoading } = useSummaries(novelId)
  const updateNovelSummaryMutation = useUpdateNovelSummary()

  const [isEditingNovelSummary, setIsEditingNovelSummary] = useState(false)
  const [novelSummaryText, setNovelSummaryText] = useState("")

  const handleEditNovelSummary = () => {
    setNovelSummaryText(data?.novelSummary || "")
    setIsEditingNovelSummary(true)
  }

  const handleSaveNovelSummary = () => {
    updateNovelSummaryMutation.mutate(
      { novelId, summary: novelSummaryText },
      {
        onSuccess: () => setIsEditingNovelSummary(false),
      }
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  const chapters = data?.chapters || []
  const summaryCount = chapters.filter((c) => c.summary).length
  const totalCount = chapters.length

  return (
    <div className="flex h-full flex-col bg-white">
      {/* 顶部标题栏 */}
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <FileText className="size-5 text-gray-500" />
          <span className="text-lg font-medium">章节摘要管理</span>
        </div>
        <span className="text-sm text-gray-500">
          {summaryCount}/{totalCount} 已生成
        </span>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* 全书概要 */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-medium text-gray-900">全书概要</h3>
              {!isEditingNovelSummary && (
                <button
                  onClick={handleEditNovelSummary}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#2b7fff]"
                >
                  <Edit2 className="size-3" />
                  编辑
                </button>
              )}
            </div>

            {isEditingNovelSummary ? (
              <div className="space-y-3">
                <textarea
                  value={novelSummaryText}
                  onChange={(e) => setNovelSummaryText(e.target.value)}
                  placeholder="输入全书概要，描述小说类型、整体风格、核心设定..."
                  rows={4}
                  maxLength={500}
                  className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-[#2b7fff] focus:outline-none"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {novelSummaryText.length}/500
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsEditingNovelSummary(false)}
                      className="rounded px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleSaveNovelSummary}
                      disabled={updateNovelSummaryMutation.isPending}
                      className="rounded bg-[#2b7fff] px-3 py-1.5 text-sm text-white hover:bg-[#2b7fff]/90 disabled:opacity-50"
                    >
                      {updateNovelSummaryMutation.isPending ? "保存中..." : "保存"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <p className={cn("text-sm", data?.novelSummary ? "text-gray-700" : "text-gray-400")}>
                {data?.novelSummary || "未设置全书概要，点击编辑添加"}
              </p>
            )}
          </div>

          {/* 章节摘要列表 */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">章节摘要</h3>
            {chapters.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-200 py-8 text-center text-gray-500">
                暂无章节
              </div>
            ) : (
              <div className="space-y-2">
                {chapters.map((chapter) => (
                  <ChapterSummaryCard key={chapter.id} chapter={chapter} novelId={novelId} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
