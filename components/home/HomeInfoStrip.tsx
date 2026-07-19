// 메인 상단 정보 — OpenRouter 인기 자료 TOP5 랭킹 카드 + 도리 현황. (locale-aware)
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { TopTool, OrLists } from "@/lib/homeStats";

type Row = { name: string; val?: string };
type Locale = "ko" | "en";

function RankCard({ title, href, rows }: { title: string; href: string; rows: Row[] }) {
  if (!rows.length) return null;
  return (
    <Link
      href={href}
      className="group w-[212px] shrink-0 rounded-2xl bg-stone-50 dark:bg-zinc-900/50 p-3.5 active:opacity-80 transition-opacity"
    >
      <p className="text-[11px] font-bold text-stone-400 dark:text-stone-500 mb-2 flex items-center justify-between gap-1">
        <span className="truncate">{title}</span>
        <ArrowRight className="w-3 h-3 flex-shrink-0 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[#F9954E]" />
      </p>
      <ol className="space-y-[7px]">
        {rows.map((r, i) => (
          <li key={r.name + i} className="flex items-center gap-2">
            <span className={`w-3 text-[10px] font-extrabold text-center flex-shrink-0 ${i < 3 ? "text-[#F9954E]" : "text-stone-300 dark:text-stone-600"}`}>{i + 1}</span>
            <span className="flex-1 min-w-0 truncate text-[12px] font-semibold text-stone-700 dark:text-stone-200">{r.name}</span>
            {r.val && <span className="text-[10.5px] text-stone-400 tabular-nums flex-shrink-0">{r.val}</span>}
          </li>
        ))}
      </ol>
    </Link>
  );
}

const T = {
  ko: { usage: "🤖 많이 쓰는 AI 모델", intel: "🧠 똑똑한 AI 모델", speed: "⚡ 빠른 AI 모델", price: "💰 저렴한 AI 모델", tools: "🔧 추천 AI 도구", today: "✨ 오늘의 도리", insight: "📰 오늘 인사이트", animal: "🐾 몽글로", game: "🎮 미니게임", community: "💬 커뮤니티", play: "바로가기", talk: "이야기", cnt: "건", spec: "종", pts: "점", free: "무료" },
  en: { usage: "🤖 Most-used AI Models", intel: "🧠 Smartest AI Models", speed: "⚡ Fastest AI Models", price: "💰 Cheapest AI Models", tools: "🔧 Recommended AI Tools", today: "✨ Today on illo", insight: "📰 Today's insights", animal: "🐾 Animal Encyclopedia", game: "🎮 Mini Games", community: "💬 Community", play: "Play", talk: "Talk", cnt: "", spec: "", pts: " pts", free: "Free" },
};

export default function HomeInfoStrip({
  topTools,
  insightCount,
  animalCount,
  orLists,
  locale = "ko",
}: {
  topTools: TopTool[];
  insightCount: number;
  animalCount: number;
  orLists: OrLists;
  locale?: Locale;
}) {
  const t = T[locale];
  const en = locale === "en";
  const usageVal = (reqM: number) => (en ? `${reqM}M` : `${Math.round(reqM * 100).toLocaleString()}만`);
  // 입력 100만 토큰당 단가. 0이면 무료 표기
  const priceVal = (pin: number) => (pin <= 0 ? t.free : `$${pin.toFixed(2)}/M`);
  const L = (p: string) => (en ? `/en${p}` : p); // 영어판 있는 페이지만 /en
  const hModels = en ? "/en/ai-models" : "/ai-models";
  const hTools = en ? "/en/ai-tools" : "/ai-tools";

  return (
    <section className="py-4 border-b border-stone-100 dark:border-zinc-900">
      <div className="-mx-4 px-4 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2.5 w-max items-stretch">

          <RankCard title={t.usage} href={hModels}
            rows={orLists.usage.map((m) => ({ name: m.name, val: usageVal(m.reqM) }))} />
          <RankCard title={t.intel} href={hModels}
            rows={orLists.intel.map((m) => ({ name: m.name, val: `${m.score}${t.pts}` }))} />
          <RankCard title={t.speed} href={hModels}
            rows={orLists.speed.map((m) => ({ name: m.name, val: `${m.tps}tps` }))} />
          <RankCard title={t.price} href={hModels}
            rows={orLists.price.map((m) => ({ name: m.name, val: priceVal(m.pin) }))} />
          <RankCard title={t.tools} href={hTools}
            rows={topTools.map((tl) => ({ name: tl.name }))} />

          {/* 도리 현황 — 행마다 개별 링크 */}
          <div className="w-[212px] shrink-0 rounded-2xl bg-stone-50 dark:bg-zinc-900/50 p-3.5">
            <p className="text-[11px] font-bold text-stone-400 dark:text-stone-500 mb-2">{t.today}</p>
            <ul className="space-y-[7px]">
              <li><Link href={en ? "/insight" : "/insight"} className="flex items-center justify-between gap-2 text-[12px] hover:text-[#F9954E] transition-colors"><span className="text-stone-700 dark:text-stone-200">{t.insight}</span><b className="text-stone-900 dark:text-white tabular-nums">{insightCount}{t.cnt}</b></Link></li>
              {animalCount > 0 && <li><Link href="/animal" className="flex items-center justify-between gap-2 text-[12px] hover:text-[#F9954E] transition-colors"><span className="text-stone-700 dark:text-stone-200">{t.animal}</span><b className="text-stone-900 dark:text-white tabular-nums">{animalCount}{t.spec}</b></Link></li>}
              <li><Link href="/minigame" className="flex items-center justify-between gap-2 text-[12px] hover:text-[#F9954E] transition-colors"><span className="text-stone-700 dark:text-stone-200">{t.game}</span><span className="text-[10.5px] text-stone-400">{t.play}</span></Link></li>
              <li><Link href="/community" className="flex items-center justify-between gap-2 text-[12px] hover:text-[#F9954E] transition-colors"><span className="text-stone-700 dark:text-stone-200">{t.community}</span><span className="text-[10.5px] text-stone-400">{t.talk}</span></Link></li>
            </ul>
          </div>

        </div>
      </div>
    </section>
  );
}
