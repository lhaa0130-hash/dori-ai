"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { BookOpen, Search, X, RotateCcw, ChevronDown, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";

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

// ── 종류(타입) 단일 소스 ─────────────────────────────────────────────
const TYPES: { label: string; hex: string; emoji: string }[] = [
  { label: "포유류", hex: "#B5764A", emoji: "🦊" },
  { label: "조류",   hex: "#4E97C7", emoji: "🐦" },
  { label: "파충류", hex: "#6BA368", emoji: "🦎" },
  { label: "어류",   hex: "#2FA6A0", emoji: "🐟" },
  { label: "양서류", hex: "#86A642", emoji: "🐸" },
  { label: "곤충",   hex: "#C79A3C", emoji: "🐛" },
  { label: "갑각류", hex: "#C56B4E", emoji: "🦀" },
  { label: "연체동물", hex: "#8C6BB1", emoji: "🐙" },
];
const TYPE_MAP: Record<string, { hex: string; emoji: string }> = {};
TYPES.forEach((t) => { TYPE_MAP[t.label] = { hex: t.hex, emoji: t.emoji }; });

// ── 간소화된 3개 필터 (먹이·색깔·수명) ──────────────────────────────
const SIMPLE_FILTERS = [
  {
    id: "diet", emoji: "🍽️", label: "먹이",
    cls: "bg-orange-500 text-white border-orange-500",
    chipCls: "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800",
    tags: ["초식", "육식", "잡식", "곤충을 먹는", "물고기를 먹는", "플랑크톤을 먹는", "꿀을 먹는", "씨앗을 먹는"],
  },
  {
    id: "color", emoji: "🎨", label: "색깔",
    cls: "bg-pink-500 text-white border-pink-500",
    chipCls: "bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800",
    tags: ["흰색", "검정색", "빨간색", "파란색", "초록색", "분홍색", "투명한", "알록달록한"],
  },
  {
    id: "lifespan", emoji: "⏳", label: "수명",
    cls: "bg-violet-500 text-white border-violet-500",
    chipCls: "bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800",
    tags: ["1년 이하", "1~5년", "5~20년", "20~50년", "50년 이상"],
  },
  {
    id: "weight", emoji: "⚖️", label: "몸무게",
    cls: "bg-cyan-500 text-white border-cyan-500",
    chipCls: "bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800",
    tags: ["100g 이하", "100g~1kg", "1~10kg", "10~50kg", "50~200kg", "200kg~1톤", "1톤 이상"],
  },
] as const;

// 모달 하단에 항상 표시할 3개 칩 (모든 동물 동일)
const MODAL_CHIPS = [
  { id: "taxonomy", label: "종류", emoji: "🗂️" },
  { id: "diet",     label: "먹이", emoji: "🍽️" },
  { id: "color",    label: "색깔", emoji: "🎨" },
];

// 모달 기본 정보 — 항상 4개 행을 동일하게 표시
const STD_INFO = [
  { key: "서식지", emoji: "🌍" },
  { key: "먹이",   emoji: "🍽️" },
  { key: "크기",   emoji: "📏" },
  { key: "몸무게", emoji: "⚖️" },
  { key: "수명",   emoji: "⏳" },
];

// 수명 텍스트 → 필터 카테고리 변환
function lifespanOf(card: AnimalCard): string | null {
  const item = card.info?.find((i) => i[1] === "수명");
  if (!item) return null;
  const nums = item[2].match(/\d+/g)?.map(Number) || [];
  if (!nums.length) return null;
  const max = Math.max(...nums);
  if (max <= 1)  return "1년 이하";
  if (max <= 5)  return "1~5년";
  if (max <= 20) return "5~20년";
  if (max <= 50) return "20~50년";
  return "50년 이상";
}

const BUSTED_SLUGS = new Set(["spider-monkey", "gibbon", "sloth", "japanese-giant-flying-squirrel", "cassowary", "andean-condor", "ocean-sunfish", "eel", "electric-eel", "piranha", "devil-fish", "flying-fish", "blackmouth-angler", "sea-anemone", "sea-urchin", "abalone", "scallop", "dragonfly", "cicada", "stag-beetle", "newt", "stick-insect", "earwig", "water-strider", "desert-tortoise", "star-nosed-mole", "naked-mole-rat", "smooth-hammerhead", "colugo", "firefly", "longhorn-beetle", "lionfish"]);
function imgUrl(p?: string) {
  if (!p) return "";
  const slug = (p.split("/").pop() || "").replace(/\.jpg$/, "");
  return BUSTED_SLUGS.has(slug) ? `${p}?v=5` : p;
}

