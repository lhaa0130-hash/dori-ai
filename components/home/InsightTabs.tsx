"use client";

// 토스증권 실시간 차트 풍 — 인사이트를 종류(카테고리)별 탭 + 순위 리스트로.
import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

// 클라이언트 전용(서버 fs 모듈 import 금지) — 타입/순서는 여기서 정의
export type InsightFeedItem = {
  slug: string;
  title: string;
  date: string;
  thumbnail?: string;
  category: string;
};
const INSIGHT_CATEGORY_ORDER = ["트렌드", "가이드", "리포트", "분석", "큐레이션", "영상"];

const EMOJI: Record<string, string> = {
  트렌드: "🔥", 가이드: "📖", 리포트: "📊", 분석: "🔬", 큐레이션: "✨", 영상: "🎬",
};

function fmtDate(d: string) {
  const t = new Date(d);
  if (isNaN(t.getTime())) return "";
  return t.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

export default function InsightTabs({ items, perTab = 8 }: { items: InsightFeedItem[]; perTab?: number }) {
  // 존재하는 카테고리만, 정해진 순서로
  const present = useMemo(() => {
    const set = new Set(items.map((i) => i.category));
    return INSIGHT_CATEGORY_ORDER.filter((c) => set.has(c));
  }, [items]);

  const tabs = useMemo(() => ["전체", ...present], [present]);
  const [tab, setTab] = useState("전체");

  const rows = useMemo(() => {
    const list = tab === "전체" ? items : items.filter((i) => i.category === tab);
    return list.slice(0, perTab);
  }, [items, tab, perTab]);

  if (!items.length) return null;

  return (
    <section className="py-5 border-b border-neutral-100 dark:border-zinc-900">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[14px] font-extrabold text-neutral-950 dark:text-white">AI 인사이트</p>
        <Link href="/insight" className="flex items-center gap-1 text-[13px] font-semibold text-[#F9954E]">
          전체 <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 카테고리 탭 — 가로 스크롤 */}
      <div className="-mx-4 px-4 overflow-x-auto scrollbar-hide mb-1">
        <div className="flex gap-1.5 w-max">
          {tabs.map((t) => {
            const active = tab === t;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-bold whitespace-nowrap transition-colors border
                  ${active
                    ? "bg-[#F9954E] border-[#F9954E] text-white"
                    : "bg-white dark:bg-zinc-950 border-neutral-200 dark:border-zinc-800 text-neutral-500 dark:text-neutral-400 hover:border-[#F9954E]/40"}`}
              >
                {t !== "전체" && <span className="mr-1">{EMOJI[t]}</span>}{t}
              </button>
            );
          })}
        </div>
      </div>

      {/* 순위 리스트 */}
      <div className="divide-y divide-neutral-100 dark:divide-white/[0.06]">
        {rows.map((it, i) => (
          <Link
            key={it.slug + i}
            href={`/insight/article/${it.slug}`}
            className="flex items-center gap-3 py-3 active:opacity-60 transition-opacity"
          >
            {/* 순위 */}
            <span className={`w-5 text-center text-[14px] font-extrabold flex-shrink-0
              ${i < 3 ? "text-[#F9954E]" : "text-neutral-300 dark:text-neutral-600"}`}>
              {i + 1}
            </span>

            {/* 썸네일 */}
            <div className="relative w-[40px] h-[40px] rounded-xl overflow-hidden bg-neutral-100 dark:bg-white/10 flex-shrink-0">
              {it.thumbnail ? (
                <Image src={it.thumbnail} alt={it.title} fill style={{ objectFit: "cover" }} sizes="40px" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-base">{EMOJI[it.category] || "📝"}</div>
              )}
            </div>

            {/* 제목 + 메타 */}
            <div className="flex-1 min-w-0">
              <p className="text-neutral-900 dark:text-white font-semibold text-[13px] line-clamp-1 break-keep">
                {it.title}
              </p>
              <p className="flex items-center gap-1.5 mt-0.5">
                {tab === "전체" && (
                  <span className="text-[10px] font-bold text-[#F9954E] bg-[#FFF1E3] dark:bg-[#F9954E]/15 rounded px-1.5 py-0.5">
                    {it.category}
                  </span>
                )}
                <span className="text-neutral-400 text-[11px]">{fmtDate(it.date)}</span>
              </p>
            </div>

            <ArrowRight className="w-3.5 h-3.5 text-neutral-300 dark:text-white/20 flex-shrink-0" />
          </Link>
        ))}
      </div>
    </section>
  );
}
