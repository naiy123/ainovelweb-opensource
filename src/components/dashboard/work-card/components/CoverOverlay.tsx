"use client"

import { Sparkles, Loader2, Download } from "lucide-react"

interface CoverOverlayProps {
  coverUrl?: string
  title: string
  isGenerating: boolean
  onGenerateClick: () => void
  onDownloadClick: () => void
}

export function CoverOverlay({
  coverUrl,
  title,
  isGenerating,
  onGenerateClick,
  onDownloadClick,
}: CoverOverlayProps) {
  return (
    <div className="relative w-full aspect-[3/4] bg-gray-100">
      {coverUrl && (
        <div
          className="absolute inset-0"
          style={{ backgroundImage: `url(${coverUrl})`, backgroundSize: "cover", backgroundPosition: "center" }}
        />
      )}

      {/* AI Generate Cover Button - show on hover when no cover, always show when generating */}
      {(!coverUrl || isGenerating) && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onGenerateClick()
            }}
            disabled={isGenerating}
            className={`pointer-events-auto flex flex-col items-center justify-center gap-1.5 px-4 py-3 rounded-lg transition-opacity bg-black/40 hover:bg-black/60 ${
              isGenerating ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="size-6 text-white animate-spin" />
                <span className="text-xs text-white font-medium">生成中...</span>
              </>
            ) : (
              <>
                <Sparkles className="size-6 text-white" />
                <span className="text-xs text-white font-medium">智能生成封面</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Download Button - show on hover when has cover */}
      {coverUrl && (
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onDownloadClick()
          }}
          className="absolute left-2 top-2 flex size-8 items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
          title="下载封面"
        >
          <Download className="size-4 text-white" />
        </button>
      )}

      {/* Title at Bottom */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-3 pb-2 pt-6">
        <h3 className="text-base font-medium text-white truncate">{title}</h3>
      </div>
    </div>
  )
}
