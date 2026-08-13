import Script from "next/script";
import "./globals.css";
import { Providers } from "./providers";
import LayoutClient from "@/components/layout/LayoutClient";
import VisitorTracker from "@/components/VisitorTracker";
import AnalyticsScripts from "@/components/AnalyticsScripts";
import LevelUpToast from "@/components/LevelUpToast";
import StructuredData from "@/components/SEO/StructuredData";
import ScrollAnimationProvider from "@/components/ScrollAnimationProvider";
import { createMetadata } from "@/lib/seo";

export const metadata = {
  metadataBase: new URL("https://illo.im"),
  ...createMetadata({
    // ⚠️ 2026-08-10 문구 정정 — 이전 문구는 "AI 도구·트렌드·큐레이션·분석을 매일 만나는
    //    AI 피드 플랫폼"이었다. 트렌드 182편·큐레이션 110편은 2026-07-26 에 삭제했고 커뮤니티는
    //    DB 없는 스텁이라, 없는 콘텐츠를 약속하는 문구였다. 애드센스 심사에서 사이트 설명과
    //    실제 콘텐츠가 어긋나는 것은 그 자체로 신뢰성 감점이다. **실제 있는 것만 적는다.**
    // ⚠️ 2026-08-13 — 브랜드명을 맨 앞으로 올렸다. 이전엔 접미사로만 "| illo" 가 붙어서
    //    브랜드 검색 "illo" 에 한글 홈(55위)보다 제목이 illo 로 시작하는 /en 이 먼저 잡혔다.
    //    한글 표기 "일로" 도 함께 넣는다 — 실제 브랜드 검색어다(illo = 모든 일을 하나의 일로).
    title: "illo(일로) — AI 도구·모델 비교와 심층 분석 플랫폼",
    description: "AI 도구를 카테고리별로 찾아 비교하고, 주요 AI 모델의 성능·가격을 계산하고, 기술과 시장의 변화를 직접 분석한 리포트를 읽는 곳. illo.",
    path: "/",
    keywords: [
      "AI 도구",
      "AI 모델 비교",
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
      "LLM 가격 비교",
    ],
  }),
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [
      { url: '/apple-icon.png', type: 'image/png', sizes: '180x180' },
    ],
  },
  other: {
    'pretendard-font': 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard-dynamic-subset.css',
    'naver-site-verification': ['fc6aff074a85b391562bd15daa80e96e0f2a946a', 'ae3b47b353b50f9a3ac06e4c0db4ac641738faee', '6089a4a423224f2bfbf2ba87754c73d2b5e20f82'],
    'msvalidate.01': 'DEFC5BCB96FACF7035E1444299D359B2',
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
        {/* RSS 피드 자동 발견 (구글·빙·뉴스 리더) */}
        <link rel="alternate" type="application/rss+xml" title="illo 최신 인사이트" href="https://illo.im/feed.xml" />
        {/* AdSense 사이트 소유권 확인 메타태그. 신규 도메인(illo.im) 심사가 '준비 중'에서
            넘어가지 않는 흔한 원인 — 스크립트만으로는 소유권 확인이 지연될 수 있어 병행. */}
        <meta name="google-adsense-account" content="ca-pub-1868839951780851" />
        {/* ⚠️ AdSense 로더는 raw HTML <head>에 직접 둔다. next/script(lazyOnload)로 넣으면
            JS 실행 후에야 주입돼 검증 크롤러(=심사자)가 스크립트를 못 봐 '준비 중'에서 멈춘다.
            여기 두면 SSR HTML에 그대로 들어가 검증·광고 서빙 모두 정상 동작. */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1868839951780851"
          crossOrigin="anonymous"
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
        {/* 분석 스크립트(GA4·Clarity)는 AnalyticsScripts 컴포넌트에서 로드 — 관리자 본인은 제외.
            AdSense 로더는 위 <head>에서 raw script로 직접 로드한다(검증 크롤러 가시성). */}

        <Providers>
          <AnalyticsScripts />
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