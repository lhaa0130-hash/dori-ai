// 메인 상단 정보 — 틀(카드) 없이, 인기 AI도구 미니 바차트 + 큰 숫자 지표(우리만의 대시보드 느낌).
import Link from "next/link";
import type { TopTool } from "@/lib/homeStats";

export default function HomeInfoStrip({
  topTools,
  insightCount,
  animalCount,
}: {
  topTools: TopTool[];
  insightCount: number;
  animalCount: number;
}) {
  const stats: { emoji: string; value?: string; unit?: string; label: string; href: string }[] = [
    { emoji: "📰", value: String(insightCount), unit: "건", label: "오늘의 인사이트", href: "/insight" },
    ...(animalCount > 0 ? [{ emoji: "🐾", value: String(animalCount), unit: "종", label: "동물도감", href: "/animal" }] : []),
    { emoji: "🎮", label: "미니게임", href: "/minigame" },
    { emoji: "💬", label: "커뮤니티", href: "/community" },
  ];

  return (
    <section className="py-5 border-b border-neutral-100 dark:border-zinc-900">
      <div className="flex flex-col lg:flex-row lg:items-center gap-5 lg:gap-9">

        {/* 인기 AI 도구 — 순위 미니 바차트(틀 없음) */}
        {topTools.length > 0 && (
          <Link href="/ai-tools" className="group flex-1 min-w-0">
            <p className="text-[11px] font-bold text-neutral-400 mb-2.5 flex items-center gap-1">
              🔥 인기 AI 도구
              <span className="text-[#F9954E] opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all">→</span>
            </p>
            <div className="space-y-[7px]">
              {topTools.map((t, i) => (
                <div key={t.name} className="flex items-center gap-2.5">
                  <span className={`w-3 text-[10px] font-extrabold text-right ${i < 3 ? "text-[#F9954E]" : "text-neutral-300 dark:text-neutral-600"}`}>{i + 1}</span>
                  <span className="text-[12px] font-semibold text-neutral-700 dark:text-neutral-200 w-[84px] truncate">{t.name}</span>
                  <span className="flex-1 h-[6px] rounded-full bg-neutral-100 dark:bg-zinc-800/80 overflow-hidden">
                    <span
                      className="block h-full rounded-full bg-gradient-to-r from-[#FBAA60] to-[#F9954E] transition-all duration-700"
                      style={{ width: `${100 - i * 15}%` }}
                    />
                  </span>
                </div>
              ))}
            </div>
          </Link>
        )}

        {/* 구분선(데스크탑) */}
        <span className="hidden lg:block w-px self-stretch bg-neutral-100 dark:bg-zinc-800" />

        {/* 지표 — 틀 없는 큰 숫자 */}
        <div className="flex items-end gap-6 sm:gap-8 overflow-x-auto scrollbar-hide shrink-0 -mx-4 px-4 lg:mx-0 lg:px-0">
          {stats.map((s) => (
            <Link key={s.label} href={s.href} className="group flex flex-col items-center text-center shrink-0">
              <span className="text-[15px] mb-1">{s.emoji}</span>
              {s.value ? (
                <span className="text-[20px] font-extrabold text-neutral-900 dark:text-white leading-none group-hover:text-[#F9954E] transition-colors tabular-nums">
                  {s.value}
                  <span className="text-[11px] font-bold text-neutral-400 ml-0.5">{s.unit}</span>
                </span>
              ) : (
                <span className="text-[14px] font-extrabold text-neutral-900 dark:text-white leading-none group-hover:text-[#F9954E] transition-colors">{s.label}</span>
              )}
              {s.value && <span className="text-[10.5px] text-neutral-400 mt-1.5 whitespace-nowrap">{s.label}</span>}
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}
