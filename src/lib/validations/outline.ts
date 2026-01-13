import { z } from "zod"

// ==================== 大纲节点类型 ====================
// 层级约束: 卷纲(volume) > 章纲(chapter_outline) > 情节点(plot_point)

export const OUTLINE_NODE_TYPES = ["volume", "chapter_outline", "plot_point"] as const
export type OutlineNodeType = (typeof OUTLINE_NODE_TYPES)[number]

// 类型显示名称
export const OUTLINE_NODE_TYPE_LABELS: Record<OutlineNodeType, string> = {
  volume: "卷纲",
  chapter_outline: "章纲",
  plot_point: "情节点",
}

// 根据父节点类型获取子节点类型
export function getChildNodeType(parentType: OutlineNodeType | null): OutlineNodeType {
  if (!parentType) return "volume" // 顶级只能是卷纲
  if (parentType === "volume") return "chapter_outline" // 卷纲下是章纲
  if (parentType === "chapter_outline") return "plot_point" // 章纲下是情节点
  return "plot_point" // 情节点下还是情节点（理论上不应该发生）
}

// 检查是否可以创建子节点
export function canCreateChild(type: OutlineNodeType): boolean {
  return type !== "plot_point" // 情节点下不能创建子节点
}

// ==================== 大纲节点 Schemas ====================

export const createOutlineNodeSchema = z.object({
  parentId: z.string().optional().nullable(),
  title: z.string().min(1, "标题不能为空").max(100, "标题不能超过100字"),
  content: z.string().max(5000, "内容不能超过5000字").optional().nullable(),
  type: z.enum(OUTLINE_NODE_TYPES).optional(), // 类型由层级自动确定
  linkedChapterId: z.string().optional().nullable(), // 章纲关联的章节
})

export const updateOutlineNodeSchema = z.object({
  parentId: z.string().optional().nullable(),
  title: z.string().min(1, "标题不能为空").max(100, "标题不能超过100字").optional(),
  content: z.string().max(5000, "内容不能超过5000字").optional().nullable(),
  type: z.enum(OUTLINE_NODE_TYPES).optional(),
  sortOrder: z.number().optional(),
  linkedChapterId: z.string().optional().nullable(),
  completed: z.boolean().optional(), // 情节点完成状态
})

export const reorderOutlineNodesSchema = z.object({
  updates: z.array(
    z.object({
      id: z.string(),
      parentId: z.string().optional().nullable(),
      sortOrder: z.number(),
    })
  ),
})

// ==================== 类型导出 ====================

export type CreateOutlineNodeInput = z.infer<typeof createOutlineNodeSchema>
export type UpdateOutlineNodeInput = z.infer<typeof updateOutlineNodeSchema>
export type ReorderOutlineNodesInput = z.infer<typeof reorderOutlineNodesSchema>
