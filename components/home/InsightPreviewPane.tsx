"use client";

// 인라인 미리보기 — 인사이트 행에 마우스를 올리면 우측 절반에 표시(토스처럼).
// 썸네일 + 요약 + 본문 일부 + 좋아요/댓글(쓰기 가능, ArticleSocial 재사용) + 전체 보기.
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ArticleSocial from "@/components/article/ArticleSocial";

export type PreviewItem = {
  slug: string; title: string; date: string; thumbnail?: string; category: string;
  summary?: string; excerpt?: string; channel?: string; videoDate?: string;
};

const EMOJI: Record<string, string> = { 트렌드: "🔥", 가이드: "📖", 리포트: "📊", 분석: "🔬", 큐레이션: "✨", 영상: "🎬" };
const CAT_EN: Record<string, string> = { 트렌드: "Trends", 가이드: "Guides", 리포트: "Reports", 분석: "Analysis", 큐레이션: "Curation", 영상: "Videos" };

function fmtVideoDate(iso: string | undefined, en: boolean) {
  if (!iso) return "";
  const t = new Date(iso);
  if (isNaN(t.getTime())) return "";
  const lc = en ? "en-US" : "ko-KR";
  const d = t.toLocaleDateString(lc, { timeZone: "Asia/Seoul", year: "numeric", month: "long", day: "numeric" });
  const tm = t.toLocaleTimeString(lc, { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit" });
  return `${d} ${tm}`;
}

export default function InsightPreviewPane({ item, locale = "ko" }: { item: PreviewItem; locale?: "ko" | "en" }) {
  const en = locale === "en";
  const catLabel = (c: string) => (en ? CAT_EN[c] || c : c);
  const href = en ? `/en/insight/article/${item.slug}` : `/insight/article/${item.slug}`;
  const dateStr = (() => { const t = new Date(item.date); return isNaN(t.getTime()) ? "" : t.toLocaleDateString(en ? "en-US" : "ko-KR", { year: "numeric", month: "long", day: "numeric" }); })();
  const isVideo = item.category === "영상";

  return (
    <div className="rounded-2xl border border-stone-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
      {/* 썸네일 — 16:9 고정 크기로 통일(어떤 이미지든 글 위치 동일). object-cover */}
      {item.thumbnail ? (
        <div className="w-full aspect-video bg-stone-100 dark:bg-zinc-900 overflow-hidden">
          <img
            src={item.thumbnail}
            alt={item.title}
            loading="lazy"
            className="block w-full h-full object-cover"
            onError={(e) => { const p = e.currentTarget.parentElement; if (p) p.style.display = "none"; }}
          />
        </div>
      ) : (
        <div className="w-full aspect-video bg-gradient-to-br from-[#FFF1E3] to-white dark:from-[#F9954E]/10 dark:to-zinc-900 flex items-center justify-center text-5xl">{EMOJI[item.category] || "📝"}</div>
      )}

      <div className="p-5">
        {/* 카테고리 · (영상이면 채널·업로드시각 / 그 외 날짜) */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-[11px] font-bold text-[#F9954E] bg-[#FFF1E3] dark:bg-[#F9954E]/15 rounded px-2 py-0.5">{EMOJI[item.category] || "📝"} {catLabel(item.category)}</span>
          {isVideo && item.videoDate ? (
            <span className="text-[11px] text-stone-500 dark:text-stone-400">
              {item.channel && <b className="text-stone-700 dark:text-stone-200">{item.channel}</b>}
              {item.channel ? " · " : ""}📺 {fmtVideoDate(item.videoDate, en)}{en ? " uploaded" : " 업로드"}
            </span>
          ) : (
            <span className="text-[11px] text-stone-400">{dateStr}</span>
          )}
        </div>

        {/* 제목 */}
        <h3 className="text-[18px] font-extrabold text-stone-950 dark:text-white leading-snug break-keep mb-2">{item.title}</h3>

        {/* 요약(리드) */}
        {item.summary && (
          <p className="text-[13px] font-medium text-stone-600 dark:text-stone-300 leading-relaxed break-keep line-clamp-3 mb-2.5">{item.summary}</p>
        )}

        {/* 본문 일부 미리보기 */}
        {item.excerpt && (
          <p className="text-[12.5px] text-stone-500 dark:text-stone-400 leading-relaxed break-keep line-clamp-[7] mb-4">{item.excerpt}…</p>
        )}

        {/* 전체 보기 */}
        <Link href={href} className="flex items-center justify-center gap-1.5 w-full py-3 rounded-xl bg-[#F9954E] text-white text-[14px] font-bold active:opacity-85 transition-opacity">
          {en ? "Read full article" : "전체 보기"} <ArrowRight className="w-4 h-4" />
        </Link>

        {/* 좋아요 · 댓글 (쓰기 가능) */}
        <ArticleSocial slug={item.slug} compact locale={locale} />
      </div>
    </div>
  );
}
