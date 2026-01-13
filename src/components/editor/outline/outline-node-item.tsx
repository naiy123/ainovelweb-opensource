"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, BookOpen, Layers, Target, Plus, Trash2, Check, Link } from "lucide-react"
import { cn } from "@/lib/utils"
import { canCreateChild, type OutlineNode, type OutlineNodeType } from "@/hooks/use-outline"

interface OutlineNodeItemProps {
  node: OutlineNode
  level: number
  selectedNodeId?: string
  onSelect: (nodeId: string) => void
  onCreateChild?: (parentId: string) => void
  onDelete?: (nodeId: string) => void
}

const TYPE_ICONS: Record<OutlineNodeType, typeof BookOpen> = {
  volume: BookOpen,
  chapter_outline: Layers,
  plot_point: Target,
}

const TYPE_COLORS: Record<OutlineNodeType, string> = {
  volume: "text-purple-600",
  chapter_outline: "text-blue-600",
  plot_point: "text-green-600",
}

export function OutlineNodeItem({
  node,
  level,
  selectedNodeId,
  onSelect,
  onCreateChild,
  onDelete,
}: OutlineNodeItemProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [showActions, setShowActions] = useState(false)

  const hasChildren = node.children && node.children.length > 0
  const isSelected = selectedNodeId === node.id
  const Icon = TYPE_ICONS[node.type] || Target
  const iconColor = TYPE_COLORS[node.type] || "text-gray-600"

  // 限制嵌套层级显示（最多5层缩进）
  const indent = Math.min(level, 5) * 16

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-1 rounded px-2 py-1.5 cursor-pointer transition-colors",
          isSelected ? "bg-[#2b7fff]/10 text-[#2b7fff]" : "hover:bg-gray-50"
        )}
        style={{ paddingLeft: `${indent + 8}px` }}
        onClick={() => onSelect(node.id)}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* 展开/折叠按钮 */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            setIsExpanded(!isExpanded)
          }}
          className={cn(
            "flex size-5 items-center justify-center rounded hover:bg-gray-200",
            !hasChildren && "invisible"
          )}
        >
          {isExpanded ? (
            <ChevronDown className="size-3.5" />
          ) : (
            <ChevronRight className="size-3.5" />
          )}
        </button>

        {/* 类型图标 */}
        <Icon className={cn("size-4 shrink-0", iconColor)} />

        {/* 完成状态（情节点） */}
        {node.type === "plot_point" && node.completed && (
          <Check className="size-3.5 text-green-500 shrink-0" />
        )}

        {/* 关联章节指示（章纲） */}
        {node.type === "chapter_outline" && node.linkedChapterId && (
          <Link className="size-3 text-blue-400 shrink-0" />
        )}

        {/* 标题 */}
        <span className={cn(
          "flex-1 truncate text-sm",
          node.type === "plot_point" && node.completed && "line-through text-gray-400"
        )}>
          {node.title}
        </span>

        {/* 操作按钮 */}
        {showActions && (
          <div className="flex items-center gap-0.5">
            {onCreateChild && canCreateChild(node.type) && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onCreateChild(node.id)
                }}
                className="flex size-6 items-center justify-center rounded hover:bg-gray-200"
                title="添加子节点"
              >
                <Plus className="size-3.5 text-gray-500" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(node.id)
                }}
                className="flex size-6 items-center justify-center rounded hover:bg-red-100"
                title="删除"
              >
                <Trash2 className="size-3.5 text-red-500" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* 子节点 */}
      {isExpanded && hasChildren && (
        <div>
          {node.children!.map((child) => (
            <OutlineNodeItem
              key={child.id}
              node={child}
              level={level + 1}
              selectedNodeId={selectedNodeId}
              onSelect={onSelect}
              onCreateChild={onCreateChild}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
