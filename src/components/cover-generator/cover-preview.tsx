"use client"

import { forwardRef } from "react"
import type { TypographyPreset } from "./types"

interface CoverPreviewProps {
  title: string
  author: string
  bgUrl: string | null
  typography: TypographyPreset
  isFinal: boolean
  finalUrl: string | null
}

export const CoverPreview = forwardRef<HTMLDivElement, CoverPreviewProps>(
  ({ title, author, bgUrl, typography, isFinal, finalUrl }, ref) => {
    const bookContainerStyle =
      "relative w-full aspect-[3/4] shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-500 border border-white/10"
    const holographicOverlay =
      "absolute inset-0 bg-gradient-to-tr from-cyan-500/10 via-transparent to-blue-500/10 z-20 pointer-events-none mix-blend-overlay"
    const scanline =
      "absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSIxIiBmaWxsPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMSkiLz4KPC9zdmc+')] z-30 opacity-20 pointer-events-none"

    // 最终封面
    if (isFinal && finalUrl) {
      return (
        <div
          className={`group ${bookContainerStyle} rounded-sm ring-1 ring-white/10 hover:ring-[#00e5ff]/50 transition-all`}
        >
          <div className={holographicOverlay}></div>
          <div className={scanline}></div>

          <img src={finalUrl} alt="Final Cover" className="w-full h-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity z-40 backdrop-blur-sm">
            <a
              href={finalUrl}
              download={`cover-${title}.png`}
              className="bg-[#00e5ff] text-black px-8 py-3 rounded font-bold tracking-widest hover:scale-105 transition-transform flex items-center gap-2 shadow-[0_0_20px_rgba(0,229,255,0.5)]"
            >
              下载封面
            </a>
          </div>
        </div>
      )
    }

    // 草稿预览
    return (
      <div ref={ref} className={`${bookContainerStyle} bg-[#0A0F1C] select-none group`}>
        <div className={holographicOverlay}></div>
        <div className={scanline}></div>

        {/* 角落装饰 */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#00e5ff] z-30 opacity-50"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#00e5ff] z-30 opacity-50"></div>

        {/* 背景图 */}
        {bgUrl ? (
          <img src={bgUrl} alt="Cover Background" className="w-full h-full object-cover opacity-90" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 gap-4 relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.02] flex items-center justify-center pointer-events-none">
              <span className="font-sans font-bold text-[100px] tracking-tighter">LINGJI</span>
            </div>
            <div className="border border-white/10 bg-white/5 p-8 rounded backdrop-blur-sm flex flex-col items-center animate-pulse">
              <span className="text-3xl opacity-50 mb-2">+</span>
              <span className="text-xs tracking-widest uppercase">选择背景</span>
            </div>
          </div>
        )}

        {/* 文字层 (草稿) */}
        <div className="absolute inset-0 p-6 pointer-events-none z-20">
          <div className="flex flex-row-reverse w-full h-full justify-between relative">
            {/* 标题 */}
            <div
              className={`flex flex-col items-center justify-start pt-8 h-full ${typography.cssClass}`}
              style={{
                writingMode: "vertical-rl",
                color: typography.previewColor,
                textShadow: "0 0 10px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5)",
              }}
            >
              <h1 className="text-5xl md:text-6xl font-bold tracking-widest leading-relaxed drop-shadow-xl">
                {title || "灵机写作"}
              </h1>
            </div>

            {/* 作者 */}
            <div
              className={`flex flex-col items-center justify-end pb-8 pl-2 h-full ${typography.cssClass}`}
              style={{
                writingMode: "vertical-rl",
                color: typography.previewColor,
                textShadow: "0 0 10px rgba(0,0,0,0.8)",
              }}
            >
              <p className="text-lg md:text-xl tracking-widest opacity-90 border-r-2 border-white/30 pr-3 mr-2">
                {author ? `${author}` : "作者名"}
              </p>
            </div>

            {/* 品牌标识 */}
            <div className="absolute bottom-4 left-4 border border-[#00e5ff]/50 p-1 opacity-80">
              <div className="px-2 py-1 text-[8px] bg-[#00e5ff]/10 text-[#00e5ff] tracking-widest uppercase">
                灵机写作
              </div>
            </div>
          </div>

          {/* 草稿标签 */}
          <div className="absolute top-3 right-3 px-2 py-0.5 bg-black/50 text-[#00e5ff] border border-[#00e5ff]/30 text-[9px] uppercase tracking-wider backdrop-blur-md">
            Preview
          </div>
        </div>
      </div>
    )
  }
)

CoverPreview.displayName = "CoverPreview"
