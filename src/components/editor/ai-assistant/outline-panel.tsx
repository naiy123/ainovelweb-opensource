"use client"

import { useState, useEffect } from "react"
import { Sparkles, BookOpen, Layers, Target, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { GeneratedOutlineNode } from "@/lib/ai"
import type { OutlineNode, OutlineNodeType } from "@/hooks/use-outline"
import { ModelSelector, StyleSelector, GenerateButton, ErrorMessage, MODEL_OPTIONS } from "./shared"

// 节点类型配置
const NODE_TYPE_CONFIG: Record<OutlineNodeType, {
  label: string
  icon: typeof BookOpen
  color: string
  placeholders: string[]
  childLabel: string
}> = {
  volume: {
    label: "卷纲",
    icon: BookOpen,
    color: "text-purple-600",
    placeholders: [
      "主角觉醒异能，踏上修炼之路",
      "误入神秘组织，卷入权力斗争",
      "寻找失落神器，解开身世之谜",
      "复仇之路，从弱小到强大的蜕变",
    ],
    childLabel: "章节",
  },
  chapter_outline: {
    label: "章纲",
    icon: Layers,
    color: "text-blue-600",
    placeholders: [
      "初入宗门，遭遇刁难",
      "意外获得传承，实力暴涨",
      "与女主初次相遇，产生误会",
      "外出历练，遭遇危机",
    ],
    childLabel: "情节点",
  },
  plot_point: {
    label: "情节点",
    icon: Target,
    color: "text-green-600",
    placeholders: [
      "在集市听到宝藏传闻",
      "与反派首次交锋",
      "获得关键线索",
      "师徒对话，传授心法",
    ],
    childLabel: "",
  },
}

interface OutlineAssistantPanelProps {
  novelId: string
  nodeType: OutlineNodeType
  parentNode?: OutlineNode | null
  siblingNodes?: OutlineNode[]
  isNew?: boolean  // 是否新建节点（影响按钮文字）
  onApplyGenerated: (data: { title: string; content: string }) => void
  onCreateChild?: (title: string) => void  // 快速创建子节点
}

export function OutlineAssistantPanel({
  novelId,
  nodeType,
  parentNode,
  siblingNodes = [],
  isNew = true,
  onApplyGenerated,
  onCreateChild,
}: OutlineAssistantPanelProps) {
  const config = NODE_TYPE_CONFIG[nodeType]
  const [placeholderIndex, setPlaceholderIndex] = useState(0)

  const [keywords, setKeywords] = useState("")
  const [style, setStyle] = useState("")
  const [selectedModel, setSelectedModel] = useState("fast")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedResult, setGeneratedResult] = useState<GeneratedOutlineNode | null>(null)
  const [selectedTitleIndex, setSelectedTitleIndex] = useState(0)
  const [error, setError] = useState("")

  const currentModel = MODEL_OPTIONS.find((m) => m.id === selectedModel) || MODEL_OPTIONS[0]

  // 轮换 placeholder
  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % config.placeholders.length)
    }, 3000)
    return () => clearInterval(timer)
  }, [config.placeholders.length])

  // 重置状态当 nodeType 变化
  useEffect(() => {
    setKeywords("")
    setGeneratedResult(null)
    setSelectedTitleIndex(0)
    setError("")
  }, [nodeType])

  const handleGenerate = async () => {
    if (!keywords.trim()) {
      setError("请输入关键词或描述")
      return
    }

    setIsGenerating(true)
    setError("")
    setGeneratedResult(null)

    try {
      const response = await fetch(`/api/novels/${novelId}/outline/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nodeType,
          keywords: keywords.trim(),
          style: style || undefined,
          model: selectedModel,
          parentNodeId: parentNode?.id,
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || "生成失败")
      }

      const result = await response.json()
      setGeneratedResult(result.data)
      setSelectedTitleIndex(0)
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成失败，请重试")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleApply = () => {
    if (!generatedResult) return

    const selectedTitle = generatedResult.titles[selectedTitleIndex]?.name || ""

    onApplyGenerated({
      title: selectedTitle,
      content: generatedResult.content,
    })

    // 清空生成结果
    setGeneratedResult(null)
    setKeywords("")
  }

  const handleCreateChild = (suggestion: string) => {
    if (onCreateChild) {
      onCreateChild(suggestion)
    }
  }

  const Icon = config.icon

  return (
    <aside className="flex h-full w-80 flex-col border-l border-gray-200 bg-white">
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center gap-2">
          <Icon className={cn("size-5", config.color)} />
          <h2 className="text-base font-medium text-gray-900">大纲助手</h2>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          智能辅助生成{config.label}
        </p>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-4">
          {/* 父节点上下文（如果有） */}
          {parentNode && (
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs font-medium text-gray-500 mb-1">
                上级{NODE_TYPE_CONFIG[parentNode.type as OutlineNodeType]?.label || "节点"}
              </p>
              <p className="text-sm text-gray-700 font-medium">{parentNode.title}</p>
              {parentNode.content && (
                <p className="mt-1 text-xs text-gray-500 line-clamp-2">{parentNode.content}</p>
              )}
            </div>
          )}

          {/* 输入区域 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              描述你想要的{config.label}
            </label>
            <textarea
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder={config.placeholders[placeholderIndex]}
              rows={3}
              className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-[#2b7fff] focus:outline-none"
            />
            <p className="mt-1 text-xs text-gray-400">
              输入关键词、情节描述或主题
            </p>
          </div>

          {/* 风格选择 */}
          <StyleSelector value={style} onChange={setStyle} />

          {/* 模型选择 */}
          <ModelSelector selectedModel={selectedModel} onSelect={setSelectedModel} />

          {/* 生成按钮 */}
          <GenerateButton
            onClick={handleGenerate}
            isGenerating={isGenerating}
            disabled={!keywords.trim()}
            credits={currentModel.credits}
            label={`智能生成${config.label}`}
          />

          {/* 错误提示 */}
          {error && <ErrorMessage message={error} />}

          {/* 生成结果 */}
          {generatedResult && (
            <div className="space-y-4 rounded-lg border border-green-200 bg-green-50 p-4">
              <h3 className="text-sm font-medium text-green-900">生成结果</h3>

              {/* 标题候选 */}
              <div>
                <p className="mb-2 text-xs font-medium text-gray-600">选择标题：</p>
                <div className="space-y-2">
                  {generatedResult.titles.map((item, index) => (
                    <label
                      key={index}
                      className={cn(
                        "flex cursor-pointer items-start gap-2 rounded-lg border p-2 transition-colors",
                        selectedTitleIndex === index
                          ? "border-[#2b7fff] bg-[#2b7fff]/5"
                          : "border-gray-200 hover:bg-gray-50"
                      )}
                    >
                      <input
                        type="radio"
                        name="selectedTitle"
                        checked={selectedTitleIndex === index}
                        onChange={() => setSelectedTitleIndex(index)}
                        className="mt-0.5"
                      />
                      <div>
                        <span className="font-medium text-gray-900">{item.name}</span>
                        <p className="text-xs text-gray-500">{item.meaning}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* 内容预览 */}
              <div>
                <p className="mb-1 text-xs font-medium text-gray-600">内容概述：</p>
                <p className="text-xs text-gray-700 whitespace-pre-wrap">
                  {generatedResult.content.slice(0, 200)}
                  {generatedResult.content.length > 200 && "..."}
                </p>
              </div>

              {/* 子节点建议 */}
              {generatedResult.childSuggestions && generatedResult.childSuggestions.length > 0 && config.childLabel && (
                <div>
                  <p className="mb-2 text-xs font-medium text-gray-600">
                    建议的{config.childLabel}：
                  </p>
                  <div className="space-y-1">
                    {generatedResult.childSuggestions.map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => handleCreateChild(suggestion)}
                        className="flex w-full items-center gap-2 rounded border border-gray-200 px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-100 text-left"
                      >
                        <ChevronRight className="size-3 text-gray-400 shrink-0" />
                        <span className="truncate">{suggestion}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 应用按钮 */}
              <div className="flex gap-2">
                <button
                  onClick={handleApply}
                  className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                  {isNew ? "采用并创建" : "采用并填充"}
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50"
                >
                  重新生成
                </button>
              </div>
            </div>
          )}

          {/* 使用提示 */}
          {!generatedResult && (
            <div className="rounded-lg bg-gray-50 p-4">
              <h4 className="text-sm font-medium text-gray-700">示例输入</h4>
              <ul className="mt-2 space-y-1 text-xs text-gray-500">
                {config.placeholders.map((example, i) => (
                  <li
                    key={i}
                    className="cursor-pointer hover:text-[#2b7fff]"
                    onClick={() => setKeywords(example)}
                  >
                    • {example}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
