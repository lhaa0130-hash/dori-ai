"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, Sparkles, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

// ─── 관리자 이메일 (단 1명만 접근 가능) ─────────────────────────────
const ADMIN_EMAIL = "lhaa0130@gmail.com";

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

// ── 필터 카테고리 (8가지 축) ────────────────────────────────────────
const FILTER_CATEGORIES = [
  {
    id: "diet",
    emoji: "🍽️",
    title: "먹이",
    col: "A",
    color: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700",
    header: "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300",
    selected: "bg-orange-200 dark:bg-orange-800/50 text-orange-900 dark:text-orange-100 border-orange-400 dark:border-orange-500 ring-2 ring-orange-400 dark:ring-orange-500",
    tags: ["곤충을 먹는", "물고기를 먹는", "초식", "육식", "잡식", "썩은 것 먹는", "꿀을 먹는", "씨앗을 먹는"],
  },
  {
    id: "color",
    emoji: "🎨",
    title: "색깔",
    col: "B",
    color: "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 border-pink-300 dark:border-pink-700",
    header: "bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300",
    selected: "bg-pink-200 dark:bg-pink-800/50 text-pink-900 dark:text-pink-100 border-pink-400 dark:border-pink-500 ring-2 ring-pink-400 dark:ring-pink-500",
    tags: ["분홍색", "파란색", "빨간색", "초록색", "검정색", "흰색", "투명한", "알록달록한"],
  },
  {
    id: "size",
    emoji: "📏",
    title: "크기",
    col: "C",
    color: "bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-700",
    header: "bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300",
    selected: "bg-sky-200 dark:bg-sky-800/50 text-sky-900 dark:text-sky-100 border-sky-400 dark:border-sky-500 ring-2 ring-sky-400 dark:ring-sky-500",
    tags: ["손보다 작은", "손바닥만한", "고양이만한", "사람만한", "코끼리만한", "버스만한", "세상 가장 작은", "세상 가장 큰"],
  },
  {
    id: "habitat",
    emoji: "🌍",
    title: "사는 곳",
    col: "D",
    color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700",
    header: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300",
    selected: "bg-emerald-200 dark:bg-emerald-800/50 text-emerald-900 dark:text-emerald-100 border-emerald-400 dark:border-emerald-500 ring-2 ring-emerald-400 dark:ring-emerald-500",
    tags: ["바다", "강·호수", "사막", "열대우림", "극지방", "초원", "동굴", "도시 근처"],
  },
  {
    id: "feature",
    emoji: "⚡",
    title: "특징",
    col: "E",
    color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700",
    header: "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300",
    selected: "bg-yellow-200 dark:bg-yellow-800/50 text-yellow-900 dark:text-yellow-100 border-yellow-400 dark:border-yellow-500 ring-2 ring-yellow-400 dark:ring-yellow-500",
    tags: ["날 수 있는", "독이 있는", "야행성", "보호색", "변장하는", "엄청 빠른", "엄청 느린", "빛을 내는"],
  },
  {
    id: "body",
    emoji: "🔬",
    title: "몸 구조",
    col: "F",
    color: "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border-violet-300 dark:border-violet-700",
    header: "bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300",
    selected: "bg-violet-200 dark:bg-violet-800/50 text-violet-900 dark:text-violet-100 border-violet-400 dark:border-violet-500 ring-2 ring-violet-400 dark:ring-violet-500",
    tags: ["다리가 없는", "다리가 4개인", "다리가 6개+", "날개 있는", "딱딱한 껍질", "뿔이 있는", "긴 꼬리", "긴 목"],
  },
  {
    id: "behavior",
    emoji: "🤝",
    title: "생활 방식",
    col: "G",
    color: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700",
    header: "bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300",
    selected: "bg-cyan-200 dark:bg-cyan-800/50 text-cyan-900 dark:text-cyan-100 border-cyan-400 dark:border-cyan-500 ring-2 ring-cyan-400 dark:ring-cyan-500",
    tags: ["혼자 사는", "무리지어 사는", "겨울잠 자는", "철새처럼 이동", "알을 낳는", "새끼를 낳는", "동굴에 사는", "나무 위에 사는"],
  },
  {
    id: "taxonomy",
    emoji: "🗂️",
    title: "종류",
    col: "H",
    color: "bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-300 border-lime-300 dark:border-lime-700",
    header: "bg-lime-50 dark:bg-lime-900/20 text-lime-700 dark:text-lime-300",
    selected: "bg-lime-200 dark:bg-lime-800/50 text-lime-900 dark:text-lime-100 border-lime-400 dark:border-lime-500 ring-2 ring-lime-400 dark:ring-lime-500",
    tags: ["포유류", "조류", "파충류", "어류", "양서류", "곤충", "갑각류", "연체동물"],
  },
];

