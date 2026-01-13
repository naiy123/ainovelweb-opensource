"use client"

import { useState } from "react"
import { X, MessageCircle, Copy, Check } from "lucide-react"

interface ContactAdminModalProps {
  isOpen: boolean
  onClose: () => void
  message?: string
}

export function ContactAdminModal({ isOpen, onClose, message }: ContactAdminModalProps) {
  const [copied, setCopied] = useState(false)

  // TODO: 替换为实际的管理员联系方式
  const adminWechat = "lingji_admin"

  if (!isOpen) return null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(adminWechat)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // 降级方案
      const textArea = document.createElement("textarea")
      textArea.value = adminWechat
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          <X className="size-5" />
        </button>

        {/* Content */}
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-blue-50">
            <MessageCircle className="size-8 text-blue-500" />
          </div>

          <h3 className="mb-2 text-lg font-semibold text-gray-900">
            联系管理员
          </h3>

          {message && (
            <p className="mb-4 text-sm text-gray-500">
              {message}
            </p>
          )}

          <p className="mb-4 text-sm text-gray-600">
            如需充值或开通会员，请添加管理员微信
          </p>

          {/* WeChat ID */}
          <div className="mb-6 flex w-full items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">微信号：</span>
              <span className="font-medium text-gray-900">{adminWechat}</span>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 rounded-md bg-blue-500 px-3 py-1.5 text-sm text-white transition-colors hover:bg-blue-600"
            >
              {copied ? (
                <>
                  <Check className="size-4" />
                  已复制
                </>
              ) : (
                <>
                  <Copy className="size-4" />
                  复制
                </>
              )}
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
          >
            我知道了
          </button>
        </div>
      </div>
    </div>
  )
}

// Zustand store for global state
import { create } from "zustand"

interface ContactAdminStore {
  isOpen: boolean
  message?: string
  openContactAdmin: (message?: string) => void
  closeContactAdmin: () => void
}

export const useContactAdminStore = create<ContactAdminStore>((set) => ({
  isOpen: false,
  message: undefined,
  openContactAdmin: (message) => set({ isOpen: true, message }),
  closeContactAdmin: () => set({ isOpen: false, message: undefined }),
}))
