import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { ICPFooter } from "@/components/layout/icp-footer";
import {
  WebsiteJsonLd,
  OrganizationJsonLd,
  SoftwareApplicationJsonLd,
} from "@/components/seo/json-ld";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://lingji.ai";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "灵机写作 - 智能一体化的小说创作平台",
    template: "%s | 灵机写作",
  },
  description:
    "灵机写作是一款 AI 驱动的小说创作平台，提供智能续写、大纲生成、角色管理、封面制作等功能，帮助作家提升创作效率。",
  keywords: [
    "AI写作",
    "小说创作",
    "AI续写",
    "智能写作",
    "小说生成器",
    "写作助手",
    "AI小说",
    "创作工具",
    "大纲生成",
    "角色管理",
    "灵机写作",
  ],
  authors: [{ name: "灵机写作团队" }],
  creator: "灵机写作",
  publisher: "灵机写作",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: BASE_URL,
    siteName: "灵机写作",
    title: "灵机写作 - 智能一体化的小说创作平台",
    description:
      "灵机写作是一款智能一体化的小说创作平台，提供智能续写、大纲生成、角色管理、封面制作等功能。",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "灵机写作 - AI 小说创作平台",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "灵机写作 - 智能一体化的小说创作平台",
    description: "智能一体化的小说创作平台，提供智能续写、大纲生成、角色管理等功能。",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: BASE_URL,
  },
  verification: {
    other: {
      "baidu-site-verification": "codeva-zj8pGrqLSI",
    },
  },
  category: "technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <WebsiteJsonLd />
        <OrganizationJsonLd />
        <SoftwareApplicationJsonLd />
      </head>
      <body className="font-sans antialiased">
        <Providers>
          {children}
          <ICPFooter />
        </Providers>
      </body>
    </html>
  );
}
