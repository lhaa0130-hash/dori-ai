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
    // ⚠️ 2026-08-08 — 동물도감 disallow 를 **의도적으로 뺐다.** 되돌리지 말 것(이유 아래).
    //
    //    2026-08-04 에 "죽은 URL 1205개를 크롤러가 두드리지 않게" 막았는데, 효과가 정반대였다.
    //    robots.txt 차단은 "색인에서 빼라"가 아니라 "보지 마라"다. 이미 색인된 URL 을 막으면
    //    구글은 그 URL 이 404 가 된 걸 확인할 방법이 없어져서 → 색인에 그대로 남는다.
    //    실제로 Search Console 이 "색인이 생성되었으나 robots.txt 에 의해 차단됨" 경고를 보냈다.
    //    (애드센스 목표가 '얇은 페이지를 색인에서 빼는 것'인데, 차단이 오히려 그걸 막고 있었다.)
    //
    //    지금 /animal·/animal/* 는 라우트가 없어 전부 404 다(실측 확인). 크롤을 열어 두면
    //    구글이 404 를 보고 스스로 색인에서 지운다. 페이지가 없으므로 노출 위험도 없다.
    //    ▶ 색인에서 다 빠진 뒤(Search Console 에서 0 확인) 다시 막고 싶으면 그때 되살려라.
    //    ▶ 동물도감을 되살릴 때는 publicFlags.ts 의 복구 절차만 따르면 된다(여기 손댈 것 없음).
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
