// app/sitemap.ts
import type { MetadataRoute } from "next";
import { getAllTrends } from "@/lib/trends";
import { getAllCurations } from "@/lib/curation";
import { getAllAnalyses } from "@/lib/analysis";
import { getAllReports } from "@/lib/reports";
import { getAllStudios } from "@/lib/studio";
import { getAllMarketPosts } from "@/lib/market-posts";
import { getAllGuides } from "@/lib/guides";
import { loadCountryDataset } from "@/lib/worldmap/server";
import {
  buildCountryRoutes, countryPath, countriesIndexPath, continentPath, rankingPath,
  curiosityPath, metricSlug, CONTINENT_SLUG, CURIOSITY_SLUG,
} from "@/lib/worldmap/seoRoutes";
import { RANKING_METRICS } from "@/lib/worldmap/ranking";
import { CURIOSITY_COLLECTIONS } from "@/lib/worldmap/curiosity";
import fs from "fs";
import path from "path";
import { SHOW_ANIMAL, SHOW_WORLDMAP, SHOW_VIDEO, SHOW_COMMUNITY, SHOW_PROJECTS } from "@/lib/publicFlags";

export const dynamic = "force-static";

const baseUrl = "https://illo.im";

function getAnimalNos(): string[] {
  try {
    const p = path.join(process.cwd(), "data", "animal-cards.json");
    const data = JSON.parse(fs.readFileSync(p, "utf8"));
    return (Array.isArray(data) ? data : []).map((c: any) => c?.no).filter(Boolean);
  } catch {
    return [];
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // 1) 핵심 정적 페이지 (크롤 가치 높은 페이지만)
  const staticPagesAll: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`,          lastModified: now, changeFrequency: "daily",   priority: 1.0 },
    // ⚠️ 사업 대표 페이지. 앱 본체(/ai-assistant, /ai-assistant/control-tower)는 로그인·관리자
    //    게이트라 noindex다 — 사이트맵에 넣으면 '제출된 URL에 noindex 태그' 오류가 난다.
    //    크롤러에 내보내는 건 공개 소개 페이지인 이 URL 하나뿐이다.
    { url: `${baseUrl}/ai-assistant/intro`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/en`,        lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${baseUrl}/insight`,   lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${baseUrl}/en/insight`, lastModified: now, changeFrequency: "daily",  priority: 0.8 },
    { url: `${baseUrl}/en/ai-news`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/en/projects`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/en/minigame`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/en/animal`,  lastModified: now, changeFrequency: "daily",  priority: 0.8 },
    { url: `${baseUrl}/en/psychtest`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/en/faq`,     lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/en/notice`,  lastModified: now, changeFrequency: "weekly", priority: 0.4 },
    { url: `${baseUrl}/ai-tools`,  lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${baseUrl}/en/ai-tools`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/ai-models`, lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${baseUrl}/en/ai-models`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/ai-news`,   lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${baseUrl}/video`,     lastModified: now, changeFrequency: "daily",   priority: 0.8 },
    { url: `${baseUrl}/psychtest`, lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${baseUrl}/community`, lastModified: now, changeFrequency: "daily",   priority: 0.8 },
    { url: `${baseUrl}/market`,    lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${baseUrl}/animal`,    lastModified: now, changeFrequency: "daily",   priority: 0.8 },
    // 영어판 페이지(hreflang 상호연결)
    // ⚠️ /en/psychtest·/en/animal·/en/faq·/en/notice 는 위쪽 블록에 이미 있다. 여기 또 적으면
    //    사이트맵에 같은 URL 이 두 번 실린다(2026-08-08 실측 3건 발견). 추가 전 위를 먼저 확인할 것.
    { url: `${baseUrl}/en/legal/about`, lastModified: now, changeFrequency: "weekly", priority: 0.4 },
    { url: `${baseUrl}/en/legal/privacy`, lastModified: now, changeFrequency: "weekly", priority: 0.4 },
    { url: `${baseUrl}/en/legal/terms`, lastModified: now, changeFrequency: "weekly", priority: 0.4 },
    { url: `${baseUrl}/en/legal/contact`, lastModified: now, changeFrequency: "weekly", priority: 0.4 },
    { url: `${baseUrl}/en/legal/copyright`, lastModified: now, changeFrequency: "weekly", priority: 0.4 },
    { url: `${baseUrl}/en/legal/business`, lastModified: now, changeFrequency: "weekly", priority: 0.4 },
    { url: `${baseUrl}/en/legal/youth`, lastModified: now, changeFrequency: "weekly", priority: 0.4 },
    { url: `${baseUrl}/minigame`,                     changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/world-map`,                    changeFrequency: "weekly",  priority: 0.8 },
    { url: `${baseUrl}/en/world-map`,                 changeFrequency: "weekly",  priority: 0.7 },
    { url: `${baseUrl}/projects`,                      changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/faq`,                          changeFrequency: "monthly", priority: 0.4 },
    // ⚠️ /help 는 robots.ts 에서 차단 중이라 사이트맵에 넣으면 안 된다("차단됐는데 제출됨" 모순 신호).
    //    다시 넣으려면 robots.ts 의 disallow 에서 먼저 빼라.
    { url: `${baseUrl}/legal/about`,                  changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/legal/contact`,                changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/legal/privacy`,                changeFrequency: "monthly", priority: 0.2 },
    { url: `${baseUrl}/legal/terms`,                  changeFrequency: "monthly", priority: 0.2 },
  ];
  // 비공개 섹션 제외 (배열 리터럴에 직접 .filter 를 붙이면 changeFrequency 가 string 으로
  // 넓어져 타입이 깨지므로 반드시 분리해서 거른다)
  //  - /animal·/en/animal          : 2026-08-04 비공개
  //  - /world-map·/en/world-map    : 2026-08-10 비공개
  //  - /video                      : 2026-08-10 비공개(큐레이션 삭제 후 항상 0건)
  //  - /community                  : 2026-08-10 제출 중단(DB 없는 스텁, 라우트는 유지)
  //  - /projects·/en/projects      : 2026-08-10 제출 중단('운영 중 0개' 상태, 라우트는 유지)
  // ⚠️ `$` 앵커를 쓰므로 한 줄로 ko·en 이 함께 걸린다. 라우트가 없는데 사이트맵에 남기면
  //    Search Console 이 '제출된 URL 을 찾을 수 없음(404)' 으로 잡는다.
  const staticPages: MetadataRoute.Sitemap = staticPagesAll.filter(
    (p) =>
      (SHOW_ANIMAL || !/\/animal$/.test(p.url)) &&
      (SHOW_WORLDMAP || !/\/world-map$/.test(p.url)) &&
      (SHOW_VIDEO || !/\/video$/.test(p.url)) &&
      (SHOW_COMMUNITY || !/\/community$/.test(p.url)) &&
      (SHOW_PROJECTS || !/\/projects$/.test(p.url))
  );

  // 2) 아티클 페이지 수집 헬퍼 — 언어별 경로 분리(한글=/insight/article, 영어=/en/insight/article)
  type Post = { slug: string; date?: string; lang?: string; category?: string };
  const collect = (
    posts: Post[],
    priority: number
  ): MetadataRoute.Sitemap =>
    // 영어 영상 글은 /en에서 노출하지 않는 방침이라 사이트맵에서도 제외
    posts.filter((p) => !(p.lang === "en" && p.category === "영상")).map((p) => ({
      url: `${baseUrl}${p.lang === "en" ? "/en/insight/article/" : "/insight/article/"}${p.slug}`,
      lastModified: p.date ? new Date(p.date) : now,
      changeFrequency: "monthly" as const, // 발행 후 자주 바뀌지 않음
      priority,
    }));

  let articleUrls: MetadataRoute.Sitemap = [];
  try {
    articleUrls = [
      // ⚠️ 트렌드 색인 경계: 구버전(≤189번)은 사실 근거가 약해 사이트맵 제외(기사 페이지
      //    robots noindex와 짝). 190번부터는 사실 근거 규칙으로 생성된 새 기사라 포함.
      ...collect(getAllTrends().filter((t) => {
        const n = parseInt(String(t.slug).slice(6), 10);
        return Number.isFinite(n) && n >= 190;
      }), 0.8),
      ...collect(getAllCurations(), 0.7),
      ...collect(getAllAnalyses().filter((a) => !(a as { noindex?: boolean }).noindex),  0.7),
      ...collect(getAllReports(),   0.7),
      ...collect(getAllStudios(),   0.8),
      ...collect(getAllMarketPosts(), 0.8),
      ...collect(getAllGuides(),    0.8),
    ];
  } catch (e) {
    console.warn("[sitemap] failed to collect articles:", e);
  }

  // 3) 나라콕 — 국가·대륙·랭킹·호기심 (지시서 10 §9.1)
  //
  // ⚠️ `?country=KOR` 같은 쿼리 URL 은 넣지 않는다. 그건 사용자 조작 상태이지
  //    별도 문서가 아니다. 넣으면 같은 내용이 여러 주소로 색인된다.
  // ⚠️ lastmod 는 데이터 스냅샷 생성일이다. 배포할 때마다 오늘로 갱신하지 않는다.
  // ⚠️ 2026-08-10 비공개(lib/publicFlags.ts SHOW_WORLDMAP). 라우트를 app/_world-map 으로 내렸으므로
  //    여기 남기면 '제출된 URL 을 찾을 수 없음(404)' 이 456건 발생한다. 되살릴 때는 품질 gate 를
  //    통과한 소수만 다시 넣어라 — 예전엔 사이트맵 130개 + noindex 328개 구조였고, 그 noindex 가
  //    심사에 아무 효과가 없다는 게 2차 거절의 교훈이었다.
  const worldMapUrls: MetadataRoute.Sitemap = !SHOW_WORLDMAP ? [] : (() => {
    try {
      const { countries, generatedAt } = loadCountryDataset();
      const dataDate = new Date(generatedAt);
      const routes = buildCountryRoutes(countries);
      const out: MetadataRoute.Sitemap = [
        { url: `${baseUrl}${countriesIndexPath("ko")}`, lastModified: dataDate, changeFrequency: "monthly", priority: 0.7 },
        { url: `${baseUrl}${countriesIndexPath("en")}`, lastModified: dataDate, changeFrequency: "monthly", priority: 0.6 },
      ];
      // 품질 gate 를 통과한 나라만 넣는다(§4.3). 나머지는 페이지는 있어도 색인 대상이 아니다.
      for (const r of routes) {
        if (r.indexableKo) out.push({ url: `${baseUrl}${countryPath("ko", r.slug)}`, lastModified: dataDate, changeFrequency: "monthly", priority: 0.8 });
        if (r.indexableEn) out.push({ url: `${baseUrl}${countryPath("en", r.slug)}`, lastModified: dataDate, changeFrequency: "monthly", priority: 0.6 });
      }
      for (const slug of Object.values(CONTINENT_SLUG)) {
        out.push({ url: `${baseUrl}${continentPath("ko", slug)}`, lastModified: dataDate, changeFrequency: "monthly", priority: 0.7 });
        out.push({ url: `${baseUrl}${continentPath("en", slug)}`, lastModified: dataDate, changeFrequency: "monthly", priority: 0.5 });
      }
      for (const m of RANKING_METRICS) {
        const slug = metricSlug(m.metricId);
        out.push({ url: `${baseUrl}${rankingPath("ko", slug)}`, lastModified: dataDate, changeFrequency: "monthly", priority: 0.7 });
        out.push({ url: `${baseUrl}${rankingPath("en", slug)}`, lastModified: dataDate, changeFrequency: "monthly", priority: 0.5 });
      }
      for (const col of CURIOSITY_COLLECTIONS) {
        const slug = CURIOSITY_SLUG[col.id];
        out.push({ url: `${baseUrl}${curiosityPath("ko", slug)}`, lastModified: dataDate, changeFrequency: "monthly", priority: 0.6 });
        out.push({ url: `${baseUrl}${curiosityPath("en", slug)}`, lastModified: dataDate, changeFrequency: "monthly", priority: 0.4 });
      }
      return out;
    } catch (e) {
      console.warn("[sitemap] worldmap routes failed:", e);
      return [];
    }
  })();

  // 4) 동물 상세 페이지 — 애드센스 심사 대비로 비공개 전환(lib/publicFlags.ts). 라우트가 없으므로
  //    사이트맵에 남기면 '제출된 URL을 찾을 수 없음(404)' 오류가 1205건 발생한다.
  const animalUrls: MetadataRoute.Sitemap = SHOW_ANIMAL
    ? getAnimalNos().map((no) => ({
        url: `${baseUrl}/animal/${no}`,
        lastModified: now,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      }))
    : [];

  // 5) 최종 중복 제거 — 같은 URL 이 두 번 실리면 Search Console 이 "중복 페이지"로 잡는다.
  //    위 목록들이 서로 겹칠 수 있으므로(수기 관리 블록 + 자동 수집), 내보내기 직전에 한 번 거른다.
  //    먼저 나온 항목을 남긴다.
  const all = [...staticPages, ...worldMapUrls, ...articleUrls, ...animalUrls];
  const seen = new Set<string>();
  return all.filter((entry) => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
}
