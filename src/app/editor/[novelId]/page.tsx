"use client"

import { useMemo } from "react"
import { useParams } from "next/navigation"
import { ChapterSidebar } from "@/components/editor/chapter-sidebar"
import { TextEditor } from "@/components/editor/text-editor"
import { AIWritingPanel } from "@/components/editor/ai-writing-panel"
import { EditorToolbar } from "@/components/editor/editor-toolbar"
import { CardEditor } from "@/components/editor/card-editor"
import { SettingsAssistantPanel } from "@/components/editor/settings-assistant-panel"
import { OutlineEditor } from "@/components/editor/outline"
import { OutlineAssistantPanel } from "@/components/editor/ai-assistant"
import { SummaryPanel } from "@/components/editor/summary-panel"
import { useEditorState } from "./hooks/use-editor-state"
import { getChapterGroups } from "./types"

export default function EditorPage() {
  const params = useParams()
  const novelId = params.novelId as string

  const editor = useEditorState(novelId)
  const chapterGroups = useMemo(() => getChapterGroups(editor.chapters), [editor.chapters])

  // Loading state
  if (editor.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  // Novel not found
  if (!editor.novel) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-500">小说不存在</div>
      </div>
    )
  }

  // No chapters
  if (editor.chapters.length === 0 && editor.editorMode === "chapter") {
    return (
      <div className="flex h-screen flex-col bg-gray-50">
        <EditorToolbar novelTitle={editor.novel.title} />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="text-gray-500 mb-4">暂无章节</div>
            <button
              onClick={editor.handleCreateChapter}
              className="px-4 py-2 bg-[#2b7fff] text-white rounded hover:bg-[#2b7fff]/90"
            >
              创建第一章
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* Top Toolbar */}
      <EditorToolbar novelTitle={editor.novel.title} />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chapter Sidebar */}
        <ChapterSidebar
          novelId={novelId}
          groups={chapterGroups}
          selectedChapterId={editor.editorMode === "chapter" ? editor.selectedChapterId : undefined}
          selectedCardId={editor.editorMode === "card" ? editor.selectedCardId : undefined}
          selectedOutlineNodeId={editor.editorMode === "outline" ? editor.selectedOutlineNodeId : undefined}
          isSummaryMode={editor.editorMode === "summary"}
          cards={editor.cards}
          outlineNodes={editor.outlineNodes}
          onSelectChapter={editor.handleSelectChapter}
          onSelectCard={editor.handleSelectCard}
          onSelectOutlineNode={editor.handleSelectOutlineNode}
          onOpenSummary={editor.handleOpenSummary}
          onCreateChapter={editor.handleCreateChapter}
          onCreateCard={editor.handleCreateCard}
          onCreateOutlineNode={editor.handleCreateOutlineNode}
          onDeleteOutlineNode={editor.handleDeleteOutlineNode}
          onMoveChapter={editor.handleMoveChapter}
        />

        {/* Main Editor Area */}
        <div className="flex-1 overflow-hidden">
          {editor.editorMode === "chapter" && (
            <TextEditor
              chapterTitle={editor.chapterTitle}
              createdAt={editor.createdAt}
              content={editor.content}
              wordCount={editor.wordCount}
              onChange={editor.setContent}
              onTitleChange={editor.setChapterTitle}
              onTitleBlur={editor.handleSave}
              onAutoFormat={editor.handleAutoFormat}
              isStreaming={editor.isGenerating}
              saveStatus={editor.saveStatus}
              chapterOutlineNode={editor.currentChapterOutlineNode}
              chapterPlotPoints={editor.chapterPlotPoints}
              onPlotPointAdd={editor.handleAddPlotPoint}
              onPlotPointUpdate={editor.handleUpdatePlotPoint}
              onPlotPointDelete={editor.handleDeletePlotPoint}
              onPlotPointSelect={editor.handleSelectOutlineNode}
            />
          )}
          {editor.editorMode === "card" && (
            <CardEditor
              key={editor.currentCard?.id || "new"}
              card={editor.currentCard}
              category={editor.currentCardCategory}
              isNew={!!editor.newCardCategory}
              onSave={editor.handleSaveCard}
              onDelete={editor.handleDeleteCard}
              onCancel={editor.newCardCategory ? editor.handleCancelCard : undefined}
              saveStatus={editor.cardSaveStatus}
              prefillData={editor.generatedCardData}
              onPrefillConsumed={() => editor.setGeneratedCardData(null)}
            />
          )}
          {editor.editorMode === "outline" && (
            <OutlineEditor
              node={editor.currentOutlineNode}
              isNew={editor.isNewOutlineNode}
              parentId={editor.newOutlineParentId}
              parentType={editor.newOutlineParentType}
              chapters={editor.chapters.map(c => ({ id: c.id, title: c.title }))}
              onSave={editor.handleSaveOutlineNode}
              onDelete={() => editor.handleDeleteOutlineNode()}
              saveStatus={editor.outlineSaveStatus}
              prefillData={editor.generatedOutlineData}
              onPrefillConsumed={() => editor.setGeneratedOutlineData(null)}
            />
          )}
          {editor.editorMode === "summary" && (
            <SummaryPanel novelId={novelId} />
          )}
        </div>

        {/* AI Writing Panel - only show in chapter mode */}
        {editor.editorMode === "chapter" && (
          <AIWritingPanel
            novelId={novelId}
            currentChapterId={editor.selectedChapterId}
            onGenerate={editor.handleGenerate}
            isGenerating={editor.isGenerating}
            thinking={editor.thinking}
            cards={editor.cards}
            chapters={editor.chapters.map(c => ({ id: c.id, title: c.title, wordCount: c.wordCount, content: c.content }))}
            linkedOutlineNode={editor.currentChapterOutlineNode}
            availableOutlines={editor.availableChapterOutlines}
            outlineNodes={editor.outlineNodes}
            onLinkOutline={editor.handleLinkChapterOutline}
            onUnlinkOutline={editor.handleUnlinkChapterOutline}
          />
        )}

        {/* Settings Assistant Panel - only show in character/term card mode */}
        {editor.editorMode === "card" && (editor.currentCardCategory === "character" || editor.currentCardCategory === "term") && (
          <SettingsAssistantPanel
            novelId={novelId}
            category={editor.currentCardCategory}
            isNew={!!editor.newCardCategory}
            onApplyGenerated={(data) => editor.setGeneratedCardData(data)}
          />
        )}

        {/* Outline Assistant Panel - only show in outline mode */}
        {editor.editorMode === "outline" && (
          <OutlineAssistantPanel
            novelId={novelId}
            nodeType={
              editor.currentOutlineNode
                ? (editor.currentOutlineNode.type as "volume" | "chapter_outline" | "plot_point")
                : editor.newOutlineParentType === "volume"
                  ? "chapter_outline"
                  : editor.newOutlineParentType === "chapter_outline"
                    ? "plot_point"
                    : "volume"
            }
            parentNode={
              editor.newOutlineParentId
                ? editor.outlineNodes.find(n => n.id === editor.newOutlineParentId) ||
                  editor.outlineNodes.flatMap(n => n.children || []).find(c => c.id === editor.newOutlineParentId) ||
                  null
                : null
            }
            isNew={editor.isNewOutlineNode}
            onApplyGenerated={(data) => {
              if (editor.isNewOutlineNode) {
                // 新建节点：直接创建
                editor.handleSaveOutlineNode({
                  title: data.title,
                  content: data.content,
                  parentId: editor.newOutlineParentId,
                })
              } else {
                // 编辑已有节点：预填充表单
                editor.setGeneratedOutlineData(data)
              }
            }}
          />
        )}
      </div>
    </div>
  )
}
