import { createMetadata } from "@/lib/seo";
import AiToolsClient from "../../ai-tools/page.client";
import { AI_TOOLS_DATA } from "@/constants/aiToolsData";
import type { AiTool } from "@/types/content";
import enMap from "@/data/aiTools.en.json";

export const metadata = createMetadata({
  title: "AI Tools Directory — 340+ AI tools by category",
  description: "Browse 340+ hand-picked AI tools by category — coding, image, video, agents, voice and more — with rankings, descriptions and API links at a glance.",
  path: "/en/ai-tools",
  locale: "en",
  hreflang: { ko: "/ai-tools", en: "/en/ai-tools" },
  keywords: [
    "AI tools", "best AI tools", "AI tools directory", "AI tools list", "AI coding tools",
    "AI image tools", "AI video tools", "AI agents", "free AI tools", "AI tools 2026",
  ],
});

// 한글 데이터에 영어 번역 필드를 오버레이 (id·name·category·website 등은 유지)
const EN = enMap as Record<string, Partial<AiTool>>;
const enTools: AiTool[] = AI_TOOLS_DATA.map((t) => ({ ...t, ...(EN[t.id] || {}) }));

export default function Page() {
  return <AiToolsClient locale="en" toolsData={enTools} />;
}
