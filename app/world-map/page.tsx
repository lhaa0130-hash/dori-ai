import { createMetadata } from "@/lib/seo";
import WorldMapClient from "./page.client";
import "maplibre-gl/dist/maplibre-gl.css";

export const metadata = {
  ...createMetadata({
    title: "월드맵 | 세계 국가 정보 탐색 및 비교",
    description:
      "평면 세계지도와 지구본을 나란히 놓고 195개국을 살펴보세요. 수도·지도자·국가 수립일·종교·인구·면적·GDP·1인당 GDP를 기준연도와 출처까지 함께 확인하고, 두 나라를 바로 비교할 수 있습니다.",
    path: "/world-map",
    hreflang: { ko: "/world-map", en: "/world-map?lang=en" },
  }),
};

export default function WorldMapPage() {
  return <WorldMapClient />;
}
