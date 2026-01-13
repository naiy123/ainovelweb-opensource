"use client"

import { X, Download } from "lucide-react"
import type { HistoryImage } from "../types"

interface ImagePreviewModalProps {
  previewImage: HistoryImage | null
  onClose: () => void
  onDownload: (url: string, filename: string) => void
}

export function ImagePreviewModal({ previewImage, onClose, onDownload }: ImagePreviewModalProps) {
  if (!previewImage) return null

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-8"
      onClick={onClose}
    >
      <div
        className="relative max-w-[400px] w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white/60 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>

        <img
          src={previewImage.imageUrl}
          alt={previewImage.title || "Preview"}
          className="w-full aspect-[3/4] object-cover rounded-lg shadow-2xl"
        />

        <div className="mt-4 flex items-center justify-between">
          <div className="text-white">
            <p className="text-sm font-bold">
              {previewImage.type === "cover" ? previewImage.title : "智能生成背景"}
            </p>
            {previewImage.author && (
              <p className="text-xs text-white/60">{previewImage.author}</p>
            )}
            <p className="text-[10px] text-white/40 mt-1">
              {new Date(previewImage.createdAt).toLocaleString("zh-CN")}
            </p>
          </div>

          <button
            onClick={() =>
              onDownload(
                previewImage.imageUrl,
                `${previewImage.title || previewImage.type}_${previewImage.id}.png`
              )
            }
            className="px-4 py-2 bg-[#00e5ff] text-black rounded font-bold text-xs flex items-center gap-2"
          >
            <Download className="w-3 h-3" />
            下载
          </button>
        </div>
      </div>
    </div>
  )
}
