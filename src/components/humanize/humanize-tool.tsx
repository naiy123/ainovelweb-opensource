"use client"

import { useState, useCallback, useRef, type ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Copy, RotateCcw, ArrowRight, Loader2, Bird, FileText, Wand2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useContactAdminStore } from "@/components/contact-admin-modal"

export function HumanizeTool() {
  const [inputText, setInputText] = useState("")
  const [outputText, setOutputText] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const openContactAdmin = useContactAdminStore((state) => state.openContactAdmin)

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
        body: JSON.stringify({ text: inputText }),
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
        toast.info("已取消")
      } else {
        const message = error instanceof Error ? error.message : "处理失败"
        if (message.includes("灵感点不足")) {
          openContactAdmin(message)
        } else {
          toast.error(message)
        }
      }
    } finally {
      setIsProcessing(false)
      abortControllerRef.current = null
    }
  }, [inputText, openContactAdmin])

  const handleCancel = useCallback(() => {
    abortControllerRef.current?.abort()
  }, [])

  const handleCopy = useCallback(() => {
    if (outputText) {
      navigator.clipboard.writeText(outputText)
      toast.success("已复制")
    }
  }, [outputText])

  const handleReset = useCallback(() => {
    setInputText("")
    setOutputText("")
  }, [])

  const handleUseAsInput = useCallback(() => {
    if (outputText) {
      setInputText(outputText)
      setOutputText("")
    }
  }, [outputText])

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 标题栏 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-500 to-orange-500">
            <Bird className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-neutral-950">朱雀降重</h1>
            <p className="text-sm text-gray-500">网文风格改写，降低AI检测率</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleReset}>
          <RotateCcw className="w-4 h-4 mr-1" />
          重置
        </Button>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* 左侧：输入 */}
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-neutral-950 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-gray-500" />
              原文（整章）
            </Label>
            <span className="text-xs text-gray-500">{inputText.length} 字</span>
          </div>
          <textarea
            value={inputText}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setInputText(e.target.value)}
            placeholder="粘贴需要改写的章节内容..."
            className="flex-1 resize-none w-full rounded-lg border border-gray-200 p-4 text-sm outline-none placeholder:text-gray-400 focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
            disabled={isProcessing}
          />
        </div>

        {/* 中间：操作 */}
        <div className="flex flex-col items-center justify-center gap-3 px-2">
          {isProcessing ? (
            <div className="flex flex-col items-center gap-2">
              <Button variant="destructive" size="lg" onClick={handleCancel}>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                取消
              </Button>
              <span className="text-xs text-gray-500">✍️ 创作中...</span>
            </div>
          ) : (
            <Button
              size="lg"
              onClick={handleHumanize}
              disabled={!inputText.trim()}
              className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              开始改写
            </Button>
          )}

          {outputText && !isProcessing && (
            <Button variant="ghost" size="sm" onClick={handleUseAsInput}>
              <RotateCcw className="w-3 h-3 mr-1" />
              再次改写
            </Button>
          )}
        </div>

        {/* 右侧：输出 */}
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-neutral-950 flex items-center gap-1.5">
              <Wand2 className="w-4 h-4 text-orange-500" />
              改写结果
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{outputText.length} 字</span>
              {outputText && (
                <Button variant="ghost" size="sm" onClick={handleCopy}>
                  <Copy className="w-3 h-3 mr-1" />
                  复制
                </Button>
              )}
            </div>
          </div>
          <div className="flex-1 relative">
            <textarea
              value={outputText}
              readOnly
              placeholder={isProcessing ? "正在创作..." : "改写结果"}
              className={cn(
                "h-full w-full resize-none rounded-lg border border-gray-200 p-4 text-sm outline-none",
                "bg-gray-50"
              )}
            />
            {isProcessing && (
              <div className="absolute bottom-3 right-3">
                <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 底部 */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-500 text-center">
          基于网文作家风格改写，保持原意、融入行文特色
        </p>
      </div>
    </div>
  )
}
