import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Electron 打包需要 standalone 输出
  output: 'standalone',
  // 构建时忽略ESLint错误（开发时仍然检查）
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 安全响应头配置
  async headers() {
    // CSP 配置
    const cspDirectives = [
      "default-src 'self'",
      // 脚本：允许自身、微信SDK、reCAPTCHA
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://res.wx.qq.com https://www.google.com https://www.gstatic.com",
      // 样式：允许自身和内联样式（Tailwind需要）
      "style-src 'self' 'unsafe-inline'",
      // 图片：允许自身、data URI、blob、常见图片CDN
      "img-src 'self' data: blob: https: http:",
      // 字体：允许自身和常见字体CDN
      "font-src 'self' data: https://fonts.gstatic.com",
      // 连接：允许自身、API、微信、reCAPTCHA
      "connect-src 'self' https://api.weixin.qq.com https://www.google.com https://generativelanguage.googleapis.com wss:",
      // frame：允许微信登录iframe和reCAPTCHA
      "frame-src 'self' https://open.weixin.qq.com https://www.google.com https://www.gstatic.com",
      // 媒体
      "media-src 'self'",
      // 对象
      "object-src 'none'",
      // 基础URI
      "base-uri 'self'",
      // 表单提交
      "form-action 'self'",
      // frame祖先（防止点击劫持）
      "frame-ancestors 'self'",
      // 升级不安全请求（生产环境）
      process.env.NODE_ENV === "production" ? "upgrade-insecure-requests" : "",
    ].filter(Boolean).join("; ");

    return [
      {
        // 应用到所有路由
        source: "/:path*",
        headers: [
          {
            // Content Security Policy
            key: "Content-Security-Policy",
            value: cspDirectives,
          },
          {
            // 防止点击劫持
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            // 防止 MIME 类型嗅探
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            // XSS 保护（现代浏览器已内置，但作为后备）
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            // 控制 Referrer 信息泄露
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            // 权限策略：限制敏感 API 使用
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            // 强制 HTTPS（生产环境）
            key: "Strict-Transport-Security",
            value: process.env.NODE_ENV === "production"
              ? "max-age=31536000; includeSubDomains"
              : "max-age=0",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
