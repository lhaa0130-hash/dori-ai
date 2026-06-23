"use client";

import Link from "next/link";
import { PROJECTS } from "@/constants/projectsData";

export default function ProjectsPage() {
  const live = PROJECTS.filter((p) => p.isActive && p.launchHref);
  const soon = PROJECTS.filter((p) => !(p.isActive && p.launchHref));
  const now = new Date();
  const badgeOf = (p: (typeof PROJECTS)[number]) => {
    if (p.launchDate) {
      const dt = new Date(p.launchDate);
      if (now < dt) return `${dt.getMonth() + 1}월 ${dt.getDate()}일 오픈`;
    }
    return p.status;
  };

  return (
    <main className="w-full min-h-screen bg-white dark:bg-black">
      {/* ── 히어로 ── */}
      <section className="pt-8 pb-10 border-b border-neutral-100 dark:border-zinc-900">
        <p className="text-[12px] font-semibold text-[#F9954E] mb-3">프로젝트</p>
        <h1 className="text-[36px] sm:text-[48px] font-extrabold text-neutral-950 dark:text-white leading-[1.15] tracking-tight mb-3 break-keep">
          DORI-AI<br />프로젝트
        </h1>
        <p className="text-[14px] text-neutral-500 dark:text-neutral-400 leading-relaxed break-keep">
          DORI-AI가 만드는 프로그램들이에요. 이용 가능한 건 바로 써보고, 준비 중인 것도 곧 공개할게요.
        </p>
      </section>

      {/* ── 이용 가능 (클릭) ── */}
      {live.length > 0 && (
        <section className="py-8">
          <p className="text-[12px] font-bold text-neutral-400 mb-3">지금 이용 가능</p>
          <div className="flex flex-col gap-2.5">
            {live.map((p) => (
              <Link
                key={p.slug}
                href={p.launchHref as string}
                className="flex items-center gap-3.5 p-4 rounded-2xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-[#F9954E] transition-colors"
              >
                <div className="w-11 h-11 rounded-xl bg-neutral-100 dark:bg-zinc-900 flex items-center justify-center text-[22px] flex-shrink-0">
                  {p.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block text-[15px] font-extrabold text-neutral-900 dark:text-white truncate">{p.name}</span>
                  <span className="block text-[12px] text-neutral-500 dark:text-neutral-400 truncate">{p.desc}</span>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#F9954E]/15 text-[#F9954E] flex-shrink-0">
                  {badgeOf(p)}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── 준비 중 ── */}
      {soon.length > 0 && (
        <section className="pb-10">
          <p className="text-[12px] font-bold text-neutral-400 mb-3">준비 중</p>
          <div className="flex flex-col gap-2.5">
            {soon.map((p) => (
              <div
                key={p.slug}
                className="flex items-center gap-3.5 p-4 rounded-2xl border border-neutral-100 dark:border-zinc-900 bg-neutral-50/50 dark:bg-zinc-950"
              >
                <div className="w-11 h-11 rounded-xl bg-neutral-100 dark:bg-zinc-900 flex items-center justify-center text-[22px] flex-shrink-0 grayscale opacity-80">
                  {p.emoji}
                </div>
                <span className="flex-1 text-[15px] font-extrabold text-neutral-700 dark:text-neutral-300">
                  {p.name}
                </span>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-zinc-800 text-neutral-400 dark:text-neutral-500 flex-shrink-0">
                  준비 중
                </span>
              </div>
            ))}
          </div>

          <p className="mt-6 text-center text-[12px] text-neutral-300 dark:text-zinc-600">
            공개 일정은 공지사항에서 안내해 드릴게요.
          </p>
        </section>
      )}
    </main>
  );
}
