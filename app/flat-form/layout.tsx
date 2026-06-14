import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "flat-form · 평면도 설계",
  description:
    "누구나 설계하고, 전문가를 돕는 건축 설계 보조 프로그램. 드래그로 방을 그리면 면적(㎡·평)과 치수가 자동 계산되고, 설계 도우미가 동선·면적·구성을 점검해 줍니다.",
  path: "/flat-form",
  keywords: [
    "평면도",
    "평면도 그리기",
    "건축 설계",
    "인테리어 설계",
    "집 설계",
    "도면",
    "면적 계산",
    "평수 계산",
    "방 배치",
    "flat-form",
    "DORI-AI",
  ],
});

export default function FlatFormLayout({ children }: { children: React.ReactNode }) {
  return children;
}
