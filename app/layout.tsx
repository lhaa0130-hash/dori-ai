import type { Metadata } from "next";
import Script from "next/script"; // ★ Script 컴포넌트 추가
import "./globals.css";
import { AuthProvider } from "./providers";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "DORI-AI | Create Reality",
  description: "AI Creative Studio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        {/* 1. 구글 애드센스 Verification Meta Tag (사이트 확인용) */}
        {/* pub-YOUR_PUBLISHER_ID 부분을 고객님의 코드로 교체해야 합니다. */}
        <meta name="google-adsense-account" content="pub-1868839951780851" /> 
        
        {/* ★ 2. Google AdSense Main Script (광고 로딩용) */}
        <Script 
            async 
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1868839951780851" 
            strategy="lazyOnload" 
            crossOrigin="anonymous" 
        />
      </head>

      <body suppressHydrationWarning={true}>
        <AuthProvider>
          <Header />
          <div className="main-layout">
            <div className="content-area">
              {children}
              <Footer />
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}