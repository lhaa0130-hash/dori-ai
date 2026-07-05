"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ArrowLeft, ShoppingBag, FileText } from "lucide-react";
import {
  MARKET_CATEGORIES,
  MARKET_PRODUCTS,
  SOURCE_META,
  CATEGORY_EMOJI,
  CATEGORY_LABEL,
  buildMarketUrl,
  countByCategory,
  getWeeklyPicks,
  type MarketProduct,
  type MarketCategory,
} from "@/constants/marketData";

function ProductCard({ p }: { p: MarketProduct }) {
  const src = SOURCE_META[p.source];
  return (
    <a
      href={buildMarketUrl(p)}
      target="_blank"
      rel="sponsored noopener noreferrer"
      className="group flex flex-col p-4 rounded-2xl border border-neutral-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 hover:border-[#F9954E]/40 hover:shadow-lg hover:shadow-[#F9954E]/5 transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-11 h-11 rounded-xl bg-neutral-50 dark:bg-zinc-900 border border-neutral-100 dark:border-zinc-800 flex items-center justify-center text-[22px] leading-none">
          {p.emoji || CATEGORY_EMOJI[p.category] || "🛍️"}
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${src.cls}`}>{src.label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <h3 className="text-[14px] font-extrabold text-neutral-900 dark:text-white leading-tight truncate group-hover:text-[#E8832E] dark:group-hover:text-[#FBAA60] transition-colors">{p.name}</h3>
        {p.hot && <span className="text-[9px] font-black text-white bg-[#F9954E] rounded-full px-1.5 py-0.5 flex-shrink-0">HOT</span>}
      </div>
      <p className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed line-clamp-2 break-keep">{p.summary}</p>
      <div className="flex items-center justify-between mt-auto pt-3">
        {p.priceHint ? <span className="text-[11px] font-bold text-neutral-400">{p.priceHint}</span> : <span />}
        <span className="flex items-center gap-0.5 text-[12px] font-bold text-[#F9954E]">보러가기 <ArrowUpRight className="w-3.5 h-3.5" /></span>
      </div>
    </a>
  );
}

// ── 이주의 상품 (featured) ──
function WeeklyCard({ p }: { p: MarketProduct }) {
  const src = SOURCE_META[p.source];
  return (
    <a
      href={buildMarketUrl(p)}
      target="_blank"
      rel="sponsored noopener noreferrer"
      className="group flex items-center gap-3 p-3 rounded-xl border border-[#F9954E]/30 bg-gradient-to-br from-[#FFF5EB] to-white dark:from-[#1a0d00] dark:to-black hover:shadow-lg hover:shadow-[#F9954E]/10 transition-all"
    >
      <div className="w-11 h-11 rounded-xl bg-white dark:bg-zinc-900 border border-[#F9954E]/20 flex items-center justify-center text-[22px] leading-none flex-shrink-0">
        {p.emoji || CATEGORY_EMOJI[p.category] || "🛍️"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${src.cls}`}>{src.label}</span>
          <span className="text-[9px] font-bold text-neutral-400">{CATEGORY_LABEL[p.category]}</span>
        </div>
        <h3 className="text-[13px] font-extrabold text-neutral-900 dark:text-white truncate group-hover:text-[#E8832E] dark:group-hover:text-[#FBAA60] transition-colors">{p.name}</h3>
        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-1 break-keep">{p.summary}</p>
      </div>
      <span className="flex items-center gap-0.5 text-[11px] font-bold text-[#F9954E] flex-shrink-0">보기 <ArrowUpRight className="w-3 h-3" /></span>
    </a>
  );
}

function WeeklySection() {
  const picks = getWeeklyPicks();
  return (
    <section className="py-5 border-b border-neutral-100 dark:border-zinc-900">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[13px] font-extrabold text-neutral-900 dark:text-white">🔥 이주의 상품</span>
        <span className="text-[9px] font-bold text-[#F9954E] px-1.5 py-0.5 rounded-full bg-[#FFF5EB] dark:bg-[#F9954E]/10">WEEKLY</span>
      </div>
      {picks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#F9954E]/40 bg-[#FFF5EB]/40 dark:bg-[#F9954E]/5 p-5 text-center">
          <p className="text-2xl mb-1.5">🛍️</p>
          <p className="text-[13px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">이주의 상품을 준비 중이에요</p>
          <p className="text-[11px] text-neutral-400 break-keep">매주 아마존·쿠팡·알리에서 가장 추천하는 제품을 골라 올려드릴게요.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {picks.map((p) => <WeeklyCard key={p.id} p={p} />)}
        </div>
      )}
    </section>
  );
}

// ── 리뷰 글 (content/market 자동 발행) ──
export interface MarketReview {
  slug: string;
  title: string;
  description: string;
  date: string;
  thumbnail?: string;
}

