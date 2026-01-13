import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

// ==================== 大纲节点类型 ====================
// 层级约束: 卷纲(volume) > 章纲(chapter_outline) > 情节点(plot_point)

export const OUTLINE_NODE_TYPES = ["volume", "chapter_outline", "plot_point"] as const
export type OutlineNodeType = (typeof OUTLINE_NODE_TYPES)[number]

export const OUTLINE_NODE_TYPE_LABELS: Record<OutlineNodeType, string> = {
  volume: "卷纲",
  chapter_outline: "章纲",
  plot_point: "情节点",
}

// 根据父节点类型获取子节点类型
export function getChildNodeType(parentType: OutlineNodeType | null): OutlineNodeType {
  if (!parentType) return "volume"
  if (parentType === "volume") return "chapter_outline"
  if (parentType === "chapter_outline") return "plot_point"
  return "plot_point"
}

// 检查是否可以创建子节点
export function canCreateChild(type: OutlineNodeType): boolean {
  return type !== "plot_point"
}

// ==================== 大纲节点接口 ====================

export interface OutlineNode {
  id: string
  novelId: string
  parentId: string | null
  linkedChapterId: string | null
  title: string
  content: string | null
  type: OutlineNodeType
  sortOrder: number
  completed: boolean
  createdAt: string
  updatedAt: string
  children?: OutlineNode[]
}

export interface CreateOutlineNodeInput {
  novelId: string
  parentId?: string | null
  title: string
  content?: string | null
  linkedChapterId?: string | null
}

export interface UpdateOutlineNodeInput {
  novelId: string
  nodeId: string
  parentId?: string | null
  title?: string
  content?: string | null
  sortOrder?: number
  linkedChapterId?: string | null
  completed?: boolean
}

export interface ReorderOutlineNodesInput {
  novelId: string
  updates: Array<{
    id: string
    parentId?: string | null
    sortOrder: number
  }>
}

// ==================== 大纲节点 API 函数 ====================

async function fetchOutlineNodes(novelId: string): Promise<OutlineNode[]> {
  const response = await fetch(`/api/novels/${novelId}/outline`)
  if (!response.ok) {
    throw new Error("获取大纲失败")
  }
  return response.json()
}

async function fetchOutlineNode(novelId: string, nodeId: string): Promise<OutlineNode> {
  const response = await fetch(`/api/novels/${novelId}/outline/${nodeId}`)
  if (!response.ok) {
    throw new Error("获取大纲节点失败")
  }
  return response.json()
}

async function createOutlineNode({ novelId, ...data }: CreateOutlineNodeInput): Promise<OutlineNode> {
  const response = await fetch(`/api/novels/${novelId}/outline`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "创建大纲节点失败")
  }
  return response.json()
}

async function updateOutlineNode({ novelId, nodeId, ...data }: UpdateOutlineNodeInput): Promise<OutlineNode> {
  const response = await fetch(`/api/novels/${novelId}/outline/${nodeId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "更新大纲节点失败")
  }
  return response.json()
}

async function deleteOutlineNode(novelId: string, nodeId: string): Promise<void> {
  const response = await fetch(`/api/novels/${novelId}/outline/${nodeId}`, {
    method: "DELETE",
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "删除大纲节点失败")
  }
}

async function reorderOutlineNodes({ novelId, updates }: ReorderOutlineNodesInput): Promise<void> {
  const response = await fetch(`/api/novels/${novelId}/outline/reorder`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ updates }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "重排序大纲节点失败")
  }
}

// ==================== 大纲节点 Hooks ====================

export function useOutlineNodes(novelId: string) {
  return useQuery({
    queryKey: ["outline", novelId],
    queryFn: () => fetchOutlineNodes(novelId),
    enabled: !!novelId,
  })
}

export function useOutlineNode(novelId: string, nodeId: string) {
  return useQuery({
    queryKey: ["outline", novelId, nodeId],
    queryFn: () => fetchOutlineNode(novelId, nodeId),
    enabled: !!novelId && !!nodeId,
  })
}

export function useCreateOutlineNode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createOutlineNode,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["outline", variables.novelId] })
    },
  })
}

export function useUpdateOutlineNode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateOutlineNode,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["outline", variables.novelId] })
    },
  })
}

export function useDeleteOutlineNode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ novelId, nodeId }: { novelId: string; nodeId: string }) =>
      deleteOutlineNode(novelId, nodeId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["outline", variables.novelId] })
    },
  })
}

export function useReorderOutlineNodes() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: reorderOutlineNodes,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["outline", variables.novelId] })
    },
  })
}

// ==================== 辅助函数 ====================

// 根据章节ID查找关联的章纲节点
export function findChapterOutlineNode(nodes: OutlineNode[], chapterId: string): OutlineNode | null {
  for (const node of nodes) {
    if (node.type === "chapter_outline" && node.linkedChapterId === chapterId) {
      return node
    }
    if (node.children) {
      const found = findChapterOutlineNode(node.children, chapterId)
      if (found) return found
    }
  }
  return null
}

// 获取章纲节点下的所有情节点
export function getPlotPoints(chapterOutlineNode: OutlineNode): OutlineNode[] {
  return chapterOutlineNode.children?.filter(child => child.type === "plot_point") || []
}

// 扁平化大纲树
export function flattenOutlineNodes(nodes: OutlineNode[]): OutlineNode[] {
  const result: OutlineNode[] = []
  for (const node of nodes) {
    result.push(node)
    if (node.children) {
      result.push(...flattenOutlineNodes(node.children))
    }
  }
  return result
}
