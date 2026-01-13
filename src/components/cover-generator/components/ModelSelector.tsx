"use client"

import type { QuickModel, QuickModelOption } from "../types"
import { QUICK_MODEL_OPTIONS } from "../constants"

interface ModelSelectorProps {
  quickModel: QuickModel
  onModelChange: (model: QuickModel) => void
}

export function ModelSelector({ quickModel, onModelChange }: ModelSelectorProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-1 h-4 bg-[#00e5ff] rounded-full" />
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#6a7282]">
          选择模型
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {QUICK_MODEL_OPTIONS.map((model) => (
          <button
            key={model.id}
            onClick={() => model.available && onModelChange(model.id)}
            disabled={!model.available}
            className={`p-3 rounded-lg border text-left transition-all ${
              quickModel === model.id && model.available
                ? "border-[#00e5ff] bg-[#00e5ff]/10"
                : model.available
                ? "border-white/10 hover:border-white/20"
                : "border-white/5 opacity-50 cursor-not-allowed"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`text-sm font-bold ${
                quickModel === model.id && model.available ? "text-[#00e5ff]" : "text-white"
              }`}>
                {model.name}
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                model.available
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-white/10 text-white/40"
              }`}>
                {model.credits}点
              </span>
            </div>
            <p className="text-[10px] text-white/40">{model.description}</p>
          </button>
        ))}
      </div>
    </section>
  )
}
