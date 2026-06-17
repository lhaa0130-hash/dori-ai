import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://dori-ai.com";

  // 색인 제외 경로 (한 곳에서 관리)
  const disallow = [
    // 관리자·인증·개인
    "/admin",
    "/admin/",
    "/studio",
    "/my",
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
