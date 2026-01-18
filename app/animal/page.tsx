import { createMetadata } from "@/lib/seo";
import AnimalPageClient from "./page.client";

export const metadata = createMetadata({
  title: "DORI'S 동물도감",
  description: "아이들의 상상력을 자극하는 AI 기반 맞춤형 동물 백과사전",
  path: "/animal",
});

export default async function AnimalPage() {
  return <AnimalPageClient />;
}

