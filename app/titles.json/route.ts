// 중복 검사 전용 경량 엔드포인트 — 발행된 모든 글의 제목/카테고리/슬러그 전체 목록 (n8n 중복검사 게이트가 사용)
// 공개 RSS(feed.xml, 40개)와 달리 전체 글을 다 담는다. 빌드 시 정적 생성.
import { getAllTrends } from "@/lib/trends";
import { getAllCurations } from "@/lib/curation";
import { getAllAnalyses } from "@/lib/analysis";
import { getAllReports } from "@/lib/reports";
import { getAllStudios } from "@/lib/studio";
import { getAllMarketPosts } from "@/lib/market-posts";

export const dynamic = "force-static";

export async function GET() {
  let items: Array<{ t: string; c: string; s: string; d: string }> = [];
  try {
    const all = [
      ...(getAllTrends() as any[]).map((p) => ({ ...p, cat: "트렌드" })),
      ...(getAllCurations() as any[]).map((p) => ({ ...p, cat: "큐레이션" })),
      ...(getAllAnalyses() as any[]).map((p) => ({ ...p, cat: "분석" })),
      ...(getAllReports() as any[]).map((p) => ({ ...p, cat: "리포트" })),
      ...(getAllStudios() as any[]).map((p) => ({ ...p, cat: "스튜디오" })),
      ...(getAllMarketPosts() as any[]).map((p) => ({ ...p, cat: "마켓" })),
    ];
    items = all
      .filter((p) => p && p.slug && p.title)
      .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
      .map((p) => ({ t: String(p.title), c: p.cat, s: String(p.slug), d: String(p.date || "") }));
  } catch {
    /* 빈 목록이라도 200 */
  }
  return new Response(JSON.stringify({ count: items.length, items }), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
