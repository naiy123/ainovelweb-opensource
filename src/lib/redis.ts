import Redis from "ioredis"

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined
}

// 检查是否配置了 Redis URL（没有配置则禁用 Redis）
const REDIS_ENABLED = !!process.env.REDIS_URL

function createRedisClient(): Redis | null {
  // 没有配置 REDIS_URL 时返回 null，使用内存降级
  if (!REDIS_ENABLED) {
    return null
  }

  const client = new Redis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    retryStrategy: (times) => {
      if (times > 3) return null
      return Math.min(times * 200, 1000)
    },
  })

  client.on("error", (err) => {
    console.error("Redis connection error:", err.message)
  })

  return client
}

export const redis = globalForRedis.redis ?? createRedisClient()

if (process.env.NODE_ENV !== "production" && redis) {
  globalForRedis.redis = redis
}
