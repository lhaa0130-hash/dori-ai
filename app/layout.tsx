import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "./providers";
import Header from "@/components/layout/Header"; 
import Footer from "@/components/layout/Footer";
import VisitorTracker from "@/components/VisitorTracker";
import { createMetadata } from "@/lib/seo";

const inter = Inter({ subsets: ["latin"] });

export const metadata = createMetadata({
  title: "Create Reality",
  description: "AI Tools, Insight, Academy, Community - All in one AI Platform.",
  path: "/",
});

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
      {/* [핵심 수정] 
        배경색을 div가 아닌 body 태그에 직접 줍니다. 
        이것이 가장 근본적인 배경색이 되며, 자식 페이지에서 배경색을 
        따로 지정하지 않으면(투명하면) 이 색을 따르게 됩니다.
      */}
      <body 
        className={`${inter.className} transition-colors duration-300 bg-white text-black dark:bg-black dark:text-white`} 
        suppressHydrationWarning={true}
      >
        
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1868839951780851"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />

        <AuthProvider>
          <VisitorTracker /> 
          <div className="flex flex-col min-h-screen">
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