import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://illo.im";

  // 색인 제외 경로 (한 곳에서 관리)
  const disallow = [
    // 관리자·인증·개인
    "/admin",
    "/admin/",
    "/studio",
    // ⚠️ "$"(URL 끝) 앵커 필수 — 그냥 "/my" 로 두면 앞글자 일치라 콘텐츠 페이지 "/my-world"까지 막힌다.
    "/my$",
    "/my/",
    "/login",
    "/signup",
    // API·내부 에셋
    "/api/",
    "/_next/",
    // 콘텐츠 얇은 부가 페이지
    "/family",
    "/illo",
    "/shop",
    // 커뮤니티 글 작성 페이지(유저 생성)
    "/community/write",
    // ⚠️ 애드센스 대비: 크롤러가 보면 "로그인이 필요합니다" 한 줄뿐인 회원 전용 화면.
    //    발행 콘텐츠가 없는 페이지가 색인되면 '가치 없는 콘텐츠'로 판정될 수 있다.
    "/profile",
    "/messages",
    "/notifications",
    // ⚠️ "$" 없으면 RSS 피드 "/feed.xml"까지 막힌다. 회원 피드 화면만 막는 게 목적이다.
    "/feed$",
    "/feed/",
    "/u",
    "/explore",
    "/suggestion",
    "/help",
    // ⚠️ 2026-08-04 애드센스 대비 — 동물도감 전체 비공개(lib/publicFlags.ts SHOW_ANIMAL=false).
    //    라우트를 지웠으므로 크롤러가 죽은 URL 1205개를 계속 두드리지 않게 통째로 막는다.
    //    되살릴 때 이 세 줄 중 "/animal" 만 빼면 된다.
    "/animal",
    "/animal/create",
    "/animal/creations",
    // 유니티 게임 원시 빌드 셸(본문 10~52자) — 플레이는 /minigame/* 래퍼로 한다.
    "/games/",
    // 영어판 회원 전용 화면도 동일하게 제외
    "/en/profile",
    "/en/messages",
    "/en/notifications",
    "/en/feed",
    "/en/shop",
    "/en/my",
    "/en/login",
    "/en/signup",
  ];

  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      { userAgent: "Googlebot", allow: "/", disallow },
      // AI 학습 크롤러 차단
      { userAgent: "GPTBot", disallow: ["/"] },
      { userAgent: "ClaudeBot", disallow: ["/"] },
      { userAgent: "anthropic-ai", disallow: ["/"] },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
