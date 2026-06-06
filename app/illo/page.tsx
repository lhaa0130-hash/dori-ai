import { createMetadata } from "@/lib/seo";
import IlloPageClient from "./page.client";

export const metadata = createMetadata({
  title: "일로 (Illo) — 혼자서도, 일이 되는 곳",
  description:
    "AI 직원을 불러와 지시하고 내 사업·콘텐츠·사이트를 굴리는 1인용 AI 사무실. 필요한 기능만 드래그로 꺼내 쓰고, 내 API 키로 동작합니다. DORI-AI의 정식 프로그램, 일로를 다운로드하세요.",
  path: "/illo",
});

export default async function IlloPage() {
  return <IlloPageClient />;
}
