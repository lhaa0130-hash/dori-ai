import type { Metadata } from "next";
import Script from "next/script"; // next/script 임포트
import { Inter } from "next/font/google"; // 폰트 임포트가 있다면 유지
import "./globals.css";
import { AuthProvider } from "./providers";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const inter = Inter({ subsets: ["latin"] }); // 폰트 변수 사용한다면 유지

// 1. 🔥 애드센스 메타 태그를 metadata 객체에 삽입 (권장)
export const metadata: Metadata = {
  title: "DORI-AI | Create Reality",
  description: "AI Creative Studio",
  verification: {
    // google-adsense-account 메타 태그의 content 값을 여기에 넣어줍니다.
    google: "google-adsense-account=ca-pub-1868839951780851",
    // 만약 Google Search Console 메타 태그가 있다면 함께 넣습니다.
    // google: "...", 
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // 2. 수동 <head> 태그는 제거하고 Next.js가 자동으로 생성하도록 둡니다.
    <html lang="ko">
      <body suppressHydrationWarning={true} className={inter.className}>
        
        {/* 3. 🔥 애드센스 코드 스니펫을 <body> 태그 내, 상단에 <Script> 컴포넌트로 배치 */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1868839951780851" // 애드센스 ID 적용
          crossOrigin="anonymous"
          strategy="afterInteractive" // 중요: 페이지 콘텐츠 로드 후 스크립트 실행
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