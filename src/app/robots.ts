import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',           // API 路由
          '/dashboard/',     // 用户仪表盘（需登录）
          '/editor/',        // 编辑器页面（需登录）
        ],
      },
      {
        // 百度爬虫特殊规则
        userAgent: 'Baiduspider',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/editor/',
        ],
      },
    ],
    sitemap: 'https://www.lingjixiezuo.com/sitemap.xml',
  }
}
