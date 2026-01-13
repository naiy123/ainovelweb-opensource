"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { User, BookOpen, Pin, Trash2, X, Plus, Brain, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Card, CardCategory, CharacterAttributes } from "@/hooks/use-cards";

interface PrefillData {
  name: string;
  description?: string;
  tags?: string;
  triggers?: string[];
  attributes?: Record<string, unknown>;
}

interface CardEditorProps {
  card: Card | null;
  category: CardCategory;
  isNew?: boolean;
  onSave: (data: Partial<Card>) => void;
  onDelete?: () => void;
  onCancel?: () => void;
  saveStatus?: "saved" | "unsaved" | "saving";
  prefillData?: PrefillData | null;
  onPrefillConsumed?: () => void;
}

// 标签输入组件
function TagInput({
  tags,
  onChange,
  placeholder = "添加标签",
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState("");

  const handleAdd = () => {
    if (input.trim() && !tags.includes(input.trim())) {
      onChange([...tags, input.trim()]);
      setInput("");
    }
  };

  const handleRemove = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-sm"
          >
            {tag}
            <button
              onClick={() => handleRemove(tag)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAdd())}
          placeholder={placeholder}
          className="flex-1 rounded border border-gray-200 px-3 py-1.5 text-sm focus:border-[#2b7fff] focus:outline-none"
        />
        <button
          onClick={handleAdd}
          className="rounded bg-gray-100 px-3 py-1.5 text-sm hover:bg-gray-200"
        >
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  );
}

