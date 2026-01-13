"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import type { StandardPlan, PeriodType } from "../types"

interface StandardPlanCardProps {
  plan: StandardPlan
  period: PeriodType
  delay: number
}

export function StandardPlanCard({ plan, period, delay }: StandardPlanCardProps) {
  const isBlack = plan.theme === "black"
  const isBlue = plan.theme === "blue"
  const isFree = plan.theme === "gray"

  let displayPrice: number
  if (typeof plan.price === "object") {
    displayPrice = plan.price[period]
  } else {
    displayPrice = plan.price
  }

  const avgPrice =
    typeof plan.price === "object"
      ? period === "monthly"
        ? displayPrice
        : (displayPrice / (period === "yearly" ? 12 : 3)).toFixed(1)
      : 0

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-[1.25rem] border p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl",
        isBlack
          ? "border-slate-800 bg-slate-900 text-white shadow-2xl shadow-slate-900/20"
          : "border-slate-100 bg-white shadow-sm",
        plan.highlight && "ring-2 ring-indigo-400/50"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {plan.highlight && (
        <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-1 text-[10px] font-bold text-white shadow-lg shadow-indigo-200">
          编辑力荐
        </div>
      )}

      {/* Header */}
      <div className="mb-5">
        <h3 className={cn("mb-1 text-lg font-bold", isBlack ? "text-amber-200" : "text-slate-800")}>
          {plan.name}
        </h3>

        <div className="flex h-14 flex-col justify-end">
          {plan.price === 0 ? (
            <span className="text-3xl font-black tracking-tight text-slate-300">免费</span>
          ) : (
            <div className="flex items-baseline gap-0.5">
              <span className="text-sm font-medium opacity-60">¥</span>
              <span
                className={cn(
                  "text-4xl font-black tracking-tighter",
                  isBlack ? "text-white" : "text-slate-900"
                )}
              >
                {displayPrice}
              </span>
              <span className="ml-1 text-xs opacity-60">
                /{period === "monthly" ? "月" : period === "yearly" ? "年" : "季"}
              </span>
            </div>
          )}
        </div>
        {period !== "monthly" && plan.price !== 0 && (
          <div
            className={cn(
              "mt-2 inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium",
              isBlack ? "bg-slate-800 text-slate-400" : "bg-green-50 text-green-700"
            )}
          >
            折合 ¥{avgPrice}/月
            {period === "yearly" && (
              <span className="scale-90 rounded-[2px] bg-red-500 px-1 text-[9px] text-white">
                省30%
              </span>
            )}
          </div>
        )}
      </div>

      {/* Points Info */}
      <div className={cn("border-t border-dashed py-5", isBlack ? "border-slate-800" : "border-slate-100")}>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs opacity-60">每月获赠灵感点</span>
          <span className={cn("font-mono text-lg font-bold", isBlack ? "text-amber-400" : "text-indigo-600")}>
            {plan.points.toLocaleString()}
          </span>
        </div>
        {plan.points > 0 && (
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200/20">
            <div
              className={cn(
                "h-full rounded-full",
                isBlack ? "bg-amber-400" : "bg-gradient-to-r from-indigo-400 to-cyan-400"
              )}
              style={{ width: `${Math.min((plan.points / 30000) * 100, 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* Features */}
      <ul className="mb-6 flex-1 space-y-3">
        {plan.features.map((f, i) => (
          <li key={i} className="flex items-start gap-2.5 text-[13px]">
            <Check className={cn("mt-0.5 size-4 shrink-0", isBlack ? "text-amber-500" : "text-indigo-500")} />
            <span className="font-medium leading-relaxed opacity-80">{f}</span>
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      <button
        className={cn(
          "mt-auto w-full rounded-xl py-3 text-sm font-bold shadow-lg transition-all active:scale-95",
          isBlack
            ? "bg-gradient-to-r from-amber-200 to-amber-500 text-black hover:shadow-amber-500/20"
            : isFree
              ? "bg-slate-100 text-slate-500 shadow-none hover:bg-slate-200"
              : isBlue
                ? "bg-gradient-to-r from-indigo-500 to-blue-600 text-white hover:shadow-indigo-500/30"
                : "bg-slate-900 text-white hover:bg-black hover:shadow-slate-800/30"
        )}
      >
        {plan.cta}
      </button>
    </div>
  )
}
