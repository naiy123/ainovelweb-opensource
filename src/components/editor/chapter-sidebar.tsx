"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, FileText, FolderOpen, Plus, User, BookOpen, Pin, FileEdit, Send, Map, ScrollText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Card, CardCategory } from "@/hooks/use-cards";
import type { OutlineNode } from "@/hooks/use-outline";
import { OutlineTree } from "./outline";
import { EmbeddingManager } from "./embedding-manager";

interface Chapter {
  id: string;
  title: string;
  wordCount?: number;
  status?: string;
}

interface ChapterGroup {
  id: string;
  title: string;
  chapters: Chapter[];
  isExpanded?: boolean;
}

// 设定子分类配置
interface SettingsCategory {
  id: CardCategory;
  title: string;
  icon: React.ReactNode;
}

const SETTINGS_CATEGORIES: SettingsCategory[] = [
  { id: "character", title: "角色", icon: <User className="size-4" /> },
  { id: "term", title: "词条", icon: <BookOpen className="size-4" /> },
];

interface ChapterSidebarProps {
  novelId: string;
  groups: ChapterGroup[];
  selectedChapterId?: string;
  selectedCardId?: string;
  selectedOutlineNodeId?: string;
  isSummaryMode?: boolean;
  cards?: Card[];
  outlineNodes?: OutlineNode[];
  onSelectChapter: (chapterId: string) => void;
  onSelectCard?: (cardId: string) => void;
  onSelectOutlineNode?: (nodeId: string) => void;
  onOpenSummary?: () => void;
  onCreateChapter?: () => void;
  onCreateCard?: (category: CardCategory) => void;
  onCreateOutlineNode?: (parentId?: string) => void;
  onDeleteOutlineNode?: (nodeId: string) => void;
  onMoveChapter?: (chapterId: string, newStatus: "published" | "draft") => void;
}

