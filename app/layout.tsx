import type { Metadata } from "next";
import Script from "next/script";
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
        {/* 🔥 구글 애드센스 계정 확인 메타 태그 */}
        <meta
          name="google-adsense-account"
          content="ca-pub-1868399517808851"
        />

        {/* 🔥 구글 애드센스 소유권 확인 스크립트 (반드시 head 안에 있어야 함) */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1868399517808851"
          crossOrigin="anonymous"
          strategy="afterInteractive"
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
