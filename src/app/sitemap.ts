import { MetadataRoute } from 'next'

// 本地版本：禁用 sitemap
export default function sitemap(): MetadataRoute.Sitemap {
  // 本地版不需要 sitemap
  return []
}

/*
// 线上版本配置（已禁用）
const BASE_URL = 'https://www.lingjixiezuo.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/login`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/cover-generator`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]

  return [...staticPages]
}
*/
