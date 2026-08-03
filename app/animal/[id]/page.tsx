import { createMetadata } from "@/lib/seo";
import {
  buildAnimalTitle,
  buildAnimalDescription,
  buildAnimalKeywords,
  buildGlanceRows,
  taxonProfile,
  pickRelated,
  pickHabitatPeers,
} from "@/lib/animal-seo";
import fs from "fs";
import path from "path";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/layout/Header";
import { notFound } from "next/navigation";
import type { AnimalCard } from "../page.client";

const SITE_URL = "https://illo.im";

function loadCards(): AnimalCard[] {
  try {
    const p = path.join(process.cwd(), "data", "animal-cards.json");
    return JSON.parse(fs.readFileSync(p, "utf8")) || [];
  } catch {
    return [];
  }
}
function findCard(id: string, cards: AnimalCard[]) {
  return cards.find((c) => c.no === id) || cards.find((c) => c.no === String(id).padStart(4, "0"));
}

export function generateStaticParams() {
  return loadCards()
    .filter((c) => c.no)
    .map((c) => ({ id: String(c.no) }));
}

export function generateMetadata({ params }: { params: { id: string } }) {
  const card = findCard(params.id, loadCards());
  if (!card) return createMetadata({ title: "동물 백과 — 몽글로 : 동물도감", description: "동물 백과사전 몽글로 : 동물도감", path: `/animal/${params.id}` });
  // ⚠️ 제목·설명을 고정 문구로 되돌리지 말 것. 1,205개가 같은 꼬리표를 달고 있던 게
  //    '기계로 찍어낸 페이지' 신호였다. 카드 고유값(별명·수치·속성)에서만 만든다. → lib/animal-seo.ts
  return createMetadata({
    title: buildAnimalTitle(card),
    description: buildAnimalDescription(card),
    path: `/animal/${card.no}`,
    image: card.image_path ? `${SITE_URL}${card.image_path}` : undefined,
    keywords: buildAnimalKeywords(card),
  });
}

