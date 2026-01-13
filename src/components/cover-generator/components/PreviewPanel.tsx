"use client"

import { Loader2, Download, Image as ImageIcon } from "lucide-react"
import type { ImageData } from "../types"

interface PreviewPanelProps {
  resultImage: string | null
  backgroundImage: ImageData | null
  title: string
  author: string
  isGenerating: boolean
  onDownload: (url: string, filename: string) => void
}

export function PreviewPanel({
  resultImage, backgroundImage, title, author, isGenerating, onDownload,
}: PreviewPanelProps) {
  return (
    <div className="flex-1 min-h-[300px] lg:min-h-0 flex items-center justify-center p-4 lg:p-6 relative overflow-auto">
      <div
        className="absolute inset-0 z-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0, 229, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 229, 255, 0.1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-4 w-full h-full max-h-full">
        {/* 响应式图片容器：移动端小一点，大屏根据可用空间自适应 */}
        <div className="w-full max-w-[280px] sm:max-w-[320px] md:max-w-[380px] lg:max-w-[420px] xl:max-w-[500px] aspect-[3/4] rounded-lg overflow-hidden border border-white/20 shadow-[0_0_30px_rgba(0,0,0,0.5)] bg-[#111827]">
          {resultImage ? (
            <img src={resultImage} alt="Generated Cover" className="w-full h-full object-cover" />
          ) : backgroundImage ? (
            <div className="relative w-full h-full">
              <img
                src={backgroundImage.preview}
                alt="Preview"
                className="w-full h-full object-cover opacity-70"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white/80">
                <span className="text-7xl font-bold drop-shadow-lg">{title || "书名"}</span>
                <span className="text-3xl mt-6 drop-shadow-md">{author || "作者"}</span>
              </div>
            </div>
          ) : isGenerating ? (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <Loader2 className="w-12 h-12 text-[#00e5ff] animate-spin mb-4" />
              <span className="text-sm text-white/60">正在智能生成封面...</span>
              <span className="text-xs text-white/30 mt-2">预计需要 30-60 秒</span>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-white/30">
              <ImageIcon className="w-12 h-12 mb-2 opacity-30" />
              <span className="text-xs">封面预览</span>
            </div>
          )}
        </div>

        {resultImage && (
          <button
            onClick={() => onDownload(resultImage, `${title || "cover"}_封面.png`)}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded text-xs text-white flex items-center gap-2"
          >
            <Download className="w-3 h-3" />
            下载封面
          </button>
        )}
      </div>
    </div>
  )
}
