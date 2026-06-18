"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Sparkles, Search, X, RotateCcw, SlidersHorizontal, ChevronDown, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";

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

// ── 종류(타입) 단일 소스 — pill·카드 배지·모달 칩이 공유 ──────────────
const TYPES: { label: string; hex: string; emoji: string }[] = [
  { label: "포유류", hex: "#B5764A", emoji: "🦊" },
  { label: "조류", hex: "#4E97C7", emoji: "🐦" },
  { label: "파충류", hex: "#6BA368", emoji: "🦎" },
  { label: "어류", hex: "#2FA6A0", emoji: "🐟" },
  { label: "양서류", hex: "#86A642", emoji: "🐸" },
  { label: "곤충", hex: "#C79A3C", emoji: "🐛" },
  { label: "갑각류", hex: "#C56B4E", emoji: "🦀" },
  { label: "연체동물", hex: "#8C6BB1", emoji: "🐙" },
];
const TYPE_MAP: Record<string, { hex: string; emoji: string }> = {};
TYPES.forEach((t) => { TYPE_MAP[t.label] = { hex: t.hex, emoji: t.emoji }; });

// ── 상세 찾기 카테고리 (종류 제외 7축) ─────────────────────────────
const FILTER_CATEGORIES = [
  {
    id: "diet", emoji: "🍽️", title: "무엇을 먹나요",
    selected: "bg-orange-500 text-white border-orange-500",
    tags: ["곤충을 먹는", "물고기를 먹는", "초식", "육식", "잡식", "썩은 것 먹는", "꿀을 먹는", "씨앗을 먹는"],
  },
  {
    id: "color", emoji: "🎨", title: "무슨 색깔인가요",
    selected: "bg-pink-500 text-white border-pink-500",
    tags: ["분홍색", "파란색", "빨간색", "초록색", "검정색", "흰색", "투명한", "알록달록한"],
  },
  {
    id: "size", emoji: "📏", title: "얼마나 큰가요",
    selected: "bg-sky-500 text-white border-sky-500",
    tags: ["손보다 작은", "손바닥만한", "고양이만한", "사람만한", "코끼리만한", "버스만한", "세상 가장 작은", "세상 가장 큰"],
  },
  {
    id: "habitat", emoji: "🌍", title: "어디에 사나요",
    selected: "bg-emerald-500 text-white border-emerald-500",
    tags: ["바다", "강·호수", "사막", "열대우림", "극지방", "초원", "동굴", "도시 근처"],
  },
  {
    id: "feature", emoji: "⚡", title: "특별한 능력",
    selected: "bg-yellow-500 text-white border-yellow-500",
    tags: ["날 수 있는", "독이 있는", "야행성", "보호색", "변장하는", "엄청 빠른", "엄청 느린", "빛을 내는"],
  },
  {
    id: "body", emoji: "🦴", title: "몸은 어떻게 생겼나요",
    selected: "bg-violet-500 text-white border-violet-500",
    tags: ["다리가 없는", "다리가 4개인", "다리가 6개+", "날개 있는", "딱딱한 껍질", "뿔이 있는", "긴 꼬리", "긴 목"],
  },
  {
    id: "behavior", emoji: "🤝", title: "어떻게 사나요",
    selected: "bg-cyan-500 text-white border-cyan-500",
    tags: ["혼자 사는", "무리지어 사는", "겨울잠 자는", "철새처럼 이동", "알을 낳는", "새끼를 낳는", "동굴에 사는", "나무 위에 사는"],
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
const ALL_CATS = [...FILTER_CATEGORIES, { id: "taxonomy", emoji: "🗂️", title: "어떤 종류인가요", selected: "", tags: TYPES.map((t) => t.label) }];

// 재생성됐지만 파일명이 같아 브라우저 캐시에 막힌 이미지 — 쿼리로 캐시 무효화
const BUSTED_SLUGS = new Set(["spider-monkey", "gibbon", "ocean-sunfish"]);
function imgUrl(p?: string) {
  if (!p) return p || "";
  const slug = (p.split("/").pop() || "").replace(/\.jpg$/, "");
  return BUSTED_SLUGS.has(slug) ? `${p}?v=2` : p;
}

export default function AnimalPageClient({ cards = [] }: { cards?: AnimalCard[] }) {
  const [selected, setSelected] = useState<Record<string, Set<string>>>({});
  const [detail, setDetail] = useState<AnimalCard | null>(null);
  const [zoomImg, setZoomImg] = useState<{ src: string; name: string } | null>(null);
  const [query, setQuery] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [sort, setSort] = useState<"no" | "name">("no");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(16); // 4줄 기준: 모바일2열=8, 태블릿3열=12, 데스크탑4열=16
  const resultRef = useRef<HTMLDivElement>(null);

  // 화면 너비에 따라 "4줄"이 되도록 페이지당 개수 조정
  useEffect(() => {
    const calc = () => {
      const w = window.innerWidth;
      setPerPage(w < 640 ? 8 : w < 1024 ? 12 : 16);
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  // 종류별 보유 동물 수(1회 산출)
  const typeCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const c of cards) for (const t of c.filters?.taxonomy || []) m[t] = (m[t] || 0) + 1;
    return m;
  }, [cards]);

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
  function clearAll() { setSelected({}); setQuery(""); } // 정렬(취향)은 보존

  // 선택된 모든 조건(요약칩용)
  const allSelected = ALL_CATS.flatMap((cat) =>
    [...(selected[cat.id] || [])].map((tag) => ({ catId: cat.id, tag, cat }))
  );
  const advancedCount = FILTER_CATEGORIES.reduce((n, c) => n + (selected[c.id]?.size || 0), 0);

  // ── 매칭: 카테고리 간 AND, 카테고리 내 OR + 이름/별명/영문 검색 ──
  const q = query.trim().toLowerCase();
  const matched = cards.filter((card) => {
    if (q) {
      const hay = (card.animal_name + " " + card.search_nickname + " " + (card.en || "")).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    for (const cat of ALL_CATS) {
      const picks = selected[cat.id];
      if (!picks || picks.size === 0) continue;
      const cardTags = (card.filters && card.filters[cat.id]) || [];
      if (![...picks].some((t) => cardTags.includes(t))) return false;
    }
    return true;
  });
  const sorted = [...matched].sort((a, b) =>
    sort === "name"
      ? a.animal_name.localeCompare(b.animal_name, "ko")
      : (a.no || "9999").localeCompare(b.no || "9999")
  );
  const hasFilter = allSelected.length > 0 || q.length > 0;

  // ── 페이지네이션 (무한스크롤 X, 4줄씩 끊어 다음 페이지로) ──
  const filterSig = allSelected.map((s) => s.catId + s.tag).join("|") + "#" + q + "#" + sort;
  useEffect(() => { setPage(1); }, [filterSig]);
  const pageCount = Math.max(1, Math.ceil(sorted.length / perPage));
  const safePage = Math.min(page, pageCount);
  const pageItems = sorted.slice((safePage - 1) * perPage, safePage * perPage);
  function goPage(p: number) {
    const np = Math.min(Math.max(1, p), pageCount);
    setPage(np);
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 30);
  }
  function pageList(cur: number, total: number): (number | "…")[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const out: (number | "…")[] = [1];
    if (cur > 4) out.push("…");
    for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) out.push(i);
    if (cur < total - 3) out.push("…");
    out.push(total);
    return out;
  }

  // 빈 결과가 "0마리인 종류만 골라서" 생긴 경우 분기
  const taxPicks = [...(selected.taxonomy || [])];
  const onlyEmptyTypes =
    !q && advancedCount === 0 && taxPicks.length > 0 && taxPicks.every((t) => (typeCounts[t] || 0) === 0);

  return (
    <main className="w-full min-h-screen bg-white dark:bg-black transition-colors duration-500 relative overflow-x-hidden font-sans">
      <div className="absolute top-0 left-0 w-full h-[380px] bg-gradient-to-b from-[#FEEBD0]/40 via-[#FFF5EB]/20 to-transparent dark:from-[#8F4B10]/10 dark:to-black/0 pointer-events-none z-0" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-6 pt-20 pb-16">

        {/* ── 컴팩트 히어로 ── */}
        <section className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF5EB] dark:bg-orange-950/30 border border-[#FDD5A5] dark:border-[#B35E15] text-[#E8832E] dark:text-[#FBAA60] text-xs font-bold mb-4">
            <BookOpen className="w-3 h-3" /><span>DORI 동물도감</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight leading-tight mb-2.5 text-neutral-900 dark:text-white break-keep">
            궁금한 <span className="bg-gradient-to-r from-[#F9954E] via-[#FBAA60] to-[#F9954E] bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">동물</span>을 찾아보세요
          </h1>
          <p className="text-sm md:text-base font-medium text-neutral-600 dark:text-neutral-400 max-w-xl mx-auto leading-relaxed break-keep">
            이름으로 찾거나, 종류와 특징으로 골라보세요. 진짜 동물을 도감처럼 만나봐요 🐾
          </p>
        </section>

        {/* ── 큰 검색바 (sticky) ── */}
        <div className="sticky top-16 z-30 -mx-4 px-4 md:-mx-6 md:px-6 py-3 bg-white/85 dark:bg-black/85 backdrop-blur-md mb-6">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="동물 이름이나 별명으로 찾아보세요"
              className="w-full pl-12 pr-11 py-3.5 rounded-2xl bg-white dark:bg-zinc-900 border-2 border-neutral-200 dark:border-zinc-700 text-base text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-[#F9954E] focus:ring-4 focus:ring-[#F9954E]/15 transition shadow-sm"
            />
            {query && (
              <button onClick={() => setQuery("")} aria-label="검색어 지우기" className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 dark:hover:bg-zinc-800 hover:text-red-500 transition"><X className="w-4 h-4" /></button>
            )}
          </div>
        </div>

        {/* ── 종류로 찾기 (시그니처 색 pill) ── */}
        <section className="mb-5">
          <div className="flex items-baseline gap-2 mb-3">
            <h2 className="text-lg md:text-xl font-extrabold text-neutral-900 dark:text-white">🗂️ 종류로 찾기</h2>
            <span className="text-[12px] font-medium text-neutral-400 dark:text-neutral-500">여러 개 골라도 돼요</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {TYPES.map((t) => {
              const sel = isSelected("taxonomy", t.label);
              const cnt = typeCounts[t.label] || 0;
              const dim = cnt === 0;
              return (
                <button
                  key={t.label}
                  onClick={() => toggleTag("taxonomy", t.label)}
                  className={`relative inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border-2 font-extrabold text-[13.5px] transition-all active:scale-95 ${dim && !sel ? "opacity-45" : ""}`}
                  style={
                    sel
                      ? { background: t.hex, borderColor: t.hex, color: "#fff", boxShadow: `0 5px 16px ${t.hex}55` }
                      : { background: t.hex + "1A", borderColor: t.hex + "40", color: t.hex }
                  }
                >
                  <span className="text-[15px]">{t.emoji}</span>
                  {t.label}
                  <span
                    className="text-[10.5px] font-bold px-1.5 py-0.5 rounded-full leading-none"
                    style={sel ? { background: "rgba(255,255,255,.25)", color: "#fff" } : { background: t.hex + "26", color: t.hex }}
                  >
                    {cnt}
                  </span>
                  {sel && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-white text-[10px] font-black flex items-center justify-center shadow" style={{ color: t.hex }}>✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── 자세히 찾기(상세 7축) 토글 ── */}
        <section className="mb-7">
          <button
            onClick={() => setShowAdvanced((v) => !v)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 text-[14px] font-bold text-neutral-700 dark:text-neutral-200 hover:border-[#F9954E] transition-all"
          >
            <SlidersHorizontal className="w-4 h-4" />
            자세히 찾기
            <span className="text-[12px] text-neutral-400">(먹이·색깔·크기·특징…)</span>
            {advancedCount > 0 && <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-[#F9954E] text-white">{advancedCount}</span>}
            <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence initial={false}>
            {showAdvanced && (
              <motion.div
                key="adv"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-4">
                  {FILTER_CATEGORIES.map((cat) => {
                    const count = selected[cat.id]?.size || 0;
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
                                  sel ? cat.selected + " shadow-sm" : "bg-neutral-50 dark:bg-zinc-800 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-zinc-700 hover:border-[#F9954E]"
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
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* ── 결과 헤더 ── */}
        <section ref={resultRef} className="mb-16 scroll-mt-20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-xl md:text-2xl font-extrabold text-neutral-900 dark:text-white">
                🐾 {hasFilter ? `${sorted.length}마리를 찾았어요` : `전체 ${cards.length}마리`}
              </h2>
              <p className="text-neutral-500 dark:text-neutral-400 text-[13px] font-medium mt-0.5">
                {hasFilter ? "카드를 누르면 자세한 이야기를 볼 수 있어요" : "검색하거나, 종류·특징을 골라보세요"}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {hasFilter && (
                <button onClick={clearAll} className="inline-flex items-center gap-1 text-[13px] font-bold text-neutral-500 dark:text-neutral-400 hover:text-red-500 transition-colors">
                  <RotateCcw className="w-3.5 h-3.5" /> 초기화
                </button>
              )}
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as "no" | "name")}
                  aria-label="정렬"
                  className="appearance-none pl-3 pr-8 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-700 text-[13px] font-bold text-neutral-700 dark:text-neutral-200 focus:outline-none focus:border-[#F9954E] cursor-pointer"
                >
                  <option value="no">도감번호순</option>
                  <option value="name">이름순</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* 선택된 조건 요약 */}
          {allSelected.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mb-5">
              {allSelected.map(({ catId, tag, cat }) => {
                const isTax = catId === "taxonomy";
                const tm = isTax ? TYPE_MAP[tag] : null;
                return (
                  <button
                    key={catId + tag}
                    onClick={() => toggleTag(catId, tag)}
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border transition ${isTax ? "text-white" : cat.selected}`}
                    style={isTax && tm ? { background: tm.hex, borderColor: tm.hex } : undefined}
                  >
                    {isTax && tm ? tm.emoji : cat.emoji} {tag} <X className="w-2.5 h-2.5" />
                  </button>
                );
              })}
            </div>
          )}

          {cards.length === 0 ? (
            <div className="text-center py-20 bg-neutral-50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-neutral-200 dark:border-zinc-700">
              <div className="text-5xl mb-3">🐣</div>
              <p className="text-neutral-500 dark:text-neutral-400 font-medium">동물 데이터를 채우는 중이에요</p>
            </div>
          ) : sorted.length === 0 ? (
            <div className="text-center py-20 bg-neutral-50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-neutral-200 dark:border-zinc-700">
              <div className="text-5xl mb-3">{onlyEmptyTypes ? "🥚" : "🔍"}</div>
              {onlyEmptyTypes ? (
                <>
                  <p className="text-neutral-600 dark:text-neutral-300 font-bold mb-1">{taxPicks.join("·")} 친구는 곧 도감에 들어올 거예요</p>
                  <p className="text-neutral-400 dark:text-neutral-500 text-sm mb-4">다른 종류도 구경해볼까요?</p>
                </>
              ) : (
                <>
                  <p className="text-neutral-600 dark:text-neutral-300 font-bold mb-1">아직 이 조건에 맞는 친구가 없어요</p>
                  <p className="text-neutral-400 dark:text-neutral-500 text-sm mb-4">조건을 조금 줄이면 더 많이 찾을 수 있어요</p>
                </>
              )}
              <button onClick={clearAll} className="text-sm font-bold text-[#E8832E] dark:text-[#FBAA60] hover:underline">전체 초기화</button>
            </div>
          ) : (
            <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {pageItems.map((card, i) => {
                const tax = card.filters?.taxonomy?.[0];
                const tm = tax ? TYPE_MAP[tax] : null;
                return (
                  <motion.button
                    key={card.no ?? card.animal_name}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.4) }}
                    onClick={() => setDetail(card)}
                    className="group text-left bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-2xl overflow-hidden hover:border-[#F9954E] hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100 dark:bg-zinc-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imgUrl(card.image_path)} alt={card.animal_name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={(e) => { e.currentTarget.style.opacity = "0.15"; }} />
                      {card.no && <span className="absolute top-2 left-2 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-black/55 text-[#f0d28a] backdrop-blur-sm">No.{card.no}</span>}
                      {card.status?.code && <span className="absolute top-2 right-2 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md text-white shadow" style={{ background: card.status.color }}>{card.status.code}</span>}
                      {tax && tm && (
                        <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md text-white shadow" style={{ background: tm.hex }}>
                          {tm.emoji} {tax}
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <div className="font-bold text-sm text-neutral-900 dark:text-white truncate">{card.animal_name}</div>
                        {typeof card.rarity === "number" && <span className="text-[10px] text-[#F9954E] shrink-0 tracking-tighter">{"★".repeat(card.rarity)}{"☆".repeat(5 - card.rarity)}</span>}
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug line-clamp-2 break-keep">{card.search_nickname}</div>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {pageCount > 1 && (
              <nav className="flex flex-wrap items-center justify-center gap-1.5 mt-9" aria-label="페이지">
                <button
                  onClick={() => goPage(safePage - 1)}
                  disabled={safePage === 1}
                  className="inline-flex items-center gap-0.5 h-9 pl-2 pr-3 rounded-xl text-[13px] font-bold border border-neutral-200 dark:border-zinc-700 text-neutral-600 dark:text-neutral-300 enabled:hover:border-[#F9954E] enabled:hover:text-[#E8832E] disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="w-4 h-4" /> 이전
                </button>
                {pageList(safePage, pageCount).map((p, idx) =>
                  p === "…" ? (
                    <span key={"e" + idx} className="w-9 h-9 flex items-center justify-center text-neutral-400 text-sm">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => goPage(p)}
                      aria-current={p === safePage ? "page" : undefined}
                      className={`w-9 h-9 rounded-xl text-[13.5px] font-extrabold border transition ${
                        p === safePage
                          ? "bg-[#F9954E] text-white border-[#F9954E] shadow-sm shadow-[#F9954E]/30"
                          : "bg-white dark:bg-zinc-900 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-zinc-700 hover:border-[#F9954E] hover:text-[#E8832E]"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
                <button
                  onClick={() => goPage(safePage + 1)}
                  disabled={safePage === pageCount}
                  className="inline-flex items-center gap-0.5 h-9 pl-3 pr-2 rounded-xl text-[13px] font-bold border border-neutral-200 dark:border-zinc-700 text-neutral-600 dark:text-neutral-300 enabled:hover:border-[#F9954E] enabled:hover:text-[#E8832E] disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  다음 <ChevronRight className="w-4 h-4" />
                </button>
              </nav>
            )}
            {pageCount > 1 && (
              <p className="text-center text-[12px] text-neutral-400 dark:text-neutral-500 mt-3">
                {safePage} / {pageCount} 페이지 · 전체 {sorted.length}마리
              </p>
            )}
            </>
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
              <button
                type="button"
                onClick={() => setZoomImg({ src: detail.image_path, name: detail.animal_name })}
                className="group/img relative w-full aspect-[3/4] md:self-start bg-neutral-100 dark:bg-zinc-800 cursor-zoom-in overflow-hidden md:rounded-l-3xl"
                aria-label="이미지 크게 보기"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imgUrl(detail.image_path)} alt={detail.animal_name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-105" onError={(e) => { e.currentTarget.style.opacity = "0.15"; }} />
                <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/55 text-white text-[11px] font-bold backdrop-blur-sm opacity-90 group-hover/img:bg-black/70 transition">
                  <Maximize2 className="w-3 h-3" /> 크게 보기
                </span>
              </button>
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
                  {ALL_CATS.map((cat) => {
                    const tags = detail.filters?.[cat.id] || [];
                    if (tags.length === 0) return null;
                    const isTax = cat.id === "taxonomy";
                    return (
                      <div key={cat.id} className="flex items-start gap-2">
                        <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 w-16 flex-shrink-0 pt-0.5">{cat.emoji} {CAT_SHORT[cat.id]}</span>
                        <div className="flex flex-wrap gap-1">
                          {tags.map((t) => {
                            const tm = isTax ? TYPE_MAP[t] : null;
                            return tm ? (
                              <span key={t} className="text-[10px] font-bold px-2 py-0.5 rounded-md text-white" style={{ background: tm.hex }}>{tm.emoji} {t}</span>
                            ) : (
                              <span key={t} className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${CAT_CHIP[cat.id]}`}>{t}</span>
                            );
                          })}
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

      {/* ── 이미지 크게 보기(라이트박스) ── */}
      {zoomImg && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
          onClick={() => setZoomImg(null)}
        >
          <button
            onClick={() => setZoomImg(null)}
            aria-label="닫기"
            className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/30 transition"
          >
            <X className="w-6 h-6" />
          </button>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="flex flex-col items-center gap-3"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imgUrl(zoomImg.src)} alt={zoomImg.name} className="max-w-[92vw] max-h-[82vh] object-contain rounded-2xl shadow-2xl" onError={(e) => { e.currentTarget.style.opacity = "0.15"; }} />
            <p className="text-white/90 text-sm font-bold">{zoomImg.name}</p>
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
