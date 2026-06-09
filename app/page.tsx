// app/page.tsx
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Hero from "@/components/home/Hero";
import HomeClient from "@/components/home/HomeClient";
import TrendPreview from "@/components/home/TrendPreview";
import MiniGameSection from "@/components/home/MiniGameSection";
import { getAllTrends } from "@/lib/trends";

/* 퀵 메뉴 */
const MENUS = [
  { emoji: "🔥", label: "트렌드",   href: "/insight"   },
  { emoji: "🤖", label: "AI 도구",  href: "/ai-tools"  },
  { emoji: "🎮", label: "미니게임", href: "/minigame"  },
  { emoji: "⚡", label: "자동화",   href: "/auto"      },
  { emoji: "💬", label: "커뮤니티", href: "/community" },
];

/* AI 도구 카테고리 */
const TOOL_CATS = [
  { emoji: "🤖", label: "텍스트 & LLM", sub: "ChatGPT, Claude",     href: "/ai-tools" },
  { emoji: "🎨", label: "이미지 생성",   sub: "Midjourney, DALL-E",  href: "/ai-tools" },
  { emoji: "🎬", label: "영상 & 음성",   sub: "Runway, Suno",        href: "/ai-tools" },
  { emoji: "⚡", label: "자동화",        sub: "n8n, Make, Zapier",   href: "/ai-tools" },
];

export default async function Home() {
  const latestTrends = getAllTrends().slice(0, 3);

  return (
    <main className="min-h-screen">

      {/* ① 히어로 */}
      <Hero />

      {/* ② 퀵 메뉴 */}
      <section className="pb-7 border-b border-neutral-100 dark:border-zinc-900">
        <div className="grid grid-cols-5">
          {MENUS.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="flex flex-col items-center gap-2 py-1 active:opacity-55 transition-opacity"
            >
              <div className="w-[50px] h-[50px] rounded-2xl bg-neutral-50 dark:bg-zinc-900 border border-neutral-100 dark:border-zinc-800 flex items-center justify-center text-[21px] shadow-sm">
                {m.emoji}
              </div>
              <span className="text-[10.5px] font-semibold text-neutral-500 dark:text-neutral-400 text-center">
                {m.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ③ 출석 위젯 */}
      <HomeClient />

      {/* ④ AI 트렌드 — 피처드 + 리스트 */}
      <TrendPreview trends={latestTrends} />

      {/* ⑤ AI 도구 카테고리 */}
      <section className="py-5 border-b border-neutral-100 dark:border-zinc-900">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-[14px] font-extrabold text-neutral-950 dark:text-white">AI 도구</p>
          <Link href="/ai-tools" className="flex items-center gap-1 text-[13px] font-semibold text-[#F9954E]">
            전체 보기 <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 2×2 카테고리 그리드 */}
        <div className="scroll-reveal rounded-2xl border border-neutral-100 dark:border-zinc-900 overflow-hidden">
          <div className="grid grid-cols-2">
            {TOOL_CATS.map((cat, i) => (
              <Link
                key={cat.label}
                href={cat.href}
                className={`flex items-center gap-3 px-4 py-4 bg-white dark:bg-zinc-950 active:opacity-70 transition-opacity
                  ${i % 2 === 1 ? "border-l border-neutral-100 dark:border-zinc-900" : ""}
                  ${i >= 2 ? "border-t border-neutral-100 dark:border-zinc-900" : ""}
                `}
              >
                <span className="text-[20px] leading-none flex-shrink-0">{cat.emoji}</span>
                <div className="min-w-0">
                  <p className="text-[12px] font-bold text-neutral-900 dark:text-white leading-tight">{cat.label}</p>
                  <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5 truncate">{cat.sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ⑥ 미니게임 */}
      <MiniGameSection />

    </main>
  );
}
