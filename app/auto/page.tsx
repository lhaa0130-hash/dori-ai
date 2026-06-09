import { createMetadata } from "@/lib/seo";
import AutoClient from "./page.client";

export const metadata = {
  ...createMetadata({
    title: "오토 매거진",
    description: "글로벌 테크 트렌드를 AI가 매시간 자동으로 수집·정리해 올리는 콘텐츠 모음입니다.",
    path: "/auto",
  }),
  // 자동 생성·제휴 콘텐츠 → 검색 색인 제외(품질 필터 회피), 내부 링크는 허용
  robots: { index: false, follow: true },
};

export default function AutoPage() {
  return <AutoClient />;
}
