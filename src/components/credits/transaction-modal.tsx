"use client"

import { useEffect, useState, useCallback } from "react"
import { X, ArrowDownCircle, ArrowUpCircle, Gift, RotateCcw, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Transaction {
  id: string
  amount: number
  balanceAfter: number
  type: string
  category: string | null
  description: string | null
  createdAt: string
}

interface TransactionModalProps {
  isOpen: boolean
  onClose: () => void
}

const typeConfig: Record<string, { label: string; icon: typeof ArrowDownCircle; color: string }> = {
  consume: { label: "消费", icon: ArrowUpCircle, color: "text-red-500" },
  recharge: { label: "充值", icon: ArrowDownCircle, color: "text-green-500" },
  gift: { label: "赠送", icon: Gift, color: "text-amber-500" },
  refund: { label: "退款", icon: RotateCcw, color: "text-blue-500" },
}

const categoryLabels: Record<string, string> = {
  welcome: "新用户赠送",
  chapter_generation: "章节生成",
  cover_generation: "封面生成",
  inspiration: "灵感生成",
  subscription: "订阅赠送",
}

export function TransactionModal({ isOpen, onClose }: TransactionModalProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)

  const fetchTransactions = useCallback(async (cursor?: string) => {
    try {
      const isLoadMore = !!cursor
      if (isLoadMore) {
        setLoadingMore(true)
      } else {
        setLoading(true)
      }

      const url = new URL("/api/user/credits/transactions", window.location.origin)
      if (cursor) url.searchParams.set("cursor", cursor)

      const res = await fetch(url.toString())
      if (!res.ok) throw new Error("Failed to fetch")

      const data = await res.json()

      if (isLoadMore) {
        setTransactions((prev) => [...prev, ...data.transactions])
      } else {
        setTransactions(data.transactions)
        setBalance(data.balance)
      }
      setNextCursor(data.nextCursor)
      setHasMore(data.hasMore)
    } catch (error) {
      console.error("Failed to fetch transactions:", error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      fetchTransactions()
    }
  }, [isOpen, fetchTransactions])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getTypeInfo = (type: string) => {
    return typeConfig[type] || { label: type, icon: ArrowUpCircle, color: "text-gray-500" }
  }

  const getCategoryLabel = (category: string | null) => {
    if (!category) return ""
    return categoryLabels[category] || category
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 flex h-[80vh] max-h-[600px] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">灵感点记录</h2>
            <p className="text-sm text-gray-500">当前余额: <span className="font-semibold text-indigo-600">{balance}</span> 点</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="size-6 animate-spin text-indigo-500" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center text-gray-400">
              <Gift className="mb-2 size-10" />
              <p>暂无记录</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => {
                const typeInfo = getTypeInfo(tx.type)
                const Icon = typeInfo.icon
                const isPositive = tx.amount > 0

                return (
                  <div
                    key={tx.id}
                    className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-4 transition-colors hover:bg-gray-50"
                  >
                    <div className={cn("flex size-10 items-center justify-center rounded-full bg-white shadow-sm", typeInfo.color)}>
                      <Icon className="size-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{typeInfo.label}</span>
                        {tx.category && (
                          <span className="truncate text-xs text-gray-400">
                            {getCategoryLabel(tx.category)}
                          </span>
                        )}
                      </div>
                      {tx.description && (
                        <p className="mt-0.5 truncate text-xs text-gray-400">{tx.description}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-400">{formatDate(tx.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <span className={cn("text-lg font-bold", isPositive ? "text-green-600" : "text-red-500")}>
                        {isPositive ? "+" : ""}{tx.amount}
                      </span>
                      <p className="text-xs text-gray-400">余额 {tx.balanceAfter}</p>
                    </div>
                  </div>
                )
              })}

              {/* Load More */}
              {hasMore && (
                <button
                  onClick={() => nextCursor && fetchTransactions(nextCursor)}
                  disabled={loadingMore}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 text-sm text-gray-500 transition-colors hover:bg-gray-50 disabled:opacity-50"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      加载中...
                    </>
                  ) : (
                    "加载更多"
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
