"use client"

import { MoreHorizontal, Pencil, Archive, Trash2, Sparkles } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { NovelStatus } from "../types"

interface CardDropdownProps {
  status: NovelStatus
  coverUrl?: string
  onEdit: () => void
  onCoverGenerate: () => void
  onArchive: () => void
  onDelete: () => void
}

export function CardDropdown({
  status,
  coverUrl,
  onEdit,
  onCoverGenerate,
  onArchive,
  onDelete,
}: CardDropdownProps) {
  return (
    <div className="absolute right-4 top-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="opacity-0 group-hover:opacity-100 flex size-8 items-center justify-center rounded hover:bg-gray-200/50 transition-opacity"
            onClick={(e) => e.preventDefault()}
          >
            <MoreHorizontal className="size-4 text-[#6a7282]" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="mr-2 size-4" />
            编辑
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onCoverGenerate}>
            <Sparkles className="mr-2 size-4" />
            {coverUrl ? "重新生成封面" : "生成封面"}
          </DropdownMenuItem>
          {status !== "archived" && (
            <DropdownMenuItem onClick={onArchive}>
              <Archive className="mr-2 size-4" />
              归档
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={onDelete}>
            <Trash2 className="mr-2 size-4" />
            删除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
