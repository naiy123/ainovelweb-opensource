"use client";

import { ArrowLeft, User } from "lucide-react";
import Link from "next/link";

interface EditorToolbarProps {
  novelTitle: string;
}

export function EditorToolbar({
  novelTitle,
}: EditorToolbarProps) {
  return (
    <div className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-[#364153] hover:text-[#2b7fff]"
        >
          <ArrowLeft className="size-5" />
          <span>返回</span>
        </Link>
        <div className="h-6 w-px bg-gray-200" />
        <div className="flex items-center gap-1">
          <span className="text-[#6a7282]">作品名称：</span>
          <span className="text-[#364153]">{novelTitle}</span>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/profile"
          className="flex size-9 items-center justify-center rounded hover:bg-gray-100"
          title="个人中心"
        >
          <User className="size-5 text-[#6a7282]" />
        </Link>
      </div>
    </div>
  );
}
