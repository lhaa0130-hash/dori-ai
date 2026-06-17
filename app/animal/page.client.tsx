"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { BookOpen, Sparkles, Search, X, RotateCcw } from "lucide-react";

// ─── 동물 카드 타입 ──────────────────────────────────────────────────
export interface AnimalCard {
  no?: string;
  rarity?: number;
  animal_name: string;
  sci?: string;
  en?: string;
  search_nickname: string;
  kid_friendly_desc: string;
  status?: { label: string; code: string; color: string };
  taxonomy?: string;
  subspecies?: string;
  info?: [string, string, string][];
  facts?: string[];
  key_feature?: string[];
  image_prompt?: string;
  image_path: string;
  card_path?: string;
  filters: Record<string, string[]>;
}

// ── 찾기 카테고리 (8가지 특징) ──────────────────────────────────────
const FILTER_CATEGORIES = [
  {
    id: "diet", emoji: "🍽️", title: "무엇을 먹나요",
    selected: "bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-500/30",
    tags: ["곤충을 먹는", "물고기를 먹는", "초식", "육식", "잡식", "썩은 것 먹는", "꿀을 먹는", "씨앗을 먹는"],
  },
  {
    id: "color", emoji: "🎨", title: "무슨 색깔인가요",
    selected: "bg-pink-500 text-white border-pink-500 shadow-sm shadow-pink-500/30",
    tags: ["분홍색", "파란색", "빨간색", "초록색", "검정색", "흰색", "투명한", "알록달록한"],
  },
  {
    id: "size", emoji: "📏", title: "얼마나 큰가요",
    selected: "bg-sky-500 text-white border-sky-500 shadow-sm shadow-sky-500/30",
    tags: ["손보다 작은", "손바닥만한", "고양이만한", "사람만한", "코끼리만한", "버스만한", "세상 가장 작은", "세상 가장 큰"],
  },
  {
    id: "habitat", emoji: "🌍", title: "어디에 사나요",
    selected: "bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-500/30",
    tags: ["바다", "강·호수", "사막", "열대우림", "극지방", "초원", "동굴", "도시 근처"],
  },
  {
    id: "feature", emoji: "⚡", title: "특별한 능력",
    selected: "bg-yellow-500 text-white border-yellow-500 shadow-sm shadow-yellow-500/30",
    tags: ["날 수 있는", "독이 있는", "야행성", "보호색", "변장하는", "엄청 빠른", "엄청 느린", "빛을 내는"],
  },
  {
    id: "body", emoji: "🦴", title: "몸은 어떻게 생겼나요",
    selected: "bg-violet-500 text-white border-violet-500 shadow-sm shadow-violet-500/30",
    tags: ["다리가 없는", "다리가 4개인", "다리가 6개+", "날개 있는", "딱딱한 껍질", "뿔이 있는", "긴 꼬리", "긴 목"],
  },
  {
    id: "behavior", emoji: "🤝", title: "어떻게 사나요",
    selected: "bg-cyan-500 text-white border-cyan-500 shadow-sm shadow-cyan-500/30",
    tags: ["혼자 사는", "무리지어 사는", "겨울잠 자는", "철새처럼 이동", "알을 낳는", "새끼를 낳는", "동굴에 사는", "나무 위에 사는"],
  },
  {
    id: "taxonomy", emoji: "🗂️", title: "어떤 종류인가요",
    selected: "bg-lime-500 text-white border-lime-500 shadow-sm shadow-lime-500/30",
    tags: ["포유류", "조류", "파충류", "어류", "양서류", "곤충", "갑각류", "연체동물"],
  },
];

// 상세 모달의 속성 칩 색(연한 톤)
const CAT_CHIP: Record<string, string> = {
  diet: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800",
  color: "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800",
  size: "bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800",
  habitat: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  feature: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
  body: "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800",
  behavior: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800",
  taxonomy: "bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-300 border-lime-200 dark:border-lime-800",
};

// 상세 모달용 짧은 라벨
const CAT_SHORT: Record<string, string> = {
  diet: "먹이", color: "색깔", size: "크기", habitat: "사는 곳",
  feature: "특징", body: "몸", behavior: "생활", taxonomy: "종류",
};

