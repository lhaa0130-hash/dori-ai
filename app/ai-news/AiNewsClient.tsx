"use client";

import { useState } from "react";
import { ArrowUpRight, Newspaper } from "lucide-react";
import {
  AI_NEWS_CATEGORIES,
  faviconOf,
  type AiSource,
} from "@/constants/aiNewsData";

const BADGE_CLS: Record<string, string> = {
  KR: "bg-[#FFF5EB] text-[#E8832E] dark:bg-[#F9954E]/10 dark:text-[#FBAA60]",
  HOT: "bg-[#F9954E] text-white",
  NEW: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
};

function SiteCard({ s }: { s: AiSource }) {
  const fav = faviconOf(s.url);
  const initial = s.name.replace(/[^A-Za-z0-9가-힣]/g, "").slice(0, 1).toUpperCase() || "?";
  return (
    <a
      href={s.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-3 p-4 rounded-2xl border border-neutral-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 hover:border-[#F9954E]/40 hover:shadow-lg hover:shadow-[#F9954E]/5 transition-all duration-200"
    >
      <div className="w-10 h-10 rounded-xl bg-neutral-50 dark:bg-zinc-900 border border-neutral-100 dark:border-zinc-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {fav ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={fav}
            alt=""
            width={24}
            height={24}
            loading="lazy"
            decoding="async"
            className="w-6 h-6"
            onError={(e) => {
              const el = e.currentTarget;
              el.style.display = "none";
              (el.parentElement as HTMLElement).textContent = initial;
            }}
          />
        ) : (
          <span className="text-[14px] font-extrabold text-[#F9954E]">{initial}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <h3 className="text-[14px] font-extrabold text-neutral-900 dark:text-white leading-tight truncate group-hover:text-[#E8832E] dark:group-hover:text-[#FBAA60] transition-colors">
            {s.name}
          </h3>
          {s.badge && (
            <span className={`text-[9px] font-black rounded-full px-1.5 py-0.5 flex-shrink-0 ${BADGE_CLS[s.badge]}`}>
              {s.badge}
            </span>
          )}
          <ArrowUpRight className="w-3.5 h-3.5 text-neutral-300 dark:text-zinc-600 group-hover:text-[#F9954E] transition-colors flex-shrink-0 ml-auto" />
        </div>
        <p className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed line-clamp-2 break-keep">
          {s.desc}
        </p>
      </div>
    </a>
  );
}

export default function AiNewsClient() {
  const [active, setActive] = useState<string>("all");
  const cats =
    active === "all"
      ? AI_NEWS_CATEGORIES
      : AI_NEWS_CATEGORIES.filter((c) => c.key === active);
  const total = AI_NEWS_CATEGORIES.reduce((n, c) => n + c.sites.length, 0);

  return (
    <main className="w-full min-h-screen">
      {/* 히어로 */}
      <section className="pt-8 pb-5 border-b border-neutral-100 dark:border-zinc-900">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF5EB] dark:bg-[#F9954E]/10 mb-4">
          <Newspaper className="w-3.5 h-3.5 text-[#F9954E]" />
          <span className="text-[11px] font-bold text-[#F9954E]">AI 정보 소스 {total}곳</span>
        </div>
        <h1 className="text-[34px] sm:text-[44px] font-extrabold text-neutral-950 dark:text-white leading-[1.12] tracking-tight mb-2 break-keep">
          AI 소식, 어디서 볼까?
        </h1>
        <p className="text-[14px] text-neutral-500 dark:text-neutral-500 leading-relaxed break-keep">
          뉴스·커뮤니티·뉴스레터·리더보드·연구까지 — AI 정보를 얻기 좋은 사이트를 카테고리별로 모았어요.
        </p>

        {/* 카테고리 칩 */}
        <div className="-mx-6 px-6 overflow-x-auto scrollbar-hide pt-5">
          <div className="flex gap-1.5 w-max">
            <button
              onClick={() => setActive("all")}
              className={`px-3 py-1 rounded-full text-[12px] font-semibold whitespace-nowrap transition-colors ${
                active === "all"
                  ? "bg-neutral-950 dark:bg-white text-white dark:text-neutral-950"
                  : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              전체
            </button>
            {AI_NEWS_CATEGORIES.map((c) => (
              <button
                key={c.key}
                onClick={() => setActive(c.key)}
                className={`px-3 py-1 rounded-full text-[12px] font-semibold whitespace-nowrap transition-colors ${
                  active === c.key
                    ? "bg-neutral-950 dark:bg-white text-white dark:text-neutral-950"
                    : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                }`}
              >
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 카테고리별 목록 */}
      {cats.map((c) => (
        <section key={c.key} className="py-6 border-b border-neutral-100 dark:border-zinc-900 last:border-0">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-[15px] font-extrabold text-neutral-900 dark:text-white">
              {c.emoji} {c.label}
            </span>
            <span className="text-[11px] font-bold text-neutral-400">{c.sites.length}</span>
          </div>
          <p className="text-[12.5px] text-neutral-500 dark:text-neutral-500 mb-4 break-keep">{c.desc}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {c.sites.map((s) => (
              <SiteCard key={s.url} s={s} />
            ))}
          </div>
        </section>
      ))}

      <p className="py-8 text-[11px] text-neutral-400 dark:text-zinc-600 leading-relaxed break-keep">
        ⚠️ 외부 사이트로 이동합니다. 추천 목록은 illo가 직접 큐레이션하며 제휴와 무관합니다.
      </p>
    </main>
  );
}
