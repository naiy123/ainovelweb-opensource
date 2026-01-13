"use client"

import Link from "next/link"
import { Plus } from "lucide-react"
import { EditNovelDialog } from "../edit-novel-dialog"
import { useWorkCard } from "./hooks/use-work-card"
import { CoverOverlay, CoverDialog, DeleteDialog, CardDropdown } from "./components"
import { formatWordCount, formatDate } from "./types"
import type { WorkCardProps, CreateWorkCardProps } from "./types"

export type { WorkCardProps, CreateWorkCardProps } from "./types"

export function WorkCard({
  id,
  title,
  status,
  tags = [],
  wordCount,
  updatedAt,
  coverUrl,
}: WorkCardProps) {
  const card = useWorkCard(id, title, tags)

  return (
    <>
      <div className="group relative overflow-hidden rounded-[10px] border border-gray-200 bg-white transition-shadow hover:shadow-md">
        <Link href={`/editor/${id}`} className="block">
          <CoverOverlay
            coverUrl={coverUrl}
            title={title}
            isGenerating={card.isGeneratingCover}
            onGenerateClick={card.openCoverDialog}
            onDownloadClick={() => coverUrl && card.handleDownloadCover(coverUrl)}
          />

          {/* Info Area */}
          <div className="p-3">
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="rounded bg-gray-100 px-2 py-0.5 text-xs text-[#6a7282]">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between text-xs text-[#6a7282]">
              <span>{formatWordCount(wordCount)}</span>
              <span>{formatDate(updatedAt)}</span>
            </div>
          </div>
        </Link>

        <CardDropdown
          status={status}
          coverUrl={coverUrl}
          onEdit={() => card.setIsEditOpen(true)}
          onCoverGenerate={card.openCoverDialog}
          onArchive={card.handleArchive}
          onDelete={() => card.setIsDeleteOpen(true)}
        />
      </div>

      <EditNovelDialog
        open={card.isEditOpen}
        onOpenChange={card.setIsEditOpen}
        novel={{ id, title, tags: tags.join(",") }}
      />

      <DeleteDialog
        open={card.isDeleteOpen}
        onOpenChange={card.setIsDeleteOpen}
        title={title}
        isDeleting={card.isDeleting}
        onDelete={card.handleDelete}
      />

      <CoverDialog
        open={card.isCoverDialogOpen}
        onOpenChange={card.setIsCoverDialogOpen}
        coverTitle={card.coverTitle}
        coverAuthor={card.coverAuthor}
        coverChannel={card.coverChannel}
        coverGenre={card.coverGenre}
        coverDescription={card.coverDescription}
        onCoverTitleChange={card.setCoverTitle}
        onCoverAuthorChange={card.setCoverAuthor}
        onCoverChannelChange={card.setCoverChannel}
        onCoverGenreChange={card.setCoverGenre}
        onCoverDescriptionChange={card.setCoverDescription}
        onGenerate={card.handleGenerateCover}
      />
    </>
  )
}

export function CreateWorkCard({ onClick }: CreateWorkCardProps) {
  return (
    <div className="rounded-[10px] border-[1.6px] border-dashed border-[#d1d5dc] bg-white transition-colors hover:border-[#2b7fff] hover:bg-[#2b7fff]/5">
      <button
        onClick={onClick}
        className="flex w-full aspect-[3/4] flex-col items-center justify-center gap-3 cursor-pointer"
      >
        <div className="flex size-10 items-center justify-center rounded-full bg-gray-100">
          <Plus className="size-5 text-[#6a7282]" />
        </div>
        <span className="text-sm text-[#6a7282]">新建作品</span>
      </button>
      <div className="p-3">
        <div className="h-4" />
      </div>
    </div>
  )
}
