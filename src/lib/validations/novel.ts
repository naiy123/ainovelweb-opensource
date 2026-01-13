import { z } from "zod"

export const createNovelSchema = z.object({
  title: z.string().min(1, "标题不能为空").max(100, "标题不能超过100字"),
  description: z.string().max(2000, "简介不能超过2000字").optional(),
})

export type CreateNovelInput = z.infer<typeof createNovelSchema>
