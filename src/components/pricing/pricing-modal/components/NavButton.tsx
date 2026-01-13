"use client"

import { cn } from "@/lib/utils"

interface NavButtonProps {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  title: string
  subtitle: string
  isSpecial?: boolean
}

export function NavButton({ active, onClick, icon, title, subtitle, isSpecial }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative w-full overflow-hidden rounded-xl p-3.5 text-left transition-all duration-300",
        active
          ? "bg-white shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] ring-1 ring-black/5"
          : "hover:bg-slate-100/80"
      )}
    >
      {isSpecial && active && (
        <div className="absolute inset-0 bg-gradient-to-r from-amber-50 to-orange-50 opacity-100" />
      )}

      <div className="relative flex items-center gap-3.5">
        <div
          className={cn(
            "rounded-xl p-2.5 transition-all duration-300",
            active
              ? isSpecial
                ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-orange-200"
                : "bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-lg shadow-blue-200"
              : "bg-slate-100 text-slate-500 group-hover:scale-110 group-hover:bg-white group-hover:text-indigo-600"
          )}
        >
          {icon}
        </div>
        <div>
          <div className={cn("text-[15px] font-bold", active ? "text-slate-800" : "text-slate-500")}>
            {title}
          </div>
          <div className={cn("text-[11px]", active ? "text-slate-500" : "text-slate-400")}>
            {subtitle}
          </div>
        </div>
      </div>
    </button>
  )
}
