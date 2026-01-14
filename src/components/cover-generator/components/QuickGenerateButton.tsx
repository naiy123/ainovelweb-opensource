"use client"

import { Loader2, Sparkles } from "lucide-react"

interface QuickGenerateButtonProps {
  isGenerating: boolean
  title: string
  genre: string
  onGenerate: () => void
}

export function QuickGenerateButton({
  isGenerating, title, genre, onGenerate,
}: QuickGenerateButtonProps) {
  return (
    <section>
      <button
        onClick={onGenerate}
        disabled={isGenerating || !title || !genre}
        className="w-full py-4 bg-gradient-to-r from-[#2563eb] to-[#00e5ff] text-black rounded-lg font-bold text-sm flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            智能生成中...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            一键生成封面
          </>
        )}
      </button>
      <p className="text-[10px] text-white/30 text-center mt-2">
        将根据书名、类型和描述智能生成专业封面
      </p>
    </section>
  )
}
