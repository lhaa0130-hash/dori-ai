"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Hero() {
  return (
    <section className="pt-8 pb-6 border-b border-neutral-100 dark:border-zinc-900">
      {/* 레이블 */}
      <p className="text-[11px] font-bold text-[#F9954E] uppercase tracking-widest mb-3">
        DORI-AI
      </p>

      {/* 타이틀 */}
      <h1 className="text-[30px] font-black text-neutral-900 dark:text-white leading-[1.2] tracking-tight mb-3 break-keep">
        AI의 모든 것,<br />
        <span className="text-[#F9954E]">한 곳에서.</span>
      </h1>

      {/* 서브텍스트 */}
      <p className="text-[14px] text-neutral-400 dark:text-neutral-500 leading-relaxed mb-7 break-keep">
        트렌드 · AI 도구 · 미니게임을 지금 경험하세요.
      </p>

      {/* CTA 버튼 */}
      <div className="flex gap-2.5">
        <Link
          href="/insight"
          className="flex-1 flex items-center justify-center gap-1.5 py-4 rounded-2xl bg-[#F9954E] text-white text-[14px] font-black active:opacity-80 transition-opacity"
        >
          트렌드 보기 <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href="/ai-tools"
          className="flex-1 flex items-center justify-center py-4 rounded-2xl border border-neutral-200 dark:border-zinc-800 text-neutral-700 dark:text-neutral-300 text-[14px] font-bold active:opacity-70 transition-opacity"
        >
          AI 도구
        </Link>
      </div>
    </section>
  );
}
