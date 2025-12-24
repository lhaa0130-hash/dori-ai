"use client";

import { useIsApp } from "@/hooks/useIsApp";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AppLayoutWrapper from "@/components/layout/AppLayoutWrapper";

interface LayoutClientProps {
  children: React.ReactNode;
}

/**
 * 앱/웹 UI 분기 처리 클라이언트 컴포넌트
 * isApp() 하나로 앱/웹 UI가 분리되는 단일 분기점
 */
export default function LayoutClient({ children }: LayoutClientProps) {
  const isAppEnv = useIsApp();

  // 앱 환경: Header/Footer 숨기고 AppLayoutWrapper 사용
  if (isAppEnv) {
    return <AppLayoutWrapper>{children}</AppLayoutWrapper>;
  }

  // 웹 환경: Header/Footer 표시
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow w-full" style={{ paddingTop: '70px' }}>
        {children}
      </main>
      <Footer />
    </div>
  );
}


