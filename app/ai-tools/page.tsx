import { createMetadata } from "@/lib/seo";
import AiToolsClient from "./page.client";

export const metadata = createMetadata({
  title: "AI 도구 모음 — 카테고리별 340개+ AI 툴",
  description: "코딩·이미지·영상·에이전트 등 카테고리별로 엄선된 340개+ AI 도구를 랭킹·설명·API 링크와 함께 한눈에.",
  path: "/ai-tools",
  hreflang: { ko: "/ai-tools", en: "/en/ai-tools" },
});

export default function Page() {
  return <AiToolsClient />;
}