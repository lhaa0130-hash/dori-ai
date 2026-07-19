"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PROJECTS } from "@/constants/projectsData";
import { useAuth } from "@/contexts/AuthContext";
import { isAdminEmail } from "@/lib/admin";

// 관리자 전용 프로젝트(슬러그) — 비관리자에겐 목록에서 숨김(한글판과 동일 규칙)
const ADMIN_ONLY_SLUGS = new Set(["illo"]);

// 영어 텍스트 오버레이 — 구조·상태·링크는 원본 PROJECTS 재사용, 문구만 영어
type EnText = { name: string; tag: string; status: string; desc: string; launchLabel?: string; features: { title: string; detail: string }[] };
const EN: Record<string, EnText> = {
  illo: {
    name: "Agent : AI Assistant",
    tag: "Open beta",
    status: "In testing",
    desc: "Every AI in one place — an AI office for solo businesses",
    launchLabel: "Open AI Assistant",
    features: [
      { title: "Just pick the task", detail: "Choose writing, marketing or support and the right AI is already wired up." },
      { title: "Unlimited with your API key", detail: "Connect your own key to use the latest top models without limits." },
      { title: "Your own workflow", detail: "Chain input → research → draft → review as nodes to automate the work." },
      { title: "Results library", detail: "Everything you make is saved automatically — revisit or download anytime." },
    ],
  },
  "flat-form": {
    name: "Architecture Assistant (coming soon)",
    tag: "Coming soon",
    status: "Coming soon",
    desc: "Enter a lot number and get the cadastral map, coverage and floor-area ratios automatically",
    launchLabel: "Join the test",
    features: [
      { title: "Cadastral map auto-load", detail: "Type an address and the VWorld cadastral map loads automatically." },
      { title: "Setback lines calculated", detail: "Coverage ratio, floor-area ratio and setbacks are computed and drawn for you." },
      { title: "Draw and save rooms", detail: "Place rooms yourself and save the layout locally." },
      { title: "Auto lot alignment", detail: "Mark two points and the lot rotates level automatically." },
    ],
  },
  family: {
    name: "Family Hub (coming soon)",
    tag: "Coming soon",
    status: "Coming soon",
    desc: "Your family's schedule, photos, health and memories in one app",
    launchLabel: "Open Family Hub",
    features: [
      { title: "Family calendar", detail: "Bring everyone's scattered plans together in one shared view." },
      { title: "Memory archive", detail: "Collect photos spread across chats and galleries into one place." },
      { title: "Health records", detail: "Keep track of medication and check-ups for the whole family." },
      { title: "AI summary", detail: "AI sums up this week's family news at a glance." },
    ],
  },
};

const STATUS_STYLE: Record<string, string> = {
  "Open": "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20",
  "Available now": "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20",
  "In testing": "text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-zinc-800",
  "Coming soon": "text-stone-400 dark:text-stone-500 bg-stone-100 dark:bg-zinc-800",
};

