import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "./providers";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
// RightSidebar 삭제됨

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
        {/* Google AdSense */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1b50839955170851"
          crossOrigin="anonymous"
        ></script>
      </head>
      <body suppressHydrationWarning={true}>
        <AuthProvider>
          {/* 1. 헤더 */}
          <Header />

          {/* 2. 메인 레이아웃 (사이드바 없음) */}
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
