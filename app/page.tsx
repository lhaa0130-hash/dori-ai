// app/page.tsx — 토스 풍 미니멀 메인
import Link from "next/link";
import { MessagesSquare, Newspaper, Wrench, BarChart3, Gamepad2, PawPrint, ShoppingBag, FolderKanban, Rss, Store, Bell, HelpCircle, PencilRuler } from "lucide-react";
import Hero from "@/components/home/Hero";
import HomeClient from "@/components/home/HomeClient";
import HomeInfoStrip from "@/components/home/HomeInfoStrip";
import InsightTabs from "@/components/home/InsightTabs";
import { getInsightFeed } from "@/lib/insightFeed";
import { getTopTools, getAnimalCount, getOrLists } from "@/lib/homeStats";

// 퀵 액세스 — 주요 섹션 바로가기(한 줄 가로 스크롤, 다양하게)
const SECTIONS = [
  { label: "커뮤니티", href: "/community", Icon: MessagesSquare },
  { label: "피드", href: "/feed", Icon: Rss },
  { label: "인사이트", href: "/insight", Icon: Newspaper },
  { label: "AI 도구", href: "/ai-tools", Icon: Wrench },
  { label: "AI 모델", href: "/ai-models", Icon: BarChart3 },
  { label: "미니게임", href: "/minigame", Icon: Gamepad2 },
  { label: "동물도감", href: "/animal", Icon: PawPrint },
  { label: "아크일로", href: "/flat-form", Icon: PencilRuler },
  { label: "마켓", href: "/market", Icon: ShoppingBag },
  { label: "상점", href: "/shop", Icon: Store },
  { label: "프로젝트", href: "/projects", Icon: FolderKanban },
  { label: "공지사항", href: "/notice", Icon: Bell },
  { label: "FAQ", href: "/faq", Icon: HelpCircle },
];

export default async function Home() {
  const insightFeed = getInsightFeed(25); // 인사이트 종류별 탭 순위용(전체 탭 최대 50, 본문발췌 포함)
  const topTools = getTopTools(5);
  const animalCount = getAnimalCount();
  const orLists = getOrLists(5);
  // '오늘의 인사이트' = 가장 최근 발행일의 글 수(빌드 시점 TZ 무관)
  const latestDate = insightFeed[0] ? String(insightFeed[0].date).slice(0, 10) : "";
  const todayInsights = insightFeed.filter((i) => String(i.date).slice(0, 10) === latestDate).length;

  return (
    <main className="min-h-screen">

      {/* ① 미니멀 히어로 */}
      <Hero />

      {/* ①-b 정보 스트립 (OpenRouter 인기 모델·지능·속도 + 우리 지표) */}
      <HomeInfoStrip topTools={topTools} insightCount={todayInsights} animalCount={animalCount} orLists={orLists} />

      {/* ② 퀵 액세스 — 한 줄 가로 스크롤 */}
      <section className="py-4 border-b border-neutral-100 dark:border-zinc-900">
        <div className="-mx-6 px-6 overflow-x-auto scrollbar-hide">
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

      {/* ④ AI 인사이트 — 종류별 탭 순위 (최대 50) */}
      <InsightTabs items={insightFeed} perTab={50} />

    </main>
  );
}
