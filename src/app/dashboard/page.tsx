"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { TopBar } from "@/components/layout/top-bar";
import { WorkCard, CreateWorkCard } from "@/components/dashboard/work-card";
import { ActivityPanel } from "@/components/dashboard/activity-panel";
import { WorksFilter } from "@/components/dashboard/works-filter";
import { CreateNovelDialog } from "@/components/dashboard/create-novel-dialog";
import { useNovels } from "@/hooks/use-novels";

type FilterTab = "all" | "archived";
type NovelStatus = "active" | "archived";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: novels = [], isLoading } = useNovels();

  // Filter novels based on active tab
  const filteredNovels = novels.filter((novel) => {
    if (activeTab === "all") return novel.status !== "archived";
    if (activeTab === "archived") return novel.status === "archived";
    return true;
  });

  return (
    <DashboardLayout>
      <div className="flex h-screen flex-col">
        <TopBar title="我的作品" showWelcome />

        <div className="flex flex-1 overflow-hidden">
          {/* Main Content */}
          <div className="flex-1 overflow-auto p-6">
            <WorksFilter activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Works Grid */}
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
              <CreateWorkCard onClick={() => setIsCreateDialogOpen(true)} />
              {isLoading ? (
                <div className="col-span-full flex items-center justify-center py-12 text-gray-500">
                  加载中...
                </div>
              ) : (
                filteredNovels.map((novel) => (
                  <WorkCard
                    key={novel.id}
                    id={novel.id}
                    title={novel.title}
                    status={novel.status as NovelStatus}
                    wordCount={novel.totalWords}
                    updatedAt={novel.updatedAt}
                    coverUrl={novel.coverUrl || undefined}
                  />
                ))
              )}
            </div>
          </div>

          {/* Activity Panel */}
          <ActivityPanel />
        </div>
      </div>

      {/* 新建作品弹窗 */}
      <CreateNovelDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </DashboardLayout>
  );
}
