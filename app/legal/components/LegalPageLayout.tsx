// app/legal/components/LegalPageLayout.tsx
// 법적/정보 페이지 통일 프레임 — 개인정보처리방침·이용약관(아코디언)과 동일한
// 그라데이션 히어로 + 폭 + 색 + 다크모드. 짧은 안내는 펼침(prose) 그대로.

"use client";

import React from "react";
import Link from "next/link";

interface LegalPageLayoutProps {
  title: string;
  subtitle?: string;
  badge?: string;
  date?: string;
  intro?: string;
  children: React.ReactNode;
}

export default function LegalPageLayout({ title, subtitle, badge, date, intro, children }: LegalPageLayoutProps) {
  return (
    <main className="w-full min-h-screen bg-white dark:bg-black transition-colors duration-500 relative overflow-x-hidden">
      {/* 배경 그라데이션 */}
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-[#FEEBD0]/40 via-[#FFF5EB]/20 to-transparent dark:from-[#8F4B10]/10 dark:via-black/0 dark:to-black/0 pointer-events-none z-0" />

      {/* 히어로 */}
      <section className="relative pt-4 sm:pt-16 pb-8 sm:pb-14 px-4 sm:px-6 text-center z-10">
        <div className="max-w-3xl mx-auto flex flex-col items-center">
          {badge && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF5EB] dark:bg-orange-950/30 border border-[#FDD5A5] dark:border-[#B35E15] text-[#E8832E] dark:text-[#FBAA60] text-xs font-bold mb-6">
              <span>{badge}</span>
            </div>
          )}
          <h1 className="text-4xl md:text-5xl font-bold mb-5 tracking-tight">
            <span className="bg-gradient-to-r from-[#F9954E] via-[#FBAA60] to-[#F9954E] bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
              {title}
            </span>
          </h1>
          {subtitle && (
            <p className="text-base md:text-lg font-medium text-neutral-600 dark:text-neutral-300 break-keep leading-relaxed max-w-xl">
              {subtitle}
            </p>
          )}
          {date && <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-3">{date}</p>}
        </div>
      </section>

      {/* 안내 배너 */}
      {intro && (
        <section className="container max-w-3xl mx-auto px-4 sm:px-6 mb-6 sm:mb-8 relative z-10">
          <div className="p-5 rounded-2xl bg-[#FFF5EB]/50 dark:bg-orange-950/10 border border-[#FDD5A5]/50 dark:border-[#B35E15]/30 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed break-keep">
            {intro}
          </div>
        </section>
      )}

      {/* 본문 (prose) */}
      <section className="container max-w-3xl mx-auto px-4 sm:px-6 pb-10 sm:pb-20 relative z-10">
        <article className="legal-prose">{children}</article>
        <div className="mt-12 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-neutral-100 dark:bg-zinc-800 text-neutral-600 dark:text-neutral-300 text-sm font-medium hover:bg-[#FFF5EB] dark:hover:bg-orange-950/20 hover:text-[#E8832E] dark:hover:text-[#FBAA60] transition-all duration-200"
          >
            ← 홈으로 돌아가기
          </Link>
        </div>
      </section>

      <style jsx global>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient { animation: gradient 3s ease infinite; }

        .legal-prose { font-size: 0.95rem; line-height: 1.85; color: #52525b; }
        .legal-prose > p:first-child { font-size: 1rem; color: #3f3f46; }
        .legal-prose h2 {
          font-size: 1.2rem; font-weight: 800; color: #1f2937;
          margin: 34px 0 14px; padding-left: 12px; border-left: 4px solid #F9954E;
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

        /* 사업자 정보 테이블 */
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
