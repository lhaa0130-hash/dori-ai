import { createMetadata } from "@/lib/seo";
import fs from "fs";
import path from "path";
import AnimalPageClient, { type AnimalCard } from "./page.client";

export const metadata = {
  ...createMetadata({
  hreflang: { ko: "/animal", en: "/en/animal" },
    title: "몽글로 : 동물도감 — illo",
    description: "몽글로 : 동물도감 — 먹이·색깔·크기·서식지 등 다양한 속성으로 동물을 검색하고 분류하는 동물 백과사전.",
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
      {/* 크롤러용 정적 내부링크 — 개별 페이지로 가는 앵커(JS 카드는 색인 불가하므로 필수).
          시각적으로는 접어둠(details, 기본 닫힘) → UI는 깔끔하게, 크롤러는 정적 HTML 앵커를 그대로 수집. */}
      <nav aria-label="전체 동물 목록" className="max-w-5xl mx-auto px-4 pb-16 pt-8">
        <details className="group">
          <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-sm font-bold text-stone-500 dark:text-stone-400 hover:text-orange-500 transition select-none">
            <span className="text-stone-400 transition-transform group-open:rotate-90">▸</span>
            전체 동물 목록 ({cards.length}종) 펼쳐보기
          </summary>
          <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 text-sm text-stone-500 dark:text-stone-400">
            {cards.map((c) => (
              <li key={c.no}>
                <a href={`/animal/${c.no}`} className="hover:text-orange-500 hover:underline">{c.animal_name}</a>
              </li>
            ))}
          </ul>
        </details>
      </nav>
    </>
  );
}
