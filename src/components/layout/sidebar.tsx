"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import {
  Lightbulb,
  TrendingUp,
  FileText,
  GraduationCap,
  PenTool,
  ImageIcon,
  MessageSquareText,
  ChevronRight,
  Sparkles,
  Bird,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserStore, useUserDisplayName, useUserPlanName } from "@/stores/user-store";

const navItems = [
  { name: "创意", href: "/dashboard", icon: Lightbulb, ready: true },
  { name: "智能封面", href: "/cover-generator", icon: ImageIcon, ready: true },
  { name: "朱雀降重", href: "/humanize", icon: Bird, ready: true },
  { name: "智能扫榜", href: "/rankings", icon: TrendingUp, ready: false },
  { name: "写作模板", href: "/templates", icon: FileText, ready: false },
  { name: "智能推文", href: "/marketing", icon: MessageSquareText, ready: false },
  { name: "教学", href: "/courses", icon: GraduationCap, ready: false },
  { name: "创作中心", href: "/studio", icon: PenTool, ready: false },
];

export function Sidebar() {
  const pathname = usePathname();
  const profile = useUserStore((state) => state.profile);
  const displayName = useUserDisplayName();
  const planName = useUserPlanName();
  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <aside className="flex h-screen w-[200px] flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b border-gray-200 px-4">
        <div className="flex size-8 items-center justify-center rounded bg-[#2b7fff]">
          <PenTool className="size-5 text-white" />
        </div>
        <span className="text-base font-normal text-neutral-950">灵机写作</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 pt-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

          // 如果功能未就绪，显示 toast 而不是跳转
          if (!item.ready) {
            return (
              <button
                key={item.href}
                onClick={() => toast.info(`「${item.name}」功能开发中...`)}
                className={cn(
                  "flex h-11 w-full items-center gap-3 rounded px-3 text-base transition-colors",
                  "text-[#6a7282] hover:bg-gray-50"
                )}
              >
                <item.icon className="size-4" />
                <span>{item.name}</span>
                <span className="ml-auto rounded bg-gray-100 px-1.5 py-0.5 text-xs text-[#6a7282]">
                  Soon
                </span>
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-11 items-center gap-3 rounded px-3 text-base transition-colors",
                isActive
                  ? "bg-[#2b7fff]/10 text-[#2b7fff]"
                  : "text-[#6a7282] hover:bg-gray-50"
              )}
            >
              <item.icon className="size-4" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="border-t border-gray-200 p-2">
        <Link
          href="/dashboard/profile"
          className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50"
        >
          <div className="flex size-9 items-center justify-center rounded-full bg-[#2b7fff]">
            <span className="text-sm font-medium text-white">{avatarLetter}</span>
          </div>
          <div className="flex flex-1 flex-col">
            <span className="text-sm font-medium text-[#364153]">{displayName}</span>
            <div className="flex items-center gap-1.5 text-xs text-[#6a7282]">
              <span>{planName}</span>
              <span className="text-gray-300">·</span>
              <Sparkles className="size-3 text-amber-500" />
              <span>{profile?.creditBalance ?? 0}</span>
            </div>
          </div>
          <ChevronRight className="size-4 text-[#6a7282]" />
        </Link>
      </div>
    </aside>
  );
}
