import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Flat-Form · 건축설계 보조 프로그램 | DORI-AI",
  description:
    "선으로 도면을 그리면 실(室)과 면적을 자동으로 인식·계산하는 건축설계 보조 프로그램. 지적도(VWorld) 자동 로드부터 평면 설계까지.",
  alternates: { canonical: "/flat-form" },
};

// 자체 완결형 캔버스 앱(public/flatform-app)을 전체 화면 iframe으로 임베드.
// position:fixed inset:0 으로 사이트 헤더 위까지 덮어 풀스크린 작업 환경 제공.
export default function FlatFormPage() {
  return (
    <iframe
      src="/flatform-app/index.html"
      title="Flat-Form"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        border: "none",
        zIndex: 9999,
      }}
    />
  );
}
