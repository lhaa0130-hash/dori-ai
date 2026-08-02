import { createMetadata } from "@/lib/seo";
import WorldMapClient from "./page.client";

export const metadata = {
  ...createMetadata({
    title: "월드맵 — 지구본·세계지도로 보는 나라별 지표 | illo",
    description:
      "지구본을 돌려보고 평면 세계지도로 한눈에 비교하세요. 나라를 누르면 면적·인구·GDP·1인당 GDP·수도·통화·언어를 바로 확인할 수 있고, 지표별 색칠로 나라끼리 쉽게 구분됩니다.",
    path: "/worldmap",
  }),
};

export default function WorldMapPage() {
  return <WorldMapClient />;
}
