// RSS 2.0 피드 — 구독자 확보 + 검색엔진/뉴스 수집기 노출
// /feed.xml 로 접근. 빌드 시 정적 생성됩니다.
import { getAllTrends } from "@/lib/trends";
import { getAllCurations } from "@/lib/curation";
import { getAllAnalyses } from "@/lib/analysis";
import { getAllReports } from "@/lib/reports";
import { getAllStudios } from "@/lib/studio";

export const dynamic = "force-static";

const SITE = "https://illo.im";

function esc(s: string): string {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET() {
  let items: Array<{ slug: string; title?: string; description?: string; date?: string; cat: string }> = [];
  try {
    const all = [
      ...(getAllTrends() as any[]).map((p) => ({ ...p, cat: "트렌드" })),
      ...(getAllCurations() as any[]).map((p) => ({ ...p, cat: "큐레이션" })),
      ...(getAllAnalyses() as any[]).map((p) => ({ ...p, cat: "분석" })),
      ...(getAllReports() as any[]).map((p) => ({ ...p, cat: "리포트" })),
      ...(getAllStudios() as any[]).map((p) => ({ ...p, cat: "스튜디오" })),
    ];
    items = all
      .filter((p) => p && p.slug)
      .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
      .slice(0, 40);
  } catch {
    /* 빈 피드라도 200 반환 */
  }

  const body = items
    .map((p) => {
      const url = `${SITE}/insight/article/${p.slug}`;
      const pub = p.date ? new Date(p.date).toUTCString() : new Date().toUTCString();
      return `    <item>
      <title>${esc(p.title || "")}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <category>${esc(p.cat)}</category>
      <pubDate>${pub}</pubDate>
      <description>${esc(p.description || p.title || "")}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>illo — AI 트렌드·큐레이션·분석·리포트</title>
    <link>${SITE}</link>
    <atom:link href="${SITE}/feed.xml" rel="self" type="application/rss+xml" />
    <description>매일 업데이트되는 AI 트렌드와 인사이트</description>
    <language>ko</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${body}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
