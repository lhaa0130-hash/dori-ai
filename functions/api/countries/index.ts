// GET /api/countries?lang=ko  →  ApiEnvelope<CountrySummary[]>  (명세서 §11.1)
//
// 이 사이트는 정적 export 라 Next 의 API route 를 쓸 수 없다. 저장소가 이미 쓰는
// Cloudflare Pages Functions 로 같은 계약을 제공한다.
//
// 브라우저가 REST Countries·World Bank·Wikidata 를 직접 부르지 않는다(명세서 §11 마지막).
// 외부 수집은 배포 전 `npm run sync:data` 가 끝내고, 여기서는 구워진 스냅샷만 돌려준다.

interface Env { ASSETS?: { fetch: (req: Request) => Promise<Response> } }

const CACHE = "public, max-age=300, s-maxage=3600";

/** 같은 배포에 들어 있는 정적 데이터 파일을 읽는다. 함수 번들에 200KB 를 싣지 않기 위함이다. */
async function loadDataset(request: Request, env: Env): Promise<any | null> {
  const url = new URL("/worldmap/countries.json", request.url);
  const req = new Request(url.toString(), { headers: { Accept: "application/json" } });
  const res = env.ASSETS ? await env.ASSETS.fetch(req) : await fetch(req);
  if (!res.ok) return null;
  return res.json();
}

function envelope(data: unknown, generatedAt: string, stale: boolean, errors: Array<{ source: string; message: string }> = []) {
  return { data, generatedAt, stale, errors };
}

export const onRequestGet = async (context: { request: Request; env: Env }): Promise<Response> => {
  const { request, env } = context;
  const lang = new URL(request.url).searchParams.get("lang") === "en" ? "en" : "ko";  // 미지원 언어는 ko

  const dataset = await loadDataset(request, env);
  if (!dataset) {
    return Response.json(
      envelope([], new Date().toISOString(), true, [{ source: "snapshot", message: "country dataset unavailable" }]),
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const summaries = (dataset.countries ?? []).map((c: any) => ({
    iso2: c.iso2,
    iso3: c.iso3,
    nameKo: c.nameKo,
    nameEn: c.nameEn,
    officialNameEn: c.officialNameEn,
    continentCode: c.continentCode,
    center: c.center,
    bbox: c.bbox,
    flagUrl: c.flagUrl,
    // 요청한 언어로 바로 쓸 수 있는 표시명도 함께 준다
    name: lang === "ko" ? c.nameKo : c.nameEn,
  }));

  return Response.json(envelope(summaries, dataset.generatedAt, dataset.stale === true), {
    headers: { "Cache-Control": CACHE },
  });
};
