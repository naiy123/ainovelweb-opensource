import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/db"
import { verifySmsCode } from "@/lib/aliyun-sms"
import { authConfig } from "./config"
import { checkLoginAttempts, recordLoginFailure, clearLoginFailures, rateLimit } from "@/lib/rate-limit"
import { isValidChinesePhone } from "@/lib/validators/phone"
import { verifyPassword } from "@/lib/auth/password"
import { normalizeUsername } from "@/lib/validators/username"

/**
 * 账户锁定策略
 * - 5 次失败: 锁定 15 分钟
 * - 10 次失败: 锁定 1 小时
 * - 20 次失败: 锁定 24 小时
 */
function getLockoutDuration(failedCount: number): number {
  if (failedCount >= 20) return 24 * 60 * 60 * 1000 // 24 小时
  if (failedCount >= 10) return 60 * 60 * 1000 // 1 小时
  if (failedCount >= 5) return 15 * 60 * 1000 // 15 分钟
  return 0
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    // 账号密码登录
    Credentials({
      id: "credentials",
      name: "账号密码",
      credentials: {
        username: { label: "用户名", type: "text" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials, request) {
        const { username, password } = credentials as { username: string; password: string }

        if (!username || !password) {
          throw new Error("请输入用户名和密码")
        }

        // IP 速率限制
        const ip = request?.headers?.get?.("x-forwarded-for")?.split(",")[0]?.trim() ||
                   request?.headers?.get?.("x-real-ip") || "unknown"
        const ipLimit = await rateLimit(`login:ip:${ip}`, 10, 60)
        if (!ipLimit.success) {
          throw new Error("登录请求过于频繁，请稍后重试")
        }

        // 规范化用户名
        const normalizedUsername = normalizeUsername(username)

        // 查找用户
        const user = await prisma.user.findUnique({
          where: { username: normalizedUsername },
        })

        // 检查账户锁定状态
        if (user?.lockedUntil && user.lockedUntil > new Date()) {
          const remainingMinutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000)
          throw new Error(`账户已锁定，请 ${remainingMinutes} 分钟后重试`)
        }

        // 验证密码（即使用户不存在也要验证，防止时序攻击）
        const isValid = await verifyPassword(password, user?.passwordHash)

        if (!user || !isValid) {
          // 记录失败次数
          if (user) {
            const newFailedCount = user.failedLoginCount + 1
            const lockoutDuration = getLockoutDuration(newFailedCount)

            await prisma.user.update({
              where: { id: user.id },
              data: {
                failedLoginCount: newFailedCount,
                lockedUntil: lockoutDuration > 0 ? new Date(Date.now() + lockoutDuration) : null,
              },
            })
          }
          throw new Error("用户名或密码错误")
        }

        // 登录成功，清除失败记录，更新登录信息
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginCount: 0,
            lockedUntil: null,
            lastLoginAt: new Date(),
            lastLoginIp: ip,
          },
        })

        return {
          id: user.id,
          name: user.nickname || user.username,
        }
      },
    }),

    // Phone + SMS code login (阿里云号码认证服务) - 保留用于老用户兼容
    Credentials({
      id: "phone",
      name: "Phone",
      credentials: {
        phone: { label: "Phone", type: "text" },
        code: { label: "Code", type: "text" },
      },
      async authorize(credentials) {
        const { phone, code } = credentials as { phone: string; code: string }

        if (!phone || !code) {
          throw new Error("请输入手机号和验证码")
        }

        // 验证手机号格式
        if (!isValidChinesePhone(phone)) {
          throw new Error("手机号格式错误")
        }

        // 检查登录失败次数限制
        const loginAttemptCheck = await checkLoginAttempts(phone)
        if (!loginAttemptCheck.success) {
          throw new Error(loginAttemptCheck.message)
        }

        // 开发模式：任意验证码都通过（仅在开发环境生效）
        if (process.env.NODE_ENV === "development" && process.env.DEV_SKIP_AUTH === "true") {
          // 开发模式跳过验证
        } else {
          // 使用阿里云校验验证码
          const result = await verifySmsCode(phone, code)
          if (!result.success) {
            // 记录失败次数
            await recordLoginFailure(phone)
            throw new Error(result.message)
          }
        }

        // 验证成功，清除失败记录
        await clearLoginFailures(phone)

        // Find or create user
        let user = await prisma.user.findUnique({ where: { phone } })
        if (!user) {
          user = await prisma.user.create({
            data: {
              phone,
              nickname: `用户${phone.slice(-4)}`,
              subscription: {
                create: { plan: "free", dailyLimit: 3 },
              },
            },
          })
        }

        return {
          id: user.id,
          name: user.nickname,
          phone: user.phone,
        }
      },
    }),

    // 微信扫码登录 (微信开放平台)
    Credentials({
      id: "wechat",
      name: "WeChat",
      credentials: {
        openid: { label: "OpenID", type: "text" },
        nickname: { label: "Nickname", type: "text" },
        avatar: { label: "Avatar", type: "text" },
      },
      async authorize(credentials) {
        const { openid, nickname, avatar } = credentials as {
          openid: string
          nickname?: string
          avatar?: string
        }

        if (!openid) {
          throw new Error("微信登录失败：缺少 openid")
        }

        // 查找或创建用户
        let user = await prisma.user.findUnique({
          where: { wechatOpenid: openid },
        })

        if (!user) {
          // 创建新用户
          user = await prisma.user.create({
            data: {
              wechatOpenid: openid,
              nickname: nickname || `微信用户`,
              avatar: avatar || null,
              subscription: {
                create: { plan: "free", dailyLimit: 3 },
              },
            },
          })
        } else if (nickname || avatar) {
          // 更新用户信息（如果有新的昵称或头像）
          const updateData: { nickname?: string; avatar?: string } = {}
          if (nickname && !user.nickname) {
            updateData.nickname = nickname
          }
          if (avatar && !user.avatar) {
            updateData.avatar = avatar
          }
          if (Object.keys(updateData).length > 0) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: updateData,
            })
          }
        }

        return {
          id: user.id,
          name: user.nickname,
        }
      },
    }),
  ],
})
