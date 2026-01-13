import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth/config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  // 开发模式：跳过所有认证检查（仅在开发环境生效）
  if (process.env.NODE_ENV === "development" && process.env.DEV_SKIP_AUTH === "true") {
    return NextResponse.next()
  }

  // 生产模式：使用正常的认证逻辑
  const isLoggedIn = !!req.auth?.user
  const { pathname } = req.nextUrl

  const protectedPaths = ["/dashboard", "/editor"]
  const authPaths = ["/login"]

  const isProtectedPath = protectedPaths.some((path) =>
    pathname.startsWith(path)
  )
  const isAuthPath = authPaths.some((path) => pathname.startsWith(path))

  // 未登录访问受保护页面 -> 跳转登录
  if (isProtectedPath && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // 已登录访问登录页 -> 跳转 dashboard
  if (isAuthPath && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // 匹配所有路径，除了静态文件和API
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
