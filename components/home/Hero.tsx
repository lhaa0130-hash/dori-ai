"use client";

import Link from "next/link";
import { TrendingUp, Wrench, Gamepad2, ArrowRight } from "lucide-react";

const stats = [
  { label: "트렌드 기사", value: "97+",  icon: TrendingUp, color: "text-blue-500",   bg: "bg-blue-50 dark:bg-blue-900/20" },
  { label: "AI 도구",     value: "100+", icon: Wrench,     color: "text-[#F9954E]",  bg: "bg-orange-50 dark:bg-orange-900/20" },
  { label: "미니게임",    value: "23+",  icon: Gamepad2,   color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20" },
];

export default function Hero() {
  return (
    <section className="w-full pt-4 pb-2">
      {/* ── 메인 카드 ── */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 shadow-sm">
        {/* 브랜드 뱃지 */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF5EB] dark:bg-orange-900/20 mb-4">
          <div className="w-4 h-4 rounded-md bg-[#F9954E] flex items-center justify-center">
            <span className="text-white font-black" style={{ fontSize: "9px" }}>D</span>
          </div>
          <span className="text-[11px] font-bold text-[#F9954E] tracking-wider">DORI-AI</span>
        </div>

        {/* 메인 타이틀 */}
        <h1 className="text-[26px] font-black text-neutral-900 dark:text-white leading-tight tracking-tight mb-2 break-keep">
          상상이 현실이 되는 곳,<br />
          <span className="text-[#F9954E]">Anything is Possible.</span>
        </h1>
        <p className="text-[13px] text-neutral-500 dark:text-neutral-400 leading-relaxed mb-5 break-keep">
          AI 트렌드 · 도구 · 게임을 한 곳에서 경험하세요.
        </p>

        {/* CTA 버튼 */}
        <div className="flex gap-2.5">
          <Link
            href="/insight"
            className="flex-1 flex items-center justify-center gap-1.5 py-3.5 rounded-2xl bg-[#F9954E] text-white text-[13px] font-black active:scale-[0.98] transition-transform shadow-md shadow-orange-200 dark:shadow-orange-900/20"
          >
            최신 트렌드
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/ai-tools"
            className="flex-1 flex items-center justify-center gap-1.5 py-3.5 rounded-2xl bg-neutral-100 dark:bg-zinc-800 text-neutral-700 dark:text-neutral-200 text-[13px] font-bold active:scale-[0.98] transition-transform"
          >
            AI 도구 탐색
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ── 통계 3칸 ── */}
      <div className="grid grid-cols-3 gap-3 mt-3">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm flex flex-col items-center gap-2">
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-[20px] font-black text-neutral-900 dark:text-white leading-none">{value}</p>
            <p className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 text-center leading-tight">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
