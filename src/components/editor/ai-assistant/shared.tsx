"use client"

import { Sparkles } from "lucide-react"

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

// 模型选项（轻量级任务）
export const MODEL_OPTIONS = [
  { id: "fast", name: "疾速", credits: 1, description: "快速生成" },
  { id: "balanced", name: "均衡", credits: 3, description: "更丰富细节" },
  { id: "pro", name: "专业", credits: 10, description: "专业级设定" },
]

// 模型选择器组件
interface ModelSelectorProps {
  selectedModel: string
  onSelect: (modelId: string) => void
}

export function ModelSelector({ selectedModel, onSelect }: ModelSelectorProps) {
  const currentModel = MODEL_OPTIONS.find((m) => m.id === selectedModel) || MODEL_OPTIONS[0]

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">生成模型</label>
      <div className="grid grid-cols-3 gap-2">
        {MODEL_OPTIONS.map((model) => (
          <button
            key={model.id}
            onClick={() => onSelect(model.id)}
            className={`flex flex-col items-center rounded-lg border p-2 text-xs transition-colors ${
              selectedModel === model.id
                ? "border-[#2b7fff] bg-[#2b7fff]/5 text-[#2b7fff]"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <span className="font-medium">{model.name}</span>
            <span className="mt-0.5 flex items-center gap-0.5 text-[10px] opacity-70">
              <Sparkles className="size-2.5" />
              {model.credits}
            </span>
          </button>
        ))}
      </div>
      <p className="mt-1 text-xs text-gray-400">{currentModel.description}</p>
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

// 生成按钮组件
interface GenerateButtonProps {
  onClick: () => void
  isGenerating: boolean
  disabled: boolean
  credits: number
  label: string
}

export function GenerateButton({ onClick, isGenerating, disabled, credits, label }: GenerateButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={isGenerating || disabled}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2b7fff] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#2b7fff]/90 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isGenerating ? (
        "生成中..."
      ) : (
        <>
          {label}
          <span className="flex items-center gap-0.5 rounded bg-white/20 px-1.5 py-0.5 text-xs">
            <Sparkles className="size-3" />
            {credits}
          </span>
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
