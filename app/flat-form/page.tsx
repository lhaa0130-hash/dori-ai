import type { Metadata } from "next";
import BottomAd from "@/components/ads/BottomAd";

export const metadata: Metadata = {
  title: "Flat-Form · 건축설계 보조 프로그램 | DORI-AI",
  description:
    "선으로 도면을 그리면 실(室)과 면적을 자동으로 인식·계산하는 건축설계 보조 프로그램. 지적도(VWorld) 자동 로드부터 평면 설계까지.",
  alternates: { canonical: "/flat-form" },
};

const AD_H = 56; // 하단 소형 광고 높이(px)

// 자체 완결형 캔버스 앱(public/flatform-app)을 전체 화면 iframe으로 임베드.
// 하단 광고는 작은 폭(가운데)으로 떠 있고, 앱은 전체 화면을 사용.
export default function FlatFormPage() {
  return (
    <>
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
      <BottomAd height={AD_H} />
    </>
  );
}
