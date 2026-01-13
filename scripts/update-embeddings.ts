/**
 * 为所有小说生成 embedding
 * 运行: npx tsx scripts/update-embeddings.ts
 */

import { PrismaClient } from "@prisma/client"
import { embeddingService } from "../src/lib/ai/embedding"

const prisma = new PrismaClient()

async function main() {
  console.log("🚀 开始生成 embedding...")

  // 获取所有小说
  const novels = await prisma.novel.findMany({
    select: { id: true, title: true },
  })

  console.log(`找到 ${novels.length} 部小说\n`)

  let totalCards = 0
  let totalSummaries = 0

  for (const novel of novels) {
    console.log(`📚 处理: ${novel.title}`)

    try {
      const cardsUpdated = await embeddingService.updateNovelCardEmbeddings(novel.id)
      const summariesUpdated = await embeddingService.updateNovelSummaryEmbeddings(novel.id)

      totalCards += cardsUpdated
      totalSummaries += summariesUpdated

      console.log(`   ✅ 卡片: ${cardsUpdated}, 摘要: ${summariesUpdated}\n`)
    } catch (error) {
      console.error(`   ❌ 失败:`, error)
    }
  }

  console.log("========================================")
  console.log(`✅ 完成! 共更新:`)
  console.log(`   - 卡片 embedding: ${totalCards}`)
  console.log(`   - 摘要 embedding: ${totalSummaries}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
