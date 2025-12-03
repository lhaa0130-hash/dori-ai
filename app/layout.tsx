import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "./providers";
import Header from "@/components/layout/Header"; 
import Footer from "@/components/layout/Footer";
import VisitorTracker from "@/components/VisitorTracker"; // 👈 추가
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
      <body className={inter.className} suppressHydrationWarning={true}>
        
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1868839951780851"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />

        <AuthProvider>
          <VisitorTracker /> 
          <div className="flex flex-col min-h-screen transition-colors duration-300">
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