export default function AnimalPageClient({ cards = [] }: { cards?: AnimalCard[] }) {
  const [selected, setSelected] = useState<Record<string, Set<string>>>({});
  const [detail, setDetail] = useState<AnimalCard | null>(null);
  const [zoomImg, setZoomImg] = useState<{ src: string; name: string } | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"no" | "name">("name"); // 가나다 기본, 번호순 토글 가능
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(16);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const calc = () => { const w = window.innerWidth; setPerPage(w < 640 ? 8 : w < 1024 ? 12 : 16); };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

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
  function isSelected(catId: string, tag: string) { return (selected[catId] || new Set()).has(tag); }
  function clearAll() { setSelected({}); setQuery(""); }

  // 선택된 조건 목록 (요약 칩용)
  const allSelected: { catId: string; tag: string }[] = [
    ...[...(selected["taxonomy"] || [])].map((tag) => ({ catId: "taxonomy", tag })),
    ...SIMPLE_FILTERS.flatMap((f) => [...(selected[f.id] || [])].map((tag) => ({ catId: f.id, tag }))),
  ];
  const hasFilter = allSelected.length > 0 || query.trim().length > 0;

  // ── 매칭: 종류·먹이·색깔 AND, 내부 OR + 수명 계산 매칭 ──
  const q = query.trim().toLowerCase();
  const matched = cards.filter((card) => {
    if (q) {
      const hay = (card.animal_name + " " + card.search_nickname + " " + (card.en || "")).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    // taxonomy
    const taxPicks = selected["taxonomy"];
    if (taxPicks?.size) {
      const ct = card.filters?.taxonomy || [];
      if (![...taxPicks].some((t) => ct.includes(t))) return false;
    }
    // diet, color, weight (filters 객체에서)
    for (const fid of ["diet", "color", "weight"] as const) {
      const picks = selected[fid];
      if (!picks?.size) continue;
      const ct = card.filters?.[fid] || [];
      if (![...picks].some((t) => ct.includes(t))) return false;
    }
    // lifespan (info 배열에서 계산)
    const lifePicks = selected["lifespan"];
    if (lifePicks?.size) {
      const cat = lifespanOf(card);
      if (!cat || !lifePicks.has(cat)) return false;
    }
    return true;
  });

  const sorted = [...matched].sort((a, b) =>
    sort === "name"
      ? a.animal_name.localeCompare(b.animal_name, "ko")
      : (a.no || "9999").localeCompare(b.no || "9999")
  );

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

  const detailKey = (c: AnimalCard | null) => (c ? String(c.no ?? c.animal_name) : "");
  const detailIdx = detail ? sorted.findIndex((c) => detailKey(c) === detailKey(detail)) : -1;
  const goDetail = (dir: number) => { if (detailIdx < 0) return; const n = sorted[detailIdx + dir]; if (n) setDetail(n); };
  const touchX = useRef<number | null>(null);
  useEffect(() => {
    if (!detail) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goDetail(-1);
      else if (e.key === "ArrowRight") goDetail(1);
      else if (e.key === "Escape") setDetail(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [detail, sorted]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main className="w-full min-h-screen">
      <div className="relative z-10 pt-8 pb-16">

        {/* ── 히어로 ── */}
        <section className="pb-6 border-b border-neutral-100 dark:border-zinc-900 mb-6">
          <p className="text-[11px] font-bold text-[#F9954E] mb-3 tracking-wide uppercase">몽글로 · AI 동물도감</p>
          <h1 className="text-[30px] sm:text-[40px] font-extrabold text-neutral-950 dark:text-white leading-[1.12] tracking-tight mb-2 break-keep">
            300종 동물을<br />아이 눈높이로 탐험해요
          </h1>
          <p className="text-[14px] text-neutral-400 dark:text-neutral-500 leading-relaxed break-keep">
            이름으로 찾거나 종류 · 먹이 · 색깔 · 수명 · 몸무게로 골라보세요
          </p>
        </section>

        {/* ── 검색바 (sticky) ── */}
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
              <button onClick={() => setQuery("")} aria-label="검색어 지우기" className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 dark:hover:bg-zinc-800 hover:text-red-500 transition">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* ── 종류로 찾기 (다른 필터와 동일한 컴팩트 pill로 통일) ── */}
        <section className="mb-2.5">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 w-[60px] flex-shrink-0">
              <span className="text-sm">🐾</span>
              <span className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500">종류</span>
            </div>
            <div className="flex flex-nowrap gap-1.5 overflow-x-auto pb-1">
            {TYPES.map((t) => {
              const sel = isSelected("taxonomy", t.label);
              const cnt = typeCounts[t.label] || 0;
              return (
                <button
                  key={t.label}
                  onClick={() => toggleTag("taxonomy", t.label)}
                  className={`inline-flex items-center gap-1 whitespace-nowrap flex-shrink-0 text-[12px] font-semibold px-3 py-1.5 rounded-full border transition-all active:scale-95 ${cnt === 0 && !sel ? "opacity-45" : ""}`}
                  style={
                    sel
                      ? { background: t.hex, borderColor: t.hex, color: "#fff" }
                      : { background: t.hex + "1A", borderColor: t.hex + "40", color: t.hex }
                  }
                >
                  {sel && "✓ "}
                  <span className="text-[12px] leading-none">{t.emoji}</span>
                  {t.label}
                  <span
                    className="text-[10px] font-bold px-1 rounded-full leading-none"
                    style={sel ? { background: "rgba(255,255,255,.25)", color: "#fff" } : { background: t.hex + "26", color: t.hex }}
                  >
                    {cnt}
                  </span>
                </button>
              );
            })}
            </div>
          </div>
        </section>

        {/* ── 3개 간소화 필터 (먹이·색깔·수명) — 한 줄 가로 스크롤 ── */}
        <section className="mb-8 space-y-2.5">
          {SIMPLE_FILTERS.map((f) => (
            <div key={f.id} className="flex items-center gap-3">
              <div className="flex items-center gap-1 w-[60px] flex-shrink-0">
                <span className="text-sm">{f.emoji}</span>
                <span className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500">{f.label}</span>
              </div>
              <div className="flex flex-nowrap gap-1.5 overflow-x-auto pb-1">
                {f.tags.map((tag) => {
                  const sel = isSelected(f.id, tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTag(f.id, tag)}
                      className={`whitespace-nowrap flex-shrink-0 text-[12px] font-semibold px-3 py-1.5 rounded-full border transition-all active:scale-95 ${
                        sel
                          ? f.cls + " shadow-sm"
                          : "bg-neutral-50 dark:bg-zinc-900 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-zinc-700 hover:border-[#F9954E]"
                      }`}
                    >
                      {sel && "✓ "}{tag}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </section>

        {/* ── 결과 ── */}
        <section ref={resultRef} className="mb-16 scroll-mt-20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-xl font-extrabold text-neutral-900 dark:text-white">
                🐾 {hasFilter ? `${sorted.length}마리를 찾았어요` : `전체 ${cards.length}마리`}
              </h2>
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
                  <option value="name">가나다순</option>
                  <option value="no">번호순</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* 선택된 조건 요약 칩 */}
          {allSelected.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mb-5">
              {allSelected.map(({ catId, tag }) => {
                if (catId === "taxonomy") {
                  const tm = TYPE_MAP[tag];
                  return (
                    <button
                      key={catId + tag}
                      onClick={() => toggleTag(catId, tag)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full text-white border transition"
                      style={tm ? { background: tm.hex, borderColor: tm.hex } : {}}
                    >
                      {tm?.emoji} {tag} <X className="w-2.5 h-2.5" />
                    </button>
                  );
                }
                const f = SIMPLE_FILTERS.find((x) => x.id === catId);
                return (
                  <button
                    key={catId + tag}
                    onClick={() => toggleTag(catId, tag)}
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border transition ${f?.cls || ""}`}
                  >
                    {f?.emoji} {tag} <X className="w-2.5 h-2.5" />
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
              <div className="text-5xl mb-3">🔍</div>
              <p className="text-neutral-600 dark:text-neutral-300 font-bold mb-1">조건에 맞는 친구가 없어요</p>
              <p className="text-neutral-400 dark:text-neutral-500 text-sm mb-4">조건을 조금 줄이면 더 많이 찾을 수 있어요</p>
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

        {/* ── 하단 배너 ── */}
        <section>
          <div className="bg-gradient-to-br from-[#FFF5EB] to-[#FEEBD0] dark:from-orange-950/30 dark:to-orange-900/10 border border-[#FDD5A5] dark:border-orange-800/30 rounded-3xl p-8 text-center">
            <div className="text-4xl mb-3">🐾</div>
            <h2 className="text-xl font-extrabold text-neutral-900 dark:text-white mb-2">동물 친구가 계속 늘어나요</h2>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed max-w-md mx-auto break-keep">
              매일 새로운 동물 카드가 추가되고 있어요. 자주 들러서 새 친구를 만나보세요!
            </p>
          </div>
        </section>
      </div>

      {/* ── 동물 상세 모달 ── */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setDetail(null)}>
          {detailIdx > 0 && (
            <button onClick={(e) => { e.stopPropagation(); goDetail(-1); }} aria-label="이전 동물" className="fixed left-2 sm:left-4 top-1/2 -translate-y-1/2 z-[60] w-11 h-11 flex items-center justify-center rounded-full bg-white/90 dark:bg-zinc-800/90 text-neutral-700 dark:text-neutral-200 shadow-lg hover:bg-[#F9954E] hover:text-white transition active:scale-90">
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          {detailIdx >= 0 && detailIdx < sorted.length - 1 && (
            <button onClick={(e) => { e.stopPropagation(); goDetail(1); }} aria-label="다음 동물" className="fixed right-2 sm:right-4 top-1/2 -translate-y-1/2 z-[60] w-11 h-11 flex items-center justify-center rounded-full bg-white/90 dark:bg-zinc-800/90 text-neutral-700 dark:text-neutral-200 shadow-lg hover:bg-[#F9954E] hover:text-white transition active:scale-90">
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
          <motion.div
            key={detailKey(detail)}
            initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
            onTouchEnd={(e) => { if (touchX.current == null) return; const dx = e.changedTouches[0].clientX - touchX.current; touchX.current = null; if (Math.abs(dx) > 55) goDetail(dx < 0 ? 1 : -1); }}
            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto md:overflow-hidden md:max-h-none md:h-[82vh] bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl"
          >
            <button onClick={() => setDetail(null)} className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/90 dark:bg-zinc-800/90 text-neutral-600 dark:text-neutral-300 hover:bg-red-500 hover:text-white transition shadow-md">
              <X className="w-5 h-5" />
            </button>
            <div className="grid md:grid-cols-[3fr_2fr] gap-0 md:h-full">
              {/* 이미지 */}
              <button
                type="button"
                onClick={() => setZoomImg({ src: detail.image_path, name: detail.animal_name })}
                className="group/img relative w-full aspect-[3/4] md:aspect-auto md:h-full bg-neutral-100 dark:bg-zinc-800 cursor-zoom-in overflow-hidden md:rounded-l-3xl"
                aria-label="이미지 크게 보기"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imgUrl(detail.image_path)} alt={detail.animal_name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-105" onError={(e) => { e.currentTarget.style.opacity = "0.15"; }} />
                <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/55 text-white text-[11px] font-bold backdrop-blur-sm opacity-90 group-hover/img:bg-black/70 transition">
                  <Maximize2 className="w-3 h-3" /> 크게 보기
                </span>
              </button>

              {/* 정보 패널 */}
              <div className="p-6 md:p-7 flex flex-col md:overflow-y-auto">
                {/* 헤더 */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FFF5EB] dark:bg-orange-950/30 border border-[#FDD5A5] dark:border-[#B35E15] text-[#E8832E] dark:text-[#FBAA60] text-[11px] font-bold w-fit">
                    No.{detail.no || "—"}
                  </div>
                  {typeof detail.rarity === "number" && (
                    <span className="text-[12px] text-[#F9954E] tracking-tighter" title="희귀도">{"★".repeat(detail.rarity)}{"☆".repeat(5 - detail.rarity)}</span>
                  )}
                </div>
                <h3 className="text-2xl font-black text-neutral-900 dark:text-white">{detail.animal_name}</h3>
                {detail.sci && <p className="italic text-sm text-neutral-500 dark:text-neutral-400">{detail.sci}{detail.en ? ` · ${detail.en}` : ""}</p>}
                <p className="text-[#E8832E] dark:text-[#FBAA60] text-sm font-bold mt-1.5 mb-3 break-keep">&ldquo;{detail.search_nickname}&rdquo;</p>
                {detail.status && (
                  <span className="inline-block text-[11px] font-extrabold px-2.5 py-1 rounded-full text-white mb-3 w-fit" style={{ background: detail.status.color }}>
                    {detail.status.label} · IUCN {detail.status.code}
                  </span>
                )}
                <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed mb-4 break-keep">{detail.kid_friendly_desc}</p>

                {/* 기본 정보 — 항상 서식지·먹이·크기·수명 4개 동일 */}
                {(() => {
                  const infoMap: Record<string, { ic: string; val: string }> = {};
                  for (const [ic, k, v] of (detail.info || [])) infoMap[k] = { ic, val: v };
                  return (
                    <div className="bg-neutral-50 dark:bg-zinc-800/50 rounded-2xl p-3.5 mb-4">
                      {STD_INFO.map(({ key, emoji }) => {
                        const entry = infoMap[key];
                        return (
                          <div key={key} className="flex items-start gap-3 py-2 border-b border-neutral-200 dark:border-zinc-700 last:border-0">
                            <span className="text-base flex-shrink-0 w-5 text-center leading-none mt-0.5">{entry?.ic || emoji}</span>
                            <span className="text-[11.5px] font-bold text-neutral-500 dark:text-neutral-400 w-10 flex-shrink-0 mt-0.5">{key}</span>
                            <span className="text-[12.5px] text-neutral-700 dark:text-neutral-300 break-keep leading-relaxed">{entry?.val || "—"}</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* 재미있는 사실 */}
                {detail.facts && detail.facts.length > 0 && (
                  <div className="bg-[#FFF9F0] dark:bg-orange-950/20 border border-[#FDE3C0] dark:border-orange-900/30 rounded-2xl p-3.5 mb-4">
                    <p className="text-[11px] font-extrabold text-[#E8832E] dark:text-[#FBAA60] mb-2">🔎 알고 보면 더 흥미로운</p>
                    <ul className="space-y-1.5">
                      {detail.facts.map((f, idx) => (
                        <li key={idx} className="text-[12.5px] text-neutral-600 dark:text-neutral-300 leading-snug break-keep pl-3 relative before:content-[&apos;•&apos;] before:absolute before:left-0 before:text-[#F9954E]">{f}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 분류 */}
                {detail.taxonomy && (
                  <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mb-4 leading-relaxed break-keep">
                    <b className="text-neutral-500 dark:text-neutral-400">분류 </b>{detail.taxonomy}
                  </p>
                )}

                {/* 하단 칩 — 모든 동물 동일하게 종류·먹이·색깔 3개 */}
                <div className="mt-auto pt-3 space-y-2 border-t border-neutral-100 dark:border-zinc-800">
                  {MODAL_CHIPS.map(({ id, label, emoji }) => {
                    const tags = detail.filters?.[id] || [];
                    const f = SIMPLE_FILTERS.find((x) => x.id === id);
                    return (
                      <div key={id} className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 w-16 flex-shrink-0">{emoji} {label}</span>
                        <div className="flex flex-wrap gap-1">
                          {tags.length === 0 ? (
                            <span className="text-[10px] text-neutral-300 dark:text-neutral-600">—</span>
                          ) : tags.map((t) => {
                            const tm = id === "taxonomy" ? TYPE_MAP[t] : null;
                            return tm ? (
                              <span key={t} className="text-[10px] font-bold px-2 py-0.5 rounded-md text-white" style={{ background: tm.hex }}>{tm.emoji} {t}</span>
                            ) : (
                              <span key={t} className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${f?.chipCls || ""}`}>{t}</span>
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

      {/* ── 이미지 크게 보기 ── */}
      {zoomImg && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm" onClick={() => setZoomImg(null)}>
          <button onClick={() => setZoomImg(null)} aria-label="닫기" className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/30 transition">
            <X className="w-6 h-6" />
          </button>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}
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
