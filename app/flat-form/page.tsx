import type { Metadata } from "next";
import BottomAd from "@/components/ads/BottomAd";

export const metadata: Metadata = {
  title: "Flat-Form · 건축설계 보조 프로그램 | DORI-AI",
  description:
    "선으로 도면을 그리면 실(室)과 면적을 자동으로 인식·계산하는 건축설계 보조 프로그램. 지적도(VWorld) 자동 로드부터 평면 설계까지.",
  alternates: { canonical: "/flat-form" },
};

const AD_H = 60; // 하단 광고 높이(px)

// 자체 완결형 캔버스 앱(public/flatform-app)을 전체 화면 iframe으로 임베드.
// 좌우 사이드 광고는 끄고(LayoutClient에서 /flat-form 분기) 하단에 작은 광고 1개만.
export default function FlatFormPage() {
  return (
    <>
      <iframe
        src="/flatform-app/index.html"
        title="Flat-Form"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: AD_H,        // 하단 광고 높이만큼 비워둠
          width: "100vw",
          height: `calc(100vh - ${AD_H}px)`,
          border: "none",
          zIndex: 9999,
        }}
      />
      <BottomAd height={AD_H} />
    </>
  );
}