function fmtDate(s?: string) {
  if (!s) return "";
  const d = new Date(s);
  if (isNaN(d.getTime())) return "";
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function ReviewSection({ reviews }: { reviews: MarketReview[] }) {
  if (!reviews || reviews.length === 0) return null;
  return (
    <section className="py-6 border-b border-neutral-100 dark:border-zinc-900">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[14px] font-extrabold text-neutral-900 dark:text-white">📝 최신 리뷰 & 비교</span>
        <span className="text-[10px] font-bold text-[#F9954E] px-2 py-0.5 rounded-full bg-[#FFF5EB] dark:bg-[#F9954E]/10">REVIEW</span>
        <span className="text-[11px] font-bold text-neutral-400">{reviews.length}</span>
      </div>
      <ul>
        {reviews.map((r) => (
          <li key={r.slug} className="border-b border-neutral-100 dark:border-zinc-900 last:border-0">
            <Link href={`/insight/article/${r.slug}`} className="group flex items-start gap-3 py-3">
              {/* 썸네일 */}
              <div className="w-[60px] h-[46px] rounded-lg overflow-hidden flex-shrink-0 bg-[#FFF5EB] dark:bg-[#F9954E]/10 flex items-center justify-center">
                {r.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={r.thumbnail}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => { (e.currentTarget.parentElement as HTMLElement).innerHTML = ''; }}
                  />
                ) : (
                  <FileText className="w-4 h-4 text-[#F9954E]" />
                )}
              </div>
              {/* 텍스트 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-bold text-[#F9954E]">마켓</span>
                  <span className="text-[11px] text-neutral-400 dark:text-neutral-500">{fmtDate(r.date)}</span>
                </div>
                <h3 className="text-[13.5px] sm:text-[14.5px] font-bold text-neutral-900 dark:text-white leading-snug break-keep line-clamp-2 group-hover:text-[#F9954E] transition-colors">{r.title}</h3>
                <p className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-1 break-keep">{r.description}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function MarketClient({ reviews = [] }: { reviews?: MarketReview[] }) {
  const [active, setActive] = useState<MarketCategory | null>(null);

  // ── 카테고리 상세 (선택 시) ──
  if (active) {
    const items = MARKET_PRODUCTS.filter((p) => p.category === active.key);
    return (
      <main className="w-full min-h-screen">
        <div className="pt-6">
          <button onClick={() => setActive(null)} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-neutral-400 hover:text-[#F9954E] transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> 전체 카테고리
          </button>
        </div>
        <section className="pt-5 pb-6 border-b border-neutral-100 dark:border-zinc-900">
          <h1 className="text-[30px] sm:text-[40px] font-extrabold text-neutral-950 dark:text-white leading-[1.12] tracking-tight mb-1">
            {active.emoji} {active.label}
          </h1>
          <p className="text-[14px] text-neutral-500 dark:text-neutral-500 break-keep">{active.desc}</p>
        </section>

        <section className="py-6 pb-20">
          {items.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-neutral-200 dark:border-zinc-800 rounded-2xl">
              <p className="text-3xl mb-3">🛒</p>
              <p className="text-[15px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">곧 추천 제품을 올릴게요</p>
              <p className="text-[13px] text-neutral-400">아마존·쿠팡·알리에서 엄선한 {active.label} 아이템을 준비 중이에요.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {items.map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          )}
          <p className="pt-8 text-[11px] text-neutral-400 dark:text-zinc-600 leading-relaxed break-keep">
            이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다. 아마존·알리 등 다른 제휴 링크도 구매 시 일정 수수료가 발생할 수 있습니다.
          </p>
        </section>
      </main>
    );
  }

  // ── 메인 (기본) ──
  return (
    <main className="w-full min-h-screen">
      {/* 히어로 */}
      <section className="pt-8 pb-5 border-b border-neutral-100 dark:border-zinc-900">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF5EB] dark:bg-[#F9954E]/10 mb-4">
          <ShoppingBag className="w-3.5 h-3.5 text-[#F9954E]" />
          <span className="text-[11px] font-bold text-[#F9954E]">DORI 마켓</span>
        </div>
        <h1 className="text-[34px] sm:text-[44px] font-extrabold text-neutral-950 dark:text-white leading-[1.12] tracking-tight mb-2 break-keep">
          무엇을 찾고 있나요?
        </h1>
        <p className="text-[14px] text-neutral-500 dark:text-neutral-500 leading-relaxed break-keep mb-5">
          아마존·쿠팡·알리에서 하나씩 엄선한 추천 아이템을 올려드려요.
        </p>

        {/* 카테고리 칩 (가로 스크롤, 1~2줄) */}
        <div className="-mx-6 px-6 overflow-x-auto scrollbar-hide pb-1">
          <div className="flex flex-wrap gap-2 w-max max-w-full sm:flex-wrap sm:w-auto">
            {MARKET_CATEGORIES.map((c) => (
              <button
                key={c.key}
                onClick={() => setActive(c)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-neutral-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-[12.5px] font-semibold text-neutral-700 dark:text-neutral-300 hover:border-[#F9954E] hover:text-[#F9954E] active:scale-95 transition-all whitespace-nowrap"
              >
                <span className="text-[13px]">{c.emoji}</span>
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 이주의 상품 */}
      <WeeklySection />

      {/* 최신 리뷰 글 */}
      <ReviewSection reviews={reviews} />

      <p className="pb-10 text-[11px] text-neutral-400 dark:text-zinc-600 leading-relaxed break-keep">
        이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다. 아마존·알리 등 다른 제휴 링크도 구매 시 일정 수수료가 발생할 수 있습니다.
      </p>
    </main>
  );
}
