import type { NextAuthConfig } from "next-auth"

// 开发模式模拟用户（使用 dev.db 中的测试用户）
const DEV_USER = {
  id: "test-user-001",
  name: "测试用户",
  phone: "19829782357",
}

// Edge Runtime 兼容的配置（不包含 Prisma/阿里云 SDK）
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [], // providers 在 index.ts 中配置
  callbacks: {
    async jwt({ token, user }) {
      // 开发模式：注入模拟用户（仅在开发环境生效）
      if (process.env.NODE_ENV === "development" && process.env.DEV_SKIP_AUTH === "true") {
        token.id = DEV_USER.id
        token.name = DEV_USER.name
        return token
      }
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      // 开发模式：使用模拟用户（仅在开发环境生效）
      if (process.env.NODE_ENV === "development" && process.env.DEV_SKIP_AUTH === "true") {
        session.user = {
          id: DEV_USER.id,
          name: DEV_USER.name,
        } as typeof session.user
        return session
      }
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    },
    authorized() {
      // 授权逻辑已移至 middleware.ts
      return true
    },
  },
}
