// 메인 상단 정보 스트립용 집계(서버) — 인기 AI 도구 TOP·동물도감 종수 등.
import fs from "fs";
import path from "path";
import { AI_TOOLS_DATA } from "@/constants/aiToolsData";

export type TopTool = { name: string; category: string };

// 큐레이션된 추천 도구(topPick) — 카테고리별 상위(topRank)부터. 다양·깔끔한 간소화 랭킹.
export function getTopTools(n = 5): TopTool[] {
  try {
    const picks = AI_TOOLS_DATA
      .filter((t) => t.topPick)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .sort((a: any, b: any) => (a.topRank ?? 99) - (b.topRank ?? 99));
    const seen = new Set<string>();
    const out: TopTool[] = [];
    for (const t of picks) {
      if (seen.has(t.name)) continue;
      seen.add(t.name);
      out.push({ name: t.name, category: t.category });
      if (out.length >= n) break;
    }
    return out;
  } catch {
    return [];
  }
}

// OpenRouter 인기 자료(사람들이 많이 보는 것) — 우리 스타일 카드용
export type OrPicks = {
  model: { name: string; reqM: number } | null;   // 월 요청 1위 모델
  intel: { name: string; score: number } | null;  // 지능 1위
  speed: { name: string; tps: number } | null;     // 최고 속도
};
function shortModel(n: string): string {
  const s = n.includes(": ") ? n.split(": ").slice(1).join(": ") : n;
  return s.length > 20 ? s.slice(0, 19) + "…" : s;
}
export function getOrPicks(): OrPicks {
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), "public/openrouter-stats.json"), "utf-8");
    const j = JSON.parse(raw);
    const u = j.usageTop?.[0];
    const it = j.intelTop?.[0];
    const sp = j.speedTop?.[0];
    return {
      model: u ? { name: shortModel(String(u.name)), reqM: Number(u.reqM) || 0 } : null,
      intel: it ? { name: shortModel(String(it.name)), score: Number(it.score) || 0 } : null,
      speed: sp ? { name: shortModel(String(sp.name)), tps: Number(sp.tps) || 0 } : null,
    };
  } catch {
    return { model: null, intel: null, speed: null };
  }
}

// 동물도감 종수
export function getAnimalCount(): number {
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), "data/animal-cards.json"), "utf-8");
    const j = JSON.parse(raw);
    if (Array.isArray(j)) return j.length;
    if (Array.isArray(j?.cards)) return j.cards.length;
    if (Array.isArray(j?.animals)) return j.animals.length;
    return 0;
  } catch {
    return 0;
  }
}
