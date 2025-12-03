import { createMetadata } from "@/lib/seo";
import MarketClient from "./page.client";

export const metadata = createMetadata({
  title: "Market",
  description: "AI 프롬프트, 템플릿 마켓 및 작업 의뢰.",
  path: "/market",
});

export default function Page() {
  return <MarketClient />;
}