"use client";

import { X, Search, Bell, Sparkles } from "lucide-react";
import { useState } from "react";
import { useUserStore } from "@/stores/user-store";

interface TopBarProps {
  title?: string;
  showWelcome?: boolean;
}

export function TopBar({ title = "我的作品", showWelcome = true }: TopBarProps) {
  const [showBanner, setShowBanner] = useState(true);
  const profile = useUserStore((state) => state.profile);

  return (
    <header className="border-b border-gray-200 bg-white">
      {/* Welcome Banner */}
      {showWelcome && showBanner && (
        <div className="flex h-10 items-center justify-between border-b border-[#2b7fff]/20 bg-[#e8f4fd] px-4">
          <div className="flex items-center gap-2">
            <div className="flex size-5 items-center justify-center rounded-full bg-[#2b7fff]">
              <span className="text-xs text-white">!</span>
            </div>
            <span className="text-base text-[#364153]">
              欢迎使用灵机写作！开始您的创作之旅吧
            </span>
          </div>
          <button
            onClick={() => setShowBanner(false)}
            className="text-[#6a7282] hover:text-[#364153]"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Title Bar */}
      <div className="flex h-14 items-center justify-between px-4">
        <h1 className="text-base font-normal text-neutral-950">{title}</h1>
        <div className="flex items-center gap-3">
          {/* Token Balance */}
          <div className="flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/50 px-3 py-1.5">
            <Sparkles className="size-4 text-indigo-500" />
            <span className="text-sm font-medium text-indigo-600">
              {profile?.creditBalance ?? "--"} 灵感点
            </span>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#6a7282]" />
            <input
              type="text"
              placeholder="搜索作品..."
              className="h-10 w-[230px] rounded border border-gray-200 bg-gray-50 pl-10 pr-4 text-base outline-none placeholder:text-[#6a7282] focus:border-[#2b7fff]"
            />
          </div>
          {/* Notifications */}
          <button className="flex size-9 items-center justify-center rounded hover:bg-gray-50">
            <Bell className="size-5 text-[#6a7282]" />
          </button>
        </div>
      </div>
    </header>
  );
}
