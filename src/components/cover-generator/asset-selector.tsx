"use client"

import { PRESET_BACKGROUNDS } from "./constants"

interface AssetSelectorProps {
  selectedId: string | null
  onSelect: (id: string, url: string) => void
}

export function AssetSelector({ selectedId, onSelect }: AssetSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
      {PRESET_BACKGROUNDS.map((bg) => (
        <button
          key={bg.id}
          onClick={() => onSelect(bg.id, bg.url)}
          className={`relative aspect-[3/4] rounded-sm overflow-hidden border transition-all ${
            selectedId === bg.id
              ? "border-[#00e5ff] shadow-[0_0_10px_rgba(0,229,255,0.3)]"
              : "border-white/10 hover:border-white/30"
          }`}
        >
          <img
            src={bg.url}
            alt={bg.name}
            className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white text-[10px] py-1 px-1 truncate border-t border-white/10">
            {bg.name}
          </div>
        </button>
      ))}
    </div>
  )
}
