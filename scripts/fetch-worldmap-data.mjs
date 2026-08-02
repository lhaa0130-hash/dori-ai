// 월드맵 데이터 수집기 — **빌드 시점이 아니라 수동 실행**으로 공개 API를 받아 정적 JSON 으로 굽는다.
//
// 왜 이렇게 하나:
//   · 사이트는 output:'export' 정적 배포다. 런타임에 외부 API 를 부르면 느리고 CORS·장애에 취약하다.
//   · JSON 으로 구워두면 로딩이 즉시고, 오프라인에서도 뜨고, 출처·기준연도를 고정해 신뢰도를 밝힐 수 있다.
//   · 갱신은 이 스크립트를 다시 돌리기만 하면 된다(연 1회면 충분).
//
// 출처(전부 무료·키 없음)
//   · world-countries (npm, CDN 정적 파일) — 이름/한글명/수도/지역/면적/통화/언어/시간대/국경  (ODbL)
//     ⚠️ REST Countries v3.1 은 2026 기준 **폐기**되어 오류 객체를 돌려준다. 그 API 의 원본
//        데이터셋이 이 패키지이므로 CDN 정적 파일을 직접 받는 편이 더 안정적이다.
//   · World Bank Indicators API — GDP(NY.GDP.MKTP.CD), 1인당 GDP(NY.GDP.PCAP.CD)  (CC BY 4.0)
//   · world-atlas (Natural Earth 기반 TopoJSON) — 국가 경계 지오메트리  (public domain)
//
// ⚠️ 지도자·종교처럼 자주 바뀌거나 기준이 갈리는 항목은 **1차 범위에서 제외**한다(오해 소지).
//
// 사용: node scripts/fetch-worldmap-data.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const OUT_DIR = path.join(fileURLToPath(new URL("../public/worldmap/", import.meta.url)));
const UA = { "User-Agent": "illo.im-worldmap/1.0 (data build script)" };

async function getJson(url, label) {
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`${label} → HTTP ${res.status}`);
  return res.json();
}

/** World Bank 지표를 최신 유효 연도 기준으로 { iso3: {value, year} } 로 만든다. */
async function worldBankIndicator(code, label) {
  const out = {};
  // ⚠️ per_page=20000 은 page 파라미터와 함께 쓰면 400 이 난다(실측). 5000 으로 페이지네이션한다.
  for (let page = 1; page <= 6; page++) {
    const url = `https://api.worldbank.org/v2/country/all/indicator/${code}?format=json&per_page=5000&date=2016:2024&page=${page}`;
    const j = await getJson(url, `${label} p${page}`);
    const meta = j[0], rows = j[1] || [];
    for (const r of rows) {
      if (r?.value == null) continue;
      const iso3 = r.countryiso3code;
      if (!iso3 || iso3.length !== 3) continue;          // 집계 그룹(EUU, WLD 등) 제외
      const year = Number(r.date);
      const cur = out[iso3];
      if (!cur || year > cur.year) out[iso3] = { value: Number(r.value), year };
    }
    if (!meta || page >= Number(meta.pages || 1)) break;
  }
  console.log(`  ${label}: ${Object.keys(out).length}개국`);
  return out;
}

