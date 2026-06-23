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
