"use client"

import { Loader2, ChevronDown } from "lucide-react"
import type { HistoryImage } from "../types"

interface HistoryPanelProps {
  historyImages: HistoryImage[]
  historyLoading: boolean
  historyHasMore: boolean
  historyExpanded: boolean
  historyNextCursor: string | null
  onPreview: (img: HistoryImage) => void
  onLoadMore: (cursor?: string) => void
  onToggleExpand: () => void
}

export function HistoryPanel({
  historyImages, historyLoading, historyHasMore, historyExpanded,
  historyNextCursor, onPreview, onLoadMore, onToggleExpand,
}: HistoryPanelProps) {
  return (
    <div className={`flex-shrink-0 ${historyExpanded ? "absolute inset-0 z-20" : "h-[180px] lg:h-auto"} border-t border-white/10 bg-black/95 p-3 lg:p-4 overflow-hidden flex flex-col transition-all duration-300`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider">
          生成历史 / HISTORY
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/30">{historyImages.length} 张</span>
          <button
            onClick={onToggleExpand}
            className="text-xs text-white/50 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1 rounded flex items-center gap-1.5 transition-all"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${historyExpanded ? "" : "rotate-180"}`} />
            {historyExpanded ? "收起" : "展开"}
          </button>
        </div>
      </div>

      <div className={`flex-1 overflow-x-auto ${historyExpanded ? "overflow-y-auto" : "overflow-y-hidden"} custom-scrollbar`}>
        <div className={`${historyExpanded ? "grid grid-cols-6 gap-3" : "flex gap-3 h-full"} pb-2`}>
          {historyImages.map((img) => (
            <button
              key={img.id}
              onClick={() => onPreview(img)}
              className={`${historyExpanded ? "aspect-[3/4]" : "flex-shrink-0 h-full aspect-[3/4]"} rounded overflow-hidden border border-white/10 hover:border-[#00e5ff]/50 transition-all group relative`}
            >
              <img
                src={img.imageUrl}
                alt={img.title || "Generated"}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-end pb-2">
                <span className="text-[10px] text-white truncate max-w-full px-1">
                  {img.type === "cover" ? img.title : "背景"}
                </span>
                <span className="text-[8px] text-white/50">
                  {img.type === "cover" ? "封面" : "背景"}
                </span>
              </div>
            </button>
          ))}

          {historyHasMore && (
            <button
              onClick={() => onLoadMore(historyNextCursor || undefined)}
              disabled={historyLoading}
              className={`${historyExpanded ? "aspect-[3/4]" : "flex-shrink-0 h-full aspect-[3/4]"} rounded border border-dashed border-white/20 hover:border-white/40 flex flex-col items-center justify-center text-white/40 hover:text-white/60 transition-all`}
            >
              {historyLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  <span className="text-[10px] mt-1">更多</span>
                </>
              )}
            </button>
          )}

          {historyImages.length === 0 && !historyLoading && (
            <div className="flex-1 flex items-center justify-center text-white/20 text-xs">
              暂无生成记录
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
