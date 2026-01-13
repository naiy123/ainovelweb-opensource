"use client"

import { Plus, FileText } from "lucide-react"
import { OutlineNodeItem } from "./outline-node-item"
import type { OutlineNode } from "@/hooks/use-outline"

interface OutlineTreeProps {
  nodes: OutlineNode[]
  selectedNodeId?: string
  onSelectNode: (nodeId: string) => void
  onCreateNode?: (parentId?: string) => void
  onDeleteNode?: (nodeId: string) => void
}

export function OutlineTree({
  nodes,
  selectedNodeId,
  onSelectNode,
  onCreateNode,
  onDeleteNode,
}: OutlineTreeProps) {
  if (nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <FileText className="size-10 text-gray-300 mb-2" />
        <p className="text-sm text-gray-500 mb-3">还没有大纲</p>
        {onCreateNode && (
          <button
            onClick={() => onCreateNode()}
            className="flex items-center gap-1 rounded-md bg-[#2b7fff] px-3 py-1.5 text-sm text-white hover:bg-[#2b7fff]/90"
          >
            <Plus className="size-4" />
            创建大纲
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-0.5">
      {/* 新建根节点按钮 */}
      {onCreateNode && (
        <button
          onClick={() => onCreateNode()}
          className="flex h-7 w-full items-center gap-2 rounded px-2 text-xs text-[#2b7fff] hover:bg-[#2b7fff]/5"
        >
          <Plus className="size-3" />
          <span>新建卷纲</span>
        </button>
      )}

      {/* 大纲树 */}
      {nodes.map((node) => (
        <OutlineNodeItem
          key={node.id}
          node={node}
          level={0}
          selectedNodeId={selectedNodeId}
          onSelect={onSelectNode}
          onCreateChild={onCreateNode}
          onDelete={onDeleteNode}
        />
      ))}
    </div>
  )
}
