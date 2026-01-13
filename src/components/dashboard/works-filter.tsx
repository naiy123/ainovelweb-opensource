"use client";

import { cn } from "@/lib/utils";

type FilterTab = "all" | "archived";

interface WorksFilterProps {
  activeTab: FilterTab;
  onTabChange: (tab: FilterTab) => void;
}

const tabs: { id: FilterTab; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "archived", label: "已归档" },
];

export function WorksFilter({ activeTab, onTabChange }: WorksFilterProps) {
  return (
    <div className="flex border-b border-gray-200">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "relative px-4 py-2 text-base transition-colors",
            activeTab === tab.id
              ? "text-[#2b7fff]"
              : "text-[#6a7282] hover:text-[#364153]"
          )}
        >
          {tab.label}
          {activeTab === tab.id && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2b7fff]" />
          )}
        </button>
      ))}
    </div>
  );
}
