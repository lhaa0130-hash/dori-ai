import { createMetadata } from "@/lib/seo";
import PsychTestClient from "./page.client";

export const metadata = createMetadata({
  title: "심리테스트 — 검증된 척도로 보는 나의 마음",
  description: "우울·불안·스트레스·번아웃·자존감·회복탄력성·SNS/스마트폰/게임/음주 중독까지. 실제 심리학에서 검증된 척도(PHQ-9·GAD-7·AUDIT 등) 기반의 제대로 된 자기점검 심리테스트.",
  path: "/psychtest",
  hreflang: { ko: "/psychtest", en: "/en/psychtest" },
  keywords: ["심리테스트", "우울증 자가진단", "불안 검사", "스트레스 검사", "번아웃 테스트", "자존감 테스트", "스마트폰 중독", "SNS 중독", "게임 중독", "음주 자가진단", "MBTI"],
});

export default function Page() {
  return <PsychTestClient />;
}
