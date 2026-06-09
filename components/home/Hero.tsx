"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Hero() {
  return (
    <section className="pt-8 pb-14">
      {/* 헤딩: 두 줄이 각각 따로 위에서 내려오는 Toss 패턴 */}
      <h1 className="text-[40px] sm:text-[54px] font-extrabold leading-[1.1] tracking-tight mb-5 break-keep overflow-hidden">
        <span className="block toss-fade-line toss-delay-0 text-neutral-950 dark:text-white">
          AI의 모든 것,
        </span>
        <span className="block toss-fade-line toss-delay-1 text-[#F9954E]">
          한 곳에서.
        </span>
      </h1>

      <p className="toss-fade-up toss-delay-2 text-[15px] text-neutral-500 dark:text-neutral-400 leading-[1.75] mb-9 break-keep">
        매일 업데이트되는 AI 트렌드, 200개 이상의 도구,<br className="hidden sm:block" />
        그리고 즐길 수 있는 미니게임.
      </p>

      <div className="toss-fade-up toss-delay-3 flex gap-2.5">
        <Link
          href="/insight"
          className="flex items-center gap-1.5 px-6 py-3.5 rounded-full bg-[#F9954E] text-white text-[14px] font-bold shadow-md shadow-[#F9954E]/20 active:opacity-85 transition-opacity"
        >
          트렌드 보기 <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href="/ai-tools"
          className="flex items-center px-6 py-3.5 rounded-full border border-neutral-200 dark:border-zinc-800 text-neutral-700 dark:text-neutral-300 text-[14px] font-semibold active:opacity-70 transition-opacity"
        >
          AI 도구
        </Link>
      </div>
    </section>
  );
}
