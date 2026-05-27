import { createMetadata } from "@/lib/seo";
import AnimalPageClient from "./page.client";

export const metadata = createMetadata({
  title: "동물도감 — DORI-AI",
  description: "먹이·색깔·크기·서식지 등 다양한 속성으로 동물을 검색하고 분류하는 어린이 동물 백과사전. 곤충을 먹는 동물, 분홍색 동물, 손보다 작은 동물 등 원하는 기준으로 찾아보세요.",
  path: "/animal",
});

export default async function AnimalPage() {
  return <AnimalPageClient />;
}
