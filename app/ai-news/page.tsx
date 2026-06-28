import { createMetadata } from "@/lib/seo";
import { AI_NEWS_CATEGORIES } from "@/constants/aiNewsData";
import AiNewsClient from "./AiNewsClient";

const SITE = "https://dori-ai.com";

export const metadata = createMetadata({
  title: "AI 정보 사이트 총정리 — 뉴스·커뮤니티·뉴스레터·리더보드",
  description:
    "GeekNews, Hacker News, TLDR AI, LMArena, Hugging Face 등 AI 정보를 얻기 좋은 사이트를 뉴스·커뮤니티·뉴스레터·리더보드·연구 카테고리로 모았습니다. DORI-AI 큐레이션.",
  path: "/ai-news",
  keywords: [
    "AI 뉴스 사이트", "AI 정보 사이트", "AI 커뮤니티", "AI 뉴스레터", "GeekNews",
    "AI 리더보드", "LMArena", "AI 소식", "AI 트렌드 사이트", "인공지능 뉴스",
  ],
});

// ItemList JSON-LD — 큐레이션 링크 목록(검색 리치결과·색인 촉진)
const itemListLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "AI 정보 사이트 총정리",
  url: `${SITE}/ai-news`,
  itemListElement: AI_NEWS_CATEGORIES.flatMap((c) => c.sites).map((s, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: s.name,
    url: s.url,
    description: s.desc,
  })),
};

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
      <AiNewsClient />
    </>
  );
}
