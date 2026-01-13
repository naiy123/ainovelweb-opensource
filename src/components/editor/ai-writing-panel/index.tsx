"use client"

import { useMemo, useCallback, useEffect } from "react"
import { Sparkles, X, Info, Search, FileText, Coins } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAIWritingForm } from "./hooks/use-ai-writing-form"
import { ModelSelector, ThinkingPanel, CharacterPicker, TermPicker, ChapterPicker, ChapterOutlineLink, ContextPreview } from "./components"
import { calculateLinkedChaptersCredits } from "@/lib/ai/models"
import { useSummaries } from "@/hooks/use-summaries"
import type { AIWritingPanelProps } from "./types"
import type { CharacterAttributes } from "@/hooks/use-cards"

// Re-export types
export type { AIGenerateParams, LinkedChapterInfo, CharacterCardInfo, TermCardInfo, ChapterInfo } from "./types"

export function AIWritingPanel({
  novelId,
  currentChapterId,
  onGenerate,
  isGenerating = false,
  onClose,
  thinking = "",
  cards = [],
  chapters = [],
  linkedOutlineNode,
  availableOutlines = [],
  outlineNodes = [],
  onLinkOutline,
  onUnlinkOutline,
}: AIWritingPanelProps) {
  const form = useAIWritingForm({ cards, chapters, thinking, isGenerating })

  // 获取摘要数据
  const { data: summariesData } = useSummaries(novelId || "")

  // 切换章节时重置本章核心剧情
  useEffect(() => {
    form.setChapterPlot("")
  }, [currentChapterId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleGenerate = () => {
    const params = form.buildGenerateParams()
    onGenerate(params)
  }

  const toggleCharacter = (id: string) => {
    form.setSelectedCharacters((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const toggleTerm = (id: string) => {
    form.setSelectedTerms((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const toggleChapter = (id: string) => {
    form.setSelectedChapters((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  // 计算关联章节的字数和预估消耗
  const linkedChaptersStats = useMemo(() => {
    const selectedChapterData = chapters.filter((c) => form.selectedChapters.includes(c.id))
    const totalChars = selectedChapterData.reduce((sum, c) => sum + (c.wordCount || 0), 0)
    const estimatedCredits = totalChars > 0 ? calculateLinkedChaptersCredits(totalChars, form.aiModel) : 0
    return { totalChars, estimatedCredits }
  }, [chapters, form.selectedChapters, form.aiModel])

  // 根据剧情文本匹配触发词卡片
  const matchedCards = useMemo(() => {
    const textToMatch = [form.chapterPlot, form.storyBackground].filter(Boolean).join("\n")
    if (!textToMatch) return []

    const matched: { name: string; category: string; tokenCount?: number }[] = []
    const matchedNames = new Set<string>()

    for (const card of cards) {
      // 检查卡片的 triggers 字段
      const triggers = (card as { triggers?: string[] }).triggers
      if (!triggers || triggers.length === 0) continue

      const isMatched = triggers.some(trigger => {
        if (!trigger) return false
        return textToMatch.includes(trigger)
      })

      if (isMatched && !matchedNames.has(card.name)) {
        matchedNames.add(card.name)
        // 估算 token：角色卡约 100 tokens，词条卡约 50 tokens
        const attrs = card.attributes as CharacterAttributes | null
        let tokenCount = 50
        if (card.category === "character") {
          tokenCount = 30 // 基础
          if (attrs?.personality) tokenCount += 20
          if (attrs?.background) tokenCount += 30
          if (attrs?.abilities) tokenCount += 20
        }
        matched.push({
          name: card.name,
          category: card.category,
          tokenCount,
        })
      }
    }

    return matched
  }, [cards, form.chapterPlot, form.storyBackground])

  // 构建上下文预览数据
  const contextPreviewData = useMemo(() => {
    // 找到当前章节在摘要列表中的位置
    const currentChapterIndex = summariesData?.chapters?.findIndex(c => c.id === currentChapterId) ?? -1

    // 章节摘要：只取当前章节之前的章节（最多10章）
    // 如果是第一章(index=0)或找不到(index=-1)，则没有之前的章节
    const chapterSummaries = currentChapterIndex > 0
      ? summariesData?.chapters
          ?.slice(0, currentChapterIndex) // 取当前章节之前的
          .filter(c => c.summary)
          .slice(-10) // 最近10章
          .map(c => ({
            id: c.id,
            number: c.number,
            title: c.title,
            summary: c.summary?.summary || "",
            wordCount: c.summary?.summary?.length || 0, // 摘要字数
          })) || []
      : []

    // 关联章节
    const linkedChapters = chapters
      .filter(c => form.selectedChapters.includes(c.id))
      .map(c => ({
        title: c.title,
        wordCount: c.wordCount,
      }))

    // 大纲内容
    const outlineContent = linkedOutlineNode?.content || ""

    return {
      novelSummary: summariesData?.novelSummary,
      chapterSummaries,
      matchedCards,
      linkedChapters,
      outlineContent,
    }
  }, [summariesData, chapters, form.selectedChapters, matchedCards, linkedOutlineNode, currentChapterId])

  return (
    <aside className="flex h-full w-96 flex-col border-l border-gray-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <Sparkles className="size-5 text-[#2b7fff]" />
          <div>
            <h3 className="text-base font-normal text-neutral-950">智能写作</h3>
            <p className="text-xs text-[#6a7282]">一般用于章节正文写作</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 border border-amber-200">
            <Coins className="size-3.5 text-amber-500" />
            <span className="text-sm font-medium text-amber-600">
              {form.balance !== null ? form.balance : "--"}
            </span>
          </div>
          {onClose && (
            <button onClick={onClose} className="flex size-7 items-center justify-center rounded hover:bg-gray-100">
              <X className="size-4 text-[#6a7282]" />
            </button>
          )}
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-auto p-4">
        {/* Advanced Mode Toggle */}
        <div className="mb-4 flex items-center justify-between rounded-lg bg-gray-50 p-3">
          <span className="text-sm font-medium text-neutral-950">高级功能</span>
          <button
            onClick={() => form.setAdvancedMode(!form.advancedMode)}
            className={cn("h-6 w-11 rounded-full transition-colors", form.advancedMode ? "bg-[#00c950]" : "bg-gray-300")}
          >
            <div className={cn("size-5 rounded-full bg-white shadow transition-transform", form.advancedMode ? "translate-x-5" : "translate-x-0.5")} />
          </button>
        </div>

        {form.advancedMode && (
          <div className="mb-4 flex items-start gap-2 rounded-lg bg-blue-50 p-3">
            <Info className="mt-0.5 size-4 shrink-0 text-[#2b7fff]" />
            <p className="text-xs text-[#2b7fff]">
              通过提供角色、词条、关联知识库等元数据，能够有效提高创作内容的质量和相关性
            </p>
          </div>
        )}

        {/* 上下文预览 */}
        <ContextPreview
          novelSummary={contextPreviewData.novelSummary}
          chapterSummaries={contextPreviewData.chapterSummaries}
          matchedCards={contextPreviewData.matchedCards}
          linkedChapters={contextPreviewData.linkedChapters}
          outlineContent={contextPreviewData.outlineContent}
        />

        {/* AI Model */}
        <ModelSelector
          aiModel={form.aiModel}
          showPicker={form.showModelPicker}
          onTogglePicker={() => form.setShowModelPicker(!form.showModelPicker)}
          onSelectModel={(id) => { form.setAiModel(id); form.setShowModelPicker(false) }}
        />

        {/* Story Background */}
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-neutral-950">故事背景</label>
          <p className="mb-2 text-xs text-[#99a1af]">填写小说类型或整体风格（如都市/修仙），帮助理解作品基调</p>
          <div className="relative">
            <textarea
              value={form.storyBackground}
              onChange={(e) => form.setStoryBackground(e.target.value)}
              placeholder="输入故事背景..."
              maxLength={500}
              className="h-24 w-full resize-none rounded border border-gray-300 p-3 text-sm outline-none placeholder:text-gray-400 focus:border-[#2b7fff]"
            />
            <span className="absolute bottom-2 right-2 text-xs text-[#99a1af]">{form.storyBackground.length} / 500</span>
          </div>
        </div>

        {/* Advanced Options */}
        {form.advancedMode && (
          <>
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-[#2b7fff]">本章角色卡</label>
              <p className="mb-2 text-xs text-[#99a1af]">创建角色卡提升100%生成效果，本章不出场角色不要选择</p>
              <div
                onClick={() => form.setShowCharacterPicker(true)}
                className="flex h-10 cursor-pointer items-center justify-between rounded border border-gray-300 bg-white px-3 hover:border-[#2b7fff]"
              >
                <span className={cn("text-sm", form.selectedCharacters.length > 0 ? "text-neutral-950" : "text-gray-400")}>
                  {form.selectedCharacters.length > 0
                    ? form.characters.filter((c) => form.selectedCharacters.includes(c.id)).map((c) => c.name).join("、")
                    : form.characters.length > 0 ? "选择角色" : "暂无角色卡"}
                </span>
                <Search className="size-4 text-gray-400" />
              </div>
            </div>

            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-[#2b7fff]">角色关系</label>
              <p className="mb-2 text-xs text-[#99a1af]">可写临时/非核心角色，或者补充人物关系</p>
              <div className="relative">
                <textarea
                  value={form.characterRelations}
                  onChange={(e) => form.setCharacterRelations(e.target.value)}
                  placeholder="输入角色关系..."
                  maxLength={500}
                  className="h-20 w-full resize-none rounded border border-gray-300 p-3 text-sm outline-none placeholder:text-gray-400 focus:border-[#2b7fff]"
                />
                <span className="absolute bottom-2 right-2 text-xs text-[#99a1af]">{form.characterRelations.length} / 500</span>
              </div>
            </div>

            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-[#2b7fff]">本章词条卡</label>
              <p className="mb-2 text-xs text-[#99a1af]">本章未使用词条不要选择，词条太多可能会产生重复内容或生成质量</p>
              <div
                onClick={() => form.setShowTermPicker(true)}
                className="flex h-10 cursor-pointer items-center justify-between rounded border border-gray-300 bg-white px-3 hover:border-[#2b7fff]"
              >
                <span className={cn("text-sm", form.selectedTerms.length > 0 ? "text-neutral-950" : "text-gray-400")}>
                  {form.selectedTerms.length > 0
                    ? form.terms.filter((t) => form.selectedTerms.includes(t.id)).map((t) => t.name).join("、")
                    : form.terms.length > 0 ? "选择词条" : "暂无词条卡"}
                </span>
                <Search className="size-4 text-gray-400" />
              </div>
            </div>

            {/* 关联章节 */}
            <div className="mb-4 rounded-lg border border-gray-200 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-[#2b7fff]">关联章节</span>
                <span className="text-xs text-[#99a1af]">提供上下文参考（可选）</span>
              </div>

              {/* 快捷选择按钮 */}
              {chapters.length > 0 && (
                <div className="mb-3 flex gap-2">
                  <button
                    onClick={() => form.setSelectedChapters(chapters.slice(-3).map((c) => c.id))}
                    className={cn(
                      "h-8 flex-1 rounded border text-xs transition-colors",
                      form.selectedChapters.length === 3 && chapters.slice(-3).every((c) => form.selectedChapters.includes(c.id))
                        ? "border-[#2b7fff] bg-[#2b7fff] text-white"
                        : "border-gray-300 text-neutral-950 hover:border-[#2b7fff] hover:text-[#2b7fff]"
                    )}
                  >
                    最近3章
                  </button>
                  <button
                    onClick={() => form.setSelectedChapters(chapters.slice(-5).map((c) => c.id))}
                    className={cn(
                      "h-8 flex-1 rounded border text-xs transition-colors",
                      form.selectedChapters.length === Math.min(5, chapters.length) && chapters.slice(-5).every((c) => form.selectedChapters.includes(c.id))
                        ? "border-[#2b7fff] bg-[#2b7fff] text-white"
                        : "border-gray-300 text-neutral-950 hover:border-[#2b7fff] hover:text-[#2b7fff]"
                    )}
                  >
                    最近5章
                  </button>
                  <button
                    onClick={() => form.setShowChapterPicker(true)}
                    className="h-8 flex-1 rounded border border-gray-300 text-xs text-neutral-950 hover:border-[#2b7fff] hover:text-[#2b7fff]"
                  >
                    自选
                  </button>
                </div>
              )}

              {/* 已选章节列表 */}
              {form.selectedChapters.length > 0 ? (
                <div className="mb-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs text-[#6a7282]">已选 {form.selectedChapters.length} 章</span>
                    <button
                      onClick={() => form.setSelectedChapters([])}
                      className="text-xs text-gray-400 hover:text-red-500"
                    >
                      清空
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {chapters.filter((c) => form.selectedChapters.includes(c.id)).map((chapter) => (
                      <span
                        key={chapter.id}
                        className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs text-[#2b7fff]"
                      >
                        {chapter.title}
                        <button
                          onClick={() => form.setSelectedChapters((prev) => prev.filter((id) => id !== chapter.id))}
                          className="text-blue-300 hover:text-blue-500"
                        >
                          <X className="size-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mb-3 flex items-center justify-center py-4 text-center">
                  <FileText className="mr-2 size-5 text-gray-300" />
                  <span className="text-xs text-gray-400">{chapters.length > 0 ? "未选择章节" : "暂无章节"}</span>
                </div>
              )}

              {/* 消耗预估 */}
              {form.selectedChapters.length > 0 && (
                <div className="rounded bg-gray-50 px-3 py-2 text-xs">
                  <div className="flex items-center justify-between text-[#6a7282]">
                    <span>关联字数</span>
                    <span className="font-medium text-neutral-950">{linkedChaptersStats.totalChars.toLocaleString()} 字</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[#6a7282]">
                    <span>预估消耗</span>
                    <span className="font-medium text-amber-600">+{linkedChaptersStats.estimatedCredits} 灵感点</span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Chapter Outline Link */}
        {(linkedOutlineNode || availableOutlines.length > 0) && (
          <ChapterOutlineLink
            linkedOutlineNode={linkedOutlineNode}
            availableOutlines={availableOutlines}
            outlineNodes={outlineNodes}
            onLinkOutline={onLinkOutline}
            onUnlinkOutline={onUnlinkOutline}
            onUseContent={(content) => {
              // 追加到现有内容
              const newContent = form.chapterPlot
                ? `${form.chapterPlot}\n\n${content}`
                : content
              form.setChapterPlot(newContent)
            }}
          />
        )}

        {/* Chapter Plot */}
        <div className="mb-4">
          <div className="mb-1 flex items-center justify-between">
            <label className="text-sm font-medium text-neutral-950">本章核心剧情</label>
          </div>
          <div className="relative">
            <textarea
              value={form.chapterPlot}
              onChange={(e) => form.setChapterPlot(e.target.value)}
              placeholder="在这里输入你的剧情片段或者细纲"
              maxLength={3000}
              className="h-28 w-full resize-none rounded border border-gray-300 p-3 text-sm outline-none placeholder:text-gray-400 focus:border-[#2b7fff]"
            />
            <span className="absolute bottom-2 right-2 text-xs text-[#99a1af]">{form.chapterPlot.length} / 3000</span>
          </div>
        </div>

        {/* Writing Style */}
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-neutral-950">写作风格</label>
          <p className="mb-2 text-xs text-[#99a1af]">描述期望的写作风格，如"简洁明快"、"细腻抒情"等</p>
          <textarea
            value={form.customStyle}
            onChange={(e) => form.setCustomStyle(e.target.value)}
            placeholder="输入写作风格描述..."
            maxLength={200}
            className="h-20 w-full resize-none rounded border border-gray-300 p-3 text-sm outline-none placeholder:text-gray-400 focus:border-[#2b7fff]"
          />
        </div>

        {/* Writing Requirements */}
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-neutral-950">写作要求</label>
          <p className="mb-2 text-xs text-[#99a1af]">输入额外的写作要求或注意事项</p>
          <textarea
            value={form.writingRequirements}
            onChange={(e) => form.setWritingRequirements(e.target.value)}
            placeholder="输入写作要求..."
            maxLength={500}
            className="h-20 w-full resize-none rounded border border-gray-300 p-3 text-sm outline-none placeholder:text-gray-400 focus:border-[#2b7fff]"
          />
        </div>

        <p className="border-t border-gray-100 pt-3 text-xs text-[#99a1af]">以上内容均为智能生成，仅供参考和借鉴</p>

        <ThinkingPanel
          thinking={thinking}
          isGenerating={isGenerating}
          showThinking={form.showThinking}
          translatedThinking={form.translatedThinking}
          showTranslated={form.showTranslated}
          isTranslating={form.isTranslating}
          isExpanded={form.isExpanded}
          thinkingRef={form.thinkingRef}
          onToggleShow={() => form.setShowThinking(!form.showThinking)}
          onTranslate={form.handleTranslate}
          onToggleTranslated={form.setShowTranslated}
          onExpand={() => form.setIsExpanded(true)}
          onCloseExpanded={() => form.setIsExpanded(false)}
        />
      </div>

      {/* Generate Button */}
      <div className="border-t border-gray-200 p-4">
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#2b7fff] text-white transition-colors hover:bg-[#2b7fff]/90 disabled:opacity-50"
        >
          <Sparkles className="size-5" />
          <span>{isGenerating ? "生成中..." : "生成"}</span>
        </button>
      </div>

      {/* Picker Modals */}
      {form.showCharacterPicker && (
        <CharacterPicker
          characters={form.characters}
          selectedIds={form.selectedCharacters}
          onToggle={toggleCharacter}
          onClose={() => form.setShowCharacterPicker(false)}
        />
      )}
      {form.showTermPicker && (
        <TermPicker
          terms={form.terms}
          selectedIds={form.selectedTerms}
          onToggle={toggleTerm}
          onClose={() => form.setShowTermPicker(false)}
        />
      )}
      {form.showChapterPicker && (
        <ChapterPicker
          chapters={chapters}
          selectedIds={form.selectedChapters}
          onToggle={toggleChapter}
          onClose={() => form.setShowChapterPicker(false)}
        />
      )}
    </aside>
  )
}
