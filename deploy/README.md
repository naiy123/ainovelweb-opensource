# 部署指南

## 一键部署流程

### 第一步：准备工作

1. 阿里云服务器安装宝塔面板
2. 宝塔安装：**PM2管理器**（会自动安装 Node.js）
3. 将代码推送到 Git 仓库（GitHub/Gitee）

### 第二步：首次部署

SSH 登录服务器，运行：

```bash
# 下载部署脚本
curl -O https://raw.githubusercontent.com/你的用户名/ainovelweb/main/deploy/setup.sh

# 编辑配置
nano setup.sh
# 修改 REPO_URL 和 DOMAIN

# 运行
chmod +x setup.sh
./setup.sh
```

### 第三步：宝塔配置

1. **添加网站**
   - 网站 → 添加站点 → 输入域名

2. **配置反向代理**
   - 点击网站 → 反向代理 → 添加
   - 目标URL: `http://127.0.0.1:3000`

3. **申请 SSL**
   - SSL → Let's Encrypt → 申请
   - 开启强制 HTTPS

### 第四步：填写环境变量

```bash
nano /www/wwwroot/ainovelweb/.env
```

填入你的 API 密钥等配置。

---

## 后续更新

每次更新代码后，运行：

```bash
/www/wwwroot/ainovelweb/deploy/update.sh
```

或者一行命令：

```bash
cd /www/wwwroot/ainovelweb && git pull && npm run build && pm2 restart ainovelweb
```

---

## 常用命令

| 命令 | 说明 |
|------|------|
| `pm2 logs ainovelweb` | 查看日志 |
| `pm2 restart ainovelweb` | 重启应用 |
| `pm2 stop ainovelweb` | 停止应用 |
| `pm2 status` | 查看状态 |
| `pm2 monit` | 监控面板 |

---

## 文件说明

```
deploy/
├── setup.sh      # 首次部署脚本
├── update.sh     # 更新部署脚本
├── nginx.conf    # Nginx 配置参考
└── README.md     # 本文件
```
