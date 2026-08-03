import { createMetadata } from "@/lib/seo";
import WorldMapClient from "@/app/world-map/page.client";
import "maplibre-gl/dist/maplibre-gl.css";

// 영문 경로. 사이트의 다른 영어 페이지(app/en/*)와 같은 방식으로 별도 라우트를 둔다.
// 화면은 같은 컴포넌트를 쓰고, 언어만 영어로 시작한다.
export const metadata = {
  ...createMetadata({
    title: "NARAKOK | Tap a Country, Meet the World",
    description:
      "Explore all 195 countries on one large flat map. Tap a country to see its capital, languages, currency, neighbours, population, area and GDP — each with its source year — and compare up to four countries side by side.",
    path: "/en/world-map",
    hreflang: { ko: "/world-map", en: "/en/world-map" },
  }),
};

export default function EnWorldMapPage() {
  return <WorldMapClient initialLang="en" />;
}
