#!/bin/bash
# ============================================
# 更新部署脚本 - 每次更新代码后运行
# ============================================

set -e

APP_NAME="ainovelweb"
APP_DIR="/www/wwwroot/$APP_NAME"

echo "=========================================="
echo "🔄 更新 $APP_NAME"
echo "=========================================="

cd "$APP_DIR"

# 1. 拉取最新代码
echo "📥 拉取最新代码..."
git pull origin main

# 2. 安装依赖（如果有新依赖）
echo "📦 检查依赖..."
npm install

# 3. 更新数据库（如果有 schema 变化）
echo "🗄️  同步数据库..."
npx prisma generate
npx prisma db push

# 4. 重新构建
echo "🔨 重新构建..."
npm run build

# 5. 重启应用
echo "🚀 重启应用..."
pm2 restart "$APP_NAME"

echo ""
echo "=========================================="
echo "✅ 更新完成！"
echo "=========================================="
pm2 status "$APP_NAME"
