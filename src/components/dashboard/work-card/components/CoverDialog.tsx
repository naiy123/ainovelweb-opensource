"use client"

import { Sparkles } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { GENRE_OPTIONS } from "../constants"
import type { ChannelType } from "../types"

interface CoverDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  coverTitle: string
  coverAuthor: string
  coverChannel: ChannelType
  coverGenre: string
  coverDescription: string
  onCoverTitleChange: (value: string) => void
  onCoverAuthorChange: (value: string) => void
  onCoverChannelChange: (value: ChannelType) => void
  onCoverGenreChange: (value: string) => void
  onCoverDescriptionChange: (value: string) => void
  onGenerate: () => void
}

export function CoverDialog({
  open,
  onOpenChange,
  coverTitle,
  coverAuthor,
  coverChannel,
  coverGenre,
  coverDescription,
  onCoverTitleChange,
  onCoverAuthorChange,
  onCoverChannelChange,
  onCoverGenreChange,
  onCoverDescriptionChange,
  onGenerate,
}: CoverDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>智能生成封面</DialogTitle>
          <DialogDescription>
            使用 Seedream 模型生成封面，需配置豆包 + Seedream API
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="cover-title">书名</Label>
            <Input
              id="cover-title"
              value={coverTitle}
              onChange={(e) => onCoverTitleChange(e.target.value)}
              placeholder="输入书名"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cover-author">作者名（可选）</Label>
            <Input
              id="cover-author"
              value={coverAuthor}
              onChange={(e) => onCoverAuthorChange(e.target.value)}
              placeholder="输入作者笔名"
            />
          </div>
          <div className="grid gap-2">
            <Label>频道 <span className="text-red-500">*</span></Label>
            <div className="flex gap-2">
              {(Object.keys(GENRE_OPTIONS) as ChannelType[]).map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => {
                    onCoverChannelChange(ch)
                    onCoverGenreChange("")
                  }}
                  className={`flex-1 py-2 px-3 rounded-md border text-sm font-medium transition-colors ${
                    coverChannel === ch
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-input hover:bg-accent"
                  }`}
                >
                  {GENRE_OPTIONS[ch].label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cover-genre">小说类型 <span className="text-red-500">*</span></Label>
            <select
              id="cover-genre"
              value={coverGenre}
              onChange={(e) => onCoverGenreChange(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">请选择类型</option>
              {GENRE_OPTIONS[coverChannel].genres.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cover-description">小说简介/风格描述（可选）</Label>
            <textarea
              id="cover-description"
              value={coverDescription}
              onChange={(e) => onCoverDescriptionChange(e.target.value)}
              placeholder="描述小说的氛围、场景或封面风格，如：仙侠修真、云海仙山、金光闪闪..."
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">
              {coverDescription.length}/200 - 描述越详细，封面效果越好
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={onGenerate} disabled={!coverTitle.trim() || !coverGenre}>
            <Sparkles className="mr-2 size-4" />
            生成封面
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
