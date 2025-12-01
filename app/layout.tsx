import type { Metadata } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./providers";
import Header from "@/components/layout/Header"; // 👈 여기서 Header 파일을 '불러와야' 합니다.
import Footer from "@/components/layout/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DORI-AI | Create Reality",
  description: "AI Creative Studio",
  verification: {
    google: "google-adsense-account=ca-pub-1868839951780851",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning={true}>
        
        {/* 애드센스 스크립트 */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1868839951780851"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />

        {/* 👇 로그인을 관리하는 AuthProvider가 '헤더'와 '본문'을 감싸야 합니다 */}
        <AuthProvider>
          <div className="flex flex-col min-h-screen transition-colors duration-300">
            {/* 헤더는 여기서 사용! */}
            <Header />
            
            <main className="flex-grow w-full pt-20">
              {children}
            </main>
            
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}