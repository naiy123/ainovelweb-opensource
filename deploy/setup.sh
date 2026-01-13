#!/bin/bash
# ============================================
# 首次部署脚本 - 在服务器上运行一次
# ============================================

set -e

# 配置变量（根据实际情况修改）
APP_NAME="ainovelweb"
APP_DIR="/www/wwwroot/$APP_NAME"
REPO_URL="你的Git仓库地址"  # 修改为你的仓库
DOMAIN="你的域名.com"        # 修改为你的域名
NODE_VERSION="20"

echo "=========================================="
echo "🚀 开始部署 $APP_NAME"
echo "=========================================="

# 1. 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先在宝塔面板安装 PM2管理器"
    exit 1
fi
echo "✅ Node.js 版本: $(node -v)"

# 2. 检查 PM2
if ! command -v pm2 &> /dev/null; then
    echo "📦 安装 PM2..."
    npm install -g pm2
fi
echo "✅ PM2 版本: $(pm2 -v)"

# 3. 克隆项目
if [ -d "$APP_DIR" ]; then
    echo "⚠️  目录已存在，跳过克隆"
else
    echo "📥 克隆项目..."
    git clone "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"

# 4. 安装依赖
echo "📦 安装依赖..."
npm install

# 5. 创建环境变量文件
if [ ! -f ".env" ]; then
    echo "📝 创建 .env 文件..."
    cat > .env << EOF
DATABASE_URL="file:./prisma/prod.db"
NEXTAUTH_URL="https://$DOMAIN"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
GOOGLE_GENERATIVE_AI_API_KEY="你的API密钥"
EOF
    echo "⚠️  请编辑 .env 文件，填入正确的 API 密钥"
fi

# 6. 初始化数据库
echo "🗄️  初始化数据库..."
npx prisma generate
npx prisma db push

# 7. 构建项目
echo "🔨 构建项目..."
npm run build

# 8. 启动 PM2
echo "🚀 启动应用..."
pm2 delete "$APP_NAME" 2>/dev/null || true
pm2 start npm --name "$APP_NAME" -- start
pm2 save
pm2 startup

echo ""
echo "=========================================="
echo "✅ 部署完成！"
echo "=========================================="
echo ""
echo "下一步："
echo "1. 编辑 $APP_DIR/.env 填入 API 密钥"
echo "2. 在宝塔面板添加网站: $DOMAIN"
echo "3. 配置反向代理到 http://127.0.0.1:3000"
echo "4. 申请 SSL 证书"
echo ""
echo "常用命令："
echo "  pm2 logs $APP_NAME    # 查看日志"
echo "  pm2 restart $APP_NAME # 重启应用"
echo ""
