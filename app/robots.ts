import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://dori-ai.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          // 관리자·디버그·인증
          "/admin",
          "/admin/",
          "/debug-auth",
          "/studio",
          // 개인 계정 (로그인 필요)
          "/my",
          "/my/",
          "/login",
          "/signup",
          // API 엔드포인트 (정적 배포에서 5xx 발생)
          "/api/",
          // Next.js 내부 에셋
          "/_next/",
          // 콘텐츠 없는 테스트/부가 페이지
          "/animal",
          "/family",
          "/education",
          "/illo",
          "/blog",
          "/insight-sample",
          // 커뮤니티 글 개별 페이지 (유저 생성 콘텐츠, 내용 불안정)
          "/community/write",
          // 기타 서비스 페이지
          "/shop",
          "/resources",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/debug-auth",
          "/studio",
          "/my",
          "/my/",
          "/login",
          "/signup",
          "/api/",
          "/_next/",
          "/animal",
          "/family",
          "/education",
          "/illo",
          "/blog",
          "/insight-sample",
          "/community/write",
          "/shop",
          "/resources",
        ],
      },
      // AI 학습 크롤러 차단 (선택)
      {
        userAgent: "GPTBot",
        disallow: ["/"],
      },
      {
        userAgent: "ClaudeBot",
        disallow: ["/"],
      },
      {
        userAgent: "anthropic-ai",
        disallow: ["/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
