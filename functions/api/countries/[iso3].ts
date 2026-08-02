// GET /api/countries/KOR?lang=ko  →  ApiEnvelope<CountryRecord>  (명세서 §11.2)
//
// 규칙: ISO 대소문자 무시 · 없는 ISO 는 404 · 미지원 언어는 ko fallback ·
//       한 출처가 비어도 기본 정보가 있으면 200 과 부분 데이터를 준다.
// 비교 전용 API 는 만들지 않는다. 상세 두 번을 조합해 쓴다(명세서 §11 규칙).

interface Env { ASSETS?: { fetch: (req: Request) => Promise<Response> } }

const CACHE = "public, max-age=300, s-maxage=3600";
const ISO3 = /^[A-Za-z]{3}$/;

async function loadDataset(request: Request, env: Env): Promise<any | null> {
  const url = new URL("/worldmap/countries.json", request.url);
  const req = new Request(url.toString(), { headers: { Accept: "application/json" } });
  const res = env.ASSETS ? await env.ASSETS.fetch(req) : await fetch(req);
  if (!res.ok) return null;
  return res.json();
}

export const onRequestGet = async (context: {
  request: Request;
  env: Env;
  params: { iso3: string };
}): Promise<Response> => {
  const { request, env, params } = context;
  const raw = String(params.iso3 ?? "");

  if (!ISO3.test(raw)) {
    return Response.json({ error: "invalid iso3" }, { status: 404, headers: { "Cache-Control": "no-store" } });
  }
  const iso3 = raw.toUpperCase();

  const dataset = await loadDataset(request, env);
  if (!dataset) {
    return Response.json(
      { data: null, generatedAt: new Date().toISOString(), stale: true, errors: [{ source: "snapshot", message: "country dataset unavailable" }] },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const record = (dataset.countries ?? []).find((c: any) => c.iso3 === iso3);
  if (!record) {
    return Response.json({ error: "country not found", iso3 }, { status: 404, headers: { "Cache-Control": CACHE } });
  }

  // 어떤 항목이 비었는지 호출자가 알 수 있게 errors 에 적는다(값을 지어내지 않는다).
  const errors: Array<{ source: string; message: string }> = [];
  for (const key of ["population", "gdp", "gdpPerCapita", "area", "leader", "established", "religion"]) {
    const field = (record as any)[key];
    if (field && field.s === "missing") errors.push({ source: key, message: "no data" });
  }

  return Response.json(
    { data: { ...record, sources: dataset.sources }, generatedAt: dataset.generatedAt, stale: dataset.stale === true, errors },
    { headers: { "Cache-Control": CACHE } },
  );
};
