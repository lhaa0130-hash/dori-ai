// 메인 상단 정보 — OpenRouter 인기 자료 TOP5 랭킹 카드 + 도리 현황.
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { TopTool, OrLists } from "@/lib/homeStats";

type Row = { name: string; val?: string };

function RankCard({ title, href, rows }: { title: string; href: string; rows: Row[] }) {
  if (!rows.length) return null;
  return (
    <Link
      href={href}
      className="group w-[212px] shrink-0 rounded-2xl bg-neutral-50 dark:bg-zinc-900/50 p-3.5 active:opacity-80 transition-opacity"
    >
      <p className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 mb-2 flex items-center justify-between gap-1">
        <span className="truncate">{title}</span>
        <ArrowRight className="w-3 h-3 flex-shrink-0 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[#F9954E]" />
      </p>
      <ol className="space-y-[7px]">
        {rows.map((r, i) => (
          <li key={r.name + i} className="flex items-center gap-2">
            <span className={`w-3 text-[10px] font-extrabold text-center flex-shrink-0 ${i < 3 ? "text-[#F9954E]" : "text-neutral-300 dark:text-neutral-600"}`}>{i + 1}</span>
            <span className="flex-1 min-w-0 truncate text-[12px] font-semibold text-neutral-700 dark:text-neutral-200">{r.name}</span>
            {r.val && <span className="text-[10.5px] text-neutral-400 tabular-nums flex-shrink-0">{r.val}</span>}
          </li>
        ))}
      </ol>
    </Link>
  );
}

export default function HomeInfoStrip({
  topTools,
  insightCount,
  animalCount,
  orLists,
}: {
  topTools: TopTool[];
  insightCount: number;
  animalCount: number;
  orLists: OrLists;
}) {
  const won = (reqM: number) => `${Math.round(reqM * 100).toLocaleString()}만`;

  return (
    <section className="py-4 border-b border-neutral-100 dark:border-zinc-900">
      <div className="-mx-4 px-4 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2.5 w-max items-stretch">

          <RankCard title="🤖 많이 쓰는 AI 모델" href="/ai-models"
            rows={orLists.usage.map((m) => ({ name: m.name, val: won(m.reqM) }))} />
          <RankCard title="🧠 똑똑한 AI 모델" href="/ai-models"
            rows={orLists.intel.map((m) => ({ name: m.name, val: `${m.score}점` }))} />
          <RankCard title="⚡ 빠른 AI 모델" href="/ai-models"
            rows={orLists.speed.map((m) => ({ name: m.name, val: `${m.tps}tps` }))} />
          <RankCard title="🔧 추천 AI 도구" href="/ai-tools"
            rows={topTools.map((t) => ({ name: t.name }))} />

          {/* 도리 현황 — 행마다 개별 링크 */}
          <div className="w-[212px] shrink-0 rounded-2xl bg-neutral-50 dark:bg-zinc-900/50 p-3.5">
            <p className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 mb-2">✨ 오늘의 도리</p>
            <ul className="space-y-[7px]">
              <li><Link href="/insight" className="flex items-center justify-between gap-2 text-[12px] hover:text-[#F9954E] transition-colors"><span className="text-neutral-700 dark:text-neutral-200">📰 오늘 인사이트</span><b className="text-neutral-900 dark:text-white tabular-nums">{insightCount}건</b></Link></li>
              {animalCount > 0 && <li><Link href="/animal" className="flex items-center justify-between gap-2 text-[12px] hover:text-[#F9954E] transition-colors"><span className="text-neutral-700 dark:text-neutral-200">🐾 동물도감</span><b className="text-neutral-900 dark:text-white tabular-nums">{animalCount}종</b></Link></li>}
              <li><Link href="/minigame" className="flex items-center justify-between gap-2 text-[12px] hover:text-[#F9954E] transition-colors"><span className="text-neutral-700 dark:text-neutral-200">🎮 미니게임</span><span className="text-[10.5px] text-neutral-400">바로가기</span></Link></li>
              <li><Link href="/community" className="flex items-center justify-between gap-2 text-[12px] hover:text-[#F9954E] transition-colors"><span className="text-neutral-700 dark:text-neutral-200">💬 커뮤니티</span><span className="text-[10.5px] text-neutral-400">이야기</span></Link></li>
            </ul>
          </div>

        </div>
      </div>
    </section>
  );
}
