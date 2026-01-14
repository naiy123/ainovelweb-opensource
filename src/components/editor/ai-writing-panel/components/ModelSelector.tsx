"use client"

import { useEffect, useState } from "react"
import { ChevronDown, Settings, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface ModelInfo {
  id: string
  name: string
  provider: string
  description: string
  type: "text" | "image" | "both"
  configured: boolean
}

interface ModelSelectorProps {
  selectedModel: string
  showPicker: boolean
  onTogglePicker: () => void
  onSelectModel: (modelId: string) => void
}

export function ModelSelector({
  selectedModel,
  showPicker,
  onTogglePicker,
  onSelectModel,
}: ModelSelectorProps) {
  const [models, setModels] = useState<ModelInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchModels()
  }, [])

  const fetchModels = async () => {
    try {
      const res = await fetch("/api/models/available")
      if (res.ok) {
        const data = await res.json()
        // 只显示文本模型
        setModels(data.textModels || [])
      }
    } catch (error) {
      console.error("Failed to fetch models:", error)
    } finally {
      setLoading(false)
    }
  }

  const currentModel = models.find(m => m.id === selectedModel)
  const configuredModels = models.filter(m => m.configured)
  const unconfiguredModels = models.filter(m => !m.configured)

  // 如果当前选中的模型未配置，自动切换到第一个已配置的模型
  useEffect(() => {
    if (!loading && models.length > 0) {
      const current = models.find(m => m.id === selectedModel)
      if (!current?.configured && configuredModels.length > 0) {
        onSelectModel(configuredModels[0].id)
      }
    }
  }, [loading, models, selectedModel, configuredModels, onSelectModel])

  if (loading) {
    return (
      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-neutral-950">生成模型</label>
        <div className="rounded-lg border border-gray-200 p-3 bg-gray-50 animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-20" />
        </div>
      </div>
    )
  }

  // 没有配置任何模型
  if (configuredModels.length === 0) {
    return (
      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-neutral-950">生成模型</label>
        <Link
          href="/dashboard/profile"
          className="flex items-center gap-3 p-3 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 transition-colors"
        >
          <Settings className="size-5 text-amber-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">未配置 API Key</p>
            <p className="text-xs text-amber-600">点击前往设置页面配置</p>
          </div>
        </Link>
      </div>
    )
  }

  return (
    <div className="mb-4">
      <label className="mb-2 block text-sm font-medium text-neutral-950">生成模型</label>
      <div className="rounded-lg border border-gray-200 overflow-hidden">
        {/* 当前选中的模型 */}
        <button
          type="button"
          onClick={onTogglePicker}
          className="flex w-full items-center gap-3 p-3 bg-white hover:bg-gray-50 transition-colors"
        >
          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center gap-2">
              <span className="font-medium text-neutral-950">{currentModel?.name || "选择模型"}</span>
              {currentModel?.configured && (
                <span className="inline-flex items-center rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-600">
                  已配置
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-[#99a1af] truncate">{currentModel?.description}</p>
          </div>
          <ChevronDown className={cn("size-4 text-gray-400 transition-transform", showPicker && "rotate-180")} />
        </button>

        {/* 模型选择列表 */}
        {showPicker && (
          <div className="border-t border-gray-200 bg-gray-50/50">
            {/* 已配置的模型 */}
            {configuredModels.map((model) => (
              <button
                type="button"
                key={model.id}
                onClick={() => onSelectModel(model.id)}
                className={cn(
                  "flex w-full items-center gap-3 p-3 transition-colors border-t border-gray-100 first:border-t-0",
                  model.id === selectedModel
                    ? "bg-blue-50"
                    : "hover:bg-white"
                )}
              >
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-neutral-950">{model.name}</span>
                    <span className="inline-flex items-center rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-600">
                      已配置
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-[#99a1af] truncate">{model.description}</p>
                </div>
                {model.id === selectedModel && (
                  <Check className="size-4 text-blue-500" />
                )}
              </button>
            ))}

            {/* 未配置的模型 */}
            {unconfiguredModels.length > 0 && (
              <>
                <div className="px-3 py-2 text-xs text-gray-400 bg-gray-100 border-t border-gray-200">
                  未配置
                </div>
                {unconfiguredModels.map((model) => (
                  <div
                    key={model.id}
                    className="flex items-center gap-3 p-3 border-t border-gray-100 opacity-50 cursor-not-allowed"
                  >
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-500">{model.name}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-gray-400 truncate">{model.description}</p>
                    </div>
                    <Link
                      href="/dashboard/profile"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-blue-500 hover:underline"
                    >
                      去配置
                    </Link>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