export default function ProjectsEnClient() {
  const { session } = useAuth();
  const isAdmin = isAdminEmail(session?.user?.email);
  const visible = PROJECTS.filter((p) => p.category === "main" && (isAdmin || !ADMIN_ONLY_SLUGS.has(p.slug)));
  const active = visible.filter((p) => p.isActive);
  const soon = visible.filter((p) => !p.isActive);
  const en = (slug: string) => EN[slug];

  return (
    <main className="w-full min-h-screen">

      {/* ── 히어로 ── */}
      <section className="pt-8 pb-8 border-b border-stone-100 dark:border-zinc-900">
        <p className="text-[11px] font-bold text-[#F9954E] mb-3 tracking-wide uppercase">Projects by illo</p>
        <h1 className="text-[34px] sm:text-[44px] font-extrabold text-stone-950 dark:text-white leading-[1.12] tracking-tight mb-2 break-keep">
          Practical services,<br />built with AI
        </h1>
        <p className="text-[14px] text-stone-400 dark:text-stone-500 leading-relaxed break-keep">
          AI services designed, built and run by illo.<br />
          Have something in mind? We take custom requests too.
        </p>
      </section>

      {/* ── 운영 중 ── */}
      {active.length > 0 && (
        <section className="py-8">
          <p className="text-[11px] font-bold text-stone-400 dark:text-zinc-600 uppercase tracking-wide mb-5">Live · {active.length}</p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {active.map((p) => {
              const t = en(p.slug);
              if (!t) return null;
              const now = new Date();
              const isOpen = !p.launchDate || now >= new Date(p.launchDate);
              const openLabel = p.launchDate && !isOpen
                ? (() => { const d = new Date(p.launchDate!); return `Opens ${d.toLocaleDateString("en-US", { month: "long", day: "numeric" })}`; })()
                : t.launchLabel ?? "Open";

              return (
                <div key={p.slug} className="flex flex-col rounded-2xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
                  <div className="px-5 pt-5 pb-4 border-b border-stone-100 dark:border-zinc-800">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#F9954E]/8 dark:bg-[#F9954E]/10 flex items-center justify-center text-[22px] flex-shrink-0 overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {p.image ? <img src={p.image} alt={t.name} className="w-full h-full object-cover" /> : p.emoji}
                        </div>
                        <div>
                          <h2 className="text-[16px] font-extrabold text-stone-950 dark:text-white leading-tight">{t.name}</h2>
                          <span className="text-[10px] text-stone-400 dark:text-zinc-500">{t.tag}</span>
                        </div>
                      </div>
                      {ADMIN_ONLY_SLUGS.has(p.slug)
                        ? <span className="text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 text-[#F9954E] bg-[#F9954E]/10">🔒 Admin only</span>
                        : <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${STATUS_STYLE[t.status] ?? ""}`}>{t.status}</span>}
                    </div>
                    <p className="text-[13px] text-stone-500 dark:text-stone-400 leading-relaxed break-keep">{t.desc}</p>
                  </div>

                  <div className="px-5 py-4 flex-1">
                    <ul className="space-y-2">
                      {t.features.map((f, i) => (
                        <li key={f.title} className="flex items-start gap-2">
                          <span className="text-[14px] leading-none mt-0.5 flex-shrink-0">{p.features[i]?.icon ?? "•"}</span>
                          <div className="min-w-0">
                            <span className="text-[12.5px] font-bold text-stone-900 dark:text-white">{f.title}</span>
                            <span className="text-[12px] text-stone-500 dark:text-stone-400"> — {f.detail}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="px-5 pb-5">
                    {p.launchHref && isOpen ? (
                      <Link href={p.launchHref} className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#F9954E]/10 dark:bg-[#F9954E]/10 text-[#F9954E] text-[13px] font-extrabold transition-colors hover:bg-[#F9954E]/20">
                        {openLabel} <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    ) : (
                      <div className="flex items-center justify-center w-full py-3 rounded-xl bg-stone-50 dark:bg-zinc-900 text-stone-300 dark:text-zinc-600 text-[13px] font-bold cursor-not-allowed">
                        {openLabel}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── 준비 중 ── */}
      {soon.length > 0 && (
        <section className="py-8 pb-10">
          <p className="text-[11px] font-bold text-stone-400 dark:text-zinc-600 uppercase tracking-wide mb-4">Coming soon</p>
          <div className="flex flex-col gap-2.5">
            {soon.map((p) => {
              const t = en(p.slug);
              if (!t) return null;
              return (
                <div key={p.slug} className="flex items-start gap-4 px-5 py-4 rounded-2xl border border-stone-100 dark:border-zinc-900">
                  <div className="w-9 h-9 rounded-lg bg-stone-100 dark:bg-zinc-900 flex items-center justify-center text-[18px] flex-shrink-0 grayscale opacity-50">
                    {p.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[14px] font-extrabold text-stone-600 dark:text-stone-400">{t.name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 dark:bg-zinc-800 text-stone-400 dark:text-zinc-600">{t.status}</span>
                    </div>
                    <p className="text-[12px] text-stone-400 dark:text-zinc-600 break-keep leading-relaxed">{t.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── 의뢰하기 ── */}
      <section className="pb-12 border-t border-stone-100 dark:border-zinc-900 pt-8">
        <p className="text-[11px] font-bold text-stone-400 dark:text-zinc-600 uppercase tracking-wide mb-4">Custom builds</p>
        <div className="rounded-2xl border border-[#F9954E]/30 dark:border-[#F9954E]/20 bg-[#F9954E]/5 dark:bg-[#F9954E]/5 p-5">
          <p className="text-[15px] font-extrabold text-stone-900 dark:text-white mb-1">We build requested projects too</p>
          <p className="text-[13px] text-stone-500 dark:text-stone-400 leading-relaxed break-keep mb-4">
            Got an idea? We&apos;ll turn it into an AI service.<br />
            Include the details below and we&apos;ll get back to you quickly.
          </p>
          <ul className="space-y-1.5 mb-5">
            {[
              "The problem you want solved, or the service you want built",
              "Key features (a rough list is fine)",
              "Who will use it and where (web, app, etc.)",
              "Your timeline and budget range",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-[12px] text-stone-500 dark:text-stone-400">
                <span className="text-[#F9954E] mt-0.5 shrink-0 font-bold">·</span>
                {item}
              </li>
            ))}
          </ul>
          <a
            href="mailto:illo@illo.im?subject=Project request&body=Hi, I%27d like to request a project.%0A%0A[Problem to solve]%0A%0A[Key features]%0A%0A[Target users]%0A%0A[Timeline/budget]"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#F9954E] text-white text-[13px] font-extrabold transition-opacity active:opacity-85"
          >
            Request by email <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </section>

    </main>
  );
}
