import Script from "next/script";
import "./globals.css";
import { Providers } from "./providers";
import LayoutClient from "@/components/layout/LayoutClient";
import VisitorTracker from "@/components/VisitorTracker";
import LevelUpToast from "@/components/LevelUpToast";
import StructuredData from "@/components/SEO/StructuredData";
import ScrollAnimationProvider from "@/components/ScrollAnimationProvider";
import { createMetadata } from "@/lib/seo";

export const metadata = {
  metadataBase: new URL("https://dori-ai.com"),
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
      "AI 활용 방법",
      "AI 자동화",
      "무료 AI 도구",
      "AI 뉴스",
      "AI 도구 모음",
      "AI 교육",
      "dori-ai",
    ],
  }),
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
  },
  other: {
    'pretendard-font': 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard-dynamic-subset.css',
    'naver-site-verification': ['fc6aff074a85b391562bd15daa80e96e0f2a946a', 'ae3b47b353b50f9a3ac06e4c0db4ac641738faee'],
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
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        {/* 자주 쓰는 외부 이미지 도메인 사전 연결 (도구 로고/파비콘) */}
        <link rel="preconnect" href="https://logo.clearbit.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.google.com" />
        {/* Pretendard 한글 동적 서브셋 — 전체 웨이트(수 MB) 대신 필요한 글자만 로드 */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard-dynamic-subset.css"
        />
        <StructuredData />
      </head>
      {/* [핵심 수정] 
        배경색을 div가 아닌 body 태그에 직접 줍니다. 
        이것이 가장 근본적인 배경색이 되며, 자식 페이지에서 배경색을 
        따로 지정하지 않으면(투명하면) 이 색을 따르게 됩니다.
      */}
      <body
        className="transition-colors duration-300 bg-white text-black dark:!bg-black dark:text-white"
        suppressHydrationWarning={true}
        style={{ fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif' }}
      >
        {/* 분석/광고 스크립트는 lazyOnload로 지연 → 초기 렌더(FCP/LCP) 우선, 메인 스레드 경합 완화 */}
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-RKN3F8V01C" strategy="lazyOnload" />
        <Script id="google-analytics" strategy="lazyOnload">
          {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'G-RKN3F8V01C');
            `}
        </Script>
        {/* Microsoft Clarity */}
        <Script id="microsoft-clarity" strategy="lazyOnload">
          {`
                (function(c,l,a,r,i,t,y){
                    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
                })(window, document, "clarity", "script", "va2qmv3mwz");
            `}
        </Script>

        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1868839951780851"
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />

        <Providers>
          <ScrollAnimationProvider />
          <VisitorTracker />
          <LevelUpToast />
          <LayoutClient>
            {children}
          </LayoutClient>
        </Providers>
      </body>
    </html>
  );
}