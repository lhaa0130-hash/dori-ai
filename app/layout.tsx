import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "./providers";
import LayoutClient from "@/components/layout/LayoutClient";
import VisitorTracker from "@/components/VisitorTracker";
import StructuredData from "@/components/SEO/StructuredData";
import { createMetadata } from "@/lib/seo";

export const metadata = {
  ...createMetadata({
    title: "DORI-AI - AI 활용 방법을 함께 연구하는 커뮤니티 플랫폼",
    description: "AI 도구, 인사이트, 아카데미, 커뮤니티를 한 곳에서. AI 활용 방법을 함께 연구하고 실전으로 적용해보는 최신 트렌드와 인사이트를 공유하는 커뮤니티 플랫폼입니다.",
    path: "/",
    keywords: [
      "AI 도구",
      "AI 커뮤니티",
      "인공지능",
      "AI 가이드",
      "AI 트렌드",
      "AI 튜토리얼",
      "생성형 AI",
      "ChatGPT",
      "AI 활용",
      "AI 연구",
      "AI 자동화",
      "캐릭터 제작 가이드",
      "프레리독 애니메이션",
      "AI 교육 도구",
      "dori-ai",
    ],
  }),
  other: {
    'pretendard-font': 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css',
  },
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link
          rel="preconnect"
          href="https://cdn.jsdelivr.net"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
        <StructuredData />
      </head>
      {/* [핵심 수정] 
        배경색을 div가 아닌 body 태그에 직접 줍니다. 
        이것이 가장 근본적인 배경색이 되며, 자식 페이지에서 배경색을 
        따로 지정하지 않으면(투명하면) 이 색을 따르게 됩니다.
      */}
      <body 
        className="transition-colors duration-300 bg-white text-black dark:bg-black dark:text-white" 
        suppressHydrationWarning={true}
        style={{ fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif' }}
      >
        
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1868839951780851"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />

        <AuthProvider>
          <VisitorTracker /> 
          <LayoutClient>
              {children}
          </LayoutClient>
        </AuthProvider>
      </body>
    </html>
  );
}