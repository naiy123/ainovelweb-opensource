"use client";

import { Sparkles, Clock, TrendingUp, Bell, Award, Loader2, Star, BookOpen, Wand2, Image } from "lucide-react";
import { toast } from "sonner";
import { useInspirations, useActivities, useWeeklyStats, type UserActivity } from "@/hooks/use-dashboard";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

// 动态类型与图标/颜色的映射
type ActivityType = UserActivity["type"];

const activityIcons: Record<string, { icon: typeof Clock; bgColor: string; iconColor: string }> = {
  welcome: { icon: Star, bgColor: "bg-[#2b7fff]/10", iconColor: "text-[#2b7fff]" },
  novel_created: { icon: BookOpen, bgColor: "bg-[#00c950]/10", iconColor: "text-[#00c950]" },
  chapter_completed: { icon: BookOpen, bgColor: "bg-[#00c950]/10", iconColor: "text-[#00c950]" },
  word_milestone: { icon: TrendingUp, bgColor: "bg-[#d08700]/10", iconColor: "text-[#d08700]" },
  streak_achievement: { icon: Award, bgColor: "bg-[#00c950]/10", iconColor: "text-[#00c950]" },
  ai_used: { icon: Wand2, bgColor: "bg-[#8b5cf6]/10", iconColor: "text-[#8b5cf6]" },
  cover_generated: { icon: Image, bgColor: "bg-[#ec4899]/10", iconColor: "text-[#ec4899]" },
  system_update: { icon: Bell, bgColor: "bg-[#2b7fff]/10", iconColor: "text-[#2b7fff]" },
};

// 灵感类型颜色映射
const inspirationColors: Record<string, string> = {
  "场景描写": "#d08700",
  "人物塑造": "#2b7fff",
  "写作技巧": "#00c950",
  "情节构思": "#ec4899",
  "对话技巧": "#8b5cf6",
  "氛围营造": "#06b6d4",
};

// 格式化时间
function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return formatDistanceToNow(date, { addSuffix: true, locale: zhCN });
}

export function ActivityPanel() {
  const { data: inspirations, isLoading: inspirationsLoading, refresh: refreshInspirations } = useInspirations();
  const { data: activities, isLoading: activitiesLoading } = useActivities();
  const { data: stats, isLoading: statsLoading } = useWeeklyStats();

  const handleRefreshInspirations = () => {
    refreshInspirations();
    toast.success("已刷新灵感");
  };

  return (
    <aside className="w-[320px] border-l border-gray-200 bg-white">
      {/* Daily Inspiration */}
      <section className="border-b border-gray-200 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-[#2b7fff]" />
            <h3 className="text-base text-[#364153]">每日灵感</h3>
          </div>
          <button
            onClick={handleRefreshInspirations}
            disabled={inspirationsLoading}
            className="text-xs text-[#2b7fff] hover:underline disabled:opacity-50"
          >
            {inspirationsLoading ? "刷新中..." : "换一批"}
          </button>
        </div>

        <div className="space-y-3">
          {inspirationsLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="size-5 animate-spin text-gray-400" />
            </div>
          ) : inspirations && inspirations.length > 0 ? (
            inspirations.map((item, index) => {
              const color = inspirationColors[item.type] || "#6a7282";
              return (
                <div
                  key={index}
                  className="rounded border border-[#2b7fff]/10 p-3"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <div
                      className="size-3 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs" style={{ color }}>
                      {item.type}
                    </span>
                  </div>
                  <p className="text-sm text-[#364153]">{item.content}</p>
                </div>
              );
            })
          ) : (
            <p className="py-4 text-center text-sm text-gray-400">暂无灵感</p>
          )}
        </div>
      </section>

      {/* Recent Activity */}
      <section className="flex-1 overflow-auto p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base text-[#364153]">最近动态</h3>
          <button
            onClick={() => toast.info("功能开发中...")}
            className="text-xs text-[#2b7fff] hover:underline"
          >
            查看全部
          </button>
        </div>

        <div className="space-y-2">
          {activitiesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-5 animate-spin text-gray-400" />
            </div>
          ) : activities && activities.length > 0 ? (
            activities.map((activity) => {
              const iconConfig = activityIcons[activity.type] || activityIcons.system_update;
              const Icon = iconConfig.icon;
              return (
                <div key={activity.id} className="flex gap-3 rounded p-3 hover:bg-gray-50">
                  <div
                    className={`flex size-8 shrink-0 items-center justify-center rounded ${iconConfig.bgColor}`}
                  >
                    <Icon className={`size-4 ${iconConfig.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base text-[#364153]">{activity.title}</h4>
                      {!activity.isRead && (
                        <div className="size-2 rounded-full bg-[#2b7fff]" />
                      )}
                    </div>
                    <p className="truncate text-xs text-[#6a7282]">
                      {activity.description}
                    </p>
                    <span className="text-xs text-[#6a7282]">
                      {formatTime(activity.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm text-gray-400">暂无动态</p>
              <p className="mt-1 text-xs text-gray-300">开始创作，这里会记录你的成长</p>
            </div>
          )}
        </div>
      </section>

      {/* Weekly Stats */}
      <section className="border-t border-gray-200 p-4">
        <h3 className="mb-3 text-base text-[#364153]">本周统计</h3>
        <div className="flex gap-3">
          <div className="flex-1 rounded-[10px] border border-gray-200 bg-white p-3">
            <span className="text-xs text-[#6a7282]">总字数</span>
            {statsLoading ? (
              <div className="mt-1 h-7 animate-pulse rounded bg-gray-100" />
            ) : (
              <p className="text-xl text-neutral-950">{stats?.totalWords || "0"}</p>
            )}
          </div>
          <div className="flex-1 rounded-[10px] border border-gray-200 bg-white p-3">
            <span className="text-xs text-[#6a7282]">创作天数</span>
            {statsLoading ? (
              <div className="mt-1 h-7 animate-pulse rounded bg-gray-100" />
            ) : (
              <p className="text-xl text-neutral-950">{stats?.writingDays || 0}天</p>
            )}
          </div>
        </div>
      </section>
    </aside>
  );
}
