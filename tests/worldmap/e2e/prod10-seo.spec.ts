// 프로덕션 SEO smoke (지시서 10 §16.5).
//
// ⚠️ 브라우저 렌더 후가 아니라 **응답 HTML 그 자체**를 본다. crawler 가 처음 받는
//    바이트에 제목·본문·링크가 없으면 hydration 후에 생겨도 소용이 없다.

import { test, expect, request as pwRequest } from "@playwright/test";

const BASE = "https://illo.im";

const PAGES = [
  { path: "/world-map/countries", h1: "195개국" },
  { path: "/world-map/countries/south-korea", h1: "대한민국" },
  { path: "/world-map/countries/tonga", h1: "통가" },
  { path: "/world-map/continents/asia", h1: "아시아" },
  { path: "/world-map/rankings/area", h1: null },
  { path: "/world-map/curiosities/island-countries", h1: "섬나라" },
  { path: "/en/world-map/countries/south-korea", h1: "South Korea" },
];

test("응답 HTML 에 고유 제목·본문·내부 링크가 있다", async () => {
  const ctx = await pwRequest.newContext();
  const titles = new Set<string>();

  for (const p of PAGES) {
    const res = await ctx.get(`${BASE}${p.path}`);
    expect(res.status(), `${p.path} 가 200 이 아니다`).toBe(200);
    const html = await res.text();

    const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "";
    expect(title.length, `${p.path} title 없음`).toBeGreaterThan(10);
    expect(titles.has(title), `${p.path} title 이 다른 페이지와 중복`).toBe(false);
    titles.add(title);

    expect(html, `${p.path} meta description 없음`).toMatch(/<meta name="description"/i);

    const h1Count = (html.match(/<h1[\s>]/g) ?? []).length;
    expect(h1Count, `${p.path} H1 이 ${h1Count}개`).toBe(1);
    if (p.h1) {
      const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1].replace(/<[^>]*>/g, "") ?? "";
      expect(h1, `${p.path} H1 내용`).toContain(p.h1);
    }

    // self canonical
    const canonical = html.match(/<link rel="canonical" href="([^"]*)"/i)?.[1];
    expect(canonical, `${p.path} canonical 불일치`).toBe(`${BASE}${p.path}`);

    // KO/EN 상호 지정 — 속성 이름은 대소문자를 구분하지 않는다
    const hreflangs = (html.match(/rel="alternate" hreflang=/gi) ?? []).length;
    expect(hreflangs, `${p.path} hreflang ${hreflangs}개`).toBeGreaterThanOrEqual(2);

    // 내부 링크가 실제 <a href> 로 있어야 한다
    const links = new Set([...html.matchAll(/href="(\/[^"#?][^"]*)"/g)].map((m) => m[1]));
    expect(links.size, `${p.path} 내부 링크 ${links.size}개`).toBeGreaterThanOrEqual(10);

    // JSON-LD 가 파싱되어야 한다
    for (const m of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
      expect(() => JSON.parse(m[1]), `${p.path} JSON-LD 파싱 실패`).not.toThrow();
    }
  }
  await ctx.dispose();
});

test("국가 페이지가 실제 질문에 답한다", async () => {
  const ctx = await pwRequest.newContext();
  const html = await (await ctx.get(`${BASE}/world-map/countries/south-korea`)).text();
  const text = html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");

  expect(text, "수도가 본문에 없다").toContain("서울");
  expect(text, "대륙이 본문에 없다").toContain("아시아");
  expect(text, "이웃 나라 문장이 없다").toContain("조선민주주의인민공화국");
  expect(text, "출처가 없다").toContain("World Bank");
  expect(text, "조사 오류").not.toMatch(/북한와|인구은|인구이 /);
  expect(text, "자리표시자 잔존").not.toMatch(/자료 준비 중|TODO|placeholder/i);

  await ctx.dispose();
});

test("sitemap 에 국가·랭킹 URL 이 들어 있고 쿼리 URL 은 없다", async () => {
  const ctx = await pwRequest.newContext();
  const xml = await (await ctx.get(`${BASE}/sitemap.xml`)).text();

  expect(xml).toContain("/world-map/countries/south-korea");
  expect(xml).toContain("/world-map/rankings/area");
  expect(xml).toContain("/world-map/curiosities/island-countries");
  // 쿼리 URL 은 사용자 조작 상태이지 별도 문서가 아니다
  expect(xml, "쿼리 URL 이 sitemap 에 들어갔다").not.toContain("?country=");
  expect(xml, "비교 URL 이 sitemap 에 들어갔다").not.toContain("mode=compare");

  // 1차 공개 30개국만 — 색인 보류 국가가 들어가면 안 된다
  expect(xml, "색인 보류 국가가 sitemap 에 있다").not.toContain("/world-map/countries/afghanistan");

  await ctx.dispose();
});

test("색인 보류 국가는 noindex 지만 페이지는 살아 있다", async () => {
  const ctx = await pwRequest.newContext();
  const res = await ctx.get(`${BASE}/world-map/countries/afghanistan`);
  expect(res.status()).toBe(200);
  const html = await res.text();
  expect(html, "noindex 가 없다").toMatch(/<meta name="robots" content="[^"]*noindex/i);
  // follow 는 남겨야 내부 링크를 따라간다
  expect(html).toMatch(/<meta name="robots" content="[^"]*follow/i);
  await ctx.dispose();
});

test("기존 공유 링크가 계속 작동한다", async () => {
  const ctx = await pwRequest.newContext();
  const res = await ctx.get(`${BASE}/world-map?country=KOR`);
  expect(res.status(), "기존 쿼리 링크가 깨졌다").toBe(200);
  await ctx.dispose();
});
