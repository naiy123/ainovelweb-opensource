"use client"

import { X } from "lucide-react"
import type { Card, CharacterAttributes } from "@/hooks/use-cards"
import type { ChapterInfo } from "../types"

interface CharacterPickerProps {
  characters: Card[]
  selectedIds: string[]
  onToggle: (id: string) => void
  onClose: () => void
}

export function CharacterPicker({ characters, selectedIds, onToggle, onClose }: CharacterPickerProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <span className="font-medium text-neutral-950">选择角色</span>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="size-5" />
          </button>
        </div>
        <div className="max-h-80 overflow-auto p-4">
          {characters.length > 0 ? (
            characters.map((character) => {
              const attrs = character.attributes as CharacterAttributes | null
              return (
                <label key={character.id} className="mb-2 flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(character.id)}
                    onChange={() => onToggle(character.id)}
                    className="size-4 rounded border-gray-300 text-[#2b7fff] focus:ring-[#2b7fff]"
                  />
                  <div>
                    <p className="text-sm font-medium text-neutral-950">{character.name}</p>
                    <p className="text-xs text-gray-500">
                      {[attrs?.gender, attrs?.age].filter(Boolean).join(" · ") || character.description || "暂无描述"}
                    </p>
                  </div>
                </label>
              )
            })
          ) : (
            <div className="py-8 text-center text-sm text-gray-500">暂无角色卡，请先在设定中创建角色</div>
          )}
        </div>
        <div className="border-t border-gray-200 p-4">
          <button onClick={onClose} className="w-full rounded-lg bg-[#2b7fff] py-2 text-white hover:bg-[#2b7fff]/90">
            确定
          </button>
        </div>
      </div>
    </div>
  )
}

interface TermPickerProps {
  terms: Card[]
  selectedIds: string[]
  onToggle: (id: string) => void
  onClose: () => void
}

export function TermPicker({ terms, selectedIds, onToggle, onClose }: TermPickerProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <span className="font-medium text-neutral-950">选择词条</span>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="size-5" />
          </button>
        </div>
        <div className="max-h-80 overflow-auto p-4">
          {terms.length > 0 ? (
            terms.map((term) => (
              <label key={term.id} className="mb-2 flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(term.id)}
                  onChange={() => onToggle(term.id)}
                  className="size-4 rounded border-gray-300 text-[#2b7fff] focus:ring-[#2b7fff]"
                />
                <div>
                  <p className="text-sm font-medium text-neutral-950">{term.name}</p>
                  <p className="text-xs text-gray-500">{term.description || "暂无描述"}</p>
                </div>
              </label>
            ))
          ) : (
            <div className="py-8 text-center text-sm text-gray-500">暂无词条卡，请先在设定中创建词条</div>
          )}
        </div>
        <div className="border-t border-gray-200 p-4">
          <button onClick={onClose} className="w-full rounded-lg bg-[#2b7fff] py-2 text-white hover:bg-[#2b7fff]/90">
            确定
          </button>
        </div>
      </div>
    </div>
  )
}

interface ChapterPickerProps {
  chapters: ChapterInfo[]
  selectedIds: string[]
  onToggle: (id: string) => void
  onClose: () => void
}

export function ChapterPicker({ chapters, selectedIds, onToggle, onClose }: ChapterPickerProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <span className="font-medium text-neutral-950">选择章节</span>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="size-5" />
          </button>
        </div>
        <div className="max-h-80 overflow-auto p-4">
          {chapters.length > 0 ? (
            chapters.map((chapter) => (
              <label key={chapter.id} className="mb-2 flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(chapter.id)}
                  onChange={() => onToggle(chapter.id)}
                  className="size-4 rounded border-gray-300 text-[#2b7fff] focus:ring-[#2b7fff]"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-950">{chapter.title}</p>
                  <p className="text-xs text-gray-500">{chapter.wordCount} 字</p>
                </div>
              </label>
            ))
          ) : (
            <div className="py-8 text-center text-sm text-gray-500">暂无章节</div>
          )}
        </div>
        <div className="border-t border-gray-200 p-4">
          <button onClick={onClose} className="w-full rounded-lg bg-[#2b7fff] py-2 text-white hover:bg-[#2b7fff]/90">
            确定
          </button>
        </div>
      </div>
    </div>
  )
}
