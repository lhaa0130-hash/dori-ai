// 나라콕 SEO route manifest + 감사 (지시서 10 §16.1 · §16.2).
//
//   npm run audit:worldmap:seo
//
// 빌드 산출물(out/)의 실제 HTML 을 읽는다. 코드를 보고 "있을 것이다" 라고 판단하지 않는다.
// 정적 export 라 out/ 에 있는 파일이 곧 사용자와 crawler 가 받는 바이트다.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = join(ROOT, "out");
const REPORT = join(ROOT, "reports", "worldmap-seo-audit.md");

if (!existsSync(OUT)) {
  console.error("out/ 이 없다. 먼저 npm run build 를 실행해야 실제 HTML 을 검사할 수 있다.");
  process.exit(1);
}

/** 정적 export 는 /a/b 를 out/a/b.html 또는 out/a/b/index.html 로 낸다. */
function htmlFor(urlPath) {
  const rel = urlPath.replace(/^\//, "");
  for (const cand of [join(OUT, `${rel}.html`), join(OUT, rel, "index.html")]) {
    if (existsSync(cand)) return readFileSync(cand, "utf8");
  }
  return null;
}

const pick = (html, re) => { const m = html.match(re); return m ? m[1] : null; };
// HTML 속성 이름은 대소문자 구분이 없다. 검사기가 구분하면 멀쩡한 페이지가 전부 실패한다.
const countAll = (html, re) => (html.match(re) ?? []).length;

function inspect(url) {
  const html = htmlFor(url);
  if (html == null) return { url, status: 404, problems: ["HTML 파일 없음"] };

  const problems = [];
  const title = pick(html, /<title>([^<]*)<\/title>/);
  const desc = pick(html, /<meta name="description" content="([^"]*)"/i);
  const canonical = pick(html, /<link rel="canonical" href="([^"]*)"/i);
  const h1s = countAll(html, /<h1[\s>]/g);
  const h1 = pick(html, /<h1[^>]*>([\s\S]*?)<\/h1>/)?.replace(/<[^>]*>/g, "").trim() ?? null;
  const robots = pick(html, /<meta name="robots" content="([^"]*)"/i) ?? "index, follow";
  const hreflang = countAll(html, /rel="alternate" hreflang=/gi);
  const jsonLd = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
    .map((m) => m[1]);

  // 본문 링크 — Next 는 <a href> 로 낸다. 외부·앵커는 빼고 내부 링크만 센다.
  const internalLinks = new Set(
    [...html.matchAll(/href="(\/[^"#?][^"]*)"/g)].map((m) => m[1]),
  );

  // 지도 canvas 를 뺀 실제 글자 수 — "지도 안에만 있는 정보는 본문이 아니다"(§0.5)
  const bodyText = html
    .replace(/<script[\s\S]*?<\/script>/g, "")
    .replace(/<style[\s\S]*?<\/style>/g, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!title) problems.push("title 없음");
  if (!desc) problems.push("meta description 없음");
  if (h1s !== 1) problems.push(`H1 이 ${h1s}개 (정확히 1개여야 함)`);
  if (!canonical) problems.push("canonical 없음");
  else if (!canonical.startsWith("https://illo.im")) problems.push(`canonical 이 절대 HTTPS 가 아님: ${canonical}`);
  if (hreflang < 2) problems.push(`hreflang 이 ${hreflang}개 (KO/EN 상호 지정 필요)`);
  if (bodyText.length < 400) problems.push(`본문이 ${bodyText.length}자로 너무 짧음`);
  if (internalLinks.size < 5) problems.push(`내부 링크 ${internalLinks.size}개`);
  for (const raw of jsonLd) {
    try { JSON.parse(raw); } catch { problems.push("JSON-LD 파싱 실패"); }
  }
  if (/localhost|127\.0\.0\.1|staging/.test(html.slice(0, 4000))) problems.push("head 에 localhost/staging URL");

  return {
    url, status: 200, title, desc, canonical, h1, robots,
    hreflang, jsonLd: jsonLd.length, links: internalLinks.size,
    bodyChars: bodyText.length, problems,
  };
}

// ── 검사 대상 만들기 ──────────────────────────────────────────────
const dataset = JSON.parse(readFileSync(join(ROOT, "public/worldmap/countries.json"), "utf8"));
const { buildCountryRoutes, countryPath, countriesIndexPath, continentPath, rankingPath, curiosityPath, metricSlug, CONTINENT_SLUG, CURIOSITY_SLUG } =
  await import("../../lib/worldmap/seoRoutes.ts");
const { RANKING_METRICS } = await import("../../lib/worldmap/ranking.ts");
const { CURIOSITY_COLLECTIONS } = await import("../../lib/worldmap/curiosity.ts");

const routes = buildCountryRoutes(dataset.countries);
const targets = [
  "/world-map", "/en/world-map",
  countriesIndexPath("ko"), countriesIndexPath("en"),
  ...routes.filter((r) => r.indexableKo).flatMap((r) => [countryPath("ko", r.slug), countryPath("en", r.slug)]),
  ...Object.values(CONTINENT_SLUG).flatMap((s) => [continentPath("ko", s), continentPath("en", s)]),
  ...RANKING_METRICS.flatMap((m) => [rankingPath("ko", metricSlug(m.metricId)), rankingPath("en", metricSlug(m.metricId))]),
  ...CURIOSITY_COLLECTIONS.flatMap((c) => [curiosityPath("ko", CURIOSITY_SLUG[c.id]), curiosityPath("en", CURIOSITY_SLUG[c.id])]),
];

const rows = targets.map(inspect);

// ── 중복 검사 — 같은 title/description 이 여러 페이지에 있으면 개별 문서가 아니다 ──
const byTitle = new Map();
const byDesc = new Map();
for (const r of rows) {
  if (r.title) (byTitle.get(r.title) ?? byTitle.set(r.title, []).get(r.title)).push(r.url);
  if (r.desc) (byDesc.get(r.desc) ?? byDesc.set(r.desc, []).get(r.desc)).push(r.url);
}
const dupTitles = [...byTitle.entries()].filter(([, v]) => v.length > 1);
const dupDescs = [...byDesc.entries()].filter(([, v]) => v.length > 1);
for (const [, urls] of dupTitles) for (const u of urls) rows.find((r) => r.url === u)?.problems.push("title 중복");
for (const [, urls] of dupDescs) for (const u of urls) rows.find((r) => r.url === u)?.problems.push("description 중복");

// ── canonical 자기 참조 확인 ──────────────────────────────────────
for (const r of rows) {
  if (r.canonical && r.status === 200 && r.canonical !== `https://illo.im${r.url}`) {
    r.problems.push(`canonical 불일치: ${r.canonical}`);
  }
}

const fail = rows.filter((r) => r.problems.length > 0);

// ── 보고서 ────────────────────────────────────────────────────────
const L = [];
L.push("# 나라콕 — SEO route 감사");
L.push("");
L.push("`npm run audit:worldmap:seo` · **빌드 산출물 `out/` 의 실제 HTML** 을 읽어 검사한다.");
L.push("코드를 보고 판단하지 않는다 — 정적 export 라 out/ 의 바이트가 곧 crawler 가 받는 것이다.");
L.push("");
L.push("## 요약");
L.push("");
L.push(`- 검사한 URL: **${rows.length}**`);
L.push(`- 문제 없음: **${rows.length - fail.length}**`);
L.push(`- 문제 있음: **${fail.length}**`);
L.push(`- title 중복: **${dupTitles.length}**`);
L.push(`- description 중복: **${dupDescs.length}**`);
L.push(`- 내부 링크 평균: **${Math.round(rows.reduce((s, r) => s + (r.links ?? 0), 0) / rows.length)}개**`);
L.push(`- 본문 평균 길이: **${Math.round(rows.reduce((s, r) => s + (r.bodyChars ?? 0), 0) / rows.length)}자**`);
L.push("");
L.push(fail.length === 0 ? "> 모든 URL 통과." : `> ⚠️ ${fail.length}개 URL 에 문제가 있다.`);
L.push("");
L.push("## URL 별 결과");
L.push("");
L.push("| URL | status | H1 | 링크 | 본문자수 | JSON-LD | hreflang | 문제 |");
L.push("| --- | --- | --- | --- | --- | --- | --- | --- |");
for (const r of rows) {
  L.push(`| ${r.url} | ${r.status} | ${(r.h1 ?? "-").slice(0, 30)} | ${r.links ?? "-"} | ${r.bodyChars ?? "-"} | ${r.jsonLd ?? "-"} | ${r.hreflang ?? "-"} | ${r.problems.join(" / ") || "-"} |`);
}
L.push("");

mkdirSync(dirname(REPORT), { recursive: true });
writeFileSync(REPORT, L.join("\n"), "utf8");

console.log(`검사 ${rows.length} · 문제 ${fail.length} · title중복 ${dupTitles.length} · desc중복 ${dupDescs.length}`);
console.log("보고서: reports/worldmap-seo-audit.md");
process.exit(fail.length > 0 ? 1 : 0);
