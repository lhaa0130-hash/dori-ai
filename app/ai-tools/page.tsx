import { createMetadata } from "@/lib/seo";
import AiToolsClient from "./page.client";

export const metadata = createMetadata({
  title: "AI Tools",
  description: "최신 AI 툴 랭킹, 리뷰, 가격 정보를 한눈에 확인하세요.",
  path: "/ai-tools",
});

export default function Page() {
  return <AiToolsClient />;
}