/** ISO2 → 국기 이모지(지역 표시 기호 2자). 'KR' → 🇰🇷 */
function flagEmoji(iso2) {
  if (typeof iso2 !== "string" || iso2.length !== 2) return "";
  return String.fromCodePoint(...[...iso2.toUpperCase()].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65));
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  console.log("월드맵 데이터 수집 시작\n");

  // ── 1. 국가 기본 정보 ──────────────────────────────────────────────
  const raw = await getJson("https://cdn.jsdelivr.net/npm/world-countries@5.1.0/countries.json", "world-countries");
  console.log(`  world-countries: ${raw.length}개국`);

  // ── 2. 경제 지표 ───────────────────────────────────────────────────
  const gdp = await worldBankIndicator("NY.GDP.MKTP.CD", "GDP(명목·USD)");
  const gdpPc = await worldBankIndicator("NY.GDP.PCAP.CD", "1인당 GDP(USD)");
  const pop = await worldBankIndicator("SP.POP.TOTL", "인구");

  // ── 3. 합치기 ──────────────────────────────────────────────────────
  const countries = [];
  for (const c of raw) {
    const iso3 = c.cca3;
    if (!iso3) continue;
    const ko = c.translations?.kor?.common || c.name?.common || iso3;
    const currency = c.currencies ? Object.entries(c.currencies)[0] : null;
    countries.push({
      iso2: c.cca2 ?? "",
      iso3,
      // ⚠️ 지도 지오메트리(world-atlas)는 숫자 ISO 코드(ccn3)로 매칭한다.
      ccn3: c.ccn3 ?? "",
      nameKo: ko,
      nameEn: c.name?.common ?? iso3,
      official: c.name?.official ?? "",
      capital: c.capital?.[0] ?? "",
      region: c.region ?? "",
      subregion: c.subregion ?? "",
      area: typeof c.area === "number" ? c.area : null,               // km²
      population: pop[iso3]?.value ?? null,
      populationYear: pop[iso3]?.year ?? null,
      gdp: gdp[iso3]?.value ?? null,                                  // USD
      gdpYear: gdp[iso3]?.year ?? null,
      gdpPerCapita: gdpPc[iso3]?.value ?? null,                       // USD
      gdpPerCapitaYear: gdpPc[iso3]?.year ?? null,
      currencyCode: currency?.[0] ?? "",
      currencyName: currency?.[1]?.name ?? "",
      languages: c.languages ? Object.values(c.languages).slice(0, 4) : [],
      // ⚠️ world-countries 에는 timezones 가 없다(250/250 전부 빈 값이었다).
      //    가짜 값을 만들지 않고, 실제로 존재하고 쓸모 있는 필드로 대체한다.
      callingCode: c.idd?.root ? `${c.idd.root}${(c.idd.suffixes ?? [])[0] ?? ""}` : "",
      tld: Array.isArray(c.tld) ? c.tld[0] ?? "" : "",
      landlocked: c.landlocked === true,
      // 국기 이모지는 ISO2 두 글자를 지역 표시 기호로 바꾸면 계산된다(데이터 의존 없음).
      flag: flagEmoji(c.cca2),
      borders: Array.isArray(c.borders) ? c.borders : [],
      latlng: Array.isArray(c.latlng) ? c.latlng : null,
      unMember: c.unMember === true,
      independent: c.independent === true,
    });
  }
  countries.sort((a, b) => a.nameKo.localeCompare(b.nameKo, "ko"));

  const withGdp = countries.filter((c) => c.gdp != null).length;
  const withPc = countries.filter((c) => c.gdpPerCapita != null).length;
  console.log(`\n  합계 ${countries.length}개국 · GDP 있음 ${withGdp} · 1인당 GDP 있음 ${withPc}`);

  const meta = {
    generatedAt: new Date().toISOString().slice(0, 10),
    sources: [
      { name: "world-countries", url: "https://github.com/mledoze/countries", license: "ODbL 1.0", fields: "이름·한글명·수도·지역·면적·통화·언어·국제전화·최상위도메인·내륙국·국경" },
      { name: "World Bank Indicators API", url: "https://data.worldbank.org", license: "CC BY 4.0", fields: "GDP(NY.GDP.MKTP.CD)·1인당 GDP(NY.GDP.PCAP.CD)·인구(SP.POP.TOTL)" },
      { name: "world-atlas / Natural Earth", url: "https://github.com/topojson/world-atlas", license: "Public Domain", fields: "국가 경계" },
    ],
    counts: { countries: countries.length, withGdp, withGdpPerCapita: withPc },
  };
  writeFileSync(path.join(OUT_DIR, "countries.json"), JSON.stringify({ meta, countries }));
  console.log(`  → public/worldmap/countries.json`);

  // ── 4. 국가 경계(TopoJSON) ─────────────────────────────────────────
  // 110m 해상도면 웹 지도에 충분하고 파일이 작다(약 100KB).
  const topo = await getJson("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json", "world-atlas");
  writeFileSync(path.join(OUT_DIR, "countries-110m.json"), JSON.stringify(topo));
  const geoCount = topo?.objects?.countries?.geometries?.length ?? 0;
  console.log(`  → public/worldmap/countries-110m.json (지오메트리 ${geoCount}개)`);

  // ── 5. 매칭 점검 — 지도에 있는데 정보가 없는 나라를 미리 잡는다 ────
  const byCcn3 = new Map(countries.filter((c) => c.ccn3).map((c) => [String(Number(c.ccn3)), c]));
  const geoms = topo?.objects?.countries?.geometries ?? [];
  const unmatched = geoms.filter((g) => !byCcn3.has(String(Number(g.id))));
  console.log(`\n  지오메트리 ↔ 국가정보 매칭: ${geoms.length - unmatched.length}/${geoms.length}`);
  if (unmatched.length) {
    console.log(`  ⚠️ 정보 없는 지오메트리 ${unmatched.length}개: ${unmatched.map((g) => g.properties?.name || g.id).slice(0, 12).join(", ")}`);
  }
  console.log("\n완료");
}

main().catch((e) => { console.error("실패:", e?.message || e); process.exit(1); });
