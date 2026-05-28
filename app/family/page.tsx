import { createMetadata } from "@/lib/seo";
import FamilyPageClient from "./page.client";

export const metadata = createMetadata({
  title: "가족기록 — DORI-AI",
  description: "가족 구성원이 일정·사진·건강·추억을 하나의 앱으로 함께 공유하는 가족 전용 플랫폼. DORI-AI가 개발 중인 두 번째 프로젝트입니다.",
  path: "/family",
});

export default async function FamilyPage() {
  return <FamilyPageClient />;
}
