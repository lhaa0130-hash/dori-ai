// 인사이트 종류별 피드 — 메인페이지 탭형 순위 위젯용 통합 집계.
// 트렌드/가이드/리포트/분석/큐레이션(영상 포함)을 카테고리별로 묶어 제공. (스튜디오 제외)

import { getAllTrends } from "@/lib/trends";
import { getAllGuides } from "@/lib/guides";
import { getAllAnalyses } from "@/lib/analysis";
import { getAllReports } from "@/lib/reports";
import { getAllCurations } from "@/lib/curation";

export type InsightFeedItem = {
  slug: string;
  title: string;
  date: string;
  thumbnail?: string;
  category: string;
  summary?: string;
};

// 메인 탭 노출 순서(존재하는 카테고리만 화면에 표시)
export const INSIGHT_CATEGORY_ORDER = ["트렌드", "가이드", "리포트", "분석", "큐레이션", "영상"];

const norm = (s?: string) => (s || "").trim();

/** 카테고리별 최신 perCategory개씩, 전체 날짜 최신순 평면 배열 */
export function getInsightFeed(perCategory = 12): InsightFeedItem[] {
  const items: InsightFeedItem[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const push = (arr: any[], fallbackCat: string) => {
    for (const it of arr || []) {
      if (!it?.slug || !it?.title) continue;
      items.push({
        slug: String(it.slug),
        title: String(it.title),
        date: String(it.date || ""),
        thumbnail: it.thumbnail || undefined,
        category: norm(it.category) || fallbackCat,
        summary: norm(it.description || it.summary || it.subtitle) || undefined,
      });
    }
  };

  try { push(getAllTrends(), "트렌드"); } catch { /* noop */ }
  try { push(getAllGuides(), "가이드"); } catch { /* noop */ }
  try { push(getAllReports(), "리포트"); } catch { /* noop */ }
  try { push(getAllAnalyses(), "분석"); } catch { /* noop */ }
  try { push(getAllCurations(), "큐레이션"); } catch { /* noop */ }

  // 날짜 최신순
  items.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

  // 카테고리별 상한 적용(페이로드 절약)
  const byCat: Record<string, InsightFeedItem[]> = {};
  for (const it of items) (byCat[it.category] ||= []).push(it);
  const capped: InsightFeedItem[] = [];
  for (const cat of Object.keys(byCat)) capped.push(...byCat[cat].slice(0, perCategory));
  capped.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  return capped;
}
