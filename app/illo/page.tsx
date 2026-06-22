import { createMetadata } from "@/lib/seo";
import IlloPageClient from "./page.client";

export const metadata = createMetadata({
  title: "워크일로 = 일로 (Workillo) — AI API, 구독 말고 필요한 만큼",
  description:
    "GPT·Claude·Gemini만 구독하고 API는 못 쓰던 사람들을 위한 AI API 활용 웹 구독 서비스. 내 키로 검색·글·이미지·음성을 조합하고, 결과를 사이트·메일·카톡으로 자동 발행. 월 ₩990.",
  path: "/illo",
});

export default async function IlloPage() {
  return <IlloPageClient />;
}
