#!/bin/bash
set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== 开始部署 ===${NC}"

# 1. 拉取最新代码
echo -e "${YELLOW}[1/6] 拉取最新代码...${NC}"
git pull origin main

# 2. 安装依赖
echo -e "${YELLOW}[2/6] 安装依赖...${NC}"
npm ci

# 3. 生成 Prisma Client
echo -e "${YELLOW}[3/6] 生成 Prisma Client...${NC}"
npx prisma generate

# 4. 运行数据库迁移（生产环境）
echo -e "${YELLOW}[4/6] 运行数据库迁移...${NC}"
npx prisma migrate deploy

# 5. 构建应用
echo -e "${YELLOW}[5/6] 构建应用...${NC}"
npm run build

# 6. 重启应用
echo -e "${YELLOW}[6/6] 重启应用...${NC}"
pm2 restart ainovelweb

echo -e "${GREEN}=== 部署完成 ===${NC}"

# 健康检查
sleep 5
if curl -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✓ 健康检查通过${NC}"
else
    echo -e "${RED}✗ 健康检查失败！${NC}"
    pm2 logs ainovelweb --lines 20
    exit 1
fi
