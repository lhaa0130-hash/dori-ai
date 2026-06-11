"use client";

import { PROJECTS } from "@/constants/projectsData";

export default function ProjectsPage() {
  return (
    <main className="w-full min-h-screen bg-white dark:bg-black">

      {/* ── 히어로 ── */}
      <section className="pt-8 pb-10 border-b border-neutral-100 dark:border-zinc-900">
        <p className="text-[12px] font-semibold text-[#F9954E] mb-3">프로젝트</p>
        <h1 className="text-[36px] sm:text-[48px] font-extrabold text-neutral-950 dark:text-white leading-[1.15] tracking-tight mb-3 break-keep">
          준비 중인<br />프로젝트
        </h1>
        <p className="text-[14px] text-neutral-500 dark:text-neutral-400 leading-relaxed break-keep">
          DORI-AI가 개발 중인 프로그램들이에요. 곧 자세히 공개할게요.
        </p>
      </section>

      {/* ── 이름만 (준비 중) ── */}
      <section className="py-8">
        <div className="flex flex-col gap-2.5">
          {PROJECTS.map((p) => (
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

    </main>
  );
}
