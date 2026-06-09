"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Hero() {
  return (
    <section className="pt-9 pb-8">

      {/* 커뮤니티 뱃지 (🍊 살짝 떠오르는 플로트 애니메이션) */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF5EB] dark:bg-[#F9954E]/10 mb-5 toss-fade-line">
        <span className="toss-float text-[12px] leading-none">🍊</span>
        <span className="text-[11px] font-bold text-[#F9954E]">매일 업데이트되는 AI 커뮤니티</span>
      </div>

      {/* 헤딩 */}
      <h1 className="text-[42px] sm:text-[52px] font-extrabold leading-[1.08] tracking-tight mb-4 break-keep overflow-hidden">
        <span className="block toss-fade-line toss-delay-0 text-neutral-950 dark:text-white">AI, 같이 하면</span>
        <span className="block toss-fade-line toss-delay-1 text-[#F9954E]">더 재밌으니까.</span>
      </h1>

      {/* 서브타이틀 */}
      <p className="toss-fade-up toss-delay-2 text-[14px] text-neutral-400 dark:text-neutral-500 leading-relaxed mb-7 break-keep">
        최신 트렌드부터 AI 도구, 미니게임까지.<br />
        도리에서 가볍게 시작해요.
      </p>

      {/* CTA */}
      <div className="toss-fade-up toss-delay-3 flex gap-2.5">
        <Link
          href="/community"
          className="toss-shine flex items-center gap-1.5 px-6 py-3 rounded-full bg-[#F9954E] text-white text-[14px] font-bold shadow-md shadow-[#F9954E]/25 active:opacity-85 transition-opacity"
        >
          커뮤니티 둘러보기 <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        <Link
          href="/ai-tools"
          className="flex items-center px-6 py-3 rounded-full bg-neutral-100 dark:bg-zinc-900 text-neutral-700 dark:text-neutral-300 text-[14px] font-bold active:opacity-70 transition-opacity"
        >
          AI 도구
        </Link>
      </div>

    </section>
  );
}
