"use client"

import { useState } from "react"
import { X, Crown, Infinity, Sparkles, Feather } from "lucide-react"
import { cn } from "@/lib/utils"
import { STANDARD_PLANS, UNLIMITED_CARDS } from "./constants"
import { NavButton, StandardPlanCard, UnlimitedPlanCard } from "./components"
import type { PricingModalProps, PeriodType, ViewMode } from "./types"

export type { PricingModalProps, PeriodType, ViewMode, StandardPlan, UnlimitedCard } from "./types"

export function PricingModal({ isOpen, onClose, userInfo }: PricingModalProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("standard")
  const [period, setPeriod] = useState<PeriodType>("monthly")

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative z-10 flex h-[90vh] max-h-[700px] w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] border border-white/60 bg-white/95 shadow-2xl backdrop-blur-2xl transition-all duration-500 md:flex-row">
        {/* Sidebar Navigation */}
        <div className="relative shrink-0 border-b border-gray-100/50 bg-slate-50/80 p-6 md:w-64 md:border-b-0 md:border-r">
          {/* Logo */}
          <div className="mb-8 flex items-center gap-3 md:mb-10">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-500 text-white shadow-lg shadow-indigo-200">
              <Feather className="size-6" />
            </div>
            <div>
              <span className="block text-xl font-black leading-tight tracking-tight text-slate-800">
                灵机写作
              </span>
              <span className="text-[10px] font-medium uppercase tracking-widest text-slate-400">
                LINGJI WRITING
              </span>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="space-y-3">
            <p className="mb-2 pl-2 text-xs font-bold uppercase tracking-wider text-slate-400">订阅模式</p>
            <NavButton
              active={viewMode === "standard"}
              onClick={() => setViewMode("standard")}
              icon={<Crown className="size-5" />}
              title="灵机会员"
              subtitle="按月发放灵感点"
            />
            <NavButton
              active={viewMode === "unlimited"}
              onClick={() => setViewMode("unlimited")}
              icon={<Infinity className="size-5" />}
              title="无限畅享"
              subtitle="有效期内不限次"
              isSpecial
            />
          </div>

          {/* User Info */}
          <div className="mt-auto hidden pt-6 md:block">
            <div className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 text-white font-bold">
                  {userInfo?.nickname?.charAt(0) || "用"}
                </div>
                <div className="overflow-hidden">
                  <div className="truncate text-sm font-bold text-slate-800">
                    {userInfo?.nickname || "用户"}
                  </div>
                  <div className="text-xs font-medium text-indigo-500">
                    余额: {userInfo?.balance ?? 0} 灵感点
                  </div>
                </div>
              </div>
              <button
                onClick={() => userInfo?.onViewRecords?.()}
                className="w-full rounded-lg bg-slate-100 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-200"
              >
                查看充值记录
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="relative flex flex-1 flex-col overflow-hidden bg-slate-50/30">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-20 rounded-full bg-white/60 p-2 text-slate-400 shadow-sm transition-colors hover:bg-white hover:text-slate-800 md:right-6 md:top-6"
          >
            <X className="size-5" />
          </button>

          {/* Header Section */}
          <div className="shrink-0 px-6 pb-4 pt-6 md:px-10 md:pb-6 md:pt-10">
            <h2 className="mb-2 pr-10 text-2xl font-black tracking-tight text-slate-800 md:text-3xl">
              {viewMode === "standard" ? "升级您的灵机创作库" : "开启无限灵感流"}
            </h2>
            <p className="text-sm font-medium text-slate-500">
              {viewMode === "standard"
                ? "按需订阅，灵感常在。适合持续创作、追求极致的你。"
                : "在有效期内不限次数使用智能功能，让灵感如泉涌般爆发。"}
            </p>
          </div>

          {/* Period Selector (Standard Mode Only) */}
          {viewMode === "standard" && (
            <div className="mb-6 shrink-0 px-6 md:mb-8 md:px-10">
              <div className="relative inline-flex rounded-2xl bg-slate-100/80 p-1.5">
                <div
                  className="absolute bottom-1.5 top-1.5 z-0 rounded-xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all duration-300 ease-out"
                  style={{
                    left:
                      period === "monthly"
                        ? "6px"
                        : period === "quarterly"
                          ? "calc(33.33% + 2px)"
                          : "calc(66.66% - 2px)",
                    width: "calc(33.33% - 4px)",
                  }}
                />
                {(["monthly", "quarterly", "yearly"] as PeriodType[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={cn(
                      "relative z-10 flex w-24 items-center justify-center gap-1 py-2 text-sm font-bold transition-colors duration-300 md:w-32",
                      period === p ? "text-slate-800" : "text-slate-500 hover:text-slate-600"
                    )}
                  >
                    {p === "monthly" ? "月付" : p === "quarterly" ? "季付" : "年付"}
                    {p === "quarterly" && (
                      <span className="ml-1 whitespace-nowrap rounded-md border border-red-100 bg-red-50 px-1.5 py-0.5 text-[10px] text-red-500">
                        -10%
                      </span>
                    )}
                    {p === "yearly" && (
                      <span className="ml-1 whitespace-nowrap rounded-md bg-red-500 px-1.5 py-0.5 text-[10px] text-white shadow-sm shadow-red-200">
                        -30%
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Scrollable Content */}
          <div className="custom-scrollbar flex-1 overflow-y-auto px-6 pb-4 md:px-10">
            {viewMode === "standard" ? (
              <div className="grid animate-in grid-cols-1 gap-4 pb-10 pt-2 fade-in-0 sm:grid-cols-2 lg:grid-cols-4">
                {STANDARD_PLANS.map((plan, i) => (
                  <StandardPlanCard key={plan.id} plan={plan} period={period} delay={i * 100} />
                ))}
              </div>
            ) : (
              <div className="flex h-full animate-in flex-col pb-10 pt-2 fade-in-0">
                <div className="mb-8 grid grid-cols-1 gap-6 px-1 sm:grid-cols-2 xl:grid-cols-3">
                  {UNLIMITED_CARDS.map((card, i) => (
                    <UnlimitedPlanCard key={i} data={card} delay={i * 50} />
                  ))}
                </div>

                {/* Info Banner */}
                <div className="mt-auto flex shrink-0 items-start gap-4 rounded-2xl border border-orange-100 bg-gradient-to-r from-amber-50 to-orange-50 p-6 shadow-sm">
                  <div className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-500">
                    <Sparkles className="size-5" />
                  </div>
                  <div>
                    <h4 className="mb-1 text-sm font-bold text-orange-900">无限卡权益说明</h4>
                    <p className="max-w-2xl text-xs leading-relaxed text-orange-800/70">
                      拥有无限卡期间，所有智能生成功能均不扣除您的账户余额（灵感点）。
                      适合需要大量扩充设定、反复推敲剧情、或进行"爆发式"更新的创作阶段。
                      <br />
                      <span className="opacity-60">*无限卡时间可叠加，优先消耗无限卡时长。</span>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="shrink-0 border-t border-slate-100 bg-white/40 px-6 py-4 text-center backdrop-blur-sm md:px-10 md:py-5">
            <p className="flex items-center justify-center gap-2 text-xs text-slate-400">
              <span className="size-1.5 rounded-full bg-emerald-400"></span>
              SSL安全支付
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
