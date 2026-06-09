"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Hero() {
  return (
    <section className="pt-6 pb-14">
      <p className="text-[11px] font-bold text-[#F9954E] tracking-[0.22em] uppercase mb-7">
        DORI-AI
      </p>

      <h1 className="text-[52px] sm:text-[68px] font-black text-neutral-950 dark:text-white leading-[1.0] tracking-[-0.03em] mb-6 break-keep">
        AI의 모든 것,
        <br />
        <span className="text-[#F9954E]">한 곳에서.</span>
      </h1>

      <p className="text-[16px] text-neutral-400 dark:text-neutral-500 leading-[1.7] mb-10 break-keep">
        매일 업데이트되는 AI 트렌드,<br />
        200개 이상의 도구, 그리고 미니게임.
      </p>

      <div className="flex gap-3">
        <Link
          href="/insight"
          className="flex items-center gap-1.5 px-6 py-4 rounded-2xl bg-[#F9954E] text-white text-[15px] font-black active:opacity-80 transition-opacity"
        >
          트렌드 보기 <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href="/ai-tools"
          className="flex items-center px-6 py-4 rounded-2xl border border-neutral-200 dark:border-zinc-800 text-neutral-800 dark:text-neutral-200 text-[15px] font-bold active:opacity-70 transition-opacity"
        >
          AI 도구
        </Link>
      </div>
    </section>
  );
}
