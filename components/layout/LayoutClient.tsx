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

// ── 광고 비노출 경로 ──────────────────────────────────────────────
// ⚠️ 애드센스 정책: 로그인 화면·에러 페이지·발행 콘텐츠가 없는 페이지에는 광고를 넣을 수 없다.
//    이 경로들은 크롤러(=심사자)가 보면 "로그인이 필요합니다" 한 줄뿐이라 광고를 붙이면
//    '가치 없는 콘텐츠' 사유로 거절된다. 로그인한 회원에게도 어차피 광고 가치가 낮다.
//    (ko/en 공통 — 앞의 "/en" 은 제거하고 비교한다)
const AD_FREE_PREFIXES = [
  "/login", "/signup",              // 인증 화면
  "/profile", "/my", "/u",          // 회원 개인 공간
  "/messages", "/notifications",    // 개인 수·발신함
  "/shop", "/feed", "/explore",     // 로그인 후에야 내용이 보이는 화면
  "/suggestion", "/help",           // 문의·도움 폼
  "/community",                     // 글 목록·글쓰기 — 로그인 전엔 본문이 비어 있다
  "/animal/create", "/animal/creations",
  "/illo/inbox", "/studio", "/academy",
];

function isAdFree(pathname: string | null): boolean {
  // 정적 내보내기라 "/profile.html", "/profile/" 로도 열릴 수 있다 → 정규화 후 비교.
  const p =
    ((pathname || "")
      .replace(/\.html$/, "")
      .replace(/\/+$/, "")
      .replace(/^\/en(?=\/|$)/, "")) || "/";
  return AD_FREE_PREFIXES.some((r) => p === r || p.startsWith(r + "/"));
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

  // 대리인 : AI비서 앱(/ai-assistant)도 독립 전체화면 — 사이트 헤더·좌우 광고·여백 없이
  // 통째로 렌더. (자체 ProjectTopBar·사이드바로 illo와 연결) flat-form·미니게임과 동일 패턴.
  if (pathname?.startsWith("/ai-assistant")) {
    return <>{children}</>;
  }

  // Flat-Form(/flat-form)도 전체화면 도구 — 사이트 헤더/좌우 사이드 광고 없이 렌더
  // (페이지 자체에서 iframe + 하단 소형 광고를 직접 배치)
  if (pathname?.startsWith("/flat-form")) {
    return <>{children}</>;
  }

  // 미니게임 인게임 — 헤더/사이드 광고/패딩 없이 풀스크린 렌더 (인덱스 /minigame 는 제외)
  if (pathname?.startsWith("/minigame/")) {
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
  const adFree = isAdFree(pathname);
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
      <Header />
      {!adFree && <LeftSideAd />}
      <main className="flex-grow w-full pt-[100px] pb-[80px] lg:pb-[200px] xl:px-[260px] px-6 relative z-0">
        <PageTransition>
          {children}
        </PageTransition>
      </main>
      <Footer />
      <BottomNav />
      <OpenPopup />
      {!adFree && <RightSideAd />}
      <QuickBar />
    </div>
  );
}





