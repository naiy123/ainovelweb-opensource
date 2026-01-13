"use client"

import { RefObject } from "react"
import { Brain, Languages, Maximize2, ChevronUp, ChevronDown, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ThinkingPanelProps {
  thinking: string
  isGenerating: boolean
  showThinking: boolean
  translatedThinking: string
  showTranslated: boolean
  isTranslating: boolean
  isExpanded: boolean
  thinkingRef: RefObject<HTMLDivElement | null>
  onToggleShow: () => void
  onTranslate: () => void
  onToggleTranslated: (show: boolean) => void
  onExpand: () => void
  onCloseExpanded: () => void
}

export function ThinkingPanel({
  thinking,
  isGenerating,
  showThinking,
  translatedThinking,
  showTranslated,
  isTranslating,
  isExpanded,
  thinkingRef,
  onToggleShow,
  onTranslate,
  onToggleTranslated,
  onExpand,
  onCloseExpanded,
}: ThinkingPanelProps) {
  if (!thinking && !isGenerating) return null

  return (
    <>
      <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between p-3">
          <button onClick={onToggleShow} className="flex flex-1 items-center gap-2 text-left">
            <Brain className="size-4 text-purple-500" />
            <span className="text-sm font-medium text-gray-700">智能思考过程</span>
            {isGenerating && !thinking && (
              <span className="flex items-center gap-1 text-xs text-purple-500">
                <span className="animate-pulse">准备中...</span>
              </span>
            )}
            {thinking && <span className="text-xs text-gray-500">({thinking.length} 字)</span>}
          </button>
          <div className="flex items-center gap-2">
            {/* 翻译功能暂时禁用，等待后续开发
            {thinking && !isGenerating && (
              <button
                onClick={onTranslate}
                disabled={isTranslating}
                className={cn(
                  "flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors",
                  showTranslated ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-500"
                )}
              >
                <Languages className="size-3" />
                {isTranslating ? "翻译中..." : showTranslated ? "已翻译" : "翻译"}
              </button>
            )}
            */}
            {thinking && (
              <button
                onClick={onExpand}
                className="flex items-center justify-center rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                title="展开查看"
              >
                <Maximize2 className="size-3.5" />
              </button>
            )}
            <button onClick={onToggleShow}>
              {showThinking ? <ChevronUp className="size-4 text-gray-500" /> : <ChevronDown className="size-4 text-gray-500" />}
            </button>
          </div>
        </div>
        {showThinking && thinking && (
          <div ref={thinkingRef} className="max-h-40 overflow-auto border-t border-gray-100 bg-purple-50/50 p-3">
            {translatedThinking && (
              <div className="mb-2 flex gap-2">
                <button
                  onClick={() => onToggleTranslated(false)}
                  className={cn("rounded px-2 py-0.5 text-xs", !showTranslated ? "bg-purple-200 text-purple-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200")}
                >
                  原文
                </button>
                <button
                  onClick={() => onToggleTranslated(true)}
                  className={cn("rounded px-2 py-0.5 text-xs", showTranslated ? "bg-purple-200 text-purple-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200")}
                >
                  中文
                </button>
              </div>
            )}
            <p className="whitespace-pre-wrap text-xs text-gray-600 leading-relaxed">
              {showTranslated && translatedThinking ? translatedThinking : thinking}
            </p>
          </div>
        )}
      </div>

      {/* 展开浮窗 */}
      {isExpanded && thinking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative mx-4 flex max-h-[80vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 p-4">
              <div className="flex items-center gap-2">
                <Brain className="size-5 text-purple-500" />
                <span className="font-medium text-gray-800">智能思考过程</span>
                <span className="text-sm text-gray-500">({thinking.length} 字)</span>
              </div>
              <div className="flex items-center gap-2">
                {/* 翻译功能暂时禁用，等待后续开发
                {!isGenerating && (
                  <button
                    onClick={onTranslate}
                    disabled={isTranslating}
                    className={cn(
                      "flex items-center gap-1 rounded px-3 py-1.5 text-sm transition-colors",
                      showTranslated ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-500"
                    )}
                  >
                    <Languages className="size-4" />
                    {isTranslating ? "翻译中..." : showTranslated ? "已翻译" : "翻译"}
                  </button>
                )}
                */}
                <button onClick={onCloseExpanded} className="flex items-center justify-center rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700">
                  <X className="size-5" />
                </button>
              </div>
            </div>
            {translatedThinking && (
              <div className="flex gap-2 border-b border-gray-100 px-4 py-2">
                <button
                  onClick={() => onToggleTranslated(false)}
                  className={cn("rounded px-3 py-1 text-sm", !showTranslated ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200")}
                >
                  原文
                </button>
                <button
                  onClick={() => onToggleTranslated(true)}
                  className={cn("rounded px-3 py-1 text-sm", showTranslated ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200")}
                >
                  中文
                </button>
              </div>
            )}
            <div className="flex-1 overflow-auto p-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                {showTranslated && translatedThinking ? translatedThinking : thinking}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
