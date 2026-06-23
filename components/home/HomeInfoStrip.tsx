// 메인 상단 정보 — 무엇을 뜻하는지 바로 알 수 있게(제목+답+쉬운 설명).
// OpenRouter 인기 자료(가장 많이 쓰는/똑똑한/빠른 모델) + 우리 지표.
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { TopTool, OrPicks } from "@/lib/homeStats";

type Card = { href: string; title: string; big: string; detail: string };

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
  if (orPicks.model)
    cards.push({
      href: "/ai-models",
      title: "🤖 가장 많이 쓰는 AI 모델",
      big: orPicks.model.name,
      detail: `한 달 ${Math.round(orPicks.model.reqM * 100).toLocaleString()}만 회 사용 · 1위`,
    });
  if (orPicks.intel)
    cards.push({
      href: "/ai-models",
      title: "🧠 가장 똑똑한 AI 모델",
      big: orPicks.intel.name,
      detail: `지능 점수 ${orPicks.intel.score}점 · 1위`,
    });
  if (orPicks.speed)
    cards.push({
      href: "/ai-models",
      title: "⚡ 가장 빠른 AI 모델",
      big: orPicks.speed.name,
      detail: `1초에 ${orPicks.speed.tps.toLocaleString()}단어(토큰) 생성`,
    });
  if (topTools[0])
    cards.push({
      href: "/ai-tools",
      title: "🔧 오늘의 추천 AI 도구",
      big: topTools[0].name,
      detail: topTools[1] ? `${topTools[1].name} 등 더 보기` : "AI 도구 둘러보기",
    });
  cards.push({
    href: "/insight",
    title: "📰 오늘 올라온 인사이트",
    big: `${insightCount}건`,
    detail: "트렌드·분석·리포트 새 글",
  });
  if (animalCount > 0)
    cards.push({
      href: "/animal",
      title: "🐾 동물도감",
      big: `${animalCount}종`,
      detail: "수록된 동물 수 · 매일 추가",
    });

  return (
    <section className="py-4 border-b border-neutral-100 dark:border-zinc-900">
      <div className="-mx-4 px-4 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2.5 w-max">
          {cards.map((c) => (
            <Link
              key={c.title}
              href={c.href}
              className="group w-[176px] shrink-0 rounded-2xl bg-neutral-50 dark:bg-zinc-900/50 p-3.5 active:opacity-80 transition-opacity"
            >
              <p className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 mb-1.5 flex items-center justify-between gap-1">
                <span className="truncate">{c.title}</span>
                <ArrowRight className="w-3 h-3 flex-shrink-0 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[#F9954E]" />
              </p>
              <p className="text-[15px] font-extrabold text-neutral-900 dark:text-white leading-tight line-clamp-2 min-h-[36px] group-hover:text-[#F9954E] transition-colors break-keep">
                {c.big}
              </p>
              <p className="text-[10.5px] text-neutral-400 dark:text-neutral-500 mt-1.5 leading-snug break-keep line-clamp-2">{c.detail}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
