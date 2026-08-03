"use client";

import { useEffect, useState } from "react";
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
  // ⚠️ 2026-08-03 애드센스 '가치가 별로 없는 콘텐츠' 거절 대응 — 동물도감 전체를 광고에서 뺀다.
  //    카드 1,205장이 페이지당 약 1,076자뿐인데 광고 3개가 붙어 있었다. 광고가 붙은 페이지의
  //    94%가 이 얇은 카드라 심사에서 사이트 전체가 얇아 보였다. 목록 화면(/animal)도 필터 UI뿐이라 함께 제외.
  //    ⛔ 내용을 두껍게 만들기 전에는 되돌리지 말 것. (알찬 인사이트 글 71편에는 광고가 그대로 붙는다)
  "/animal",
  // ⚠️ 2026-08-03 재심사 대비 2차 정리 — 배포본 1,391개를 전수 조사해 "광고는 붙었는데 얇은"
  //    페이지를 전부 골라냈다. 기준: 자바스크립트 렌더 후에도 본문 2,000자 미만.
  //    (/ai-models 는 렌더 후 2,335자짜리 실시간 비용 계산기라 광고를 남겼다)
  "/404", "/_not-found",            // 오류 화면 — 애드센스가 명시적으로 광고를 금지한다
  "/at", "/post",                   // @사용자홈·게시물 상세 — 크롤러엔 골격만 (446·579자)
  "/video",                         // 렌더 후에도 424자
  "/world-map", "/my-world",        // 지도 UI — 텍스트 551·762자
  "/projects",                      // 목록·상세 모두 864~1,236자
  "/minigame",                      // 게임 목록 — 개별 게임은 이미 전체화면이라 광고 없음
  "/legal",                         // 약관·정책 — 얇고, 법적 고지에 광고는 인상도 나쁘다
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

  // 현재 화면이 noindex 인지 — 404 등 오류 화면 광고 차단용 (아래 adFree 주석 참고)
  const [metaNoIndex, setMetaNoIndex] = useState(false);
  useEffect(() => {
    const content = document.querySelector('meta[name="robots"]')?.getAttribute("content") || "";
    setMetaNoIndex(/noindex/i.test(content));
  }, [pathname]);

  // 일로 앱(/illo/app)은 독립 전체화면 — 사이트 헤더·광고·여백 없이 통째로 렌더
  if (pathname?.startsWith("/illo/app")) {
    return <>{children}</>;
  }

  // 대리인 : AI비서 앱(/ai-assistant)도 독립 전체화면 — 사이트 헤더·좌우 광고·여백 없이
  // 통째로 렌더. (자체 ProjectTopBar·사이드바로 illo와 연결) flat-form·미니게임과 동일 패턴.
  // ⚠️ 단, /ai-assistant/intro는 공개 소개 페이지라 예외 — 앱 셸로 렌더하면 헤더·푸터가 빠져
  //    내부 링크가 사라지고 색인 가치가 떨어진다. 일반 웹 레이아웃을 그대로 태운다.
  if (pathname?.startsWith("/ai-assistant") && pathname !== "/ai-assistant/intro") {
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
  // ⚠️ 경로 목록(AD_FREE_PREFIXES)만으로는 404를 못 막는다. 없는 주소로 들어오면 pathname이
  //    "/this-is-wrong" 같은 임의값이라 목록에 걸리지 않는데, 화면은 오류 페이지가 뜬다.
  //    → head의 robots 메타를 함께 본다. noindex 화면에는 광고를 붙이지 않는다는 규칙.
  //    SSR 땐 판단할 수 없어 초기값 false(=광고 그대로 렌더)로 둔다. 정적 HTML의 광고 마크업을
  //    보존해야 애드센스가 "광고 요청 없는 사이트"로 오해하지 않는다.
  //    광고 컴포넌트들은 마운트 후 300ms 지연 뒤에야 adsbygoogle.push 하므로,
  //    그 전에 언마운트되어 실제 광고 요청은 발생하지 않는다.
  const adFree = isAdFree(pathname) || metaNoIndex;
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





