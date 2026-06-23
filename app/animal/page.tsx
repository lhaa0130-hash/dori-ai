import { createMetadata } from "@/lib/seo";
import fs from "fs";
import path from "path";
import AnimalPageClient, { type AnimalCard } from "./page.client";

export const metadata = {
  ...createMetadata({
    title: "애니멀일로 (animalillo) — DORI-AI",
    description: "애니멀일로(animalillo) — 먹이·색깔·크기·서식지 등 다양한 속성으로 동물을 검색하고 분류하는 동물 백과사전.",
    path: "/animal",
  }),
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
  return (
    <>
      <AnimalPageClient cards={cards} />
      {/* 크롤러용 정적 내부링크 — 262종 개별 페이지로 가는 앵커(자바스크립트 카드는 색인 불가하므로 필수) */}
      <nav aria-label="전체 동물 목록" className="max-w-5xl mx-auto px-4 pb-16 pt-8">
        <h2 className="text-base font-bold mb-3 text-neutral-600 dark:text-neutral-400">전체 동물 목록 ({cards.length}종)</h2>
        <ul className="flex flex-wrap gap-x-3 gap-y-1.5 text-sm text-neutral-500 dark:text-neutral-400">
          {cards.map((c) => (
            <li key={c.no}>
              <a href={`/animal/${c.no}`} className="hover:text-orange-500 hover:underline">{c.animal_name}</a>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
