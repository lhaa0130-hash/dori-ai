"use client";

import { usePathname } from "next/navigation";
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
import BottomNav from "@/components/layout/BottomNav";
import QuickBar from "@/components/layout/QuickBar";

interface LayoutClientProps {
  children: React.ReactNode;
}

/**
 * 앱/웹 UI 분기 처리 클라이언트 컴포넌트
 * isApp() 하나로 앱/웹 UI가 분리되는 단일 분기점
 */
export default function LayoutClient({ children }: LayoutClientProps) {
  const isAppEnv = useIsApp();
  const pathname = usePathname();

  // 전역 미션 자동 완료 (출석 체크, 페이지 방문 등)
  useMissionAutoComplete();

  // 10분간 비활성 시 자동 로그아웃
  useAutoLogout();

  // 일로 앱(/illo/app)은 독립 전체화면 — 사이트 헤더·광고·여백 없이 통째로 렌더
  if (pathname?.startsWith("/illo/app")) {
    return <>{children}</>;
  }

  // Flat-Form(/flat-form)도 전체화면 도구 — 사이트 헤더/좌우 사이드 광고 없이 렌더
  // (페이지 자체에서 iframe + 하단 소형 광고를 직접 배치)
  if (pathname?.startsWith("/flat-form")) {
    return <>{children}</>;
  }

  // 임베드형 전체화면 미니게임 — 사이트 헤더/사이드 광고 없이 셸(EmbeddedGame) 통째 렌더
  if (
    pathname?.startsWith("/minigame/galaxy") ||
    pathname?.startsWith("/minigame/cute2048") ||
    pathname?.startsWith("/minigame/gem") ||
    pathname?.startsWith("/minigame/boss")
  ) {
    return <>{children}</>;
  }

  // 관리자(/admin)는 자체 헤더·풀폭 레이아웃 사용 — 사이드 광고/본문 패딩 중복 제거
  if (pathname?.startsWith("/admin")) {
    return <>{children}</>;
  }

  // 앱 환경: Header/Footer 숨기고 AppLayoutWrapper 사용
  if (isAppEnv) {
    return <AppLayoutWrapper>{children}</AppLayoutWrapper>;
  }

  // 웹 환경: Header/Footer 표시 및 Sidebar 추가
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
      <Header />
      <LeftSideAd />
      <main className="flex-grow w-full pt-[100px] pb-[80px] lg:pb-[200px] xl:px-[260px] px-6 relative z-0">
        <PageTransition>
          {children}
        </PageTransition>
      </main>
      <Footer />
      <BottomNav />
      <OpenPopup />
      <RightSideAd />
      <QuickBar />
    </div>
  );
}





