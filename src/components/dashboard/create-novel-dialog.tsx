"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateNovel } from "@/hooks/use-novels";

interface CreateNovelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TAG_OPTIONS = ["玄幻", "都市", "科幻", "历史", "悬疑", "言情", "武侠", "游戏"];

export function CreateNovelDialog({ open, onOpenChange }: CreateNovelDialogProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const { mutate: createNovel, isPending } = useCreateNovel();

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createNovel(
      {
        title: title.trim(),
        description: description.trim() || undefined,
      },
      {
        onSuccess: (novel) => {
          onOpenChange(false);
          resetForm();
          router.push(`/editor/${novel.id}`);
        },
      }
    );
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSelectedTags([]);
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-xl">新建作品</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* 标题 - 必填 */}
          <div className="space-y-2">
            <Label htmlFor="title">
              作品名称 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="请输入作品名称"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              autoFocus
            />
          </div>

          {/* 简介 - 选填 */}
          <div className="space-y-2">
            <Label htmlFor="description">作品简介</Label>
            <textarea
              id="description"
              placeholder="请输入作品简介（选填）"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
          </div>

          {/* 标签 - 选填 */}
          <div className="space-y-2">
            <Label>作品标签</Label>
            <div className="flex flex-wrap gap-2">
              {TAG_OPTIONS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    selectedTags.includes(tag)
                      ? "bg-[#2b7fff] text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* 按钮 */}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              取消
            </Button>
            <Button type="submit" disabled={!title.trim() || isPending}>
              {isPending ? "创建中..." : "创建"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
