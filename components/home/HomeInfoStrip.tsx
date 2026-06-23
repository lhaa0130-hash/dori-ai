// 메인 상단 정보 스트립 — 토스 지수 요약 풍의 깔끔한 카드 가로 스크롤.
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { TopTool } from "@/lib/homeStats";

const CAT_EMOJI: Record<string, string> = {
  agent: "🤖", llm: "💬", img: "🎨", vid: "🎬", vedit: "✂️", code: "💻",
  voice: "🎙️", "3d": "🧊", auto: "⚙️", music: "🎵", ppt: "📊", write: "✍️",
  edit: "🖼️", etc: "✨", mkt: "📣", chat: "💬", avatar: "🧑", web: "🌐",
  edu: "📚", meet: "🎧", game: "🕹️",
};

export default function HomeInfoStrip({
  topTools,
  insightCount,
  animalCount,
}: {
  topTools: TopTool[];
  insightCount: number;
  animalCount: number;
}) {
  return (
    <section className="pb-5 border-b border-neutral-100 dark:border-zinc-900">
      <div className="-mx-4 px-4 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2.5 w-max">

          {/* 인기 AI 도구 — 간소화 랭킹 (와이드 카드) */}
          {topTools.length > 0 && (
            <Link
              href="/ai-tools"
              className="w-[230px] shrink-0 rounded-2xl border border-neutral-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3.5 active:opacity-80 transition-opacity"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-extrabold text-neutral-900 dark:text-white">🔥 인기 AI 도구</span>
                <ArrowRight className="w-3.5 h-3.5 text-neutral-300 dark:text-zinc-600" />
              </div>
              <ol className="space-y-1.5">
                {topTools.map((t, i) => (
                  <li key={t.name} className="flex items-center gap-2">
                    <span className={`w-3.5 text-[11px] font-extrabold text-center ${i < 3 ? "text-[#F9954E]" : "text-neutral-300 dark:text-neutral-600"}`}>{i + 1}</span>
                    <span className="text-[12px]">{CAT_EMOJI[t.category] || "✨"}</span>
                    <span className="text-[12.5px] font-semibold text-neutral-700 dark:text-neutral-200 truncate">{t.name}</span>
                  </li>
                ))}
              </ol>
            </Link>
          )}

          {/* 지표 카드들 */}
          <StatCard href="/insight" label="오늘의 인사이트" value={`${insightCount}건`} hint="트렌드·가이드·분석" emoji="📰" />
          {animalCount > 0 && (
            <StatCard href="/animal" label="동물도감" value={`${animalCount}종`} hint="매일 새로운 동물" emoji="🐾" />
          )}
          <StatCard href="/minigame" label="미니게임" value="플레이" hint="랭킹·솜사탕" emoji="🎮" />
          <StatCard href="/community" label="커뮤니티" value="이야기" hint="AI 수다 떨기" emoji="💬" />

        </div>
      </div>
    </section>
  );
}

function StatCard({ href, label, value, hint, emoji }: { href: string; label: string; value: string; hint: string; emoji: string }) {
  return (
    <Link
      href={href}
      className="w-[140px] shrink-0 rounded-2xl border border-neutral-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3.5 flex flex-col justify-between active:opacity-80 transition-opacity"
    >
      <div className="flex items-center justify-between">
        <span className="text-[16px]">{emoji}</span>
        <ArrowRight className="w-3.5 h-3.5 text-neutral-300 dark:text-zinc-600" />
      </div>
      <div className="mt-3">
        <p className="text-[11px] text-neutral-400">{label}</p>
        <p className="text-[18px] font-extrabold text-neutral-900 dark:text-white leading-tight">{value}</p>
        <p className="text-[10.5px] text-neutral-400 mt-0.5">{hint}</p>
      </div>
    </Link>
  );
}
