import { createMetadata } from "@/lib/seo";
import MarketClient from "./page.client";

export const metadata = createMetadata({
  title: "마켓",
  description: "아마존·쿠팡·알리에서 고른 가전·가구·디지털 등 추천 아이템을 카테고리별로 모았습니다.",
  path: "/market",
  keywords: ["추천 아이템", "가성비 제품", "가전 추천", "가구 추천", "아마존 추천", "쿠팡 추천", "알리 추천", "DORI 마켓"],
});

export default function Page() {
  return <MarketClient />;
}