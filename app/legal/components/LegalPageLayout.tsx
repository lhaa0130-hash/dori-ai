// app/legal/components/LegalPageLayout.tsx
// FAQ·공지사항과 동일한 심플 스타일 — 왼쪽 정렬 헤더 + prose 본문.
// 회사소개·연락처·사업자정보 공용.

"use client";

import React from "react";
import Link from "next/link";

interface LegalPageLayoutProps {
  title: string;
  subtitle?: string;
  badge?: string;
  date?: string;
  intro?: string;
  /** 기본 ko — 영어(/en) 페이지에서만 "en" 전달 */
  locale?: "ko" | "en";
  children: React.ReactNode;
}

export default function LegalPageLayout({ title, subtitle, badge, date, intro, locale = "ko", children }: LegalPageLayoutProps) {
  const homeHref = locale === "en" ? "/en" : "/";
  const homeLabel = locale === "en" ? "← Back to home" : "← 홈으로 돌아가기";
  return (
    <main className="w-full min-h-screen">
      {/* 히어로 (FAQ 스타일) */}
      <section className="pt-8 pb-8 border-b border-stone-100 dark:border-zinc-900">
        {badge && <p className="text-[12px] font-semibold text-[#F9954E] mb-3">{badge}</p>}
        <h1 className="text-[36px] sm:text-[48px] font-extrabold text-stone-950 dark:text-white leading-[1.15] tracking-tight mb-3 break-keep">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[14px] text-stone-500 dark:text-stone-400 leading-relaxed break-keep">
            {subtitle}
          </p>
        )}
        {date && <p className="text-[12px] text-stone-400 dark:text-stone-500 mt-2">{date}</p>}
      </section>

      {/* 안내 배너 (선택) */}
      {intro && (
        <div className="mt-6 p-4 rounded-2xl bg-[#FBEEE7]/60 dark:bg-orange-950/10 border border-[#FDD5A5]/50 dark:border-[#B35E15]/30 text-[13px] text-stone-600 dark:text-stone-400 leading-relaxed break-keep">
          {intro}
        </div>
      )}

      {/* 본문 (prose) */}
      <article className="legal-prose py-8">{children}</article>

      <div className="pb-20">
        <Link
          href={homeHref}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-stone-300 text-sm font-medium hover:bg-[#FBEEE7] dark:hover:bg-orange-950/20 hover:text-[#E8832E] dark:hover:text-[#FBAA60] transition-all duration-200"
        >
          {homeLabel}
        </Link>
      </div>

      <style jsx global>{`
        .legal-prose { font-size: 0.95rem; line-height: 1.85; color: #52525b; }
        .legal-prose > p:first-child { font-size: 1rem; color: #3f3f46; }
        .legal-prose h2 {
          font-size: 1.2rem; font-weight: 800; color: #1f2937;
          margin: 32px 0 14px; padding-left: 12px; border-left: 4px solid #F9954E;
        }
        .legal-prose p { margin-bottom: 16px; }
        .legal-prose ul { padding-left: 22px; margin-bottom: 18px; list-style: disc; }
        .legal-prose li { margin-bottom: 8px; }
        .legal-prose strong { color: #1f2937; font-weight: 700; }
        .legal-prose a { color: #E8832E; font-weight: 700; text-decoration: none; }
        .legal-prose a:hover { text-decoration: underline; }
        .dark .legal-prose { color: #d4d4d8; }
        .dark .legal-prose > p:first-child { color: #e4e4e7; }
        .dark .legal-prose h2 { color: #f4f4f5; }
        .dark .legal-prose strong { color: #f4f4f5; }

        .legal-prose .biz-table { width: 100%; border-collapse: collapse; margin: 8px 0 20px; font-size: 0.95rem; }
        .legal-prose .biz-table th, .legal-prose .biz-table td { text-align: left; padding: 12px 14px; border-bottom: 1px solid #f0f0f0; vertical-align: top; }
        .legal-prose .biz-table th { width: 38%; color: #6b7280; font-weight: 700; white-space: nowrap; }
        .legal-prose .biz-table td { color: #374151; font-weight: 600; }
        .legal-prose .biz-table td.pending { color: #b98a3e; font-weight: 500; }
        .dark .legal-prose .biz-table th, .dark .legal-prose .biz-table td { border-bottom-color: #27272a; }
        .dark .legal-prose .biz-table th { color: #a1a1aa; }
        .dark .legal-prose .biz-table td { color: #e4e4e7; }
        .dark .legal-prose .biz-table td.pending { color: #d6a860; }
      `}</style>
    </main>
  );
}
