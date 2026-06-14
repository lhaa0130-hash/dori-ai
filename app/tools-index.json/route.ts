// 도구 순위 자동화용 — 각 AI 도구의 id + 도메인 목록 (n8n이 Tranco 순위 조회에 사용)
import { AI_TOOLS_DATA } from "@/constants/aiToolsData";

export const dynamic = "force-static";

export async function GET() {
  const items = AI_TOOLS_DATA.map((t) => {
    let domain = "";
    try { domain = new URL(t.website).hostname.replace(/^www\./, ""); } catch {}
    return { id: t.id, domain };
  }).filter((x) => x.domain);
  return new Response(JSON.stringify({ count: items.length, items }), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
