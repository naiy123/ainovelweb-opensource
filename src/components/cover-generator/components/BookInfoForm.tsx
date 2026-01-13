"use client"

import type { ChannelType, GenerateMode } from "../types"
import { GENRE_OPTIONS } from "../constants"

interface BookInfoFormProps {
  title: string
  author: string
  channel: ChannelType
  genre: string
  description: string
  generateMode: GenerateMode
  onTitleChange: (value: string) => void
  onAuthorChange: (value: string) => void
  onChannelChange: (ch: ChannelType) => void
  onGenreChange: (value: string) => void
  onDescriptionChange: (value: string) => void
}

export function BookInfoForm({
  title, author, channel, genre, description, generateMode,
  onTitleChange, onAuthorChange, onChannelChange, onGenreChange, onDescriptionChange,
}: BookInfoFormProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-1 h-4 bg-[#00e5ff] rounded-full" />
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#6a7282]">
          作品信息
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] text-[#6a7282] mb-1">书名 *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="w-full bg-[#111827] border border-white/10 rounded px-3 py-2 text-sm focus:border-[#00e5ff] outline-none text-white"
            placeholder="输入书名..."
          />
        </div>
        <div>
          <label className="block text-[10px] text-[#6a7282] mb-1">作者</label>
          <input
            type="text"
            value={author}
            onChange={(e) => onAuthorChange(e.target.value)}
            className="w-full bg-[#111827] border border-white/10 rounded px-3 py-2 text-sm focus:border-[#00e5ff] outline-none text-white"
            placeholder="输入作者..."
          />
        </div>
      </div>

      {generateMode === "quick" && (
        <>
          <div>
            <label className="block text-[10px] text-[#6a7282] mb-1">频道 *</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(GENRE_OPTIONS) as ChannelType[]).map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => onChannelChange(ch)}
                  className={`py-2 px-3 rounded border text-sm font-medium transition-all ${
                    channel === ch
                      ? "border-[#00e5ff] bg-[#00e5ff]/10 text-[#00e5ff]"
                      : "border-white/10 text-white/60 hover:border-white/20"
                  }`}
                >
                  {GENRE_OPTIONS[ch].label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[10px] text-[#6a7282] mb-1">小说类型 *</label>
            <select
              value={genre}
              onChange={(e) => onGenreChange(e.target.value)}
              className="w-full bg-[#111827] border border-white/10 rounded px-3 py-2 text-sm focus:border-[#00e5ff] outline-none text-white"
            >
              <option value="">请选择类型</option>
              {GENRE_OPTIONS[channel].genres.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        </>
      )}

      <div>
        <label className="block text-[10px] text-[#6a7282] mb-1">小说简介/风格描述</label>
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          className="w-full bg-[#111827] border border-white/10 rounded px-3 py-2 text-sm focus:border-[#00e5ff] outline-none text-white resize-none"
          placeholder="描述小说的氛围、场景或封面风格，如：仙侠修真、云海仙山..."
          rows={2}
          maxLength={200}
        />
        <p className="text-[10px] text-white/30 mt-1">{description.length}/200</p>
      </div>
    </section>
  )
}
