import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * 简化版中间件 - 无认证模式
 * 所有请求直接通过
 */
export function middleware(_request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    // 匹配所有路径，除了静态文件和API
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
