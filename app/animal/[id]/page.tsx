import { createMetadata } from "@/lib/seo";
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
  if (!card) return createMetadata({ title: "동물 백과 — 몽글로 동물도감", description: "동물 백과사전 몽글로 동물도감", path: `/animal/${params.id}` });
  const name = card.animal_name;
  const en = card.en ? ` (${card.en})` : "";
  const desc = (card.kid_friendly_desc || `${name}의 특징, 서식지, 먹이, 수명 등 정보를 알아보세요.`).replace(/\s+/g, " ").slice(0, 155);
  return createMetadata({
    title: `${name}${en} — 특징·서식지·먹이·수명`,
    description: desc,
    path: `/animal/${card.no}`,
    image: card.image_path ? `${SITE_URL}${card.image_path}` : undefined,
    keywords: [name, `${name} 특징`, `${name} 수명`, `${name} 서식지`, `${name} 먹이`, card.en, card.sci, "동물 백과", "몽글로", "몽글로 동물도감"].filter(Boolean) as string[],
  });
}

export default function AnimalDetail({ params }: { params: { id: string } }) {
  const cards = loadCards();
  const idx = cards.findIndex((c) => c.no === params.id || c.no === String(params.id).padStart(4, "0"));
  const card = idx >= 0 ? cards[idx] : null;
  if (!card) return notFound();

  const prev = idx > 0 ? cards[idx - 1] : null;
  const next = idx < cards.length - 1 ? cards[idx + 1] : null;
  const info = Array.isArray(card.info) ? card.info : [];
  const facts = Array.isArray(card.facts) ? card.facts : [];
  const features = Array.isArray(card.key_feature) ? card.key_feature : [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${card.animal_name} — 특징·서식지·먹이·수명`,
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
      { "@type": "ListItem", position: 2, name: "몽글로 동물도감", item: `${SITE_URL}/animal` },
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
            <Link href="/animal" className="hover:underline">몽글로 동물도감</Link> › <span>{card.animal_name}</span>
          </nav>

          <h1 className="text-3xl md:text-4xl font-extrabold mb-1">{card.animal_name}</h1>
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
                  <tr key={i} className="border-b border-neutral-200 dark:border-neutral-800">
                    <th className="py-2 pr-4 font-semibold whitespace-nowrap align-top">{row[0]} {row[1]}</th>
                    <td className="py-2">{row[2]}</td>
                  </tr>
                ))}
                {card.taxonomy && (
                  <tr className="border-b border-neutral-200 dark:border-neutral-800">
                    <th className="py-2 pr-4 font-semibold whitespace-nowrap align-top">🗂️ 분류</th>
                    <td className="py-2">{card.taxonomy}</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {features.length > 0 && (
            <section className="mb-6">
              <h2 className="text-xl font-bold mb-2">✨ 핵심 특징</h2>
              <ul className="list-disc pl-5 space-y-1">{features.map((f, i) => <li key={i}>{f}</li>)}</ul>
            </section>
          )}

          {facts.length > 0 && (
            <section className="mb-6">
              <h2 className="text-xl font-bold mb-2">🔎 재미있는 사실</h2>
              <ul className="list-disc pl-5 space-y-1">{facts.map((f, i) => <li key={i}>{f}</li>)}</ul>
            </section>
          )}

          {card.subspecies && (
            <section className="mb-6">
              <h2 className="text-xl font-bold mb-2">🧬 아종</h2>
              <p>{card.subspecies}</p>
            </section>
          )}

          <nav className="flex items-center justify-between mt-10 pt-6 border-t border-neutral-200 dark:border-neutral-800 text-sm">
            {prev ? <Link href={`/animal/${prev.no}`} className="hover:underline">← {prev.animal_name}</Link> : <span />}
            <Link href="/animal" className="font-semibold text-orange-500 hover:underline">몽글로 동물도감 전체 보기</Link>
            {next ? <Link href={`/animal/${next.no}`} className="hover:underline">{next.animal_name} →</Link> : <span />}
          </nav>
        </article>
      </main>
    </>
  );
}
