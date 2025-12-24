import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "./providers";
import LayoutClient from "@/components/layout/LayoutClient";
import VisitorTracker from "@/components/VisitorTracker";
import { createMetadata } from "@/lib/seo";

export const metadata = {
  ...createMetadata({
  title: "Create Reality",
  description: "AI Tools, Insight, Academy, Community - All in one AI Platform.",
  path: "/",
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
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
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