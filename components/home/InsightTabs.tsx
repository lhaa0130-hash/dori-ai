"use client";

// 토스증권 실시간 차트 풍 — 인사이트를 종류(카테고리)별 탭 + 순위 리스트로.
// 데스크탑(lg+): 좌 리스트 / 우 미리보기 2단. 행에 '마우스를 올리면' 우측 미리보기 갱신.
import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import InsightPreviewPane from "./InsightPreviewPane";

// 클라이언트 전용(서버 fs 모듈 import 금지) — 타입/순서는 여기서 정의
export type InsightFeedItem = {
  slug: string;
  title: string;
  date: string;
  thumbnail?: string;
  category: string;
  summary?: string;
  excerpt?: string;
  channel?: string;
  videoDate?: string;
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

// 영상: 실제 유튜브 업로드 날짜+시간(KST)
export function fmtVideoDate(iso?: string) {
  if (!iso) return "";
  const t = new Date(iso);
  if (isNaN(t.getTime())) return "";
  const d = t.toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul", month: "long", day: "numeric" });
  const tm = t.toLocaleTimeString("ko-KR", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit" });
  return `${d} ${tm}`;
}

export default function InsightTabs({ items, perTab = 8 }: { items: InsightFeedItem[]; perTab?: number }) {
  const present = useMemo(() => {
    const set = new Set(items.map((i) => i.category));
    return INSIGHT_CATEGORY_ORDER.filter((c) => set.has(c));
  }, [items]);

  const tabs = useMemo(() => ["전체", ...present], [present]);
  const [tab, setTab] = useState("전체");
  const [sel, setSel] = useState<InsightFeedItem | null>(null); // 우측 미리보기(데스크탑 hover)

  const rows = useMemo(() => {
    const list = tab === "전체" ? items : items.filter((i) => i.category === tab);
    return list.slice(0, perTab);
  }, [items, tab, perTab]);

  if (!items.length) return null;

  const preview = sel ?? rows[0];

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
      <div className="-mx-4 px-4 overflow-x-auto scrollbar-hide mb-3">
        <div className="flex gap-1.5 w-max">
          {tabs.map((t) => {
            const active = tab === t;
            return (
              <button
                key={t}
                onClick={() => { setTab(t); setSel(null); }}
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

      {/* 본문 — 데스크탑 2단(리스트 | 미리보기), 모바일 리스트만.
          items-start 없이 stretch → 우측 칸이 리스트 높이만큼 늘어나 sticky 미리보기가 끝까지 따라옴 */}
      <div className="lg:grid lg:grid-cols-2 lg:gap-6">
        {/* 좌: 순위 리스트 */}
        <div className="divide-y divide-neutral-100 dark:divide-white/[0.06]">
          {rows.map((it, i) => {
            const isPrev = preview?.slug === it.slug;
            return (
              <Link
                key={it.slug + i}
                href={`/insight/article/${it.slug}`}
                onMouseEnter={() => setSel(it)}
                className={`flex items-center gap-3 py-3 transition-colors active:opacity-60 lg:px-2.5 lg:rounded-xl lg:border-0
                  ${isPrev ? "lg:bg-[#FFF8F1] dark:lg:bg-[#F9954E]/[0.08]" : "lg:hover:bg-neutral-50 dark:lg:hover:bg-zinc-900/50"}`}
              >
                <span className={`w-5 text-center text-[14px] font-extrabold flex-shrink-0 ${i < 3 ? "text-[#F9954E]" : "text-neutral-300 dark:text-neutral-600"}`}>{i + 1}</span>

                <div className="relative w-[40px] h-[40px] rounded-xl overflow-hidden bg-neutral-100 dark:bg-white/10 flex-shrink-0">
                  {it.thumbnail ? (
                    <Image src={it.thumbnail} alt={it.title} fill style={{ objectFit: "cover" }} sizes="40px" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-base">{EMOJI[it.category] || "📝"}</div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-neutral-900 dark:text-white font-semibold text-[13px] line-clamp-1 break-keep">{it.title}</p>
                  <p className="flex items-center gap-1.5 mt-0.5">
                    {tab === "전체" && (
                      <span className="text-[10px] font-bold text-[#F9954E] bg-[#FFF1E3] dark:bg-[#F9954E]/15 rounded px-1.5 py-0.5">{it.category}</span>
                    )}
                    {it.category === "영상" && it.videoDate ? (
                      <span className="text-neutral-400 text-[11px] truncate">
                        {it.channel && <b className="text-neutral-600 dark:text-neutral-300">{it.channel}</b>}
                        {it.channel ? " · " : ""}📺 {fmtVideoDate(it.videoDate)}
                      </span>
                    ) : (
                      <span className="text-neutral-400 text-[11px]">{fmtDate(it.date)}</span>
                    )}
                  </p>
                </div>

                <ArrowRight className="w-3.5 h-3.5 text-neutral-300 dark:text-white/20 flex-shrink-0" />
              </Link>
            );
          })}
        </div>

        {/* 우: 미리보기 (데스크탑 전용, sticky) */}
        <div className="hidden lg:block">
          {preview && (
            <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-hide">
              <InsightPreviewPane item={preview} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
