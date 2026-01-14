// 本地版本使用 localhost
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

// 网站/组织结构化数据
export function WebsiteJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: '灵机写作',
    alternateName: 'LingJi AI Writing',
    url: BASE_URL,
    description: 'AI 驱动的小说创作平台，帮助作家提升写作效率',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

// 组织信息结构化数据
export function OrganizationJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: '灵机写作',
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    description: 'AI 驱动的小说创作平台',
    sameAs: [
      // 社交媒体链接（如有）
      // 'https://weibo.com/lingji',
      // 'https://www.xiaohongshu.com/lingji',
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

// 软件应用结构化数据
export function SoftwareApplicationJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: '灵机写作',
    applicationCategory: 'CreativeWork',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'CNY',
    },
    description: 'AI 驱动的小说创作平台，提供智能写作辅助、大纲生成、角色管理等功能',
    featureList: [
      'AI 智能续写',
      '大纲自动生成',
      '角色人设管理',
      '小说封面生成',
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
