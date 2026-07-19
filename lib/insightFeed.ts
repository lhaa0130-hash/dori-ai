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
  excerpt?: string;   // 본문 일부(미리보기용)
  author?: string;    // 글 작성자(출처)
  channel?: string;   // 영상: 유튜브 채널명
  videoDate?: string; // 영상: 실제 유튜브 업로드 시각(ISO)
  lang: "ko" | "en";  // 콘텐츠 언어(frontmatter lang, 기본 ko) — 홈 언어별 분리용
  titleEn?: string;   // 영상 등 공유 글의 영어 제목(en 피드에서 title로 스왑)
  summaryEn?: string; // 영어 요약
};

// 메인 탭 노출 순서(존재하는 카테고리만 화면에 표시)
export const INSIGHT_CATEGORY_ORDER = ["트렌드", "가이드", "리포트", "분석", "큐레이션", "영상"];

const norm = (s?: string) => (s || "").trim();

// 본문 마크다운 → 읽기 텍스트 발췌(이미지·표·인용·채널통계줄 제거)
function excerptOf(md: string, n = 280): string {
  const t = (md || "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")    // 이미지
    .replace(/^.*구독자.*$/m, " ")            // 영상: 채널 통계 줄
    .replace(/^\s*>.*$/gm, " ")               // 인용(💡 요약)
    .replace(/^\s*\|.*\|\s*$/gm, " ")         // 표 행
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")  // 링크 → 텍스트
    .replace(/[#>*`_~|]/g, " ")               // 마크다운 기호
    .replace(/\s+/g, " ")
    .trim();
  return t.slice(0, n);
}

/** 카테고리별 최신 perCategory개씩, 전체 날짜 최신순 평면 배열 */
export function getInsightFeed(perCategory = 12, lang?: "ko" | "en"): InsightFeedItem[] {
  const items: InsightFeedItem[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const push = (arr: any[], fallbackCat: string) => {
    for (const it of arr || []) {
      if (!it?.slug || !it?.title) continue;
      const cat = norm(it.category) || fallbackCat;
      const body = String(it.content || "");
      items.push({
        slug: String(it.slug),
        title: String(it.title),
        date: String(it.date || ""),
        thumbnail: it.thumbnail || undefined,
        category: cat,
        summary: (norm(it.description || it.summary || it.subtitle) || "").slice(0, 180) || undefined,
        excerpt: excerptOf(body) || undefined,
        author: norm(it.author) || "illo",
        channel: cat === "영상" ? ((body.match(/\*\*(.+?)\*\*/) || [])[1] || undefined) : undefined,
        videoDate: it.videoDate || undefined,
        lang: it.lang === "en" ? "en" : "ko",
        titleEn: norm(it.titleEn) || undefined,
        summaryEn: (norm(it.summaryEn) || "").slice(0, 180) || undefined,
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

  // 언어 필터(한글=ko페이지, 영어=en페이지). 상한 적용 전에 걸러야 카테고리별 개수가 올바름.
  // ⚠️영어 페이지는 트렌드·영상 제외(사용자 방침) — 영어로 쓴 글만 노출.
  const src = lang ? items.filter((it) => it.lang === lang && it.category !== "영상" && it.category !== "트렌드") : items;

  // 카테고리별 상한 적용(페이로드 절약)
  const byCat: Record<string, InsightFeedItem[]> = {};
  for (const it of src) (byCat[it.category] ||= []).push(it);
  const capped: InsightFeedItem[] = [];
  for (const cat of Object.keys(byCat)) capped.push(...byCat[cat].slice(0, perCategory));
  capped.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  return capped;
}
