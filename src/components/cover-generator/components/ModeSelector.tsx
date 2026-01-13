"use client"

import { Sparkles, Image as ImageIcon, Lock } from "lucide-react"
import type { GenerateMode } from "../types"

interface ModeSelectorProps {
  generateMode: GenerateMode
  onModeChange: (mode: GenerateMode) => void
}

export function ModeSelector({ generateMode, onModeChange }: ModeSelectorProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-[#00e5ff] rounded-full" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#6a7282]">
            生成模式
          </h2>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onModeChange("quick")}
          className={`p-3 rounded-lg border text-left transition-all ${
            generateMode === "quick"
              ? "border-[#00e5ff] bg-[#00e5ff]/10"
              : "border-white/10 hover:border-white/20"
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className={`w-4 h-4 ${generateMode === "quick" ? "text-[#00e5ff]" : "text-white/60"}`} />
            <span className={`text-sm font-bold ${generateMode === "quick" ? "text-[#00e5ff]" : "text-white"}`}>
              快速生成
            </span>
            <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded">推荐</span>
          </div>
          <p className="text-[10px] text-white/40">智能一键生成完整封面</p>
        </button>
        <div className="relative">
          <button
            disabled
            className="w-full p-3 rounded-lg border border-white/10 text-left transition-all opacity-60 cursor-not-allowed"
          >
            <div className="flex items-center gap-2 mb-1">
              <ImageIcon className="w-4 h-4 text-white/40" />
              <span className="text-sm font-bold text-white/60">高级模式</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-white/10 text-white/50 rounded flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" />
                开发中
              </span>
            </div>
            <p className="text-[10px] text-white/30">分步选择背景和字体</p>
          </button>
        </div>
      </div>
    </section>
  )
}
