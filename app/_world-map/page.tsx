import { createMetadata } from "@/lib/seo";
import WorldMapClient from "./page.client";
import "maplibre-gl/dist/maplibre-gl.css";

export const metadata = {
  ...createMetadata({
    title: "나라콕 | 콕 눌러 만나는 세계 — 195개국 지도",
    description:
      "세계지도에서 나라를 콕 누르면 수도·언어·통화·이웃 나라·인구·면적·GDP·1인당 GDP가 바로 나옵니다. 195개국을 대륙 색으로 구분해 보고, 최대 4개국을 나란히 비교할 수 있어요.",
    path: "/world-map",
    hreflang: { ko: "/world-map", en: "/en/world-map" },
  }),
};

export default function WorldMapPage() {
  return <WorldMapClient />;
}
