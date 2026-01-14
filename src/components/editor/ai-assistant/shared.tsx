"use client"

import { useState, useEffect } from "react"
import { Sparkles, Check } from "lucide-react"

// 风格选项（通用）
export const STYLE_OPTIONS = [
  { value: "", label: "自动识别" },
  { value: "玄幻", label: "玄幻" },
  { value: "仙侠", label: "仙侠" },
  { value: "都市", label: "都市" },
  { value: "科幻", label: "科幻" },
  { value: "西幻", label: "西幻" },
  { value: "历史", label: "历史" },
  { value: "游戏", label: "游戏" },
]

// 文本模型接口
interface TextModel {
  id: string
  name: string
  description: string
  configured: boolean
}

// 旧版模型选项（保留兼容性）
export const MODEL_OPTIONS = [
  { id: "balanced", name: "豆包", credits: 0, description: "火山引擎豆包大模型" },
]

// 模型选择器组件（新版：从 API 获取）
interface ModelSelectorProps {
  selectedModel: string
  onSelect: (modelId: string) => void
}

export function ModelSelector({ selectedModel, onSelect }: ModelSelectorProps) {
  const [textModels, setTextModels] = useState<TextModel[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const res = await fetch("/api/models/available")
        if (res.ok) {
          const data = await res.json()
          setTextModels(data.textModels || [])
          // 自动选择第一个已配置的模型
          const configured = (data.textModels || []).find((m: TextModel) => m.configured)
          if (configured && !selectedModel) {
            onSelect(configured.id)
          }
        }
      } catch (err) {
        console.error("Failed to fetch models:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchModels()
  }, [])

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">生成模型</label>
      {loading ? (
        <div className="py-2 text-sm text-gray-400">加载中...</div>
      ) : (
        <div className="space-y-2">
          {textModels.map((model) => (
            <button
              key={model.id}
              onClick={() => model.configured && onSelect(model.id)}
              disabled={!model.configured}
              className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors ${
                selectedModel === model.id && model.configured
                  ? "border-[#2b7fff] bg-[#2b7fff]/5"
                  : model.configured
                  ? "border-gray-200 hover:bg-gray-50"
                  : "border-gray-100 opacity-50 cursor-not-allowed"
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${selectedModel === model.id ? "text-[#2b7fff]" : "text-gray-900"}`}>
                    {model.name}
                  </span>
                  {model.configured && (
                    <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-600">
                      已配置
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-gray-500">{model.description}</p>
              </div>
              {selectedModel === model.id && model.configured && (
                <Check className="size-4 text-[#2b7fff]" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// 风格选择器组件
interface StyleSelectorProps {
  value: string
  onChange: (value: string) => void
}

export function StyleSelector({ value, onChange }: StyleSelectorProps) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">风格</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#2b7fff] focus:outline-none"
      >
        {STYLE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

// 生成按钮组件（新版：不显示点数）
interface GenerateButtonProps {
  onClick: () => void
  isGenerating: boolean
  disabled: boolean
  credits?: number  // 保留但不再使用
  label: string
  hasConfiguredModel?: boolean
}

export function GenerateButton({ onClick, isGenerating, disabled, label, hasConfiguredModel = true }: GenerateButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={isGenerating || disabled || !hasConfiguredModel}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2b7fff] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#2b7fff]/90 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isGenerating ? (
        "生成中..."
      ) : !hasConfiguredModel ? (
        "请先配置 API Key"
      ) : (
        <>
          <Sparkles className="size-4" />
          {label}
        </>
      )}
    </button>
  )
}

// 错误提示组件
export function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
      {message}
    </div>
  )
}
