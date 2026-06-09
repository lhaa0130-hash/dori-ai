// app/page.tsx
import Link from "next/link";
import { ArrowRight, Users, Newspaper, Wrench, Gamepad2, FolderKanban } from "lucide-react";
import Hero from "@/components/home/Hero";
import HomeClient from "@/components/home/HomeClient";
import TrendPreview from "@/components/home/TrendPreview";
import { getAllTrends } from "@/lib/trends";

/* 퀵메뉴 — 콘텐츠 카테고리 + 섹션, 가로 스크롤 */
const QUICK = [
  { emoji: "🔥", label: "트렌드",   href: "/insight"   },
  { emoji: "📖", label: "가이드",   href: "/insight"   },
  { emoji: "📊", label: "리포트",   href: "/insight"   },
  { emoji: "🔬", label: "분석",     href: "/insight"   },
  { emoji: "✨", label: "큐레이션", href: "/insight"   },
  { emoji: "🤖", label: "AI 도구",  href: "/ai-tools"  },
  { emoji: "🎮", label: "미니게임", href: "/minigame"  },
  { emoji: "💬", label: "커뮤니티", href: "/community" },
  // { emoji: "🏗️", label: "프로젝트", href: "/projects" }, ← 나중에 추가
];

export default async function Home() {
  const latestTrends = getAllTrends().slice(0, 3);

  return (
    <main className="min-h-screen">

      {/* ① 히어로 */}
      <Hero />

      {/* ② 퀵메뉴 — 가로 스크롤 */}
      <section className="pb-7 border-b border-neutral-100 dark:border-zinc-900">
        <div className="-mx-4 px-4 overflow-x-auto scrollbar-hide">
          <div className="flex gap-4 w-max">
            {QUICK.map((m) => (
              <Link
                key={m.label}
                href={m.href}
                className="flex flex-col items-center gap-2 active:opacity-55 transition-opacity"
              >
                <div className="w-[52px] h-[52px] rounded-2xl bg-neutral-50 dark:bg-zinc-900 border border-neutral-100 dark:border-zinc-800 flex items-center justify-center text-[22px] shadow-sm flex-shrink-0">
                  {m.emoji}
                </div>
                <span className="text-[10.5px] font-semibold text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                  {m.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ③ 5개 섹션 쇼케이스 */}
      <section className="py-5 border-b border-neutral-100 dark:border-zinc-900">

        {/* 섹션 안내 — 사이트 정체성 */}
        <p className="text-[13px] font-bold text-neutral-400 dark:text-neutral-500 mb-3 px-0.5">
          도리에서 뭐 하지? 🤔
        </p>

        {/* 커뮤니티 — 풀 와이드 메인 카드 */}
        <Link
          href="/community"
          className="toss-shine scroll-reveal flex items-center justify-between p-5 rounded-2xl mb-2.5
            bg-[#F9954E] active:opacity-85 transition-opacity"
        >
          <div>
            <p className="text-[10px] font-bold text-white/60 mb-2 uppercase tracking-widest">Community</p>
            <p className="text-[20px] font-extrabold text-white leading-tight break-keep">
              오늘은 어떤 AI 얘기?<br />같이 떠들어요
            </p>
            <div className="flex items-center gap-1 text-white/80 text-[13px] font-semibold mt-3">
              구경하기 <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <Users className="w-[56px] h-[56px] text-white/20 flex-shrink-0" strokeWidth={1.5} />
        </Link>

        {/* 인사이트 + AI 도구 */}
        <div className="grid grid-cols-2 gap-2.5 mb-2.5">
          <Link
            href="/insight"
            className="scroll-reveal-item scroll-delay-1 flex flex-col justify-between p-4 rounded-2xl
              border border-neutral-100 dark:border-zinc-900 bg-white dark:bg-zinc-950
              active:opacity-70 transition-opacity min-h-[120px]"
          >
            <Newspaper className="w-6 h-6 text-[#F9954E]" strokeWidth={1.5} />
            <div>
              <p className="text-[13px] font-extrabold text-neutral-900 dark:text-white mb-0.5">인사이트</p>
              <p className="text-[11px] text-neutral-400 leading-snug">트렌드·분석·리포트</p>
            </div>
          </Link>

          <Link
            href="/ai-tools"
            className="scroll-reveal-item scroll-delay-2 flex flex-col justify-between p-4 rounded-2xl
              border border-neutral-100 dark:border-zinc-900 bg-white dark:bg-zinc-950
              active:opacity-70 transition-opacity min-h-[120px]"
          >
            <Wrench className="w-6 h-6 text-[#F9954E]" strokeWidth={1.5} />
            <div>
              <p className="text-[13px] font-extrabold text-neutral-900 dark:text-white mb-0.5">AI 도구</p>
              <p className="text-[11px] text-neutral-400 leading-snug">카테고리별 TOP5</p>
            </div>
          </Link>
        </div>

        {/* 미니게임 + 프로젝트 */}
        <div className="grid grid-cols-2 gap-2.5">
          <Link
            href="/minigame"
            className="scroll-reveal-item scroll-delay-3 flex flex-col justify-between p-4 rounded-2xl
              border border-neutral-100 dark:border-zinc-900 bg-white dark:bg-zinc-950
              active:opacity-70 transition-opacity min-h-[105px]"
          >
            <Gamepad2 className="w-6 h-6 text-[#F9954E]" strokeWidth={1.5} />
            <div>
              <p className="text-[13px] font-extrabold text-neutral-900 dark:text-white mb-0.5">미니게임</p>
              <p className="text-[11px] text-neutral-400 leading-snug">플레이하고 솜사탕 🍭</p>
            </div>
          </Link>

          <Link
            href="/projects"
            className="scroll-reveal-item scroll-delay-4 flex flex-col justify-between p-4 rounded-2xl
              border border-neutral-100 dark:border-zinc-900 bg-white dark:bg-zinc-950
              active:opacity-70 transition-opacity min-h-[105px]"
          >
            <FolderKanban className="w-6 h-6 text-[#F9954E]" strokeWidth={1.5} />
            <div>
              <p className="text-[13px] font-extrabold text-neutral-900 dark:text-white mb-0.5">프로젝트</p>
              <p className="text-[11px] text-neutral-400 leading-snug">도리가 만드는 중</p>
            </div>
          </Link>
        </div>

      </section>

      {/* ④ 출석 위젯 */}
      <HomeClient />

      {/* ⑤ AI 트렌드 */}
      <TrendPreview trends={latestTrends} />

    </main>
  );
}
