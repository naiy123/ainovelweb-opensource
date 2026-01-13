# AI Novel Web - 开源版

<p align="center">
  <strong>🚀 AI 驱动的小说创作助手</strong>
</p>

<p align="center">
  <a href="#功能特性">功能特性</a> •
  <a href="#快速开始">快速开始</a> •
  <a href="#技术栈">技术栈</a> •
  <a href="#贡献指南">贡献指南</a>
</p>

---

## ✨ 功能特性

- 📝 **AI 写作助手** - 智能续写、扩写、改写
- 🎨 **封面生成** - AI 生成小说封面
- 📚 **章节管理** - 便捷的章节编辑器
- 🎭 **角色卡片** - 管理小说中的人物设定
- 📖 **大纲管理** - 结构化的故事大纲
- 🔍 **智能摘要** - 自动生成章节摘要

## 🚀 快速开始

### 环境要求

- Node.js 18+
- PostgreSQL 14+
- Redis (可选)

### 安装步骤

```bash
# 1. 克隆仓库
git clone https://github.com/naiy123/ainovelweb-opensource.git
cd ainovelweb-opensource

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入配置

# 4. 初始化数据库
npx prisma generate
npx prisma db push

# 5. 启动开发服务器
npm run dev
```

访问 http://localhost:3000 🎉

### 环境变量

| 变量 | 必填 | 说明 |
|------|:----:|------|
| `DATABASE_URL` | ✅ | PostgreSQL 连接字符串 |
| `AUTH_SECRET` | ✅ | Auth.js 密钥 (`openssl rand -base64 32`) |
| `GEMINI_API_KEY` | ✅ | [Google Gemini API](https://aistudio.google.com/app/apikey) |
| `REDIS_URL` | ❌ | Redis 连接（用于缓存） |
| `VOLCENGINE_*` | ❌ | 火山引擎（图片生成） |

## 🛠 技术栈

| 类别 | 技术 |
|------|------|
| **框架** | Next.js 15 (App Router) |
| **数据库** | PostgreSQL + Prisma |
| **认证** | Auth.js v5 |
| **UI** | Tailwind CSS + shadcn/ui |
| **AI** | Google Gemini API |

## 📁 项目结构

```
src/
├── app/                 # Next.js 页面和 API
│   ├── api/            # API 路由
│   ├── editor/         # 编辑器页面
│   └── dashboard/      # 仪表盘
├── components/
│   ├── editor/         # 编辑器组件
│   └── ui/             # UI 组件库
├── lib/
│   ├── ai/             # AI 服务封装
│   ├── auth/           # 认证配置
│   └── credits/        # 积分系统（开源版无限制）
└── hooks/              # React Hooks

prisma/
└── schema.prisma       # 数据库模型
```

## 🆚 开源版 vs 商业版

| 功能 | 开源版 | 商业版 |
|------|:------:|:------:|
| AI 写作 | ✅ 无限制 | ✅ 按积分 |
| 封面生成 | ✅ 无限制 | ✅ 按积分 |
| 本地部署 | ✅ | ❌ |
| 短信验证 | ❌ | ✅ |
| 在线支付 | ❌ | ✅ |
| 云存储 | ❌ | ✅ |

## 🤝 贡献指南

欢迎贡献代码！请查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解详情。

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 📄 License

本项目采用 [MIT License](LICENSE) 开源协议。

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/naiy123">naiy123</a>
</p>
