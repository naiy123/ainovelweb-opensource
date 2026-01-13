"use client"

import { useState, useCallback, useRef } from "react"
import { Sparkles, X, Copy, RotateCcw, Loader2, Check, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type HumanizeStyle = "natural" | "literary" | "casual"

const STYLE_OPTIONS: { value: HumanizeStyle; label: string }[] = [
  { value: "natural", label: "自然" },
  { value: "literary", label: "文学" },
  { value: "casual", label: "口语" },
]

interface AIHumanizePanelProps {
  selectedText: string           // 编辑器中选中的文本
  onReplace: (text: string) => void  // 替换选中文本的回调
  onClose?: () => void
}

export function AIHumanizePanel({
  selectedText,
  onReplace,
  onClose,
}: AIHumanizePanelProps) {
  const [inputText, setInputText] = useState(selectedText)
  const [outputText, setOutputText] = useState("")
  const [style, setStyle] = useState<HumanizeStyle>("natural")
  const [isProcessing, setIsProcessing] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  // 开始降AI率处理
  const handleHumanize = useCallback(async () => {
    if (!inputText.trim()) {
      toast.error("请输入需要改写的文本")
      return
    }

    if (inputText.length < 10) {
      toast.error("文本至少需要10个字符")
      return
    }

    setIsProcessing(true)
    setOutputText("")

    abortControllerRef.current = new AbortController()

    try {
      const response = await fetch("/api/humanize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: inputText,
          style,
          preserveLength: true,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "处理失败")
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error("无法读取响应")
      }

      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6))

              if (data.type === "content" && data.text) {
                setOutputText((prev) => prev + data.text)
              } else if (data.type === "done") {
                toast.success("改写完成")
              } else if (data.type === "error") {
                throw new Error(data.message)
              }
            } catch {
              // 忽略 JSON 解析错误
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        toast.info("已取消处理")
      } else {
        toast.error(error instanceof Error ? error.message : "处理失败")
      }
    } finally {
      setIsProcessing(false)
      abortControllerRef.current = null
    }
  }, [inputText, style])

  // 取消处理
  const handleCancel = useCallback(() => {
    abortControllerRef.current?.abort()
  }, [])

  // 复制结果
  const handleCopy = useCallback(() => {
    if (outputText) {
      navigator.clipboard.writeText(outputText)
      toast.success("已复制")
    }
  }, [outputText])

  // 应用到编辑器
  const handleApply = useCallback(() => {
    if (outputText) {
      onReplace(outputText)
      toast.success("已替换")
      onClose?.()
    }
  }, [outputText, onReplace, onClose])

  // 再次改写
  const handleRetry = useCallback(() => {
    if (outputText) {
      setInputText(outputText)
      setOutputText("")
    }
  }, [outputText])

  return (
    <aside className="flex h-full w-80 flex-col border-l border-gray-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 p-4">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
            <Sparkles className="size-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-neutral-950">AI 降重</h3>
            <p className="text-xs text-[#6a7282]">降低AI检测率</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="flex size-7 items-center justify-center rounded hover:bg-gray-100">
            <X className="size-4 text-[#6a7282]" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {/* 风格选择 */}
        <div className="mb-4">
          <label className="mb-2 block text-xs font-medium text-neutral-950">改写风格</label>
          <div className="flex gap-2">
            {STYLE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStyle(opt.value)}
                disabled={isProcessing}
                className={cn(
                  "flex-1 h-8 rounded border text-xs transition-colors",
                  style === opt.value
                    ? "border-purple-500 bg-purple-50 text-purple-600"
                    : "border-gray-200 text-gray-600 hover:border-purple-300"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 原始文本 */}
        <div className="mb-4">
          <div className="mb-1 flex items-center justify-between">
            <label className="text-xs font-medium text-neutral-950">原始文本</label>
            <span className="text-xs text-[#99a1af]">{inputText.length} 字</span>
          </div>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="输入或粘贴文本..."
            disabled={isProcessing}
            className="h-32 w-full resize-none rounded border border-gray-200 p-3 text-sm outline-none placeholder:text-gray-400 focus:border-purple-500"
          />
        </div>

        {/* 处理按钮 */}
        <div className="mb-4">
          {isProcessing ? (
            <button
              onClick={handleCancel}
              className="flex h-10 w-full items-center justify-center gap-2 rounded bg-red-500 text-white hover:bg-red-600"
            >
              <Loader2 className="size-4 animate-spin" />
              取消
            </button>
          ) : (
            <button
              onClick={handleHumanize}
              disabled={!inputText.trim() || inputText.length < 10}
              className="flex h-10 w-full items-center justify-center gap-2 rounded bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
            >
              <ArrowRight className="size-4" />
              开始改写
            </button>
          )}
        </div>

        {/* 改写结果 */}
        <div className="mb-4">
          <div className="mb-1 flex items-center justify-between">
            <label className="text-xs font-medium text-neutral-950">改写结果</label>
            <span className="text-xs text-[#99a1af]">{outputText.length} 字</span>
          </div>
          <div className="relative">
            <textarea
              value={outputText}
              readOnly
              placeholder={isProcessing ? "正在改写..." : "结果将显示在这里..."}
              className="h-32 w-full resize-none rounded border border-gray-200 bg-gray-50 p-3 text-sm outline-none"
            />
            {isProcessing && (
              <div className="absolute bottom-2 right-2">
                <Loader2 className="size-4 animate-spin text-purple-500" />
              </div>
            )}
          </div>
        </div>

        {/* 操作按钮 */}
        {outputText && !isProcessing && (
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex h-9 flex-1 items-center justify-center gap-1 rounded border border-gray-200 text-xs text-gray-600 hover:border-purple-300 hover:text-purple-600"
            >
              <Copy className="size-3" />
              复制
            </button>
            <button
              onClick={handleRetry}
              className="flex h-9 flex-1 items-center justify-center gap-1 rounded border border-gray-200 text-xs text-gray-600 hover:border-purple-300 hover:text-purple-600"
            >
              <RotateCcw className="size-3" />
              再改
            </button>
            <button
              onClick={handleApply}
              className="flex h-9 flex-1 items-center justify-center gap-1 rounded bg-purple-500 text-xs text-white hover:bg-purple-600"
            >
              <Check className="size-3" />
              应用
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 p-3">
        <p className="text-center text-xs text-[#99a1af]">
          改写后保持原意，表达更自然
        </p>
      </div>
    </aside>
  )
}
