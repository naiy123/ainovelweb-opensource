/**
 * 初始化 pgvector 扩展和向量字段
 * 运行: npx tsx scripts/init-pgvector.ts
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🚀 开始初始化 pgvector...")

  try {
    // 1. 启用 pgvector 扩展
    console.log("1. 启用 vector 扩展...")
    await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS vector;`)
    console.log("   ✅ vector 扩展已启用")

    // 2. 为 cards 表添加/修改 embedding 字段 (3072 维)
    console.log("2. 为 cards 表添加 embedding 字段 (3072 维)...")
    // 先删除旧索引和字段（如果存在）
    try {
      await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS cards_embedding_idx;`)
      await prisma.$executeRawUnsafe(`ALTER TABLE cards DROP COLUMN IF EXISTS embedding;`)
    } catch {}
    await prisma.$executeRawUnsafe(`
      ALTER TABLE cards ADD COLUMN IF NOT EXISTS embedding vector(3072);
    `)
    await prisma.$executeRawUnsafe(`
      ALTER TABLE cards ADD COLUMN IF NOT EXISTS embedding_text text;
    `)
    console.log("   ✅ cards.embedding 字段已添加 (3072 维)")

    // 3. 为 chapter_summaries 表添加/修改 embedding 字段 (3072 维)
    console.log("3. 为 chapter_summaries 表添加 embedding 字段 (3072 维)...")
    try {
      await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS chapter_summaries_embedding_idx;`)
      await prisma.$executeRawUnsafe(`ALTER TABLE chapter_summaries DROP COLUMN IF EXISTS embedding;`)
    } catch {}
    await prisma.$executeRawUnsafe(`
      ALTER TABLE chapter_summaries ADD COLUMN IF NOT EXISTS embedding vector(3072);
    `)
    console.log("   ✅ chapter_summaries.embedding 字段已添加 (3072 维)")

    // 4. 创建向量索引
    console.log("4. 创建向量索引...")

    // 检查是否有足够的数据创建 IVFFlat 索引
    const cardCount = await prisma.card.count()
    const summaryCount = await prisma.chapterSummary.count()

    if (cardCount > 0) {
      try {
        await prisma.$executeRawUnsafe(`
          CREATE INDEX IF NOT EXISTS cards_embedding_idx ON cards
            USING ivfflat (embedding vector_cosine_ops)
            WITH (lists = 10);
        `)
        console.log("   ✅ cards 向量索引已创建")
      } catch (e) {
        console.log("   ⚠️ cards 索引创建跳过 (可能需要更多数据)")
      }
    } else {
      console.log("   ⏭️ cards 索引跳过 (无数据)")
    }

    if (summaryCount > 0) {
      try {
        await prisma.$executeRawUnsafe(`
          CREATE INDEX IF NOT EXISTS chapter_summaries_embedding_idx ON chapter_summaries
            USING ivfflat (embedding vector_cosine_ops)
            WITH (lists = 10);
        `)
        console.log("   ✅ chapter_summaries 向量索引已创建")
      } catch (e) {
        console.log("   ⚠️ chapter_summaries 索引创建跳过 (可能需要更多数据)")
      }
    } else {
      console.log("   ⏭️ chapter_summaries 索引跳过 (无数据)")
    }

    console.log("\n✅ pgvector 初始化完成!")
    console.log(`   - cards: ${cardCount} 条记录`)
    console.log(`   - chapter_summaries: ${summaryCount} 条记录`)

  } catch (error) {
    console.error("❌ 初始化失败:", error)
    process.exit(1)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
