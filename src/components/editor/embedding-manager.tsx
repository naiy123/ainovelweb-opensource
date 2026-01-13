"use client";

import { useState, useEffect } from "react";
import { Brain, RefreshCw, CheckCircle2 } from "lucide-react";

interface EmbeddingStatus {
  cards: { total: number; withEmbedding: number; percentage: number };
  summaries: { total: number; withEmbedding: number; percentage: number };
}

interface EmbeddingManagerProps {
  novelId: string;
  compact?: boolean;
}

export function EmbeddingManager({ novelId, compact = false }: EmbeddingManagerProps) {
  const [status, setStatus] = useState<EmbeddingStatus | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateResult, setUpdateResult] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`/api/novels/${novelId}/embeddings`);
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (err) {
      console.error("获取 embedding 状态失败:", err);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [novelId]);

  const handleBatchUpdate = async () => {
    setIsUpdating(true);
    setUpdateResult(null);
    try {
      const res = await fetch(`/api/novels/${novelId}/embeddings`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setUpdateResult(`✓ 卡片 ${data.cards.updated}/${data.cards.total}，摘要 ${data.summaries.updated}/${data.summaries.total}`);
        fetchStatus();
      } else {
        setUpdateResult(`✗ ${data.error || "更新失败"}`);
      }
    } catch (err) {
      setUpdateResult("✗ 更新失败");
    } finally {
      setIsUpdating(false);
    }
  };

  const totalItems = (status?.cards.total || 0) + (status?.summaries.total || 0);
  const totalWithEmbedding = (status?.cards.withEmbedding || 0) + (status?.summaries.withEmbedding || 0);
  const overallPercentage = totalItems > 0 ? Math.round((totalWithEmbedding / totalItems) * 100) : 0;

  // 如果没有任何卡片或摘要，不显示
  if (totalItems === 0) {
    return null;
  }

  if (compact) {
    return (
      <div className="mx-2 my-2 rounded-lg border border-gray-200 bg-gray-50 p-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Brain className="size-3.5 text-purple-500" />
            <span className="text-xs text-gray-600">语义索引</span>
          </div>
          {overallPercentage === 100 ? (
            <CheckCircle2 className="size-3.5 text-green-500" />
          ) : (
            <button
              onClick={handleBatchUpdate}
              disabled={isUpdating}
              className="flex items-center gap-1 rounded bg-purple-100 px-1.5 py-0.5 text-xs text-purple-600 hover:bg-purple-200 disabled:opacity-50"
            >
              <RefreshCw className={`size-3 ${isUpdating ? "animate-spin" : ""}`} />
              <span>{isUpdating ? "..." : `${overallPercentage}%`}</span>
            </button>
          )}
        </div>
        {updateResult && (
          <p className={`mt-1 text-xs ${updateResult.startsWith("✓") ? "text-green-600" : "text-red-500"}`}>
            {updateResult}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="border-t border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Brain className="size-4 text-purple-500" />
          <span className="text-sm font-medium text-gray-700">语义检索</span>
        </div>
        {status && overallPercentage === 100 && (
          <CheckCircle2 className="size-4 text-green-500" />
        )}
      </div>

      {status && (
        <div className="space-y-2 mb-3">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 transition-all duration-300"
              style={{ width: `${overallPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>卡片 {status.cards.withEmbedding}/{status.cards.total}</span>
            <span>摘要 {status.summaries.withEmbedding}/{status.summaries.total}</span>
          </div>
        </div>
      )}

      {updateResult && (
        <p className={`text-xs mb-2 ${updateResult.startsWith("✓") ? "text-green-600" : "text-red-500"}`}>
          {updateResult}
        </p>
      )}

      <button
        onClick={handleBatchUpdate}
        disabled={isUpdating || !!(status && overallPercentage === 100)}
        className="w-full flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <RefreshCw className={`size-4 ${isUpdating ? "animate-spin" : ""}`} />
        {isUpdating ? "更新中..." : overallPercentage === 100 ? "全部已索引" : "更新全部向量"}
      </button>

      <p className="mt-2 text-xs text-gray-400">
        向量索引用于智能匹配相关设定
      </p>
    </div>
  );
}
