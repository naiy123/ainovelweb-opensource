import { MetadataRoute } from 'next'

// 本地版本：禁用 SEO 配置
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        disallow: '/', // 本地版不需要被搜索引擎索引
      },
    ],
    // sitemap: 'https://www.lingjixiezuo.com/sitemap.xml',
  }
}