export function ChapterSidebar({
  novelId,
  groups,
  selectedChapterId,
  selectedCardId,
  selectedOutlineNodeId,
  isSummaryMode = false,
  cards = [],
  outlineNodes = [],
  onSelectChapter,
  onSelectCard,
  onSelectOutlineNode,
  onOpenSummary,
  onCreateChapter,
  onCreateCard,
  onCreateOutlineNode,
  onDeleteOutlineNode,
  onMoveChapter,
}: ChapterSidebarProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set([...groups.filter((g) => g.isExpanded).map((g) => g.id), "outline"])
  );
  const [expandedSettings, setExpandedSettings] = useState<Set<string>>(new Set(["character", "term"]));

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const toggleSettings = (categoryId: string) => {
    setExpandedSettings((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  // 按分类分组卡片
  const cardsByCategory = SETTINGS_CATEGORIES.reduce((acc, cat) => {
    acc[cat.id] = cards.filter((c) => c.category === cat.id);
    return acc;
  }, {} as Record<CardCategory, Card[]>);

  return (
    <aside className="flex h-full w-64 flex-col border-r border-gray-200 bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <h2 className="text-base font-normal text-neutral-950">目录结构</h2>
        {onCreateChapter && (
          <button
            onClick={onCreateChapter}
            className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded bg-[#2b7fff] text-white transition-colors hover:bg-[#2b7fff]/90"
          >
            <Plus className="size-4" />
            <span>新建章节</span>
          </button>
        )}
      </div>

      {/* Chapter Tree */}
      <nav className="flex-1 overflow-auto p-2">
        {/* 大纲组 */}
        <div className="mb-1">
          <button
            onClick={() => toggleGroup("outline")}
            className="flex h-9 w-full items-center gap-2 rounded px-2 text-[#364153] hover:bg-gray-50"
          >
            {expandedGroups.has("outline") ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
            <Map className="size-4" />
            <span className="text-base">大纲</span>
          </button>

          {expandedGroups.has("outline") && (
            <div className="ml-4">
              <OutlineTree
                nodes={outlineNodes}
                selectedNodeId={selectedOutlineNodeId}
                onSelectNode={onSelectOutlineNode || (() => {})}
                onCreateNode={onCreateOutlineNode}
                onDeleteNode={onDeleteOutlineNode}
              />
            </div>
          )}
        </div>

        {groups.map((group) => {
          const isExpanded = expandedGroups.has(group.id);
          const isSettingsGroup = group.id === "settings";

          return (
            <div key={group.id} className="mb-1">
              {/* Group Header */}
              <button
                onClick={() => toggleGroup(group.id)}
                className="flex h-9 w-full items-center gap-2 rounded px-2 text-[#364153] hover:bg-gray-50"
              >
                {isExpanded ? (
                  <ChevronDown className="size-4" />
                ) : (
                  <ChevronRight className="size-4" />
                )}
                <FolderOpen className="size-4" />
                <span className="text-base">{group.title}</span>
              </button>

              {/* 普通章节列表 */}
              {isExpanded && !isSettingsGroup && (
                <div className="ml-6 space-y-0.5">
                  {group.chapters.map((chapter) => {
                    const isMainGroup = group.id === "main";
                    const isDraftGroup = group.id === "drafts";

                    return (
                      <div
                        key={chapter.id}
                        className={cn(
                          "group flex h-9 w-full items-center justify-between rounded px-2 transition-colors",
                          selectedChapterId === chapter.id && !selectedCardId
                            ? "bg-[#2b7fff]/10 text-[#2b7fff]"
                            : "text-[#6a7282] hover:bg-gray-50"
                        )}
                      >
                        <button
                          onClick={() => onSelectChapter(chapter.id)}
                          className="flex flex-1 items-center gap-2 min-w-0"
                        >
                          <FileText className="size-4 shrink-0" />
                          <span className="text-base truncate">{chapter.title}</span>
                        </button>
                        <div className="flex items-center gap-1">
                          {chapter.wordCount !== undefined && (
                            <span className="text-xs text-[#6a7282]">
                              {chapter.wordCount}字
                            </span>
                          )}
                          {/* 移动图标 */}
                          {onMoveChapter && (isMainGroup || isDraftGroup) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onMoveChapter(chapter.id, isMainGroup ? "draft" : "published");
                              }}
                              className="ml-1 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-gray-200 transition-opacity"
                              title={isMainGroup ? "移到草稿箱" : "发布到正文"}
                            >
                              {isMainGroup ? (
                                <FileEdit className="size-3.5 text-gray-500" />
                              ) : (
                                <Send className="size-3.5 text-gray-500" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 设定分类 - 显示角色和词条子分类 */}
              {isExpanded && isSettingsGroup && (
                <div className="ml-4 space-y-0.5">
                  {/* 语义索引状态 */}
                  <EmbeddingManager novelId={novelId} compact />
                  {SETTINGS_CATEGORIES.map((category) => {
                    const isSettingExpanded = expandedSettings.has(category.id);
                    const categoryCards = cardsByCategory[category.id] || [];

                    return (
                      <div key={category.id}>
                        {/* 子分类标题 */}
                        <button
                          onClick={() => toggleSettings(category.id)}
                          className="flex h-8 w-full items-center gap-2 rounded px-2 text-[#364153] hover:bg-gray-50"
                        >
                          {isSettingExpanded ? (
                            <ChevronDown className="size-3" />
                          ) : (
                            <ChevronRight className="size-3" />
                          )}
                          {category.icon}
                          <span className="text-sm">{category.title}</span>
                          <span className="ml-auto text-xs text-gray-400">
                            {categoryCards.length}
                          </span>
                        </button>

                        {/* 卡片列表 */}
                        {isSettingExpanded && (
                          <div className="ml-5 space-y-0.5">
                            {/* 新建按钮 */}
                            {onCreateCard && (
                              <button
                                onClick={() => onCreateCard(category.id)}
                                className="flex h-7 w-full items-center gap-2 rounded px-2 text-xs text-[#2b7fff] hover:bg-[#2b7fff]/5"
                              >
                                <Plus className="size-3" />
                                <span>新建{category.title}</span>
                              </button>
                            )}

                            {/* 卡片项 */}
                            {categoryCards.map((card) => (
                              <button
                                key={card.id}
                                onClick={() => onSelectCard?.(card.id)}
                                className={cn(
                                  "flex h-8 w-full items-center gap-2 rounded px-2 transition-colors",
                                  selectedCardId === card.id
                                    ? "bg-[#2b7fff]/10 text-[#2b7fff]"
                                    : "text-[#6a7282] hover:bg-gray-50"
                                )}
                              >
                                {card.avatar ? (
                                  <img
                                    src={card.avatar}
                                    alt={card.name}
                                    className="size-4 rounded-full object-cover"
                                  />
                                ) : category.id === "character" ? (
                                  <User className="size-4" />
                                ) : (
                                  <BookOpen className="size-4" />
                                )}
                                <span className="flex-1 truncate text-left text-sm">
                                  {card.name}
                                </span>
                                {card.isPinned && (
                                  <Pin className="size-3 text-amber-500" />
                                )}
                                {card.tags && (
                                  <span className="text-xs text-gray-400">
                                    {card.tags.split(",")[0]}
                                  </span>
                                )}
                              </button>
                            ))}

                            {/* 空状态 */}
                            {categoryCards.length === 0 && (
                              <div className="px-2 py-1 text-xs text-gray-400">
                                暂无{category.title}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* 摘要管理入口 */}
        {onOpenSummary && (
          <button
            onClick={onOpenSummary}
            className={cn(
              "mt-2 flex h-9 w-full items-center gap-2 rounded px-2 transition-colors",
              isSummaryMode
                ? "bg-[#2b7fff]/10 text-[#2b7fff]"
                : "text-[#364153] hover:bg-gray-50"
            )}
          >
            <ScrollText className="size-4" />
            <span className="text-base">章节摘要</span>
          </button>
        )}
      </nav>
    </aside>
  );
}
