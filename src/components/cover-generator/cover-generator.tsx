"use client"

import { useCoverGenerator } from "./hooks/use-cover-generator"
import {
  Header,
  ModeSelector,
  ModelSelector,
  BookInfoForm,
  PreviewPanel,
  HistoryPanel,
  ImagePreviewModal,
  QuickGenerateButton,
} from "./components"

export function CoverGenerator() {
  const {
    // State
    generateMode, step, title, author, channel, genre, description,
    isGeneratingQuick, selectedModel, backgroundImage,
    resultImage, isGeneratingFinal,
    historyImages, historyLoading, historyNextCursor, historyHasMore,
    previewImage, historyExpanded,
    // Setters
    setGenerateMode, setTitle, setAuthor, setGenre, setDescription,
    setSelectedModel, setPreviewImage, setHistoryExpanded,
    // Actions
    handleChannelChange, handleQuickGenerate, handleDownload, loadHistory,
  } = useCoverGenerator()

  return (
    <div className="cover-generator min-h-screen flex flex-col relative overflow-hidden bg-[#0a0e17]">
      {/* 装饰背景 */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-[#2563eb] opacity-[0.05] rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-[#00e5ff] opacity-[0.05] rounded-full blur-[100px] pointer-events-none" />

      <Header
        step={step}
        generateMode={generateMode}
      />

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative z-10">
        {/* 左侧面板 */}
        <aside className="w-full lg:w-[480px] glass-panel-dark border-r border-white/5 flex flex-col overflow-y-auto custom-scrollbar">
          <div className="p-6 space-y-6">
            <ModeSelector
              generateMode={generateMode}
              onModeChange={setGenerateMode}
            />

            {generateMode === "quick" && (
              <ModelSelector
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
              />
            )}

            <BookInfoForm
              title={title}
              author={author}
              channel={channel}
              genre={genre}
              description={description}
              generateMode={generateMode}
              onTitleChange={setTitle}
              onAuthorChange={setAuthor}
              onChannelChange={handleChannelChange}
              onGenreChange={setGenre}
              onDescriptionChange={setDescription}
            />

            {generateMode === "quick" && (
              <QuickGenerateButton
                isGenerating={isGeneratingQuick}
                title={title}
                genre={genre}
                onGenerate={handleQuickGenerate}
              />
            )}
          </div>
        </aside>

        {/* 右侧面板 - 响应式布局 */}
        <div className="flex-1 flex flex-col lg:grid lg:grid-rows-[1fr_250px] overflow-hidden bg-black/20 relative">
          <PreviewPanel
            resultImage={resultImage}
            backgroundImage={backgroundImage}
            title={title}
            author={author}
            isGenerating={isGeneratingQuick || isGeneratingFinal}
            onDownload={handleDownload}
          />

          <HistoryPanel
            historyImages={historyImages}
            historyLoading={historyLoading}
            historyHasMore={historyHasMore}
            historyExpanded={historyExpanded}
            historyNextCursor={historyNextCursor}
            onPreview={setPreviewImage}
            onLoadMore={loadHistory}
            onToggleExpand={() => setHistoryExpanded(!historyExpanded)}
          />
        </div>
      </main>

      <ImagePreviewModal
        previewImage={previewImage}
        onClose={() => setPreviewImage(null)}
        onDownload={handleDownload}
      />
    </div>
  )
}