const EXAMPLE_SEARCHES = [
  { query: "분홍색이면서 작은 동물은?", filters: ["분홍색", "손보다 작은"], result: "홍학 새끼, 분홍 돌고래, 핑크 아르마딜로", emoji: "🦩" },
  { query: "곤충을 먹는 야행성 동물은?", filters: ["곤충을 먹는", "야행성"], result: "박쥐, 고슴도치, 올빼미, 아르마딜로", emoji: "🦇" },
  { query: "독이 있는 파란색 동물은?", filters: ["독이 있는", "파란색"], result: "파란고리문어, 독화살개구리, 파란 전갈", emoji: "🐙" },
  { query: "극지방에 사는 흰색 동물은?", filters: ["극지방", "흰색"], result: "북극곰, 흰올빼미, 흰여우, 벨루가", emoji: "🐻‍❄️" },
];

export default function AnimalPageClient({ cards = [] }: { cards?: AnimalCard[] }) {
  const { session, status } = useAuth();
  const user = session?.user || null;
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  // { categoryId: Set<tag> }
  const [selected, setSelected] = useState<Record<string, Set<string>>>({});
  // 상세 모달
  const [detail, setDetail] = useState<AnimalCard | null>(null);
  // 이름 검색어
  const [query, setQuery] = useState("");

  useEffect(() => { setMounted(true); }, []);

  // ── 관리자 전용 접근 제어 ──
  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  useEffect(() => {
    if (!mounted || status === "loading") return;
    if (status === "unauthenticated" || !user) {
      router.replace("/login");
      return;
    }
    if (!isAdmin) {
      router.replace("/");
    }
  }, [mounted, status, user, isAdmin, router]);

  if (!mounted || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <div className="text-neutral-500 dark:text-neutral-400 text-lg animate-pulse">로딩 중...</div>
      </div>
    );
  }

  // 비관리자: 본문 렌더 차단 (리다이렉트 진행 중)
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">준비 중인 페이지예요</h1>
          <p className="text-neutral-500 dark:text-neutral-400">동물도감은 곧 공개될 예정이에요.</p>
        </div>
      </div>
    );
  }

  function toggleCell(catId: string, tag: string) {
    setSelected(prev => {
      const cur = new Set(prev[catId] || []);
      if (cur.has(tag)) cur.delete(tag);
      else cur.add(tag);
      return { ...prev, [catId]: cur };
    });
  }

  function isSelected(catId: string, tag: string) {
    return (selected[catId] || new Set()).has(tag);
  }

  const allSelected = FILTER_CATEGORIES.flatMap(cat =>
    [...(selected[cat.id] || [])].map(tag => ({ catId: cat.id, tag, cat }))
  );

  function clearAll() { setSelected({}); setQuery(""); }

  // 수식 입력줄 텍스트
  const formulaText = allSelected.length === 0
    ? "셀을 클릭해서 조건을 선택하세요"
    : allSelected.map(s => s.tag).join(" + ");

  // ── 필터 매칭: 카테고리 간 AND, 카테고리 내 OR + 이름 검색 ──
  const q = query.trim().toLowerCase();
  const matched = cards.filter(card => {
    // 이름/별명 검색
    if (q) {
      const hay = (card.animal_name + " " + card.search_nickname).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    // 8축 필터 (선택된 축마다 최소 1개 일치해야 함)
    for (const cat of FILTER_CATEGORIES) {
      const picks = selected[cat.id];
      if (!picks || picks.size === 0) continue;
      const cardTags = (card.filters && card.filters[cat.id]) || [];
      const hit = [...picks].some(t => cardTags.includes(t));
      if (!hit) return false;
    }
    return true;
  });
  const hasFilter = allSelected.length > 0 || q.length > 0;

  return (
    <main className="w-full min-h-screen bg-white dark:bg-black transition-colors duration-500 relative overflow-x-hidden font-sans">

      {/* 배경 */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#FEEBD0]/40 via-[#FFF5EB]/20 to-transparent dark:from-[#8F4B10]/10 dark:via-black/0 dark:to-black/0 pointer-events-none z-0" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 pt-4 sm:pt-16 pb-12 sm:pb-24">

        {/* ── 히어로 ── */}
        <section className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF5EB] dark:bg-orange-950/30 border border-[#FDD5A5] dark:border-[#B35E15] text-[#E8832E] dark:text-[#FBAA60] text-xs font-bold mb-6">
              <BookOpen className="w-3 h-3" />
              <span>DORI&apos;S 동물도감</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-5 text-neutral-900 dark:text-white">
              셀을 골라서<br className="hidden md:block" />
              <span className="bg-gradient-to-r from-[#F9954E] via-[#FBAA60] to-[#F9954E] bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                동물을 찾아보세요
              </span>
            </h1>

            <p className="text-base md:text-lg font-medium text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed mb-6 break-keep">
              엑셀처럼 셀을 클릭해 조건을 선택하면<br className="hidden md:block" />
              조건에 맞는 동물을 찾아드려요.
            </p>

            <div className="inline-flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-zinc-900 px-4 py-2 rounded-full border border-neutral-200 dark:border-zinc-800">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
              동물 데이터를 열심히 채우는 중이에요
            </div>
          </motion.div>
        </section>

        {/* ── 엑셀 스프레드시트 필터 ── */}
        <section className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-5"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white mb-1">
              🗂️ 어떤 동물을 찾고 싶나요?
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm font-medium">
              셀을 클릭하면 선택돼요 — 여러 조건을 동시에 고를 수 있어요
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-700 rounded-2xl overflow-hidden shadow-sm"
          >
            {/* ── 수식 입력줄 (Formula Bar) ── */}
            <div className="flex items-center gap-2 px-4 py-2.5 bg-neutral-50 dark:bg-zinc-800/80 border-b border-neutral-200 dark:border-zinc-700">
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-600 rounded text-xs font-mono text-neutral-500 dark:text-neutral-400 min-w-[40px] justify-center">
                <Search className="w-3 h-3" />
              </div>
              <div className="flex-1 px-3 py-1.5 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-600 rounded text-xs font-medium text-neutral-700 dark:text-neutral-300 min-h-[28px] flex items-center">
                {allSelected.length === 0 ? (
                  <span className="text-neutral-400 dark:text-neutral-500 italic">{formulaText}</span>
                ) : (
                  <span className="text-[#E8832E] dark:text-[#FBAA60]">{formulaText}</span>
                )}
              </div>
              {allSelected.length > 0 && (
                <button
                  onClick={clearAll}
                  className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold text-neutral-500 dark:text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <X className="w-3 h-3" />
                  초기화
                </button>
              )}
            </div>

            {/* ── 스프레드시트 테이블 ── */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs" style={{ minWidth: '900px' }}>

                {/* 컬럼 헤더 (행 번호 포함) */}
                <thead>
                  <tr>
                    {/* 행 번호 컬럼 */}
                    <th className="w-8 min-w-[32px] bg-neutral-100 dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700 text-neutral-400 dark:text-zinc-500 font-normal text-center sticky left-0 z-10" />
                    {FILTER_CATEGORIES.map((cat) => (
                      <th
                        key={cat.id}
                        className={`px-3 py-2.5 border border-neutral-200 dark:border-zinc-700 font-bold text-center ${cat.header}`}
                        style={{ minWidth: '108px' }}
                      >
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-[10px] font-mono opacity-60">{cat.col}</span>
                          <span className="text-base leading-none">{cat.emoji}</span>
                          <span className="text-[11px] font-bold mt-0.5">{cat.title}</span>
                          {selected[cat.id] && selected[cat.id].size > 0 && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#F9954E] text-white leading-none mt-0.5">
                              {selected[cat.id].size}개 선택
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                {/* 셀 바디 */}
                <tbody>
                  {Array.from({ length: 8 }, (_, rowIdx) => (
                    <tr key={rowIdx} className="group">
                      {/* 행 번호 */}
                      <td className="bg-neutral-100 dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700 text-neutral-400 dark:text-zinc-500 text-center font-mono text-[10px] py-2 sticky left-0 z-10 group-hover:bg-neutral-150 dark:group-hover:bg-zinc-750">
                        {rowIdx + 1}
                      </td>
                      {FILTER_CATEGORIES.map((cat) => {
                        const tag = cat.tags[rowIdx];
                        const sel = isSelected(cat.id, tag);
                        return (
                          <td
                            key={cat.id}
                            onClick={() => toggleCell(cat.id, tag)}
                            className={`
                              border border-neutral-200 dark:border-zinc-700 px-2 py-2.5 text-center
                              cursor-pointer select-none transition-all duration-150
                              hover:border-[#F9954E] hover:dark:border-[#F9954E]
                              ${sel
                                ? cat.selected
                                : 'bg-white dark:bg-zinc-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-zinc-800'
                              }
                            `}
                          >
                            <span className={`font-medium text-[11px] leading-snug break-keep ${sel ? 'font-bold' : ''}`}>
                              {sel && <span className="mr-0.5">✓</span>}
                              {tag}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── 선택된 셀 요약 바 ── */}
            {allSelected.length > 0 && (
              <div className="px-4 py-3 bg-[#FFF5EB] dark:bg-orange-950/30 border-t border-[#FDD5A5] dark:border-orange-800/30 flex items-center flex-wrap gap-2">
                <span className="text-xs font-bold text-[#E8832E] dark:text-[#FBAA60] mr-1">선택된 조건</span>
                {allSelected.map(({ catId, tag, cat }) => (
                  <button
                    key={catId + tag}
                    onClick={() => toggleCell(catId, tag)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#F9954E]/15 text-[#E8832E] dark:text-[#FBAA60] border border-[#F9954E]/30 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                  >
                    {cat.emoji} {tag}
                    <X className="w-2.5 h-2.5" />
                  </button>
                ))}
                <span className="text-[11px] font-bold text-[#E8832E] dark:text-[#FBAA60] ml-auto">
                  {matched.length}마리 찾았어요!
                </span>
              </div>
            )}

            {/* ── 사용법 힌트 ── */}
            {allSelected.length === 0 && (
              <div className="px-4 py-2.5 bg-neutral-50 dark:bg-zinc-800/40 border-t border-neutral-200 dark:border-zinc-700 text-center">
                <span className="text-[11px] text-neutral-400 dark:text-zinc-500">
                  💡 셀을 클릭하면 선택 · 다시 클릭하면 해제 · 여러 열에서 동시에 선택 가능
                </span>
              </div>
            )}
          </motion.div>
        </section>

        {/* ── 동물 카드 결과 ── */}
        <section className="mb-20">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white mb-1">
                🐾 {hasFilter ? `이런 동물들을 찾았어요 (${matched.length})` : `동물 친구들 (${cards.length})`}
              </h2>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm font-medium">
                {hasFilter ? "조건에 딱 맞는 동물 카드예요 — 카드를 누르면 자세히 볼 수 있어요" : "위에서 조건을 골라 찾거나, 이름으로 바로 검색해보세요"}
              </p>
            </div>
            {/* 이름 검색 */}
            <div className="relative w-full sm:w-64 flex-shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="동물 이름으로 검색"
                className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-700 text-sm text-neutral-700 dark:text-neutral-200 placeholder:text-neutral-400 focus:outline-none focus:border-[#F9954E] focus:ring-2 focus:ring-[#F9954E]/20 transition"
              />
              {query && (
                <button onClick={() => setQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-red-500">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {cards.length === 0 ? (
            <div className="text-center py-20 bg-neutral-50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-neutral-200 dark:border-zinc-700">
              <div className="text-5xl mb-3">🐣</div>
              <p className="text-neutral-500 dark:text-neutral-400 font-medium">동물 데이터를 채우는 중이에요</p>
            </div>
          ) : matched.length === 0 ? (
            <div className="text-center py-20 bg-neutral-50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-neutral-200 dark:border-zinc-700">
              <div className="text-5xl mb-3">🔍</div>
              <p className="text-neutral-600 dark:text-neutral-300 font-bold mb-1">조건에 맞는 동물이 아직 없어요</p>
              <p className="text-neutral-400 dark:text-neutral-500 text-sm mb-4">조건을 조금 줄여보면 더 많이 찾을 수 있어요</p>
              <button onClick={clearAll} className="text-sm font-bold text-[#E8832E] dark:text-[#FBAA60] hover:underline">
                필터 초기화하기
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
              {matched.map((card, i) => (
                <motion.button
                  key={card.animal_name}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.4) }}
                  onClick={() => setDetail(card)}
                  className="group text-left bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-2xl overflow-hidden hover:border-[#F9954E] dark:hover:border-[#F9954E] hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100 dark:bg-zinc-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={card.image_path}
                      alt={card.animal_name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
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

        {/* ── 복합 검색 예시 ── */}
        <section className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white mb-2">
              🔍 이런 식으로 찾을 수 있어요
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm font-medium">
              조건을 조합할수록 더 정확한 동물을 찾을 수 있어요
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {EXAMPLE_SEARCHES.map((ex, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="bg-white dark:bg-zinc-900 border border-neutral-100 dark:border-zinc-800 rounded-2xl p-5"
              >
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-2xl flex-shrink-0">{ex.emoji}</span>
                  <p className="text-sm font-bold text-neutral-900 dark:text-white leading-snug">{ex.query}</p>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {ex.filters.map((f) => (
                    <span key={f} className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#F9954E]/15 text-[#E8832E] dark:text-[#FBAA60] border border-[#F9954E]/30">
                      ✓ {f}
                    </span>
                  ))}
                </div>
                <div className="bg-neutral-50 dark:bg-zinc-800/60 rounded-xl px-3 py-2">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    <span className="font-semibold text-neutral-700 dark:text-neutral-200">결과 예시 → </span>
                    {ex.result}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── 하단 CTA ── */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-br from-[#FFF5EB] to-[#FEEBD0] dark:from-orange-950/30 dark:to-orange-900/10 border border-[#FDD5A5] dark:border-orange-800/30 rounded-3xl p-10 text-center"
          >
            <div className="text-5xl mb-4">🐾</div>
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white mb-3">
              동물도감을 함께 만들어가요
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed max-w-lg mx-auto mb-2 break-keep">
              색깔부터 먹이, 크기, 사는 곳까지 — 아이들이 스스로<br className="hidden md:block" />
              궁금한 동물을 직접 찾아갈 수 있도록 데이터를 채우고 있어요.
            </p>
            <p className="text-[#E8832E] dark:text-[#FBAA60] text-xs font-bold flex items-center justify-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              동물 카드가 업로드되면 바로 검색해볼 수 있어요
            </p>
          </motion.div>
        </section>

      </div>

      {/* ── 동물 상세 모달 ── */}
      {detail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setDetail(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl"
          >
            <button
              onClick={() => setDetail(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/90 dark:bg-zinc-800/90 text-neutral-600 dark:text-neutral-300 hover:bg-red-500 hover:text-white transition shadow-md"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid md:grid-cols-2 gap-0">
              {/* 이미지 */}
              <div className="relative aspect-[4/5] md:aspect-auto md:min-h-[420px] bg-neutral-100 dark:bg-zinc-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={detail.image_path} alt={detail.animal_name} className="absolute inset-0 w-full h-full object-cover md:rounded-l-3xl" />
              </div>

              {/* 내용 */}
              <div className="p-6 md:p-7 flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FFF5EB] dark:bg-orange-950/30 border border-[#FDD5A5] dark:border-[#B35E15] text-[#E8832E] dark:text-[#FBAA60] text-[11px] font-bold w-fit">
                    <Sparkles className="w-3 h-3" /> 동물도감{detail.no ? ` No.${detail.no}` : ""}
                  </div>
                  {typeof detail.rarity === "number" && <span className="text-[12px] text-[#F9954E] tracking-tighter" title="희귀도">{"★".repeat(detail.rarity)}{"☆".repeat(5 - detail.rarity)}</span>}
                </div>
                <h3 className="text-2xl font-black text-neutral-900 dark:text-white">{detail.animal_name}</h3>
                {detail.sci && <p className="italic text-sm text-neutral-500 dark:text-neutral-400">{detail.sci}{detail.en ? ` · ${detail.en}` : ""}</p>}
                <p className="text-[#E8832E] dark:text-[#FBAA60] text-sm font-bold mt-1.5 mb-3 break-keep">“{detail.search_nickname}”</p>

                {detail.taxonomy && <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mb-3 leading-relaxed break-keep"><b className="text-neutral-500 dark:text-neutral-400">분류 </b>{detail.taxonomy}</p>}

                {detail.status && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
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

                {detail.subspecies && <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mb-4 break-keep"><b className="text-neutral-500 dark:text-neutral-400">하위종 </b>{detail.subspecies}</p>}

                {/* 필터 속성 */}
                <div className="mt-auto space-y-2">
                  {FILTER_CATEGORIES.map((cat) => {
                    const tags = detail.filters?.[cat.id] || [];
                    if (tags.length === 0) return null;
                    return (
                      <div key={cat.id} className="flex items-start gap-2">
                        <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 w-16 flex-shrink-0 pt-0.5">{cat.emoji} {cat.title}</span>
                        <div className="flex flex-wrap gap-1">
                          {tags.map((t) => (
                            <span key={t} className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${cat.color}`}>{t}</span>
                          ))}
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
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient { animation: gradient 3s ease infinite; }
      `}</style>
    </main>
  );
}
