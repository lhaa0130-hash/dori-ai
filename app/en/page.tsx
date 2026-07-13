import Link from "next/link";
import { Wrench, BarChart3, PawPrint, Gamepad2, Newspaper, ShoppingBag, MessagesSquare, Rss } from "lucide-react";
import { createMetadata } from "@/lib/seo";
import { getTopTools, getOrLists, getAnimalCount } from "@/lib/homeStats";
import { CATEGORY_LABELS_EN } from "@/constants/aiCategories";

export const metadata = createMetadata({
  title: "illo — All your AI in one place",
  description: "Discover, compare and use AI in one place. Browse 340+ AI tools by category, compare AI model pricing with a live cost calculator, and explore a friendly animal encyclopedia. English & Korean.",
  path: "/en",
  locale: "en",
  hreflang: { ko: "/", en: "/en" },
  keywords: ["AI tools", "AI models", "AI directory", "compare AI models", "best AI tools", "AI cost calculator", "illo"],
});

// 영어권 방문자가 둘러볼 수 있는 진입점 (영어판 페이지 우선)
const SECTIONS = [
  { label: "AI Tools", desc: "340+ tools by category", href: "/en/ai-tools", Icon: Wrench, en: true },
  { label: "AI Models", desc: "Pricing & cost calculator", href: "/en/ai-models", Icon: BarChart3, en: true },
  { label: "Animal Encyclopedia", desc: "Cute, kid-friendly animal facts", href: "/animal", Icon: PawPrint, en: false },
  { label: "Mini Games", desc: "Quick browser games", href: "/minigame", Icon: Gamepad2, en: false },
  { label: "Insight", desc: "AI trends & guides", href: "/insight", Icon: Newspaper, en: false },
  { label: "Market", desc: "Digital goods", href: "/market", Icon: ShoppingBag, en: false },
  { label: "Community", desc: "Talk AI with others", href: "/community", Icon: MessagesSquare, en: false },
  { label: "Feed", desc: "Latest from illo", href: "/feed", Icon: Rss, en: false },
];

export default function EnHome() {
  const topTools = getTopTools(6);
  const orLists = getOrLists(5);
  const animalCount = getAnimalCount();

  return (
    <main className="w-full min-h-screen max-w-3xl mx-auto px-4">
      {/* Hero */}
      <section className="pt-10 pb-8 border-b border-neutral-100 dark:border-zinc-900">
        <div className="flex items-center gap-2 mb-4">
          <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F9954E] opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-[#F9954E]" /></span>
          <span className="text-[11px] font-bold text-[#F9954E] tracking-wide uppercase">All your AI, in one place</span>
        </div>
        <h1 className="text-[34px] sm:text-[46px] font-extrabold text-neutral-950 dark:text-white leading-[1.1] tracking-tight mb-3">
          Discover, compare &<br />use AI — <span className="text-[#F9954E]">effortlessly</span>.
        </h1>
        <p className="text-[15px] text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-xl">
          illo brings scattered AI together. Browse <b className="text-neutral-700 dark:text-neutral-200">340+ AI tools</b> by category, compare AI model pricing with a live calculator, and explore more — all in one friendly place.
        </p>
        <div className="mt-6 flex flex-wrap gap-2.5">
          <Link href="/en/ai-tools" className="inline-flex items-center gap-1.5 rounded-full bg-[#F9954E] text-white text-[13.5px] font-bold px-5 py-2.5 hover:bg-[#E8832E] transition-colors">Explore AI Tools →</Link>
          <Link href="/en/ai-models" className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 dark:border-zinc-700 text-neutral-700 dark:text-neutral-200 text-[13.5px] font-bold px-5 py-2.5 hover:border-[#F9954E] hover:text-[#F9954E] transition-colors">Compare AI Models</Link>
        </div>
      </section>

      {/* Quick access */}
      <section className="py-7">
        <h2 className="text-[13px] font-extrabold text-neutral-400 dark:text-neutral-500 uppercase tracking-wide mb-4">Explore</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {SECTIONS.map(({ label, desc, href, Icon, en }) => (
            <Link key={label} href={href} className="group rounded-2xl border border-neutral-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 p-4 hover:border-[#F9954E]/40 transition-colors">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-zinc-900 flex items-center justify-center text-neutral-700 dark:text-neutral-300 group-hover:text-[#F9954E] transition-colors">
                  <Icon className="w-4.5 h-4.5" strokeWidth={1.9} />
                </span>
                {!en && <span className="ml-auto text-[9px] font-bold text-neutral-300 dark:text-zinc-600 border border-neutral-200 dark:border-zinc-700 rounded px-1 py-0.5">KO</span>}
              </div>
              <div className="text-[13.5px] font-bold text-neutral-900 dark:text-white">{label}</div>
              <div className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5 leading-snug">{desc}</div>
            </Link>
          ))}
        </div>
        <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-3">Pages marked <span className="font-bold">KO</span> are currently in Korean — more English coming soon.</p>
      </section>

      {/* Featured AI tools */}
      {topTools.length > 0 && (
        <section className="pb-7 border-t border-neutral-100 dark:border-zinc-900 pt-7">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-extrabold text-neutral-900 dark:text-white">🔥 Featured AI Tools</h2>
            <Link href="/en/ai-tools" className="text-[12px] font-bold text-neutral-400 hover:text-[#F9954E] transition-colors">See all 340+ →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {topTools.map((t) => (
              <Link key={t.name} href="/en/ai-tools" className="rounded-xl border border-neutral-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 p-3 hover:border-[#F9954E]/40 transition-colors">
                <div className="text-[13.5px] font-bold text-neutral-900 dark:text-white truncate">{t.name}</div>
                <div className="text-[11px] text-[#F9954E] font-semibold mt-0.5">{CATEGORY_LABELS_EN[t.category] || t.category}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Top AI models teaser */}
      {orLists.usage.length > 0 && (
        <section className="pb-10 border-t border-neutral-100 dark:border-zinc-900 pt-7">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-extrabold text-neutral-900 dark:text-white">📊 Most-used AI Models</h2>
            <Link href="/en/ai-models" className="text-[12px] font-bold text-neutral-400 hover:text-[#F9954E] transition-colors">Compare & calculate →</Link>
          </div>
          <div className="space-y-1.5">
            {orLists.usage.slice(0, 5).map((m, i) => (
              <div key={m.name + i} className="flex items-center gap-3 rounded-xl border border-neutral-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 px-4 py-2.5">
                <span className={`text-[13px] font-black w-5 text-center ${i < 3 ? "text-[#F9954E]" : "text-neutral-300 dark:text-zinc-600"}`}>{i + 1}</span>
                <span className="text-[13.5px] font-bold text-neutral-900 dark:text-white flex-1 truncate">{m.name}</span>
                <span className="text-[12px] tabular-nums text-neutral-400">{m.reqM.toLocaleString()}M req/day</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-3">{animalCount > 0 ? `Also on illo: a ${animalCount}-species animal encyclopedia, mini games and more.` : "Also on illo: an animal encyclopedia, mini games and more."}</p>
        </section>
      )}
    </main>
  );
}
