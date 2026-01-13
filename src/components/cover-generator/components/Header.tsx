"use client"

import { Coins, Image as ImageIcon } from "lucide-react"
import type { Step, GenerateMode } from "../types"

interface HeaderProps {
  step: Step
  generateMode: GenerateMode
  userBalance: number | null
}

export function Header({ step, generateMode, userBalance }: HeaderProps) {
  return (
    <header className="glass-panel-dark border-b border-white/5 px-8 py-4 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <ImageIcon className="w-6 h-6 text-[#00e5ff]" />
        <div className="flex flex-col">
          <h1 className="text-lg font-bold tracking-wider text-white leading-none">
            智能封面工坊{" "}
            <span className="text-[#00e5ff] font-normal opacity-80">COVER STUDIO</span>
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20 rounded-full px-4 py-1.5">
        <Coins className="w-4 h-4 text-amber-400" />
        <span className="text-sm font-medium text-amber-300">
          {userBalance !== null ? <>{userBalance} 灵感点</> : "--"}
        </span>
      </div>

      {generateMode === "advanced" && (
        <div className="hidden md:flex items-center gap-1 text-xs font-medium bg-black/20 rounded-full p-1 px-2 border border-white/5">
          {[
            { id: "background", label: "01 背景" },
            { id: "style", label: "02 字体" },
            { id: "generate", label: "03 生成" },
          ].map((s) => (
            <div
              key={s.id}
              className={`px-4 py-1.5 rounded-full transition-all ${
                step === s.id
                  ? "bg-[#00e5ff] text-black shadow-[0_0_15px_rgba(0,229,255,0.4)]"
                  : "text-[#6a7282]"
              }`}
            >
              {s.label}
            </div>
          ))}
        </div>
      )}
    </header>
  )
}
