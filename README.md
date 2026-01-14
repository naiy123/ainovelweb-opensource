# AI Novel Web - 本地版

<p align="center">
  <strong>AI 驱动的小说创作助手 - 桌面应用</strong>
</p>

---

## 功能特性

- **AI 写作助手** - 智能续写、扩写、改写
- **封面生成** - AI 生成小说封面
- **章节管理** - 便捷的章节编辑器
- **角色卡片** - 管理小说中的人物设定
- **智能摘要** - 自动生成章节摘要
- **本地存储** - 数据保存在本地，无需服务器

## 快速开始

### 环境要求

- Node.js 18+

### 开发模式

```bash
# 1. 安装依赖
npm install --legacy-peer-deps

# 2. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入 GEMINI_API_KEY

# 3. 初始化数据库
npx prisma generate
npx prisma db push

# 4. 启动开发服务器
npm run dev
```

访问 http://localhost:3000

### Electron 桌面应用

```bash
# 开发模式
npm run electron:dev

# 打包为 exe
npm run electron:build
```

### 环境变量

| 变量 | 必填 | 说明 |
|------|:----:|------|
| `GEMINI_API_KEY` | 是 | [Google Gemini API](https://aistudio.google.com/app/apikey) |
| `VOLCENGINE_*` | 否 | 火山引擎（图片生成） |

## 技术栈

| 类别 | 技术 |
|------|------|
| **框架** | Next.js 15 (App Router) |
| **数据库** | SQLite + Prisma |
| **桌面** | Electron |
| **UI** | Tailwind CSS + shadcn/ui |
| **AI** | Google Gemini API |

## 项目结构

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
│   └── db.ts           # 数据库连接
└── hooks/              # React Hooks

electron/
└── main.js             # Electron 主进程

prisma/
└── schema.prisma       # 数据库模型 (SQLite)
```

## License

本项目采用 [AGPL-3.0 License](LICENSE) 开源协议。

---

<p align="center">
  Made with Claude Code
</p>
