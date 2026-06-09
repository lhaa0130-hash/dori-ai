"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Hero() {
  return (
    <section className="pt-12 pb-14">

      {/* 라이브 뱃지 */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFF5EB] dark:bg-[#F9954E]/10 mb-8 toss-fade-line">
        <span className="w-1.5 h-1.5 rounded-full bg-[#F9954E] animate-pulse" />
        <span className="text-[12px] font-bold text-[#F9954E]">매일 업데이트</span>
      </div>

      {/* 헤딩 — 줄마다 위에서 내려오는 Toss 패턴 */}
      <h1 className="text-[52px] sm:text-[64px] font-extrabold leading-[1.06] tracking-tight mb-6 break-keep overflow-hidden">
        <span className="block toss-fade-line toss-delay-0 text-neutral-950 dark:text-white">
          AI의 모든 것,
        </span>
        <span className="block toss-fade-line toss-delay-1 text-[#F9954E]">
          한 곳에서.
        </span>
      </h1>

      {/* 서브타이틀 */}
      <p className="toss-fade-up toss-delay-2 text-[15px] text-neutral-400 dark:text-neutral-500 leading-[1.8] mb-10 break-keep">
        트렌드 · 도구 · 미니게임까지<br />
        AI의 모든 것을 도리에서.
      </p>

      {/* CTA 버튼 */}
      <div className="toss-fade-up toss-delay-3 flex gap-3">
        <Link
          href="/insight"
          className="flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#F9954E] text-white text-[14px] font-bold shadow-lg shadow-[#F9954E]/25 active:opacity-85 transition-opacity"
        >
          트렌드 보기 <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href="/ai-tools"
          className="flex items-center px-7 py-3.5 rounded-full bg-neutral-100 dark:bg-zinc-900 text-neutral-700 dark:text-neutral-300 text-[14px] font-bold active:opacity-70 transition-opacity"
        >
          AI 도구
        </Link>
      </div>

    </section>
  );
}
