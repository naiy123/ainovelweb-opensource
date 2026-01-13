import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";

export default async function Home() {
  // 检查用户是否已登录
  const session = await auth();

  // 已登录用户重定向到 dashboard
  if (session?.user) {
    redirect("/dashboard");
  }

  // 未登录用户显示简单落地页（用于搜索引擎验证）
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-white to-gray-100">
      <div className="text-center px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          灵机写作
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          智能一体化的小说创作平台
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 bg-[#2b7fff] text-white rounded-lg font-medium hover:bg-[#1a6fee] transition-colors"
          >
            开始创作
          </Link>
          <Link
            href="/register"
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            免费注册
          </Link>
        </div>
      </div>
    </main>
  );
}
