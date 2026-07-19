// app/en/ai-news/page.tsx — English AI news source directory (/en/ai-news)
import { createMetadata } from "@/lib/seo";
import { AI_NEWS_CATEGORIES } from "@/constants/aiNewsData";
import { AI_SITE_DESC_EN } from "@/constants/aiNewsData.en";
import AiNewsEnClient from "./page.client";

const SITE_URL = "https://illo.im";

const base = createMetadata({
  title: "Where to follow AI — the best news, communities, newsletters and leaderboards",
  description:
    "A curated directory of the best places to keep up with AI: Hacker News, TLDR AI, The Batch, LMArena, Hugging Face, arXiv and more — grouped into news, communities, newsletters, leaderboards, tools, research and learning.",
  path: "/en/ai-news",
  locale: "en",
  hreflang: { ko: "/ai-news", en: "/en/ai-news" },
  keywords: [
    "AI news sites", "best AI newsletters", "AI communities", "AI leaderboards",
    "LMArena", "TLDR AI", "AI research papers", "follow AI news", "AI resources",
  ],
});

export const metadata = {
  ...base,
  alternates: {
    canonical: `${SITE_URL}/en/ai-news`,
    languages: {
      "ko-KR": `${SITE_URL}/ai-news`,
      en: `${SITE_URL}/en/ai-news`,
      "x-default": `${SITE_URL}/en/ai-news`,
    },
  },
};

// ItemList JSON-LD — 큐레이션 링크 목록(영문 설명 사용)
const itemListLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Where to follow AI",
  url: `${SITE_URL}/en/ai-news`,
  itemListElement: AI_NEWS_CATEGORIES.flatMap((c) => c.sites).map((s, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: s.name,
    url: s.url,
    description: AI_SITE_DESC_EN[s.name] || s.desc,
  })),
};

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
      <AiNewsEnClient />
    </>
  );
}