// 태그 → 카테고리 빠른 조회(예시 적용용)
const TAG_TO_CAT: Record<string, string> = {};
FILTER_CATEGORIES.forEach((c) => c.tags.forEach((t) => { TAG_TO_CAT[t] = c.id; }));

// 빠른 예시(누르면 바로 조건 적용)
const EXAMPLES = [
  { label: "분홍색 + 작은", emoji: "🦩", filters: ["분홍색", "손보다 작은"] },
  { label: "곤충 먹는 + 야행성", emoji: "🦇", filters: ["곤충을 먹는", "야행성"] },
  { label: "독이 있는 + 파란색", emoji: "🐙", filters: ["독이 있는", "파란색"] },
  { label: "극지방 + 흰색", emoji: "🐻‍❄️", filters: ["극지방", "흰색"] },
  { label: "바다에 사는 포유류", emoji: "🐬", filters: ["바다", "포유류"] },
];

export default function AnimalPageClient({ cards = [] }: { cards?: AnimalCard[] }) {
  const [selected, setSelected] = useState<Record<string, Set<string>>>({});
  const [detail, setDetail] = useState<AnimalCard | null>(null);
  const [query, setQuery] = useState("");
  const resultRef = useRef<HTMLDivElement>(null);

  function toggleTag(catId: string, tag: string) {
    setSelected((prev) => {
      const cur = new Set(prev[catId] || []);
      if (cur.has(tag)) cur.delete(tag); else cur.add(tag);
      return { ...prev, [catId]: cur };
    });
  }
  function isSelected(catId: string, tag: string) {
    return (selected[catId] || new Set()).has(tag);
  }
  function clearAll() { setSelected({}); setQuery(""); }

  function applyExample(filters: string[]) {
    const next: Record<string, Set<string>> = {};
    filters.forEach((t) => {
      const cid = TAG_TO_CAT[t];
      if (cid) (next[cid] = next[cid] || new Set()).add(t);
    });
    setSelected(next);
    setQuery("");
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }

  const allSelected = FILTER_CATEGORIES.flatMap((cat) =>
    [...(selected[cat.id] || [])].map((tag) => ({ catId: cat.id, tag, cat }))
  );

  // ── 매칭: 카테고리 간 AND, 카테고리 내 OR + 이름 검색 ──
  const q = query.trim().toLowerCase();
  const matched = cards.filter((card) => {
    if (q) {
      const hay = (card.animal_name + " " + card.search_nickname).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    for (const cat of FILTER_CATEGORIES) {
      const picks = selected[cat.id];
      if (!picks || picks.size === 0) continue;
      const cardTags = (card.filters && card.filters[cat.id]) || [];
      if (![...picks].some((t) => cardTags.includes(t))) return false;
    }
    return true;
  });
  const hasFilter = allSelected.length > 0 || q.length > 0;

  return (
    <main className="w-full min-h-screen bg-white dark:bg-black transition-colors duration-500 relative overflow-x-hidden font-sans">
      <div className="absolute top-0 left-0 w-full h-[420px] bg-gradient-to-b from-[#FEEBD0]/40 via-[#FFF5EB]/20 to-transparent dark:from-[#8F4B10]/10 dark:to-black/0 pointer-events-none z-0" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-6 pt-20 pb-16">

        {/* ── 히어로 ── */}
        <section className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF5EB] dark:bg-orange-950/30 border border-[#FDD5A5] dark:border-[#B35E15] text-[#E8832E] dark:text-[#FBAA60] text-xs font-bold mb-5">
            <BookOpen className="w-3 h-3" /><span>DORI 동물도감</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight mb-4 text-neutral-900 dark:text-white break-keep">
            궁금한 특징을 고르면<br className="hidden md:block" />
            <span className="bg-gradient-to-r from-[#F9954E] via-[#FBAA60] to-[#F9954E] bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">딱 맞는 동물</span>을 찾아줘요
          </h1>
          <p className="text-base md:text-lg font-medium text-neutral-600 dark:text-neutral-400 max-w-xl mx-auto leading-relaxed break-keep">
            색깔·먹이·크기·사는 곳… 원하는 특징을 톡톡 누르기만 하면 돼요.
            포켓몬 도감처럼, 진짜 동물을 재미있게 만나보세요. 🐾
          </p>
        </section>

        {/* ── 3단계 설명 ── */}
        <section className="grid grid-cols-3 gap-3 mb-10 max-w-2xl mx-auto">
          {[
            { n: "1", t: "특징 고르기", d: "색깔·먹이·크기 등 누르기", e: "👆" },
            { n: "2", t: "동물 찾기", d: "조건에 맞는 동물 등장", e: "🔎" },
            { n: "3", t: "카드 펼치기", d: "눌러서 자세히 알아보기", e: "📖" },
          ].map((s) => (
            <div key={s.n} className="rounded-2xl bg-white dark:bg-zinc-900 border border-neutral-100 dark:border-zinc-800 p-3 text-center">
              <div className="text-2xl mb-1">{s.e}</div>
              <div className="text-[13px] font-extrabold text-neutral-900 dark:text-white">{s.t}</div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 break-keep leading-tight">{s.d}</div>
            </div>
          ))}
        </section>

        {/* ── 빠른 예시 ── */}
        <section className="mb-7">
          <p className="text-[13px] font-bold text-neutral-500 dark:text-neutral-400 mb-2.5">✨ 이렇게 찾아보세요 — 누르면 바로 적용돼요</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.label}
                onClick={() => applyExample(ex.filters)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-700 text-[13px] font-bold text-neutral-700 dark:text-neutral-200 hover:border-[#F9954E] hover:text-[#E8832E] dark:hover:text-[#FBAA60] hover:-translate-y-0.5 transition-all"
              >
                <span>{ex.emoji}</span> {ex.label}
              </button>
            ))}
          </div>
        </section>

        {/* ── 특징 고르기(칩 섹션) ── */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl md:text-2xl font-extrabold text-neutral-900 dark:text-white">🎯 특징 골라 찾기</h2>
            {allSelected.length > 0 && (
              <button onClick={clearAll} className="inline-flex items-center gap-1 text-[13px] font-bold text-neutral-500 dark:text-neutral-400 hover:text-red-500 transition-colors">
                <RotateCcw className="w-3.5 h-3.5" /> 전체 초기화
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {FILTER_CATEGORIES.map((cat) => {
              const count = (selected[cat.id] || new Set()).size;
              return (
                <div key={cat.id} className="rounded-2xl bg-white dark:bg-zinc-900 border border-neutral-100 dark:border-zinc-800 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">{cat.emoji}</span>
                    <h3 className="font-extrabold text-[14px] text-neutral-900 dark:text-white">{cat.title}</h3>
                    {count > 0 && <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-[#F9954E] text-white">{count}</span>}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.tags.map((tag) => {
                      const sel = isSelected(cat.id, tag);
                      return (
                        <button
                          key={tag}
                          onClick={() => toggleTag(cat.id, tag)}
                          className={`text-[12.5px] font-bold px-3 py-1.5 rounded-full border transition-all active:scale-95 ${
                            sel ? cat.selected : "bg-neutral-50 dark:bg-zinc-800 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-zinc-700 hover:border-[#F9954E]"
                          }`}
                        >
                          {sel && "✓ "}{tag}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 결과 ── */}
        <section ref={resultRef} className="mb-16 scroll-mt-20">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
            <div>
              <h2 className="text-xl md:text-2xl font-extrabold text-neutral-900 dark:text-white">
                🐾 {hasFilter ? `이런 동물을 찾았어요 (${matched.length})` : `전체 동물 (${cards.length})`}
              </h2>
              <p className="text-neutral-500 dark:text-neutral-400 text-[13px] font-medium mt-0.5">
                {hasFilter ? "카드를 누르면 자세한 이야기를 볼 수 있어요" : "위에서 특징을 고르거나, 이름으로 바로 검색해보세요"}
              </p>
            </div>
            <div className="relative w-full sm:w-64 flex-shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="동물 이름으로 검색"
                className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-700 text-sm text-neutral-700 dark:text-neutral-200 placeholder:text-neutral-400 focus:outline-none focus:border-[#F9954E] focus:ring-2 focus:ring-[#F9954E]/20 transition"
              />
              {query && (
                <button onClick={() => setQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-red-500"><X className="w-4 h-4" /></button>
              )}
            </div>
          </div>

          {/* 선택된 조건 요약 */}
          {allSelected.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mb-5">
              {allSelected.map(({ catId, tag, cat }) => (
                <button key={catId + tag} onClick={() => toggleTag(catId, tag)} className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#F9954E]/15 text-[#E8832E] dark:text-[#FBAA60] border border-[#F9954E]/30 hover:bg-red-100 dark:hover:bg-red-900/20">
                  {cat.emoji} {tag} <X className="w-2.5 h-2.5" />
                </button>
              ))}
            </div>
          )}

          {cards.length === 0 ? (
            <div className="text-center py-20 bg-neutral-50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-neutral-200 dark:border-zinc-700">
              <div className="text-5xl mb-3">🐣</div>
              <p className="text-neutral-500 dark:text-neutral-400 font-medium">동물 데이터를 채우는 중이에요</p>
            </div>
          ) : matched.length === 0 ? (
            <div className="text-center py-20 bg-neutral-50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-neutral-200 dark:border-zinc-700">
              <div className="text-5xl mb-3">🔍</div>
              <p className="text-neutral-600 dark:text-neutral-300 font-bold mb-1">조건에 맞는 동물이 아직 없어요</p>
              <p className="text-neutral-400 dark:text-neutral-500 text-sm mb-4">특징을 조금 줄여보면 더 많이 찾을 수 있어요</p>
              <button onClick={clearAll} className="text-sm font-bold text-[#E8832E] dark:text-[#FBAA60] hover:underline">전체 초기화</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {matched.map((card, i) => (
                <motion.button
                  key={card.animal_name}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.4) }}
                  onClick={() => setDetail(card)}
                  className="group text-left bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-2xl overflow-hidden hover:border-[#F9954E] hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100 dark:bg-zinc-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={card.image_path} alt={card.animal_name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={(e) => { e.currentTarget.style.opacity = "0.15"; }} />
                    {card.no && <span className="absolute top-2 left-2 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-black/55 text-[#f0d28a] backdrop-blur-sm">No.{card.no}</span>}
                    {card.status?.code && <span className="absolute top-2 right-2 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md text-white shadow" style={{ background: card.status.color }}>{card.status.code}</span>}
                  </div>
                  <div className="p-3">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <div className="font-bold text-sm text-neutral-900 dark:text-white truncate">{card.animal_name}</div>
                      {typeof card.rarity === "number" && <span className="text-[10px] text-[#F9954E] shrink-0 tracking-tighter">{"★".repeat(card.rarity)}{"☆".repeat(5 - card.rarity)}</span>}
                    </div>
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug line-clamp-2 break-keep">{card.search_nickname}</div>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </section>

        {/* ── 하단 안내 ── */}
        <section>
          <div className="bg-gradient-to-br from-[#FFF5EB] to-[#FEEBD0] dark:from-orange-950/30 dark:to-orange-900/10 border border-[#FDD5A5] dark:border-orange-800/30 rounded-3xl p-8 text-center">
            <div className="text-4xl mb-3">🐾</div>
            <h2 className="text-xl md:text-2xl font-extrabold text-neutral-900 dark:text-white mb-2">동물 친구가 계속 늘어나요</h2>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed max-w-md mx-auto break-keep">
              지금도 새로운 동물 카드가 하나씩 추가되고 있어요.<br className="hidden md:block" />
              자주 들러서 새 친구를 만나보세요!
            </p>
          </div>
        </section>
      </div>

      {/* ── 동물 상세(설명 페이지) ── */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setDetail(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl"
          >
            <button onClick={() => setDetail(null)} className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/90 dark:bg-zinc-800/90 text-neutral-600 dark:text-neutral-300 hover:bg-red-500 hover:text-white transition shadow-md"><X className="w-5 h-5" /></button>
            <div className="grid md:grid-cols-2 gap-0">
              <div className="relative aspect-[4/5] md:aspect-auto md:min-h-[420px] bg-neutral-100 dark:bg-zinc-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={detail.image_path} alt={detail.animal_name} className="absolute inset-0 w-full h-full object-cover md:rounded-l-3xl" onError={(e) => { e.currentTarget.style.opacity = "0.15"; }} />
              </div>
              <div className="p-6 md:p-7 flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FFF5EB] dark:bg-orange-950/30 border border-[#FDD5A5] dark:border-[#B35E15] text-[#E8832E] dark:text-[#FBAA60] text-[11px] font-bold w-fit">
                    <Sparkles className="w-3 h-3" /> 도감{detail.no ? ` No.${detail.no}` : ""}
                  </div>
                  {typeof detail.rarity === "number" && <span className="text-[12px] text-[#F9954E] tracking-tighter" title="희귀도">{"★".repeat(detail.rarity)}{"☆".repeat(5 - detail.rarity)}</span>}
                </div>
                <h3 className="text-2xl font-black text-neutral-900 dark:text-white">{detail.animal_name}</h3>
                {detail.sci && <p className="italic text-sm text-neutral-500 dark:text-neutral-400">{detail.sci}{detail.en ? ` · ${detail.en}` : ""}</p>}
                <p className="text-[#E8832E] dark:text-[#FBAA60] text-sm font-bold mt-1.5 mb-3 break-keep">&ldquo;{detail.search_nickname}&rdquo;</p>
                {detail.status && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full text-white" style={{ background: detail.status.color }}>{detail.status.label} · IUCN {detail.status.code}</span>
                  </div>
                )}
                <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed mb-4 break-keep">{detail.kid_friendly_desc}</p>
                {detail.info && detail.info.length > 0 && (
                  <div className="flex flex-col gap-2 mb-4">
                    {detail.info.map(([ic, k, v], idx) => (
                      <div key={idx} className="flex items-start gap-2 text-[13px]">
                        <span className="w-5 text-center flex-shrink-0">{ic}</span>
                        <span className="font-bold text-neutral-600 dark:text-neutral-300 w-12 flex-shrink-0">{k}</span>
                        <span className="text-neutral-600 dark:text-neutral-400 break-keep">{v}</span>
                      </div>
                    ))}
                  </div>
                )}
                {detail.facts && detail.facts.length > 0 && (
                  <div className="bg-[#FFF9F0] dark:bg-orange-950/20 border border-[#FDE3C0] dark:border-orange-900/30 rounded-2xl p-3.5 mb-4">
                    <p className="text-[11px] font-extrabold text-[#E8832E] dark:text-[#FBAA60] mb-2">🔎 알고 보면 더 흥미로운</p>
                    <ul className="space-y-1.5">
                      {detail.facts.map((f, idx) => (
                        <li key={idx} className="text-[12.5px] text-neutral-600 dark:text-neutral-300 leading-snug break-keep pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-[#F9954E]">{f}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {detail.taxonomy && <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mb-1.5 leading-relaxed break-keep"><b className="text-neutral-500 dark:text-neutral-400">분류 </b>{detail.taxonomy}</p>}
                {detail.subspecies && <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mb-4 break-keep"><b className="text-neutral-500 dark:text-neutral-400">하위종 </b>{detail.subspecies}</p>}
                <div className="mt-auto pt-2 space-y-2">
                  {FILTER_CATEGORIES.map((cat) => {
                    const tags = detail.filters?.[cat.id] || [];
                    if (tags.length === 0) return null;
                    return (
                      <div key={cat.id} className="flex items-start gap-2">
                        <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 w-16 flex-shrink-0 pt-0.5">{cat.emoji} {CAT_SHORT[cat.id]}</span>
                        <div className="flex flex-wrap gap-1">
                          {tags.map((t) => <span key={t} className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${CAT_CHIP[cat.id]}`}>{t}</span>)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <style jsx global>{`
        @keyframes gradient { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        .animate-gradient { animation: gradient 3s ease infinite; }
      `}</style>
    </main>
  );
}
