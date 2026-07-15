"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PROJECTS } from "@/constants/projectsData";
import { useAuth } from "@/contexts/AuthContext";
import { isAdminEmail } from "@/lib/admin";

// 관리자 전용 프로젝트(슬러그) — 비활성화: 비관리자에겐 목록에서 아예 숨긴다. (접근은 RequireAdmin이 별도 차단)
const ADMIN_ONLY_SLUGS = new Set(["illo"]);

const STATUS_STYLE: Record<string, string> = {
  "오픈":       "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20",
  "지금 무료":  "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20",
  "이용 가능":  "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20",
  "테스트 중":  "text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-zinc-800",
  "준비 중":    "text-neutral-400 dark:text-neutral-500 bg-neutral-100 dark:bg-zinc-800",
  "기획 중":    "text-neutral-400 dark:text-neutral-500 bg-neutral-100 dark:bg-zinc-800",
};

export default function ProjectsPage() {
  const { session } = useAuth();
  const isAdmin = isAdminEmail(session?.user?.email);
  // 관리자 전용 프로젝트는 비관리자에게 노출하지 않는다(비활성). 관리자에게만 보이고 들어갈 수 있음.
  const visible = PROJECTS.filter((p) => isAdmin || !ADMIN_ONLY_SLUGS.has(p.slug));
  const active = visible.filter((p) => p.isActive);
  const soon   = visible.filter((p) => !p.isActive);

  return (
    <main className="w-full min-h-screen">

      {/* ── 히어로 ── */}
      <section className="pt-8 pb-8 border-b border-neutral-100 dark:border-zinc-900">
        <p className="text-[11px] font-bold text-[#F9954E] mb-3 tracking-wide uppercase">Projects by illo</p>
        <h1 className="text-[34px] sm:text-[44px] font-extrabold text-neutral-950 dark:text-white leading-[1.12] tracking-tight mb-2 break-keep">
          AI로 만드는<br />실용 서비스들
        </h1>
        <p className="text-[14px] text-neutral-400 dark:text-neutral-500 leading-relaxed break-keep">
          illo가 직접 기획·개발·운영하는 AI 서비스예요.<br />
          원하는 서비스가 있다면 의뢰도 받습니다.
        </p>
      </section>

      {/* ── 진행 중인 프로젝트 ── */}
      <section className="py-8">
        <p className="text-[11px] font-bold text-neutral-400 dark:text-zinc-600 uppercase tracking-wide mb-5">운영 중 · {active.length}개</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {active.map((p) => {
            const now = new Date();
            const isOpen = !p.launchDate || now >= new Date(p.launchDate);
            const openLabel = p.launchDate && !isOpen
              ? (() => { const d = new Date(p.launchDate); return `${d.getMonth()+1}월 ${d.getDate()}일 오픈`; })()
              : p.launchLabel ?? "바로 가기";

            return (
              <div
                key={p.slug}
                className="flex flex-col rounded-2xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden"
              >
                {/* 카드 헤더 */}
                <div className="px-5 pt-5 pb-4 border-b border-neutral-100 dark:border-zinc-800">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#F9954E]/8 dark:bg-[#F9954E]/10 flex items-center justify-center text-[22px] flex-shrink-0 overflow-hidden">
                        {p.image
                          ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                          : p.emoji}
                      </div>
                      <div>
                        <h2 className="text-[16px] font-extrabold text-neutral-950 dark:text-white leading-tight">{p.name}</h2>
                        <span className="text-[10px] text-neutral-400 dark:text-zinc-500">{p.tag}</span>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${STATUS_STYLE[p.status] ?? ""}`}>{p.status}</span>
                  </div>
                  <p className="text-[13px] text-neutral-500 dark:text-neutral-400 leading-relaxed break-keep">{p.desc}</p>
                </div>

                {/* 기능 목록 */}
                <div className="px-5 py-4 flex-1">
                  <ul className="space-y-2">
                    {p.features.map((f) => (
                      <li key={f.title} className="flex items-start gap-2">
                        <span className="text-[14px] leading-none mt-0.5 flex-shrink-0">{f.icon}</span>
                        <div className="min-w-0">
                          <span className="text-[12.5px] font-bold text-neutral-900 dark:text-white">{f.title}</span>
                          <span className="text-[12px] text-neutral-500 dark:text-neutral-400"> — {f.detail}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA */}
                <div className="px-5 pb-5">
                  {p.launchHref && isOpen ? (
                    <Link
                      href={p.launchHref}
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#F9954E]/10 dark:bg-[#F9954E]/10 text-[#F9954E] text-[13px] font-extrabold transition-colors hover:bg-[#F9954E]/20 dark:hover:bg-[#F9954E]/20"
                    >
                      {openLabel} <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <div className="flex items-center justify-center w-full py-3 rounded-xl bg-neutral-50 dark:bg-zinc-900 text-neutral-300 dark:text-zinc-600 text-[13px] font-bold cursor-not-allowed">
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
        <section className="pb-10">
          <p className="text-[11px] font-bold text-neutral-400 dark:text-zinc-600 uppercase tracking-wide mb-4">준비 중</p>
          <div className="flex flex-col gap-2.5">
            {soon.map((p) => (
              <div
                key={p.slug}
                className="flex items-start gap-4 px-5 py-4 rounded-2xl border border-neutral-100 dark:border-zinc-900"
              >
                <div className="w-9 h-9 rounded-lg bg-neutral-100 dark:bg-zinc-900 flex items-center justify-center text-[18px] flex-shrink-0 grayscale opacity-50">
                  {p.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[14px] font-extrabold text-neutral-600 dark:text-neutral-400">{p.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-zinc-800 text-neutral-400 dark:text-zinc-600">{p.status}</span>
                  </div>
                  <p className="text-[12px] text-neutral-400 dark:text-zinc-600 break-keep leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 의뢰하기 ── */}
      <section className="pb-12 border-t border-neutral-100 dark:border-zinc-900 pt-8">
        <p className="text-[11px] font-bold text-neutral-400 dark:text-zinc-600 uppercase tracking-wide mb-4">맞춤 제작 의뢰</p>
        <div className="rounded-2xl border border-[#F9954E]/30 dark:border-[#F9954E]/20 bg-[#F9954E]/5 dark:bg-[#F9954E]/5 p-5">
          <p className="text-[15px] font-extrabold text-neutral-900 dark:text-white mb-1">사용자 요청 프로젝트도 제작합니다</p>
          <p className="text-[13px] text-neutral-500 dark:text-neutral-400 leading-relaxed break-keep mb-4">
            아이디어가 있으시면 저희가 AI 서비스로 만들어 드려요.<br />
            의뢰 시 아래 내용을 함께 보내주시면 빠르게 검토해 드립니다.
          </p>
          <ul className="space-y-1.5 mb-5">
            {[
              "해결하고 싶은 문제 또는 만들고 싶은 서비스",
              "주요 기능 목록 (간단히 적어도 됩니다)",
              "대상 사용자와 사용 환경 (웹·앱 등)",
              "원하는 일정과 예산 범위",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-[12px] text-neutral-500 dark:text-neutral-400">
                <span className="text-[#F9954E] mt-0.5 shrink-0 font-bold">·</span>
                {item}
              </li>
            ))}
          </ul>
          <a
            href="mailto:illo@illo.im?subject=프로젝트 의뢰&body=안녕하세요, 프로젝트를 의뢰하고 싶습니다.%0A%0A[해결하고 싶은 문제]%0A%0A[주요 기능]%0A%0A[대상 사용자]%0A%0A[일정/예산]"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#F9954E] text-white text-[13px] font-extrabold transition-opacity active:opacity-85"
          >
            이메일로 의뢰하기 <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </section>

    </main>
  );
}
