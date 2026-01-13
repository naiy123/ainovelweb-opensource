import { IMAGE_CREDITS } from "@/lib/pricing/credits"
import type {
  QuickModelOption,
  PresetBackground,
  AIBackgroundPreset,
  PresetStyle,
  GenreOption,
  ChannelType,
  TypographyPreset,
} from "./types"

// 快速生成模型选项
export const QUICK_MODEL_OPTIONS: QuickModelOption[] = [
  {
    id: "designer",
    name: "设计家",
    description: "专业设计，擅长构图与排版",
    credits: IMAGE_CREDITS.COVER_DESIGNER,
    available: true,
  },
  {
    id: "stylist",
    name: "风格家",
    description: "艺术风格，擅长氛围与色彩",
    credits: IMAGE_CREDITS.COVER_STYLIST,
    available: true,
  },
]

// 预设背景图
export const PRESET_BACKGROUNDS: PresetBackground[] = [
  { id: "bg1", url: "https://picsum.photos/id/1015/600/800", name: "山河", category: "Scenery" },
  { id: "bg2", url: "https://picsum.photos/id/1036/600/800", name: "雪域", category: "Scenery" },
  { id: "bg3", url: "https://picsum.photos/id/1040/600/800", name: "古堡", category: "Architecture" },
  { id: "bg4", url: "https://picsum.photos/id/106/600/800", name: "梦幻", category: "Abstract" },
  { id: "bg5", url: "https://picsum.photos/id/164/600/800", name: "都市", category: "Modern" },
  { id: "bg6", url: "https://picsum.photos/id/209/600/800", name: "暗黑", category: "Abstract" },
]

// AI 生成背景的预设提示词
export const AI_BACKGROUND_PRESETS: AIBackgroundPreset[] = [
  {
    id: "urban",
    name: "都市霸总",
    prompt: "Urban cityscape at night with neon lights, modern skyscrapers, rain-wet streets reflecting colorful lights, moody and mysterious, cinematic lighting, no text, book cover background, vertical composition 3:4",
  },
  {
    id: "xianxia",
    name: "仙侠玄幻",
    prompt: "Ancient Chinese celestial palace floating in clouds, golden architecture with traditional curved roofs, mystical fog, divine light rays, immortal cultivation aesthetic, epic fantasy atmosphere, no text, vertical 3:4 composition",
  },
  {
    id: "system",
    name: "系统重生",
    prompt: "Digital holographic interface floating in dark space, glowing blue data streams, futuristic UI elements, system panel aesthetic, matrix-like atmosphere, high-tech mysterious vibe, no text, vertical book cover",
  },
  {
    id: "military",
    name: "战神兵王",
    prompt: "Military special forces soldier silhouette, dark battlefield background, smoke and fire, tactical equipment, powerful stance, intense atmosphere, cinematic war movie style, no text, vertical composition",
  },
  {
    id: "mystery",
    name: "悬疑诡秘",
    prompt: "Abandoned ancient Chinese mansion in fog, eerie moonlight, supernatural horror atmosphere, traditional architecture with creepy details, dark mystery aesthetic, no text, vertical book cover",
  },
  {
    id: "romance",
    name: "甜宠言情",
    prompt: "Romantic rooftop garden at night, city lights bokeh background, elegant flowers, soft pink and gold lighting, luxury romance aesthetic, dreamy atmosphere, no text, vertical composition",
  },
]

// 预设字体风格图
export const PRESET_STYLES: PresetStyle[] = [
  { id: "st1", url: "https://picsum.photos/id/237/200/300", name: "仙侠古风" },
  { id: "st2", url: "https://picsum.photos/id/238/200/300", name: "金色典雅" },
  { id: "st3", url: "https://picsum.photos/id/239/200/300", name: "霓虹都市" },
  { id: "st4", url: "https://picsum.photos/id/240/200/300", name: "悬疑血红" },
  { id: "st5", url: "https://picsum.photos/id/241/200/300", name: "狂草战神" },
]

// 小说类型选项（男频 + 女频）
export const GENRE_OPTIONS: Record<ChannelType, GenreOption> = {
  male: {
    label: "男频",
    genres: [
      "西方奇幻", "东方仙侠", "科幻末世", "都市日常", "都市修真", "都市高武",
      "历史古代", "战神赘婿", "都市种田", "传统玄幻", "历史脑洞", "悬疑脑洞",
      "都市脑洞", "玄幻脑洞", "悬疑灵异", "抗战谍战", "游戏体育", "动漫衍生",
      "男频衍生",
    ],
  },
  female: {
    label: "女频",
    genres: [
      "古风世情", "科幻末世", "游戏体育", "女频衍生", "玄幻言情", "种田",
      "年代", "现言脑洞", "宫斗宅斗", "悬疑脑洞", "古言脑洞", "快穿",
      "青春甜宠", "星光璀璨", "女频悬疑", "职场婚恋", "豪门总裁", "民国言情",
    ],
  },
}

// 字体排版预设
export const TYPOGRAPHY_PRESETS: TypographyPreset[] = [
  {
    id: "t1",
    name: "Xianxia",
    label: "仙侠风云",
    cssClass: "font-serif",
    previewColor: "#ffffff",
    promptDescription:
      "Chinese Calligraphy style, bold black ink strokes, energetic and ancient, vertical layout preferred, resembling a Wuxia novel cover.",
    previewText: "仙",
  },
  {
    id: "t2",
    name: "Imperial",
    label: "宫廷金书",
    cssClass: "font-serif",
    previewColor: "#f1c40f",
    promptDescription:
      "Elegant Serif / Song Ti style, glowing gold texture, dignified and royal, suitable for historical romance.",
    previewText: "凤",
  },
  {
    id: "t3",
    name: "Modern",
    label: "都市异能",
    cssClass: "font-sans",
    previewColor: "#00ffff",
    promptDescription:
      "Modern Sans-serif, bold, high contrast, glowing neon effects, sleek and futuristic.",
    previewText: "城",
  },
  {
    id: "t4",
    name: "Mystery",
    label: "悬疑诡秘",
    cssClass: "font-serif",
    previewColor: "#e74c3c",
    promptDescription:
      "Sharp, jagged, slightly distressed or bleeding text effect, red or silver color, mysterious and thrilling.",
    previewText: "诡",
  },
  {
    id: "t5",
    name: "Wild",
    label: "狂草战神",
    cssClass: "font-serif",
    previewColor: "#bdc3c7",
    promptDescription:
      "Wild cursive calligraphy, artistic and unconstrained, ink splash effects, dynamic composition.",
    previewText: "狂",
  },
]
