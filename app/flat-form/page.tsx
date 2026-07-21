import type { Metadata } from "next";
import RequireAuth from "@/components/auth/RequireAuth";
import FlatFormClient from "./page.client";

export const metadata: Metadata = {
  title: "건축일로 · 건축설계 보조 프로그램 | illo",
  description:
    "선으로 도면을 그리면 실(室)과 면적을 자동으로 인식·계산하는 건축설계 보조 프로그램. 지적도(VWorld) 자동 로드부터 평면 설계까지. 로그인하면 설계가 계정에 저장됩니다.",
  alternates: { canonical: "/flat-form" },
  // 로그인 필수 앱 셸 — 크롤러엔 로딩 상태만 보임. 애드센스 '가치 없는 콘텐츠' 방지.
  robots: { index: false, follow: false },
};

// 로그인 필수 + 계정별 저장(FlatFormClient). 앱 자체는 public/flatform-app iframe.
export default function FlatFormPage() {
  return (
    <RequireAuth>
      <FlatFormClient />
    </RequireAuth>
  );
}
