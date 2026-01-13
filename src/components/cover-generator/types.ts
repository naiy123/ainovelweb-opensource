// 基础枚举
export enum CoverMode {
  PRESET = "PRESET",
  AI_GEN = "AI_GEN",
}

export enum AppStep {
  BACKGROUND = "BACKGROUND",
  TYPOGRAPHY = "TYPOGRAPHY",
  RESULT = "RESULT",
}

// 生成模式类型
export type QuickModel = "designer" | "stylist"
export type Step = "background" | "style" | "generate"
export type BgMode = "preset" | "ai" | "upload"
export type GenerateMode = "quick" | "advanced"
export type ChannelType = "male" | "female"

// 基础接口
export interface PresetBackground {
  id: string
  url: string
  name: string
  category?: string
}

export interface TypographyPreset {
  id: string
  name: string
  label: string
  promptDescription: string
  cssClass: string
  previewColor: string
  previewText: string
}

export interface CoverState {
  title: string
  author: string
  synopsis: string
  bgMode: CoverMode
  selectedBgId: string | null
  generatedBgData: string | null
  selectedTypographyId: string
  finalCoverUrl: string | null
  step: AppStep
}

// 图片数据
export interface ImageData {
  base64: string
  preview: string
}

// 历史记录
export interface HistoryImage {
  id: string
  type: "background" | "cover"
  imageUrl: string
  title?: string
  author?: string
  prompt?: string
  createdAt: string
}

// 模型选项
export interface QuickModelOption {
  id: QuickModel
  name: string
  description: string
  credits: number
  available: boolean
}

// AI 背景预设
export interface AIBackgroundPreset {
  id: string
  name: string
  prompt: string
}

// 预设样式
export interface PresetStyle {
  id: string
  url: string
  name: string
}

// 类型选项
export interface GenreOption {
  label: string
  genres: string[]
}
