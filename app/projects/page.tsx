"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { PROJECTS } from "@/constants/projectsData";

const STATUS_STYLE: Record<string, string> = {
  "지금 무료":  "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  "이용 가능":  "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  "준비 중":    "bg-neutral-100 dark:bg-zinc-800 text-neutral-500 dark:text-neutral-400",
  "기획 중":    "bg-neutral-100 dark:bg-zinc-800 text-neutral-400 dark:text-neutral-500",
};

const CARD_BG: Record<string, string> = {
  "illo":      "from-orange-50 to-white dark:from-orange-900/10 dark:to-zinc-950",
  "trader":    "from-blue-50 to-white dark:from-blue-900/10 dark:to-zinc-950",
  "flat-form": "from-sky-50 to-white dark:from-sky-900/10 dark:to-zinc-950",
  "animal":    "from-emerald-50 to-white dark:from-emerald-900/10 dark:to-zinc-950",
  "family":    "from-purple-50 to-white dark:from-purple-900/10 dark:to-zinc-950",
};

export default function ProjectsPage() {
  const active = PROJECTS.filter((p) => p.isActive);
  const soon   = PROJECTS.filter((p) => !p.isActive);

  return (
    <main className="w-full min-h-screen">

      {/* ── 히어로 ── */}
      <section className="pt-8 pb-10 border-b border-neutral-100 dark:border-zinc-900">
        <p className="text-[12px] font-semibold text-[#F9954E] mb-3">프로젝트</p>
        <h1 className="text-[36px] sm:text-[48px] font-extrabold text-neutral-950 dark:text-white leading-[1.15] tracking-tight mb-3 break-keep">
          DORI-AI가<br />만드는 것들
        </h1>
        <p className="text-[14px] text-neutral-500 dark:text-neutral-400 leading-relaxed break-keep">
          AI를 실생활에 녹인 5가지 서비스예요. 이용 가능한 건 지금 바로 써보세요.
        </p>
      </section>

      {/* ── 이용 가능 프로젝트 ── */}
      <section className="py-8">
        <p className="text-[12px] font-bold text-neutral-400 mb-5">지금 이용 가능 · {active.length}개</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {active.map((p) => {
            const now = new Date();
            const isOpen = !p.launchDate || now >= new Date(p.launchDate);
            const openLabel = p.launchDate && !isOpen
              ? (() => { const d = new Date(p.launchDate); return `${d.getMonth()+1}월 ${d.getDate()}일 오픈`; })()
              : p.launchLabel ?? "바로 가기";

            return (
              <div
                key={p.slug}
                className={`flex flex-col rounded-3xl border border-neutral-100 dark:border-zinc-800 bg-gradient-to-br ${CARD_BG[p.slug] ?? "from-neutral-50 to-white dark:from-zinc-900 dark:to-zinc-950"} overflow-hidden`}
              >
                {/* 카드 헤더 */}
                <div className="px-6 pt-6 pb-4 border-b border-neutral-100 dark:border-zinc-800">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="w-14 h-14 rounded-2xl bg-white dark:bg-zinc-900 border border-neutral-100 dark:border-zinc-800 flex items-center justify-center text-[32px] shadow-sm flex-shrink-0 overflow-hidden">
                      {p.image
                        ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                        : p.emoji}
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${STATUS_STYLE[p.status]}`}>{p.status}</span>
                      <span className="text-[10px] font-semibold text-neutral-400 dark:text-zinc-500">{p.tag}</span>
                    </div>
                  </div>
                  <h2 className="text-[20px] font-extrabold text-neutral-950 dark:text-white leading-snug mb-1.5">{p.name}</h2>
                  <p className="text-[13px] text-neutral-500 dark:text-neutral-400 leading-relaxed break-keep">{p.desc}</p>
                </div>

                {/* 기능 목록 */}
                <div className="px-6 py-4 flex-1">
                  <ul className="space-y-2.5">
                    {p.features.map((f) => (
                      <li key={f.title} className="flex items-start gap-2.5">
                        <span className="text-[16px] leading-none mt-0.5 flex-shrink-0">{f.icon}</span>
                        <div className="min-w-0">
                          <span className="text-[13px] font-bold text-neutral-900 dark:text-white">{f.title}</span>
                          <span className="text-[12px] text-neutral-500 dark:text-neutral-400"> — {f.detail}</span>
                        </div>
                      </li>
                    ))}
                  </ul>

                  {/* 태그 */}
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {p.tags.map((t) => (
                      <span key={t} className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-700 text-neutral-500 dark:text-neutral-400">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <div className="px-6 pb-6">
                  {p.launchHref && isOpen ? (
                    <Link
                      href={p.launchHref}
                      className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-[#F9954E] text-white text-[14px] font-extrabold active:opacity-85 transition-opacity"
                    >
                      {openLabel} <ArrowRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <div className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-neutral-100 dark:bg-zinc-800 text-neutral-400 dark:text-neutral-500 text-[14px] font-extrabold cursor-not-allowed">
                      {openLabel}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 준비 중 ── */}
      {soon.length > 0 && (
        <section className="pb-12">
          <p className="text-[12px] font-bold text-neutral-400 mb-4">준비 중</p>
          <div className="flex flex-col gap-3">
            {soon.map((p) => (
              <div
                key={p.slug}
                className="flex items-start gap-4 p-5 rounded-2xl border border-neutral-100 dark:border-zinc-900 bg-neutral-50/60 dark:bg-zinc-950"
              >
                <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-zinc-900 flex items-center justify-center text-[24px] flex-shrink-0 grayscale opacity-70">
                  {p.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[15px] font-extrabold text-neutral-700 dark:text-neutral-300">{p.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-zinc-800 text-neutral-400">준비 중</span>
                  </div>
                  <p className="text-[12px] text-neutral-400 dark:text-zinc-500 break-keep leading-relaxed">{p.desc}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {p.tags.map((t) => (
                      <span key={t} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-zinc-800 text-neutral-400">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-5 text-center text-[12px] text-neutral-300 dark:text-zinc-600">공개 일정은 공지사항에서 안내해 드릴게요.</p>
        </section>
      )}
    </main>
  );
}
