"use client"

import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { AI_TEXT_MODELS } from "@/lib/ai/models"

interface ModelSelectorProps {
  aiModel: string
  showPicker: boolean
  onTogglePicker: () => void
  onSelectModel: (modelId: string) => void
}

export function ModelSelector({
  aiModel,
  showPicker,
  onTogglePicker,
  onSelectModel,
}: ModelSelectorProps) {
  const currentModel = AI_TEXT_MODELS[aiModel]

  return (
    <div className="mb-4">
      <label className="mb-2 block text-sm font-medium text-neutral-950">生成模型</label>
      <div className="rounded-lg border border-gray-200 overflow-hidden">
        <button
          type="button"
          onClick={onTogglePicker}
          className="flex w-full items-center gap-3 p-3 bg-white hover:bg-gray-50 transition-colors"
        >
          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center gap-2">
              <span className="font-medium text-neutral-950">{currentModel?.name}</span>
              {currentModel?.thinking && (
                <span className="inline-flex items-center rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-medium text-purple-600">
                  深度思考
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-[#99a1af] truncate">{currentModel?.description}</p>
          </div>
          <div className="shrink-0 text-right mr-2">
            <span className="text-sm font-semibold text-amber-500">{currentModel?.credits}</span>
            <span className="text-xs text-[#99a1af]">点</span>
          </div>
          <ChevronDown className={cn("size-4 text-gray-400 transition-transform", showPicker && "rotate-180")} />
        </button>

        {showPicker && (
          <div className="border-t border-gray-200 bg-gray-50/50">
            {Object.values(AI_TEXT_MODELS).map((model) => {
              if (aiModel === model.id) return null
              return (
                <button
                  type="button"
                  key={model.id}
                  onClick={() => onSelectModel(model.id)}
                  className="flex w-full items-center gap-3 p-3 hover:bg-white transition-colors border-t border-gray-100 first:border-t-0"
                >
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-neutral-950">{model.name}</span>
                      {model.thinking && (
                        <span className="inline-flex items-center rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-medium text-purple-600">
                          深度思考
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-[#99a1af] truncate">{model.description}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-sm font-semibold text-amber-500">{model.credits}</span>
                    <span className="text-xs text-[#99a1af]">点</span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
