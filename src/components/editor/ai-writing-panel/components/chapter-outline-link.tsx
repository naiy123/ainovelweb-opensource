"use client"

import { useState } from "react"
import { Layers, Link2, Unlink, ChevronDown, ChevronRight, Target, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import type { OutlineNode } from "@/hooks/use-outline"

interface ChapterOutlineLinkProps {
  linkedOutlineNode?: OutlineNode | null
  availableOutlines?: OutlineNode[]
  outlineNodes?: OutlineNode[]
  onLinkOutline?: (nodeId: string) => void
  onUnlinkOutline?: () => void
  onUseContent?: (content: string) => void
}

export function ChapterOutlineLink({
  linkedOutlineNode,
  availableOutlines = [],
  outlineNodes = [],
  onLinkOutline,
  onUnlinkOutline,
  onUseContent,
}: ChapterOutlineLinkProps) {
  const [showPicker, setShowPicker] = useState(false)
  const [expandedVolumes, setExpandedVolumes] = useState<string[]>([])

  // 获取章纲下的情节点
  const plotPoints = linkedOutlineNode?.children?.filter(
    (child) => child.type === "plot_point"
  ) || []

  // 使用章纲内容
  const handleUseOutlineContent = () => {
    if (linkedOutlineNode?.content && onUseContent) {
      onUseContent(linkedOutlineNode.content)
    }
  }

  // 使用所有情节点
  const handleUseAllPlotPoints = () => {
    if (plotPoints.length > 0 && onUseContent) {
      const content = plotPoints
        .map((p, i) => `${i + 1}. ${p.title}${p.content ? `：${p.content}` : ""}`)
        .join("\n")
      onUseContent(content)
    }
  }

  // 切换卷展开状态
  const toggleVolume = (volumeId: string) => {
    setExpandedVolumes((prev) =>
      prev.includes(volumeId)
        ? prev.filter((id) => id !== volumeId)
        : [...prev, volumeId]
    )
  }

  // 选择章纲
  const handleSelectOutline = (nodeId: string) => {
    onLinkOutline?.(nodeId)
    setShowPicker(false)
  }

  // 查找章纲的父卷
  const findParentVolume = (nodeId: string): OutlineNode | null => {
    for (const volume of outlineNodes) {
      if (volume.children?.some((child) => child.id === nodeId)) {
        return volume
      }
    }
    return null
  }

  const parentVolume = linkedOutlineNode ? findParentVolume(linkedOutlineNode.id) : null

  return (
    <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50/50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="size-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-900">章纲关联</span>
        </div>
        {linkedOutlineNode && (
          <button
            onClick={onUnlinkOutline}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500"
          >
            <Unlink className="size-3" />
            解除关联
          </button>
        )}
      </div>

      {linkedOutlineNode ? (
        // 已关联状态
        <div className="space-y-3">
          {/* 章纲信息 */}
          <div className="rounded-lg border border-blue-200 bg-white p-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {parentVolume && (
                  <p className="mb-1 flex items-center gap-1 text-xs text-gray-500">
                    <BookOpen className="size-3" />
                    {parentVolume.title}
                  </p>
                )}
                <p className="font-medium text-gray-900">{linkedOutlineNode.title}</p>
                {linkedOutlineNode.content && (
                  <p className="mt-1 text-sm text-gray-600 line-clamp-3">
                    {linkedOutlineNode.content}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 情节点列表 */}
          {plotPoints.length > 0 && (
            <div>
              <p className="mb-2 flex items-center gap-1 text-xs font-medium text-gray-600">
                <Target className="size-3" />
                情节点 ({plotPoints.length})
              </p>
              <div className="space-y-1">
                {plotPoints.map((point, index) => (
                  <div
                    key={point.id}
                    className={cn(
                      "flex items-start gap-2 rounded px-2 py-1.5 text-xs",
                      point.completed ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-700"
                    )}
                  >
                    <span className="shrink-0 text-gray-400">{index + 1}.</span>
                    <span className={point.completed ? "line-through opacity-60" : ""}>
                      {point.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-2">
            {linkedOutlineNode.content && (
              <button
                onClick={handleUseOutlineContent}
                className="flex-1 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-medium text-blue-600 hover:bg-blue-50"
              >
                使用章纲内容
              </button>
            )}
            {plotPoints.length > 0 && (
              <button
                onClick={handleUseAllPlotPoints}
                className="flex-1 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-medium text-blue-600 hover:bg-blue-50"
              >
                使用全部情节点
              </button>
            )}
          </div>
        </div>
      ) : (
        // 未关联状态
        <div>
          {availableOutlines.length > 0 ? (
            <div className="relative">
              <button
                onClick={() => setShowPicker(!showPicker)}
                className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-600 hover:border-blue-300"
              >
                <span className="flex items-center gap-2">
                  <Link2 className="size-4 text-gray-400" />
                  选择章纲关联...
                </span>
                <ChevronDown className={cn("size-4 transition-transform", showPicker && "rotate-180")} />
              </button>

              {/* 章纲选择器 */}
              {showPicker && (
                <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-64 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                  {outlineNodes.map((volume) => {
                    const volumeOutlines = availableOutlines.filter(
                      (o) => volume.children?.some((c) => c.id === o.id)
                    )
                    if (volumeOutlines.length === 0) return null

                    const isExpanded = expandedVolumes.includes(volume.id)

                    return (
                      <div key={volume.id}>
                        <button
                          onClick={() => toggleVolume(volume.id)}
                          className="flex w-full items-center gap-2 border-b border-gray-100 px-3 py-2 text-left text-sm hover:bg-gray-50"
                        >
                          {isExpanded ? (
                            <ChevronDown className="size-4 text-gray-400" />
                          ) : (
                            <ChevronRight className="size-4 text-gray-400" />
                          )}
                          <BookOpen className="size-4 text-purple-500" />
                          <span className="font-medium text-gray-700">{volume.title}</span>
                          <span className="text-xs text-gray-400">({volumeOutlines.length})</span>
                        </button>
                        {isExpanded && (
                          <div className="bg-gray-50/50">
                            {volumeOutlines.map((outline) => (
                              <button
                                key={outline.id}
                                onClick={() => handleSelectOutline(outline.id)}
                                className="flex w-full items-center gap-2 px-8 py-2 text-left text-sm hover:bg-blue-50"
                              >
                                <Layers className="size-4 text-blue-500" />
                                <span className="text-gray-700">{outline.title}</span>
                                {outline.linkedChapterId && (
                                  <span className="text-xs text-green-500">(当前)</span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 bg-white px-4 py-6 text-center">
              <Layers className="mx-auto mb-2 size-8 text-gray-300" />
              <p className="text-sm text-gray-500">暂无可用章纲</p>
              <p className="mt-1 text-xs text-gray-400">请先在大纲中创建章纲</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
