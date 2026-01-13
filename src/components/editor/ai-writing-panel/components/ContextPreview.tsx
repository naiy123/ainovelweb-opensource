"use client"

import { useState, useMemo } from "react"
import { ChevronDown, ChevronUp, FileText, User, BookOpen, ScrollText, Link2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChapterSummaryInfo {
  id: string
  number: number
  title: string
  summary: string
  wordCount: number // 摘要字数
}

interface ContextPreviewProps {
  // 全书概要
  novelSummary?: string | null
  // 选中的章节摘要（当前章节之前的）
  chapterSummaries?: ChapterSummaryInfo[]
  // 匹配的设定卡（通过触发词）
  matchedCards?: { name: string; category: string; tokenCount?: number }[]
  // 关联的章节
  linkedChapters?: { title: string; wordCount: number }[]
  // 大纲
  outlineContent?: string
}

// 估算 token 数量
function estimateTokens(text: string): number {
  if (!text) return 0
  // 中文约 2 字符/token，英文约 4 字符/token
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length
  const otherChars = text.length - chineseChars
  return Math.ceil(chineseChars / 2 + otherChars / 4)
}

export function ContextPreview({
  novelSummary,
  chapterSummaries = [],
  matchedCards = [],
  linkedChapters = [],
  outlineContent,
}: ContextPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // 计算各部分字数
  const stats = useMemo(() => {
    const novelSummaryChars = novelSummary?.length || 0
    const summariesChars = chapterSummaries.reduce(
      (sum, s) => sum + s.wordCount,
      0
    )
    const cardsChars = matchedCards.reduce(
      (sum, c) => sum + 100, // 假设每张卡片约 100 字
      0
    )
    const linkedChars = linkedChapters.reduce(
      (sum, c) => sum + c.wordCount,
      0
    )
    const outlineChars = outlineContent?.length || 0

    const total = novelSummaryChars + summariesChars + cardsChars + linkedChars + outlineChars

    return {
      novelSummary: novelSummaryChars,
      summaries: summariesChars,
      cards: cardsChars,
      linked: linkedChars,
      outline: outlineChars,
      total,
    }
  }, [novelSummary, chapterSummaries, matchedCards, linkedChapters, outlineContent])

  const hasContext = stats.total > 0

  // 如果没有任何上下文，不显示组件
  if (!hasContext) {
    return null
  }

  return (
    <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50">
      {/* 标题栏 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-3 py-2"
      >
        <div className="flex items-center gap-2">
          <ScrollText className="size-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">上下文预览</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">~{stats.total.toLocaleString()} 字</span>
          {isExpanded ? (
            <ChevronUp className="size-4 text-gray-400" />
          ) : (
            <ChevronDown className="size-4 text-gray-400" />
          )}
        </div>
      </button>

      {/* 展开内容 */}
      {isExpanded && (
        <div className="border-t border-gray-200 px-3 py-2 space-y-2">
          {/* 全书概要 */}
          {stats.novelSummary > 0 && (
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-gray-600">
                <FileText className="size-3" />
                <span>全书概要</span>
              </div>
              <span className="text-gray-500">{stats.novelSummary} 字</span>
            </div>
          )}

          {/* 章节摘要 */}
          {chapterSummaries.length > 0 && (
            <div className="text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-gray-600">
                  <ScrollText className="size-3" />
                  <span>章节摘要 ×{chapterSummaries.length}</span>
                </div>
                <span className="text-gray-500">{stats.summaries} 字</span>
              </div>
              <div className="mt-1 text-gray-400 pl-4">
                第{chapterSummaries[0]?.number || "?"}-{chapterSummaries[chapterSummaries.length - 1]?.number || "?"}章
              </div>
            </div>
          )}

          {/* 触发词匹配设定 */}
          {matchedCards.length > 0 && (
            <div className="text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-gray-600">
                  <User className="size-3" />
                  <span>触发词匹配 ×{matchedCards.length}</span>
                </div>
                <span className="text-gray-500">{stats.cards} 字</span>
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {matchedCards.slice(0, 5).map((card, i) => (
                  <span
                    key={i}
                    className={cn(
                      "rounded px-1.5 py-0.5 text-xs",
                      card.category === "character"
                        ? "bg-blue-50 text-blue-600"
                        : "bg-purple-50 text-purple-600"
                    )}
                  >
                    {card.name}
                  </span>
                ))}
                {matchedCards.length > 5 && (
                  <span className="text-gray-400">+{matchedCards.length - 5}</span>
                )}
              </div>
            </div>
          )}

          {/* 关联章节 */}
          {linkedChapters.length > 0 && (
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-gray-600">
                <Link2 className="size-3" />
                <span>关联章节 ×{linkedChapters.length}</span>
              </div>
              <span className="text-gray-500">{stats.linked} 字</span>
            </div>
          )}

          {/* 大纲 */}
          {stats.outline > 0 && (
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-gray-600">
                <BookOpen className="size-3" />
                <span>章节大纲</span>
              </div>
              <span className="text-gray-500">{stats.outline} 字</span>
            </div>
          )}

          {/* 分隔线 */}
          <div className="border-t border-gray-200 pt-2">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-gray-700">预估总计</span>
              <span className="text-[#2b7fff]">~{stats.total.toLocaleString()} 字</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