export function CardEditor({
  card,
  category,
  isNew = false,
  onSave,
  onDelete,
  onCancel,
  saveStatus = "saved",
  prefillData,
  onPrefillConsumed,
}: CardEditorProps) {
  // 表单状态
  const [name, setName] = useState(card?.name || "");
  const [description, setDescription] = useState(card?.description || "");
  const [tags, setTags] = useState<string[]>(
    card?.tags ? card.tags.split(",").filter(Boolean) : []
  );
  const [triggers, setTriggers] = useState<string[]>(card?.triggers || []);
  const [isPinned, setIsPinned] = useState(card?.isPinned || false);

  // 角色专属字段
  const [attributes, setAttributes] = useState<CharacterAttributes>(
    (card?.attributes as CharacterAttributes) || {}
  );

  // 脏标记：只有用户真正编辑时才为 true
  const [isDirty, setIsDirty] = useState(false);
  // 自动保存定时器
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 当 card 变化时更新表单（不设置 isDirty）
  useEffect(() => {
    if (card) {
      setName(card.name);
      setDescription(card.description || "");
      setTags(card.tags ? card.tags.split(",").filter(Boolean) : []);
      setTriggers(card.triggers || []);
      setIsPinned(card.isPinned);
      setAttributes((card.attributes as CharacterAttributes) || {});
    } else if (isNew) {
      setName("");
      setDescription("");
      setTags([]);
      setTriggers([]);
      setIsPinned(false);
      setAttributes({});
    }
    setIsDirty(false); // 重置脏标记
  }, [card, isNew]);

  // 当 prefillData 变化时预填充表单（设置 isDirty，因为是新内容需要保存）
  useEffect(() => {
    if (prefillData) {
      setName(prefillData.name);
      if (prefillData.description) setDescription(prefillData.description);
      if (prefillData.tags) setTags(prefillData.tags.split(",").filter(Boolean));
      if (prefillData.triggers) setTriggers(prefillData.triggers);
      if (prefillData.attributes) {
        setAttributes(prefillData.attributes as CharacterAttributes);
      }
      setIsDirty(true); // AI 生成的数据需要保存
      onPrefillConsumed?.();
    }
  }, [prefillData, onPrefillConsumed]);

  // 收集表单数据
  const getFormData = useCallback(() => {
    return {
      name,
      category,
      description: description || null,
      tags: tags.length > 0 ? tags.join(",") : null,
      triggers,
      isPinned,
      attributes: category === "character" ? attributes : null,
    };
  }, [name, category, description, tags, triggers, isPinned, attributes]);

  // 自动保存（3秒延迟，只在 isDirty 时触发）
  useEffect(() => {
    if (!isDirty || isNew) return;

    // 清除之前的定时器
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // 设置新的定时器
    autoSaveTimerRef.current = setTimeout(() => {
      onSave(getFormData());
      setIsDirty(false);
    }, 3000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [isDirty, isNew, onSave, getFormData]);

  // 用户编辑时的包装函数
  const handleChange = <T,>(setter: React.Dispatch<React.SetStateAction<T>>) => {
    return (value: T | ((prev: T) => T)) => {
      setter(value);
      setIsDirty(true);
    };
  };

  // 手动保存
  const handleSave = () => {
    if (!name.trim()) {
      alert("名称不能为空");
      return;
    }
    onSave(getFormData());
  };

  // 删除确认
  const handleDelete = () => {
    if (window.confirm(`确定要删除${category === "character" ? "角色" : "词条"}"${name}"吗？`)) {
      onDelete?.();
    }
  };

  const isCharacter = category === "character";
  const categoryLabel = isCharacter ? "角色" : "词条";

  return (
    <div className="flex h-full flex-col bg-white">
      {/* 顶部标题栏 */}
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          {isCharacter ? (
            <User className="size-5 text-gray-500" />
          ) : (
            <BookOpen className="size-5 text-gray-500" />
          )}
          <span className="text-lg font-medium">
            {isNew ? `新建${categoryLabel}` : `编辑${categoryLabel}`}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Embedding 状态指示器 */}
          {!isNew && (
            <div
              className={cn(
                "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs",
                card?.hasEmbedding
                  ? "bg-purple-50 text-purple-600"
                  : saveStatus === "saving"
                  ? "bg-gray-100 text-gray-400"
                  : "bg-amber-50 text-amber-600"
              )}
              title={
                card?.hasEmbedding
                  ? "已启用语义检索"
                  : saveStatus === "saving"
                  ? "正在生成向量..."
                  : "向量生成中，保存后自动完成"
              }
            >
              {saveStatus === "saving" ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Brain className="size-3" />
              )}
              <span>{card?.hasEmbedding ? "语义" : "待索引"}</span>
            </div>
          )}
          {/* 保存状态 */}
          <span
            className={cn(
              "text-sm",
              saveStatus === "saved"
                ? "text-green-600"
                : saveStatus === "saving"
                ? "text-gray-400"
                : "text-amber-500"
            )}
          >
            {saveStatus === "saved"
              ? "已保存"
              : saveStatus === "saving"
              ? "保存中..."
              : "待保存"}
          </span>
        </div>
      </div>

      {/* 表单内容 */}
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* 基础信息 */}
          <div className="space-y-4">
            {/* 名称 */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                {categoryLabel}名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleChange(setName)(e.target.value)}
                placeholder={`请输入${categoryLabel}名称`}
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:border-[#2b7fff] focus:outline-none"
              />
            </div>

            {/* 标签 */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                标签
              </label>
              <TagInput tags={tags} onChange={handleChange(setTags)} />
            </div>

            {/* 触发词 */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                触发词
                <span className="ml-2 text-xs font-normal text-gray-400">
                  用于自动关联
                </span>
              </label>
              <p className="mb-2 text-xs text-gray-500">
                当章节内容中出现这些词时，会自动将此{isCharacter ? "角色" : "词条"}的设定注入 AI 上下文
              </p>
              <TagInput
                tags={triggers}
                onChange={handleChange(setTriggers)}
                placeholder={`添加触发词，如: ${name || (isCharacter ? "角色名" : "词条名")}`}
              />
            </div>

            {/* 置顶 */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPinned"
                checked={isPinned}
                onChange={(e) => handleChange(setIsPinned)(e.target.checked)}
                className="size-4 rounded border-gray-300 text-[#2b7fff] focus:ring-[#2b7fff]"
              />
              <label htmlFor="isPinned" className="flex items-center gap-1 text-sm text-gray-700">
                <Pin className="size-4" />
                置顶显示
              </label>
            </div>
          </div>

          {/* 角色专属字段 */}
          {isCharacter && (
            <div className="space-y-4 rounded-lg border border-gray-200 p-4">
              <h3 className="font-medium text-gray-900">基础信息</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm text-gray-600">性别</label>
                  <select
                    value={attributes.gender || ""}
                    onChange={(e) =>
                      handleChange(setAttributes)({ ...attributes, gender: e.target.value })
                    }
                    className="w-full rounded border border-gray-200 px-3 py-2 focus:border-[#2b7fff] focus:outline-none"
                  >
                    <option value="">未设置</option>
                    <option value="男">男</option>
                    <option value="女">女</option>
                    <option value="其他">其他</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm text-gray-600">年龄</label>
                  <input
                    type="text"
                    value={attributes.age || ""}
                    onChange={(e) =>
                      handleChange(setAttributes)({ ...attributes, age: e.target.value })
                    }
                    placeholder="如: 18岁、青年"
                    className="w-full rounded border border-gray-200 px-3 py-2 focus:border-[#2b7fff] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm text-gray-600">
                  性格特点
                  <span className="ml-2 text-xs text-gray-400">
                    {(attributes.personality || "").length}/500
                  </span>
                </label>
                <textarea
                  value={attributes.personality || ""}
                  onChange={(e) =>
                    handleChange(setAttributes)({ ...attributes, personality: e.target.value })
                  }
                  placeholder="描述角色的性格特点..."
                  rows={3}
                  maxLength={500}
                  className="w-full resize-none rounded border border-gray-200 px-3 py-2 focus:border-[#2b7fff] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm text-gray-600">
                  背景故事
                  <span className="ml-2 text-xs text-gray-400">
                    {(attributes.background || "").length}/2000
                  </span>
                </label>
                <textarea
                  value={attributes.background || ""}
                  onChange={(e) =>
                    handleChange(setAttributes)({ ...attributes, background: e.target.value })
                  }
                  placeholder="描述角色的背景故事..."
                  rows={5}
                  maxLength={2000}
                  className="w-full resize-none rounded border border-gray-200 px-3 py-2 focus:border-[#2b7fff] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm text-gray-600">
                  能力设定
                  <span className="ml-2 text-xs text-gray-400">
                    {(attributes.abilities || "").length}/1000
                  </span>
                </label>
                <textarea
                  value={attributes.abilities || ""}
                  onChange={(e) =>
                    handleChange(setAttributes)({ ...attributes, abilities: e.target.value })
                  }
                  placeholder="描述角色的能力、技能、特长..."
                  rows={3}
                  maxLength={1000}
                  className="w-full resize-none rounded border border-gray-200 px-3 py-2 focus:border-[#2b7fff] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm text-gray-600">
                  人物关系
                  <span className="ml-2 text-xs text-gray-400">
                    {(attributes.relations || "").length}/1000
                  </span>
                </label>
                <textarea
                  value={attributes.relations || ""}
                  onChange={(e) =>
                    handleChange(setAttributes)({ ...attributes, relations: e.target.value })
                  }
                  placeholder="描述与其他角色的关系..."
                  rows={3}
                  maxLength={1000}
                  className="w-full resize-none rounded border border-gray-200 px-3 py-2 focus:border-[#2b7fff] focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* 描述/内容 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              {isCharacter ? "补充描述" : "词条内容"}
              <span className="ml-2 text-xs text-gray-400">
                {description.length}/5000
              </span>
            </label>
            <textarea
              value={description}
              onChange={(e) => handleChange(setDescription)(e.target.value)}
              placeholder={
                isCharacter
                  ? "其他补充信息..."
                  : "详细描述这个词条的内容..."
              }
              rows={isCharacter ? 4 : 10}
              maxLength={5000}
              className="w-full resize-none rounded-lg border border-gray-200 px-4 py-3 focus:border-[#2b7fff] focus:outline-none"
            />
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center justify-between pt-4">
            <div>
              {!isNew && onDelete && (
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 rounded px-4 py-2 text-red-500 hover:bg-red-50"
                >
                  <Trash2 className="size-4" />
                  删除{categoryLabel}
                </button>
              )}
            </div>
            <div className="flex gap-3">
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="rounded-lg border border-gray-200 px-6 py-2 hover:bg-gray-50"
                >
                  取消
                </button>
              )}
              <button
                onClick={handleSave}
                className="rounded-lg bg-[#2b7fff] px-6 py-2 text-white hover:bg-[#2b7fff]/90"
              >
                {isNew ? "创建" : "保存"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
