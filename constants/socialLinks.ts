// 소셜 링크 정본(단일 소스) — 푸터·홈 팔로우 배너·SEO sameAs 가 공유
export interface SocialLink {
  key: "instagram" | "x" | "naver" | "reddit" | "youtube";
  name: string;
  href: string;
}

export const SOCIAL_LINKS: SocialLink[] = [
  { key: "instagram", name: "Instagram", href: "https://www.instagram.com/lhaa0130/" },
  { key: "x", name: "X (Twitter)", href: "https://x.com/doriillo" },
  { key: "naver", name: "네이버 블로그", href: "https://blog.naver.com/illo26" },
  { key: "reddit", name: "Reddit", href: "https://www.reddit.com/user/illo0601/" },
  { key: "youtube", name: "YouTube", href: "https://www.youtube.com/@lhaa0130" },
];

// SEO Organization.sameAs 용 (프로필 URL만)
export const SOCIAL_SAMEAS = SOCIAL_LINKS.map((s) => s.href);
