"use client";

import { useState, useEffect } from "react";
import type { GeneratedCharacter, GeneratedTerm } from "@/lib/ai";
import { Sparkles } from "lucide-react";

// 风格选项
const STYLE_OPTIONS = [
  { value: "", label: "自动识别" },
  { value: "玄幻", label: "玄幻" },
  { value: "仙侠", label: "仙侠" },
  { value: "都市", label: "都市" },
  { value: "科幻", label: "科幻" },
  { value: "西幻", label: "西幻" },
  { value: "历史", label: "历史" },
  { value: "游戏", label: "游戏" },
];

// 卡片生成模型选项
const MODEL_OPTIONS = [
  { id: "fast", name: "疾速", credits: 1, description: "快速生成" },
  { id: "balanced", name: "均衡", credits: 3, description: "更丰富细节" },
  { id: "pro", name: "专业", credits: 10, description: "专业级设定" },
];

// 示例 placeholder（仅支持 character 和 term）
const PLACEHOLDER_EXAMPLES: Record<"character" | "term", string[]> = {
  character: [
    "冷酷 剑客 复仇",
    "火属性 暴躁 女",
    "主角的师父，性格古怪但武功高强",
    "神秘老者 隐世高人",
  ],
  term: [
    "修炼体系 境界划分",
    "上古神器 剑",
    "神秘组织 暗杀",
    "功法 火属性",
  ],
};

interface SettingsAssistantPanelProps {
  novelId: string;
  category: "character" | "term";
  isNew: boolean;
  onApplyGenerated: (data: {
    name: string;
    description?: string;
    tags?: string;
    attributes?: Record<string, unknown>;
  }) => void;
}

