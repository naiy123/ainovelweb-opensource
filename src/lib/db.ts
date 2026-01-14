import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

// 别名导出，支持使用 db 作为名称
export const db = prisma

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
