import { createMetadata } from "@/lib/seo";
import fs from "fs";
import path from "path";
import AnimalPageClient, { type AnimalCard } from "./page.client";

export const metadata = {
  ...createMetadata({
    title: "동물도감 — DORI-AI",
    description: "먹이·색깔·크기·서식지 등 다양한 속성으로 동물을 검색하고 분류하는 어린이 동물 백과사전.",
    path: "/animal",
  }),
  robots: { index: false, follow: false },
};

function loadCards(): AnimalCard[] {
  try {
    const p = path.join(process.cwd(), "data", "animal-cards.json");
    const raw = fs.readFileSync(p, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export default async function AnimalPage() {
  const cards = loadCards();
  return <AnimalPageClient cards={cards} />;
}
