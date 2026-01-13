import { MetadataRoute } from 'next'

// 网站域名
const BASE_URL = 'https://www.lingjixiezuo.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  // 静态页面
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/cover-generator`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  // TODO: 如果有公开的小说展示页，可以在这里动态添加
  // const novels = await getPublicNovels()
  // const novelPages = novels.map(novel => ({
  //   url: `${BASE_URL}/novel/${novel.id}`,
  //   lastModified: novel.updatedAt,
  //   changeFrequency: 'weekly' as const,
  //   priority: 0.6,
  // }))

  return [...staticPages]
}
