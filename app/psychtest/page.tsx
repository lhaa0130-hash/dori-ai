import { createMetadata } from "@/lib/seo";
import PsychTestClient from "./page.client";

export const metadata = createMetadata({
  title: "AI 활용 유형 테스트 — 나는 어떤 AI 사용자?",
  description: "6개 질문으로 알아보는 나의 AI 활용 성향. 실전 빌더·AI 크리에이터·탐구 학습러·자동화 마니아·트렌드 헌터 중 당신은?",
  path: "/psychtest",
});

export default function Page() {
  return <PsychTestClient />;
}
