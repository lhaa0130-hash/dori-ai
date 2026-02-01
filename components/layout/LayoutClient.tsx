"use client";

import { useIsApp } from "@/hooks/useIsApp";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AppLayoutWrapper from "@/components/layout/AppLayoutWrapper";
import { useMissionAutoComplete } from "@/hooks/useMissionAutoComplete";
import { useAutoLogout } from "@/hooks/useAutoLogout";
import OpenPopup from "@/components/layout/OpenPopup";
import LeftSideAd from "@/components/ads/LeftSideAd";
import RightSideAd from "@/components/ads/RightSideAd";
import { Sidebar } from "@/components/layout/Sidebar"; // Import Sidebar
import PageTransition from "@/components/PageTransition"; // Import PageTransition

interface LayoutClientProps {
  children: React.ReactNode;
}

/**
 * 앱/웹 UI 분기 처리 클라이언트 컴포넌트
 * isApp() 하나로 앱/웹 UI가 분리되는 단일 분기점
 */
export default function LayoutClient({ children }: LayoutClientProps) {
  const isAppEnv = useIsApp();

  // 전역 미션 자동 완료 (출석 체크, 페이지 방문 등)
  useMissionAutoComplete();

  // 10분간 비활성 시 자동 로그아웃
  useAutoLogout();

  // 앱 환경: Header/Footer 숨기고 AppLayoutWrapper 사용
  if (isAppEnv) {
    return <AppLayoutWrapper>{children}</AppLayoutWrapper>;
  }

  // 웹 환경: Header/Footer 표시 및 Sidebar 추가
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <LeftSideAd />
      <main className="flex-grow w-full pt-[100px] pb-[200px] xl:px-[260px] px-6 relative z-0">
        <PageTransition>
          {children}
        </PageTransition>
      </main>
      <Footer />
      <OpenPopup />
      <RightSideAd />
    </div>
  );
}





