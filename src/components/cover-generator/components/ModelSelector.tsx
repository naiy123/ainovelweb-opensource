"use client"

import { useEffect, useState } from "react"
import { Loader2, Settings } from "lucide-react"
import Link from "next/link"

interface ImageModel {
  id: string
  name: string
  provider: string
  description: string
  configured: boolean
}

interface ModelSelectorProps {
  selectedModel: string
  onModelChange: (modelId: string) => void
}

export function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
  const [models, setModels] = useState<ImageModel[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const res = await fetch("/api/models/available")
        if (res.ok) {
          const data = await res.json()
          setModels(data.imageModels || [])

          // 如果当前选中的模型不在列表中，或未配置，自动选择第一个已配置的模型
          const configuredModels = (data.imageModels || []).filter((m: ImageModel) => m.configured)
          if (configuredModels.length > 0 && !configuredModels.find((m: ImageModel) => m.id === selectedModel)) {
            onModelChange(configuredModels[0].id)
          }
        }
      } catch (error) {
        console.error("Failed to fetch models:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchModels()
  }, [])

  const configuredModels = models.filter(m => m.configured)
  const hasConfiguredModels = configuredModels.length > 0

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-1 h-4 bg-[#00e5ff] rounded-full" />
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#6a7282]">
          选择模型
        </h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-white/40" />
        </div>
      ) : !hasConfiguredModels ? (
        <div className="p-4 rounded-lg border border-amber-500/30 bg-amber-500/10">
          <p className="text-sm text-amber-400 mb-2">未配置图片生成模型</p>
          <Link
            href="/dashboard/profile"
            className="inline-flex items-center gap-1.5 text-xs text-[#00e5ff] hover:underline"
          >
            <Settings className="w-3.5 h-3.5" />
            前往设置配置 API Key
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {models.map((model) => (
            <button
              key={model.id}
              onClick={() => model.configured && onModelChange(model.id)}
              disabled={!model.configured}
              className={`p-3 rounded-lg border text-left transition-all ${
                selectedModel === model.id && model.configured
                  ? "border-[#00e5ff] bg-[#00e5ff]/10"
                  : model.configured
                  ? "border-white/10 hover:border-white/20"
                  : "border-white/5 opacity-50 cursor-not-allowed"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm font-bold ${
                  selectedModel === model.id && model.configured ? "text-[#00e5ff]" : "text-white"
                }`}>
                  {model.name}
                </span>
                {model.configured && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">
                    已配置
                  </span>
                )}
              </div>
              <p className="text-[10px] text-white/40">{model.description}</p>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