export function SettingsAssistantPanel({
  novelId,
  category,
  isNew,
  onApplyGenerated,
}: SettingsAssistantPanelProps) {
  const categoryLabel = category === "character" ? "角色" : "词条";
  const placeholders = PLACEHOLDER_EXAMPLES[category];
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  const [keywords, setKeywords] = useState("");
  const [style, setStyle] = useState("");
  const [selectedModel, setSelectedModel] = useState("fast");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<GeneratedCharacter | GeneratedTerm | null>(null);
  const [selectedNameIndex, setSelectedNameIndex] = useState(0);
  const [error, setError] = useState("");

  const currentModel = MODEL_OPTIONS.find(m => m.id === selectedModel) || MODEL_OPTIONS[0];

  // 轮换 placeholder
  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [placeholders.length]);

  // 重置状态当 category 变化
  useEffect(() => {
    setKeywords("");
    setGeneratedResult(null);
    setSelectedNameIndex(0);
    setError("");
  }, [category]);

  const handleGenerate = async () => {
    if (!keywords.trim()) {
      setError("请输入关键词或描述");
      return;
    }

    setIsGenerating(true);
    setError("");
    setGeneratedResult(null);

    try {
      const response = await fetch(`/api/novels/${novelId}/cards/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          keywords: keywords.trim(),
          style: style || undefined,
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "生成失败");
      }

      const result = await response.json();
      setGeneratedResult(result.data);
      setSelectedNameIndex(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成失败，请重试");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    if (!generatedResult) return;

    const selectedName = generatedResult.names[selectedNameIndex]?.name || "";

    if (category === "character") {
      const data = generatedResult as GeneratedCharacter;
      onApplyGenerated({
        name: selectedName,
        tags: data.suggestedTags?.join(","),
        attributes: {
          gender: data.gender,
          age: data.age,
          personality: data.personality,
          background: data.background,
          abilities: data.abilities,
        },
      });
    } else {
      const data = generatedResult as GeneratedTerm;
      onApplyGenerated({
        name: selectedName,
        description: data.description,
        tags: data.suggestedTags?.join(","),
      });
    }

    // 清空生成结果
    setGeneratedResult(null);
    setKeywords("");
  };

  return (
    <aside className="flex h-full w-80 flex-col border-l border-gray-200 bg-white">
      <div className="border-b border-gray-200 p-4">
        <h2 className="text-base font-medium text-gray-900">设定助手</h2>
        <p className="mt-1 text-sm text-gray-500">
          智能辅助生成{categoryLabel}设定
        </p>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-4">
          {/* 输入区域 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              描述你想要的{categoryLabel}
            </label>
            <textarea
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder={placeholders[placeholderIndex]}
              rows={3}
              className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm placeholder:text-gray-300 focus:border-[#2b7fff] focus:outline-none"
            />
            <p className="mt-1 text-xs text-gray-400">
              输入关键词、标签或简短描述
            </p>
          </div>

          {/* 风格选择 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              风格
            </label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#2b7fff] focus:outline-none"
            >
              {STYLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* 模型选择 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              生成模型
            </label>
            <div className="grid grid-cols-3 gap-2">
              {MODEL_OPTIONS.map((model) => (
                <button
                  key={model.id}
                  onClick={() => setSelectedModel(model.id)}
                  className={`flex flex-col items-center rounded-lg border p-2 text-xs transition-colors ${
                    selectedModel === model.id
                      ? "border-[#2b7fff] bg-[#2b7fff]/5 text-[#2b7fff]"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span className="font-medium">{model.name}</span>
                  <span className="mt-0.5 flex items-center gap-0.5 text-[10px] opacity-70">
                    <Sparkles className="size-2.5" />
                    {model.credits}
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-gray-400">
              {currentModel.description}
            </p>
          </div>

          {/* 生成按钮 */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !keywords.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2b7fff] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#2b7fff]/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isGenerating ? (
              "生成中..."
            ) : (
              <>
                智能生成{categoryLabel}
                <span className="flex items-center gap-0.5 rounded bg-white/20 px-1.5 py-0.5 text-xs">
                  <Sparkles className="size-3" />
                  {currentModel.credits}
                </span>
              </>
            )}
          </button>

          {/* 错误提示 */}
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* 生成结果 */}
          {generatedResult && (
            <div className="space-y-4 rounded-lg border border-green-200 bg-green-50 p-4">
              <h3 className="text-sm font-medium text-green-900">
                生成结果
              </h3>

              {/* 名字候选 */}
              <div>
                <p className="mb-2 text-xs font-medium text-gray-600">选择名字：</p>
                <div className="space-y-2">
                  {generatedResult.names.map((item, index) => (
                    <label
                      key={index}
                      className={`flex cursor-pointer items-start gap-2 rounded-lg border p-2 transition-colors ${
                        selectedNameIndex === index
                          ? "border-[#2b7fff] bg-[#2b7fff]/5"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="selectedName"
                        checked={selectedNameIndex === index}
                        onChange={() => setSelectedNameIndex(index)}
                        className="mt-0.5"
                      />
                      <div>
                        <span className="font-medium text-gray-900">{item.name}</span>
                        <p className="text-xs text-gray-500">{item.meaning}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* 预览其他字段 */}
              {category === "character" && (
                <div className="space-y-2 text-xs text-gray-600">
                  <p><span className="font-medium">性别：</span>{(generatedResult as GeneratedCharacter).gender}</p>
                  <p><span className="font-medium">年龄：</span>{(generatedResult as GeneratedCharacter).age}</p>
                  <p><span className="font-medium">性格：</span>{(generatedResult as GeneratedCharacter).personality?.slice(0, 50)}...</p>
                </div>
              )}

              {category === "term" && (
                <div className="text-xs text-gray-600">
                  <p><span className="font-medium">描述：</span>{(generatedResult as GeneratedTerm).description?.slice(0, 100)}...</p>
                </div>
              )}

              {/* 标签预览 */}
              {generatedResult.suggestedTags && (
                <div className="flex flex-wrap gap-1">
                  {generatedResult.suggestedTags.map((tag, i) => (
                    <span key={i} className="rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-600">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* 应用按钮 */}
              <div className="flex gap-2">
                <button
                  onClick={handleApply}
                  className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                  采用并填充
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50"
                >
                  重新生成
                </button>
              </div>
            </div>
          )}

          {/* 使用提示 */}
          {!generatedResult && (
            <div className="rounded-lg bg-gray-50 p-4">
              <h4 className="text-sm font-medium text-gray-700">示例输入</h4>
              <ul className="mt-2 space-y-1 text-xs text-gray-500">
                {placeholders.map((example, i) => (
                  <li key={i} className="cursor-pointer hover:text-[#2b7fff]" onClick={() => setKeywords(example)}>
                    • {example}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
