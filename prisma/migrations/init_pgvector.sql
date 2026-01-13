-- 安装 pgvector 扩展
-- 需要在数据库服务器上先安装 pgvector: https://github.com/pgvector/pgvector

-- 启用扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- 为 cards 表添加 embedding 字段 (gemini-embedding-001 输出 3072 维)
ALTER TABLE cards ADD COLUMN IF NOT EXISTS embedding vector(3072);
ALTER TABLE cards ADD COLUMN IF NOT EXISTS embedding_text text;

-- 为 chapter_summaries 表添加 embedding 字段
ALTER TABLE chapter_summaries ADD COLUMN IF NOT EXISTS embedding vector(3072);

-- 创建向量索引 (使用 IVFFlat 算法，适合中等规模数据)
-- lists 参数建议: sqrt(行数)，这里假设每个小说 ~100 个卡片
CREATE INDEX IF NOT EXISTS cards_embedding_idx ON cards
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 10);

CREATE INDEX IF NOT EXISTS chapter_summaries_embedding_idx ON chapter_summaries
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 10);

-- 如果数据量较小 (<1000)，可以使用 HNSW 索引，查询更快
-- CREATE INDEX cards_embedding_idx ON cards
--   USING hnsw (embedding vector_cosine_ops);
