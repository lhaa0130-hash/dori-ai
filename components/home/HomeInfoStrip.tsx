// 메인 상단 정보 — 토스 지수요약 풍 콤팩트 카드(미니 스파크라인 + 큰 값).
// OpenRouter 인기 자료(모델·지능·속도)를 우리 스타일로 + 우리 지표.
import Link from "next/link";
import type { TopTool, OrPicks } from "@/lib/homeStats";

// 작은 장식용 스파크라인(브랜드색) — 카드별로 살짝 다른 모양
function Spark({ seed }: { seed: number }) {
  const pts = [4, 10, 7, 13, 9, 16, 12, 19];
  const rot = pts.map((v, i) => pts[(i + seed) % pts.length]);
  const d = rot.map((v, i) => `${(i / (rot.length - 1)) * 56},${22 - v}`).join(" ");
  return (
    <svg viewBox="0 0 56 24" className="w-14 h-6" fill="none" preserveAspectRatio="none">
      <polyline points={d} stroke="#F9954E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
    </svg>
  );
}

type Card = { href: string; tag: string; value: string; unit?: string; sub: string; seed: number };

export default function HomeInfoStrip({
  topTools,
  insightCount,
  animalCount,
  orPicks,
}: {
  topTools: TopTool[];
  insightCount: number;
  animalCount: number;
  orPicks: OrPicks;
}) {
  const cards: Card[] = [];
  if (orPicks.model) cards.push({ href: "/ai-models", tag: "🤖 인기 AI 모델", value: `${orPicks.model.reqM}`, unit: "M", sub: orPicks.model.name, seed: 0 });
  if (orPicks.intel) cards.push({ href: "/ai-models", tag: "🧠 지능 1위", value: `${orPicks.intel.score}`, sub: orPicks.intel.name, seed: 2 });
  if (orPicks.speed) cards.push({ href: "/ai-models", tag: "⚡ 가장 빠름", value: `${orPicks.speed.tps}`, unit: "tps", sub: orPicks.speed.name, seed: 4 });
  if (topTools[0]) cards.push({ href: "/ai-tools", tag: "🔧 추천 AI 도구", value: topTools[0].name, sub: topTools[1] ? `· ${topTools[1].name} 외` : "둘러보기", seed: 1 });
  cards.push({ href: "/insight", tag: "📰 오늘의 인사이트", value: `${insightCount}`, unit: "건", sub: "트렌드·분석·리포트", seed: 3 });
  if (animalCount > 0) cards.push({ href: "/animal", tag: "🐾 동물도감", value: `${animalCount}`, unit: "종", sub: "매일 새 동물", seed: 5 });

  return (
    <section className="py-4 border-b border-neutral-100 dark:border-zinc-900">
      <div className="-mx-4 px-4 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2.5 w-max">
          {cards.map((c) => (
            <Link
              key={c.tag}
              href={c.href}
              className="group w-[150px] shrink-0 rounded-2xl bg-neutral-50 dark:bg-zinc-900/50 p-3.5 active:opacity-80 transition-opacity"
            >
              <p className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 mb-1.5 truncate">{c.tag}</p>
              <div className="flex items-end justify-between gap-1">
                <span className="text-[19px] font-extrabold text-neutral-900 dark:text-white leading-none tabular-nums truncate group-hover:text-[#F9954E] transition-colors">
                  {c.value}
                  {c.unit && <span className="text-[11px] font-bold text-neutral-400 ml-0.5">{c.unit}</span>}
                </span>
                <Spark seed={c.seed} />
              </div>
              <p className="text-[10.5px] text-neutral-400 dark:text-neutral-500 mt-1.5 truncate">{c.sub}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
