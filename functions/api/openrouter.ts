// Cloudflare Pages Function — /api/openrouter
// OpenRouter 무료 프론트 랭킹 API를 엣지에서 서버사이드로 받아(=브라우저 CORS 우회) 위젯용 JSON으로 가공해 반환.
// 5분 엣지 캐시 → Pages 재빌드 0회로 "거의 실시간" 갱신. (n8n의 hourly 커밋과 무관하게 동작; 위젯은 이걸 우선 사용하고 실패시 /openrouter-stats.json 폴백)
// 셰이프는 collect.js(=/openrouter-stats.json)와 동일: { updatedAt, total, usageTop, speedTop, priceTop, intelTop, appsTop }

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
const CACHE_TTL = 300; // 5분

async function jget(url: string): Promise<any | null> {
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, cf: { cacheTtl: 120, cacheEverything: true } as any });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

const norm = (s: any) => String(s || "").toLowerCase().split(":")[0].replace(/-\d{4}-\d{2}-\d{2}$/, "").replace(/-\d{8}$/, "").replace(/-\d{6}$/, "").replace(/-(preview|beta|exp|latest|free|instruct)$/g, "").trim();
const cleanName = (n: any) => String(n || "").toLowerCase().replace(/^[^:]+:\s*/, "").replace(/[\s\-_.]/g, "");
const priceM = (p: any) => { const v = parseFloat(p); return v > 0 ? +(v * 1e6).toFixed(2) : null; };

async function build(): Promise<any> {
  const modelsResp = await jget("https://openrouter.ai/api/v1/models");
  const allModels = (modelsResp && modelsResp.data) || [];
  const pf = ((await jget("https://openrouter.ai/api/frontend/rankings/performance")) || {}).data || [];
  const bmResp = await jget("https://openrouter.ai/api/frontend/rankings/benchmarks");
  const bmIntel = (bmResp && bmResp.data && bmResp.data.aaData && bmResp.data.aaData.intelligence) || [];
  const appsResp = await jget("https://openrouter.ai/api/frontend/rankings/apps");
  const appsRaw = (appsResp && appsResp.data && (appsResp.data.day || appsResp.data.week || appsResp.data.month)) || [];

  const byId: any = {}, byNorm: any = {}, byName: any = {};
  allModels.forEach((m: any) => { const pr = { pin: m.pricing ? priceM(m.pricing.prompt) : null, pout: m.pricing ? priceM(m.pricing.completion) : null }; byId[m.id] = pr; byNorm[norm(m.id)] = pr; byName[cleanName(m.name)] = pr; });
  const intelByNorm: any = {}, intelByName: any = {};
  bmIntel.forEach((b: any) => { if (b.score != null) { const sc = Math.round(b.score * 10) / 10; intelByNorm[norm(b.permaslug)] = sc; intelByName[cleanName(b.aa_name)] = sc; } });

  const cands = pf.filter((p: any) => p.request_count).map((p: any) => {
    const pr = byId[p.id] || byNorm[norm(p.id)] || byName[cleanName(p.name)] || {};
    return {
      name: p.name, provider: p.author, req: p.request_count, reqM: +(p.request_count / 1e6).toFixed(1),
      tps: p.p50_throughput != null ? Math.round(p.p50_throughput) : null,
      pin: pr.pin ?? null, pout: pr.pout ?? null,
      intel: intelByNorm[norm(p.id)] ?? intelByName[cleanName(p.name)] ?? null,
    };
  });
  const popular = cands.filter((c: any) => c.req >= 300000);
  const usageTop = [...cands].sort((a, b) => b.req - a.req).slice(0, 10);
  const speedTop = [...popular].filter((c: any) => c.tps != null).sort((a, b) => b.tps - a.tps).slice(0, 10);
  const priceTop = [...popular].filter((c: any) => c.pin != null && c.pin > 0).sort((a, b) => a.pin - b.pin).slice(0, 10);
  const intelTop = bmIntel.filter((b: any) => b.score != null && (b.aa_name || b.permaslug)).sort((a: any, b: any) => b.score - a.score).slice(0, 10)
    .map((b: any) => ({ name: (b.aa_name || norm(b.permaslug)).split("(")[0].trim().substring(0, 40), score: +Number(b.score).toFixed(1) }));
  const appsTop = appsRaw.slice(0, 10).map((a: any) => ({
    rank: a.rank, title: (a.app && a.app.title) || "App",
    desc: ((a.app && a.app.description) || "").replace(/\s+/g, " ").trim().substring(0, 70),
    tokensB: +(Number(a.total_tokens) / 1e9).toFixed(1),
    url: (a.app && (a.app.main_url || a.app.origin_url)) || "", favicon: (a.app && a.app.favicon_url) || "",
  }));

  if (!usageTop.length && !priceTop.length && !intelTop.length) return null; // 전부 실패 → 폴백 유도
  return { updatedAt: new Date().toISOString(), total: allModels.length, usageTop, speedTop, priceTop, intelTop, appsTop };
}

export const onRequestGet: any = async (context: any) => {
  const { request } = context;
  const cache = (caches as any).default;
  const cacheKey = new Request(new URL(request.url).origin + "/api/openrouter", { method: "GET" });

  const hit = await cache.match(cacheKey);
  if (hit) { const h = new Response(hit.body, hit); h.headers.set("X-Cache", "HIT"); return h; }

  const data = await build();
  if (!data) {
    return new Response(JSON.stringify({ error: "upstream" }), { status: 502, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  }
  const res = new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": `public, max-age=${CACHE_TTL}`,
      "Access-Control-Allow-Origin": "*",
      "X-Cache": "MISS",
    },
  });
  context.waitUntil(cache.put(cacheKey, res.clone()));
  return res;
};
