import { createMetadata } from "@/lib/seo";
import AnimalPageClient from "./page.client";

export const metadata = createMetadata({
  title: "동물도감 — DORI-AI",
  description: "다양한 동물들을 포켓몬처럼 배워요. 포유류·조류·파충류·어류·곤충까지, 동물이 무엇을 먹고 어떻게 사는지 아이들이 쉽게 알아가는 동물 백과사전.",
  path: "/animal",
});

export default async function AnimalPage() {
  return <AnimalPageClient />;
}
