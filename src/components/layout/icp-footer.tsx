"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// 不显示Footer的页面路径
const HIDDEN_PATHS = ["/editor"];

export function ICPFooter() {
  const pathname = usePathname();

  // 在编辑器等全屏页面不显示
  if (HIDDEN_PATHS.some((path) => pathname?.startsWith(path))) {
    return null;
  }

  return (
    <footer className="fixed bottom-0 left-0 right-0 py-3 text-center text-xs text-gray-500/70 z-40">
      <Link
        href="https://beian.miit.gov.cn/"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-gray-400 transition-colors"
      >
        冀ICP备2025133380号
      </Link>

      {/* 公安备案（如果有公安备案号，取消下面注释并填写备案号）
      <span className="mx-2">|</span>
      <Link
        href="https://beian.mps.gov.cn/#/query/webSearch?code=XXXXXXXXXXX"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 hover:text-gray-400 transition-colors"
      >
        <img src="https://beian.mps.gov.cn/web/img/logo01.6189a29f.png" alt="" className="w-3.5 h-3.5" />
        <span>冀公网安备XXXXXXXXXXX号</span>
      </Link>
      */}
    </footer>
  );
}
