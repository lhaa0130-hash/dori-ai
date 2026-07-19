// app/en/page.tsx — 영어 홈: 한국어 메인과 동일 레이아웃을 영어로 렌더 (locale="en")
import Link from "next/link";
import { MessagesSquare, Newspaper, Wrench, BarChart3, Gamepad2, PawPrint, FolderKanban, Rss, Bell, HelpCircle } from "lucide-react";
import Hero from "@/components/home/Hero";
import HomeClient from "@/components/home/HomeClient";
import HomeInfoStrip from "@/components/home/HomeInfoStrip";
import InsightTabs from "@/components/home/InsightTabs";
import { getInsightFeed } from "@/lib/insightFeed";
import { getTopTools, getAnimalCount, getOrLists } from "@/lib/homeStats";
import { createMetadata } from "@/lib/seo";

// ⚠️영어판이 있는 페이지만 노출 — 한글 페이지로 새지 않게. (마켓·상점·커뮤니티·피드는 영어판 없어 제외)
const SECTIONS = [
  { label: "Insight", href: "/en/insight", Icon: Newspaper },
  { label: "AI Tools", href: "/en/ai-tools", Icon: Wrench },
  { label: "AI Models", href: "/en/ai-models", Icon: BarChart3 },
  { label: "AI News", href: "/en/ai-news", Icon: Rss },
  { label: "Projects", href: "/en/projects", Icon: FolderKanban },
  { label: "Animal Encyclopedia", href: "/en/animal", Icon: PawPrint },
  { label: "Mini Games", href: "/en/minigame", Icon: Gamepad2 },
  { label: "Psych Tests", href: "/en/psychtest", Icon: MessagesSquare },
  { label: "Notice", href: "/en/notice", Icon: Bell },
  { label: "FAQ", href: "/en/faq", Icon: HelpCircle },
];

export const metadata = createMetadata({
  title: "illo — All your AI in one place",
  description: "Discover, compare and use AI in one place. Browse 340+ AI tools by category, compare AI model pricing with a live cost calculator, and explore AI insights, an animal encyclopedia and more.",
  path: "/en",
  locale: "en",
  hreflang: { ko: "/", en: "/en" },
  keywords: ["AI tools", "AI models", "AI directory", "compare AI models", "best AI tools", "AI cost calculator", "illo"],
});

export default async function EnHome() {
  const insightFeed = getInsightFeed(25, "en"); // 영어 인사이트만(영어 페이지)
  const topTools = getTopTools(5);
  const animalCount = getAnimalCount();
  const orLists = getOrLists(5);
  const latestDate = insightFeed[0] ? String(insightFeed[0].date).slice(0, 10) : "";
  const todayInsights = insightFeed.filter((i) => String(i.date).slice(0, 10) === latestDate).length;

  return (
    <main className="min-h-screen">
      {/* ① 히어로 */}
      <Hero locale="en" />

      {/* ①-b 정보 스트립 */}
      <HomeInfoStrip topTools={topTools} insightCount={todayInsights} animalCount={animalCount} orLists={orLists} locale="en" />

      {/* ② 퀵 액세스 */}
      <section className="py-4 border-b border-stone-100 dark:border-zinc-900">
        <div className="-mx-6 px-6 overflow-x-auto scrollbar-hide">
          <div className="flex gap-1 w-max">
            {SECTIONS.map(({ label, href, Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-1.5 py-2 w-[72px] shrink-0 rounded-2xl active:bg-stone-50 dark:active:bg-zinc-900 transition-colors"
              >
                <span className="w-11 h-11 rounded-2xl bg-stone-100 dark:bg-zinc-900 flex items-center justify-center text-stone-700 dark:text-stone-300">
                  <Icon className="w-5 h-5" strokeWidth={1.8} />
                </span>
                <span className="text-[10.5px] font-semibold text-stone-600 dark:text-stone-400 whitespace-nowrap">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ③ 출석·등급 위젯 */}
      <HomeClient locale="en" />

      {/* ④ AI 인사이트 */}
      <InsightTabs items={insightFeed} perTab={50} locale="en" />
    </main>
  );
}
