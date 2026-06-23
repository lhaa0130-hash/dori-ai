// app/page.tsx — 토스 풍 미니멀 메인
import Link from "next/link";
import { MessagesSquare, Newspaper, Wrench, BarChart3, Gamepad2, PawPrint, ShoppingBag, FolderKanban } from "lucide-react";
import Hero from "@/components/home/Hero";
import HomeClient from "@/components/home/HomeClient";
import HomeInfoStrip from "@/components/home/HomeInfoStrip";
import InsightTabs from "@/components/home/InsightTabs";
import { getInsightFeed } from "@/lib/insightFeed";
import { getTopTools, getAnimalCount } from "@/lib/homeStats";

// 퀵 액세스 — 주요 섹션 바로가기(라인 아이콘, 4열 그리드)
const SECTIONS = [
  { label: "커뮤니티", href: "/community", Icon: MessagesSquare },
  { label: "인사이트", href: "/insight", Icon: Newspaper },
  { label: "AI 도구", href: "/ai-tools", Icon: Wrench },
  { label: "AI 모델", href: "/ai-models", Icon: BarChart3 },
  { label: "미니게임", href: "/minigame", Icon: Gamepad2 },
  { label: "동물도감", href: "/animal", Icon: PawPrint },
  { label: "마켓", href: "/market", Icon: ShoppingBag },
  { label: "프로젝트", href: "/projects", Icon: FolderKanban },
];

export default async function Home() {
  const insightFeed = getInsightFeed(); // 인사이트 종류별 탭 순위용
  const topTools = getTopTools(5);
  const animalCount = getAnimalCount();

  return (
    <main className="min-h-screen">

      {/* ① 미니멀 히어로 */}
      <Hero />

      {/* ①-b 정보 스트립 (인기 AI도구·지표) */}
      <HomeInfoStrip topTools={topTools} insightCount={insightFeed.length} animalCount={animalCount} />

      {/* ② 퀵 액세스 — 한 줄 가로 스크롤 */}
      <section className="py-4 border-b border-neutral-100 dark:border-zinc-900">
        <div className="-mx-4 px-4 overflow-x-auto scrollbar-hide">
          <div className="flex gap-1 w-max">
            {SECTIONS.map(({ label, href, Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-1.5 py-2 w-[64px] shrink-0 rounded-2xl active:bg-neutral-50 dark:active:bg-zinc-900 transition-colors"
              >
                <span className="w-11 h-11 rounded-2xl bg-neutral-100 dark:bg-zinc-900 flex items-center justify-center text-neutral-700 dark:text-neutral-300">
                  <Icon className="w-5 h-5" strokeWidth={1.8} />
                </span>
                <span className="text-[10.5px] font-semibold text-neutral-600 dark:text-neutral-400 whitespace-nowrap">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ③ 출석·등급 위젯 */}
      <HomeClient />

      {/* ④ AI 인사이트 — 종류별 탭 순위 (토스 실시간차트 자리) */}
      <InsightTabs items={insightFeed} />

    </main>
  );
}
