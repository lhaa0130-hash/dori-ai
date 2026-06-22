import { createMetadata } from "@/lib/seo";
import IlloWebClient from "./page.client";

export const metadata = createMetadata({
  title: "워크일로 웹 — 브라우저에서 바로 쓰는 AI 도구",
  description: "설치 없이 브라우저에서 바로 쓰는 워크일로 라이트. 내 API 키로 블로그·SNS·카피·상품설명·답변·요약을 즉시 생성하세요.",
  path: "/illo/app",
});

export default function IlloWebPage() {
  return <IlloWebClient />;
}
