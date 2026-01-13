"use client";

import { useRef, useEffect, useCallback } from "react";
import DOMPurify from "dompurify";
import { cn } from "@/lib/utils";
import {
  Undo,
  Redo,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Wand2,
} from "lucide-react";
import { ChapterOutlineSection } from "./chapter-outline-section";
import type { OutlineNode } from "@/hooks/use-outline";

interface TextEditorProps {
  chapterTitle: string;
  createdAt: string;
  content: string;
  wordCount: number;
  onChange: (content: string) => void;
  onTitleChange: (title: string) => void;
  onTitleBlur?: () => void;
  onAutoFormat?: () => void;
  isStreaming?: boolean;
  saveStatus?: "saved" | "unsaved" | "saving";
  // 章纲相关 (情节点)
  chapterOutlineNode?: OutlineNode | null;
  chapterPlotPoints?: OutlineNode[];
  onPlotPointAdd?: () => void;
  onPlotPointUpdate?: (nodeId: string, data: { title?: string; content?: string; completed?: boolean }) => void;
  onPlotPointDelete?: (nodeId: string) => void;
  onPlotPointSelect?: (nodeId: string) => void;
}

export function TextEditor({
  chapterTitle,
  createdAt,
  content,
  wordCount,
  onChange,
  onTitleChange,
  onTitleBlur,
  onAutoFormat,
  isStreaming = false,
  saveStatus = "saved",
  chapterOutlineNode,
  chapterPlotPoints = [],
  onPlotPointAdd,
  onPlotPointUpdate,
  onPlotPointDelete,
  onPlotPointSelect,
}: TextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);

  // 同步外部 content 到编辑器（使用 DOMPurify 清理 HTML 防止 XSS）
  useEffect(() => {
    if (editorRef.current && !isInternalChange.current) {
      const sanitizedContent = DOMPurify.sanitize(content, {
        ALLOWED_TAGS: ['p', 'br', 'b', 'i', 'u', 'strong', 'em', 'span', 'div', 'ul', 'ol', 'li'],
        ALLOWED_ATTR: ['style', 'class'],
      });
      if (editorRef.current.innerHTML !== sanitizedContent) {
        editorRef.current.innerHTML = sanitizedContent;
      }
    }
    isInternalChange.current = false;
  }, [content]);

  // 流式输出时自动滚动到底部
  useEffect(() => {
    if (isStreaming && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [content, isStreaming]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-3">
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={chapterTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            onBlur={onTitleBlur}
            className="h-8 w-52 rounded border border-gray-200 px-3 text-base outline-none focus:border-[#2b7fff]"
          />
          <span className="text-sm text-[#6a7282]">
            创建时间：{createdAt}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#6a7282]">
            已输入 {wordCount.toLocaleString()} 字
          </span>
          <span className="text-sm text-[#6a7282]">
            {saveStatus === "saving" && "保存中..."}
            {saveStatus === "unsaved" && "待保存"}
            {saveStatus === "saved" && "已保存"}
          </span>
        </div>
      </div>

      {/* Chapter Outline Section */}
      {onPlotPointAdd && onPlotPointUpdate && onPlotPointDelete && (
        <ChapterOutlineSection
          chapterOutlineNode={chapterOutlineNode ?? null}
          plotPoints={chapterPlotPoints}
          onAdd={onPlotPointAdd}
          onUpdate={onPlotPointUpdate}
          onDelete={onPlotPointDelete}
          onSelectNode={onPlotPointSelect}
        />
      )}

      {/* Formatting Toolbar */}
      <div className="flex items-center gap-1 border-b border-gray-200 px-6 py-2">
        <ToolButton icon={Undo} title="撤销" command="undo" />
        <ToolButton icon={Redo} title="重做" command="redo" />
        <div className="mx-2 h-6 w-px bg-gray-200" />
        <ToolButton icon={Type} title="字体" />
        <ToolButton icon={AlignLeft} title="左对齐" command="justifyLeft" />
        <ToolButton icon={AlignCenter} title="居中" command="justifyCenter" />
        <ToolButton icon={AlignRight} title="右对齐" command="justifyRight" />
        <ToolButton icon={AlignJustify} title="两端对齐" command="justifyFull" />
        <div className="mx-2 h-6 w-px bg-gray-200" />
        <ToolButton icon={List} title="无序列表" command="insertUnorderedList" />
        <ToolButton icon={ListOrdered} title="有序列表" command="insertOrderedList" />
        <div className="mx-2 h-6 w-px bg-gray-200" />
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            onAutoFormat?.();
          }}
          title="一键排版"
          className="flex h-8 items-center gap-1 rounded px-2 text-sm text-[#6a7282] hover:bg-gray-100"
        >
          <Wand2 className="size-4" />
          <span>一键排版</span>
        </button>
      </div>

      {/* Editor Area */}
      <div ref={scrollContainerRef} className="flex-1 overflow-auto px-12 py-8">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          data-placeholder="开始写作..."
          className={cn(
            "min-h-[500px] w-full text-lg leading-relaxed text-[#364153] outline-none",
            "empty:before:pointer-events-none empty:before:text-[#d1d5dc] empty:before:content-[attr(data-placeholder)]"
          )}
        />
      </div>
    </div>
  );
}

function ToolButton({
  icon: Icon,
  title,
  command,
}: {
  icon: typeof Undo;
  title: string;
  command?: string;
}) {
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    if (command) {
      document.execCommand(command, false);
    }
  };

  return (
    <button
      onMouseDown={handleMouseDown}
      title={title}
      className="flex size-8 items-center justify-center rounded hover:bg-gray-100"
    >
      <Icon className="size-4 text-[#6a7282]" />
    </button>
  );
}
