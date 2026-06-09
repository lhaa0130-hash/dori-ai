"use client";

import Link from "next/link";

const CATS = [
  { emoji: "🔥", label: "AI 트렌드",  href: "/insight",   featured: true  },
  { emoji: "🤖", label: "AI 도구",    href: "/ai-tools",  featured: false },
  { emoji: "⚡", label: "자동화",     href: "/auto",      featured: false },
  { emoji: "🎮", label: "미니게임",   href: "/minigame",  featured: false },
  { emoji: "💬", label: "커뮤니티",   href: "/community", featured: false },
  { emoji: "📚", label: "교육",       href: "/education", featured: false },
];

export default function Hero() {
  return (
    <section className="pt-10 pb-8 border-b border-neutral-100 dark:border-zinc-900">

      {/* 브랜드 태그 */}
      <p className="text-[10px] font-black tracking-[0.16em] uppercase text-[#F9954E] mb-5 toss-fade-line">
        Dori AI
      </p>

      {/* 헤딩 — 줄마다 따로 내려오는 Toss 패턴 */}
      <h1 className="text-[42px] sm:text-[56px] font-extrabold leading-[1.08] tracking-tight mb-5 break-keep overflow-hidden">
        <span className="block toss-fade-line toss-delay-0 text-neutral-950 dark:text-white">
          AI의 모든 것,
        </span>
        <span className="block toss-fade-line toss-delay-1 text-[#F9954E]">
          한 곳에서.
        </span>
      </h1>

      {/* 서브타이틀 */}
      <p className="toss-fade-up toss-delay-2 text-[14px] text-neutral-400 dark:text-neutral-500 mb-8 break-keep leading-relaxed">
        매일 업데이트되는 AI 트렌드 · 200개 도구 · 미니게임
      </p>

      {/* 카테고리 가로 스크롤 칩 */}
      <div className="toss-fade-up toss-delay-3 -mx-4 px-4 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 w-max pb-0.5">
          {CATS.map((cat) => (
            <Link
              key={cat.href}
              href={cat.href}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full border whitespace-nowrap text-[13px] font-semibold transition-opacity active:opacity-60 ${
                cat.featured
                  ? "bg-[#F9954E] border-[#F9954E] text-white shadow-sm shadow-[#F9954E]/25"
                  : "bg-white dark:bg-zinc-950 border-neutral-100 dark:border-zinc-800 text-neutral-700 dark:text-neutral-300"
              }`}
            >
              <span className="leading-none">{cat.emoji}</span>
              {cat.label}
            </Link>
          ))}
        </div>
      </div>

    </section>
  );
}
