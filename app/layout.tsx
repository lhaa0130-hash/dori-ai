import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "./providers";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

// 🔥 수정 1: 메타 태그를 metadata 객체에 통합
export const metadata: Metadata = {
  title: "DORI-AI | Create Reality",
  description: "AI Creative Studio",
  verification: {
    // 🔥 애드센스 소유권 확인 메타 태그를 여기에 추가
    google: "google-adsense-account=ca-pub-1868399517808851", 
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // 🔥 수정 2: 수동 <head> 태그 제거
    <html lang="ko">
      <body suppressHydrationWarning={true}>
        {/* 🔥 수정 3: <Script>를 <body> 태그 내, 콘텐츠보다 먼저 배치 */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1868399517808851"
          crossOrigin="anonymous"
          // strategy="beforeInteractive" 또는 이대로 두어 Next.js 기본값 사용
        />
        
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