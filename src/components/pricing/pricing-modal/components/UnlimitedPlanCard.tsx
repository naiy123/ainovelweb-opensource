"use client"

import { Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import type { UnlimitedCard } from "../types"

interface UnlimitedPlanCardProps {
  data: UnlimitedCard
  delay: number
}

export function UnlimitedPlanCard({ data, delay }: UnlimitedPlanCardProps) {
  const isSpecial = Boolean(data.tag)
  const isLongTerm = ["月卡", "季卡", "年卡"].includes(data.duration)

  return (
    <div
      className={cn(
        "group relative cursor-pointer overflow-visible rounded-[1.25rem] border p-6 transition-all duration-300",
        isSpecial
          ? "border-orange-200 bg-white shadow-xl shadow-orange-100/50 hover:-translate-y-1 hover:border-orange-300 hover:shadow-orange-200"
          : "border-slate-100 bg-white shadow-md hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Background Decor */}
      <div
        className={cn(
          "pointer-events-none absolute right-0 top-0 rounded-full p-16 opacity-[0.08] blur-3xl transition-opacity group-hover:opacity-20",
          isSpecial ? "bg-orange-500" : "bg-indigo-500"
        )}
        style={{ transform: "translate(30%, -30%)" }}
      />

      {data.tag && (
        <div className="absolute left-0 top-0 z-20 -translate-y-1/2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-3 py-1.5 text-[10px] font-bold text-white shadow-lg">
          {data.tag}
        </div>
      )}

      <div className="relative z-10 flex h-full flex-col justify-between">
        <div>
          <div className="mb-1 flex items-start justify-between">
            <div className="mt-2 flex items-baseline gap-1">
              <span className={cn("text-3xl font-black", isSpecial ? "text-slate-800" : "text-slate-700")}>
                {data.duration}
              </span>
              {!isLongTerm && (
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-bold text-slate-400">
                  无限体验
                </span>
              )}
            </div>
            {isSpecial && (
              <div className="animate-pulse text-orange-500">
                <Sparkles className="size-5" />
              </div>
            )}
          </div>
          <p className="mb-6 text-xs font-medium text-slate-500">{data.desc}</p>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <span className="mb-0.5 block text-xs text-slate-400 line-through">原价 ¥{data.oldPrice}</span>
            <div className="flex items-baseline gap-0.5">
              <span className="text-sm font-bold text-slate-600">¥</span>
              <span
                className={cn(
                  "text-3xl font-black tracking-tighter",
                  isSpecial ? "text-orange-600" : "text-slate-800"
                )}
              >
                {data.price}
              </span>
            </div>
          </div>

          <button
            className={cn(
              "whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold shadow-md transition-all",
              isSpecial
                ? "bg-gradient-to-r from-orange-500 to-red-500 text-white hover:shadow-orange-500/30"
                : "bg-slate-900 text-white hover:bg-black hover:shadow-slate-800/30"
            )}
          >
            立即抢购
          </button>
        </div>
      </div>
    </div>
  )
}