export default function AnimalDetail({ params }: { params: { id: string } }) {
  const cards = loadCards();
  const idx = cards.findIndex((c) => c.no === params.id || c.no === String(params.id).padStart(4, "0"));
  const card = idx >= 0 ? cards[idx] : null;
  if (!card) return notFound();

  const prev = idx > 0 ? cards[idx - 1] : null;
  const next = idx < cards.length - 1 ? cards[idx + 1] : null;

  // 관련 동물 — 같은 분류군·먹이 기준 점수화(내부링크 강화: 크롤러 발견성·PageRank·회유 개선)
  const related = pickRelated(card, cards, 8);
  // 같은 서식지의 '다른 분류군' — 관련 동물과 겹치지 않게 골라 페이지마다 링크 묶음이 달라진다.
  const habitatPeers = pickHabitatPeers(card, cards, related, 6);

  const info = Array.isArray(card.info) ? card.info : [];
  const facts = Array.isArray(card.facts) ? card.facts : [];
  const features = Array.isArray(card.key_feature) ? card.key_feature : [];
  // filters에만 갇혀 있던 속성들을 지면으로 끌어올린다 — 동물마다 조합이 달라 내용 자체가 갈린다.
  const glance = buildGlanceRows(card);
  // 분류군(8종)에 따라 소제목 문구가 달라진다.
  const heads = taxonProfile(card);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: buildAnimalTitle(card),
    description: card.kid_friendly_desc,
    image: card.image_path ? [`${SITE_URL}${card.image_path}`] : undefined,
    author: { "@type": "Organization", name: "illo", url: SITE_URL },
    publisher: { "@type": "Organization", name: "illo", logo: { "@type": "ImageObject", url: `${SITE_URL}/icon.svg` } },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/animal/${card.no}` },
    about: { "@type": "Thing", name: card.animal_name, ...(card.sci ? { alternateName: card.sci } : {}) },
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "홈", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "몽글로 : 동물도감", item: `${SITE_URL}/animal` },
      { "@type": "ListItem", position: 3, name: card.animal_name, item: `${SITE_URL}/animal/${card.no}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <main style={{ minHeight: "100vh", paddingTop: "70px" }}>
        <Header />
        <article className="max-w-3xl mx-auto p-4 md:p-8">
          <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            <Link href="/" className="hover:underline">홈</Link> ›{" "}
            <Link href="/animal" className="hover:underline">몽글로 : 동물도감</Link> › <span>{card.animal_name}</span>
          </nav>

          <h1 className="text-3xl md:text-4xl font-extrabold mb-1">{card.animal_name}</h1>
          {/* 별명 — 카드마다 다른 한 줄(1,205개 중 1,182개가 고유값). 지면 첫인상을 동물별로 갈라준다. */}
          {card.search_nickname && (
            <p className="text-lg md:text-xl font-bold text-orange-500 mb-1.5">{card.search_nickname}</p>
          )}
          <p className="text-gray-500 dark:text-gray-400 mb-5">
            {card.sci && <em>{card.sci}</em>}{card.sci && card.en ? " · " : ""}{card.en}
            {card.status?.label ? ` · 보전상태: ${card.status.label}` : ""}
          </p>

          {card.image_path && (
            <div className="mb-6 rounded-xl overflow-hidden relative w-full" style={{ aspectRatio: "1 / 1", maxWidth: 480, margin: "0 auto" }}>
              <Image src={card.image_path} alt={`${card.animal_name} 이미지`} fill style={{ objectFit: "cover" }} priority sizes="480px" />
            </div>
          )}

          <p className="text-lg leading-relaxed mb-6">{card.kid_friendly_desc}</p>

          {info.length > 0 && (
            <table className="w-full text-left mb-6 border-collapse">
              <tbody>
                {info.map((row, i) => (
                  <tr key={i} className="border-b border-stone-200 dark:border-stone-800">
                    <th className="py-2 pr-4 font-semibold whitespace-nowrap align-top">{row[0]} {row[1]}</th>
                    <td className="py-2">{row[2]}</td>
                  </tr>
                ))}
                {card.taxonomy && (
                  <tr className="border-b border-stone-200 dark:border-stone-800">
                    <th className="py-2 pr-4 font-semibold whitespace-nowrap align-top">🗂️ 분류</th>
                    <td className="py-2">{card.taxonomy}</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {/* 한눈에 보기 — filters(먹이·크기·서식지·행동·몸·색·지역)를 지면으로 끌어올린 표.
              값 조합이 동물마다 달라 같은 틀로도 서로 다른 내용이 나온다. */}
          {glance.length > 0 && (
            <section className="mb-6">
              <h2 className="text-xl font-bold mb-3">{heads.glance}</h2>
              <div className="flex flex-col gap-2.5">
                {glance.map((row) => (
                  <div key={row.label} className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
                    <span className="text-sm font-semibold text-stone-500 dark:text-stone-400 min-w-[76px]">{row.label}</span>
                    <span className="flex flex-wrap gap-1.5">
                      {row.values.map((v) => (
                        <span key={v} className="text-sm px-2.5 py-1 rounded-full bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-stone-300">
                          {v}
                        </span>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {features.length > 0 && (
            <section className="mb-6">
              <h2 className="text-xl font-bold mb-2">{heads.feature}</h2>
              <ul className="list-disc pl-5 space-y-1">{features.map((f, i) => <li key={i}>{f}</li>)}</ul>
            </section>
          )}

          {facts.length > 0 && (
            <section className="mb-6">
              <h2 className="text-xl font-bold mb-2">{heads.facts}</h2>
              <ul className="list-disc pl-5 space-y-1">{facts.map((f, i) => <li key={i}>{f}</li>)}</ul>
            </section>
          )}

          {card.subspecies && (
            <section className="mb-6">
              <h2 className="text-xl font-bold mb-2">🧬 아종</h2>
              <p>{card.subspecies}</p>
            </section>
          )}

          {related.length > 0 && (
            <section className="mb-6 mt-10 pt-6 border-t border-stone-200 dark:border-stone-800">
              <h2 className="text-xl font-bold mb-4">{heads.related}</h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {related.map((r) => (
                  <Link key={r.no} href={`/animal/${r.no}`} className="group block" title={`${r.animal_name} 알아보기`}>
                    <div className="rounded-xl overflow-hidden relative w-full bg-stone-100 dark:bg-zinc-900" style={{ aspectRatio: "1 / 1" }}>
                      {r.image_path && <Image src={r.image_path} alt={`${r.animal_name} 이미지`} fill sizes="140px" style={{ objectFit: "cover" }} className="group-hover:scale-105 transition-transform" />}
                    </div>
                    <div className="text-[13px] font-semibold mt-1.5 text-center truncate group-hover:text-orange-500">{r.animal_name}</div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* 같은 서식지·다른 분류군 — 위 '관련 동물'(같은 분류군)과 겹치지 않게 골라
              페이지마다 링크 묶음이 달라지고, 분류군을 가로지르는 이동 경로가 생긴다. */}
          {habitatPeers.length > 0 && (
            <section className="mb-6">
              <h2 className="text-xl font-bold mb-4">{heads.habitatPeers}</h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {habitatPeers.map((r) => (
                  <Link key={r.no} href={`/animal/${r.no}`} className="group block" title={`${r.animal_name} 알아보기`}>
                    <div className="rounded-xl overflow-hidden relative w-full bg-stone-100 dark:bg-zinc-900" style={{ aspectRatio: "1 / 1" }}>
                      {r.image_path && <Image src={r.image_path} alt={`${r.animal_name} 이미지`} fill sizes="140px" style={{ objectFit: "cover" }} className="group-hover:scale-105 transition-transform" />}
                    </div>
                    <div className="text-[13px] font-semibold mt-1.5 text-center truncate group-hover:text-orange-500">{r.animal_name}</div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <nav className="flex items-center justify-between mt-10 pt-6 border-t border-stone-200 dark:border-stone-800 text-sm">
            {prev ? <Link href={`/animal/${prev.no}`} className="hover:underline">← {prev.animal_name}</Link> : <span />}
            <Link href="/animal" className="font-semibold text-orange-500 hover:underline">몽글로 : 동물도감 전체 보기</Link>
            {next ? <Link href={`/animal/${next.no}`} className="hover:underline">{next.animal_name} →</Link> : <span />}
          </nav>
        </article>
      </main>
    </>
  );
}
