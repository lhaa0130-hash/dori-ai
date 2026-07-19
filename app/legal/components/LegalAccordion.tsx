// app/legal/components/LegalAccordion.tsx
// FAQ·공지사항과 동일한 심플 스타일 — 왼쪽 정렬 헤더(주황 라벨+검정 제목+회색 부제) + 접이식 카드.
// 개인정보처리방침·이용약관·저작권·청소년보호정책 공용.

"use client";

import Link from "next/link";

interface Section {
  q: string;
  a: string;
}

interface LegalAccordionProps {
  label?: string;
  title: string;
  subtitle?: string;
  date?: string;
  sections: Section[];
  /** 기본 ko — 영어(/en) 페이지에서만 "en" 전달 */
  locale?: "ko" | "en";
}

export default function LegalAccordion({ label, title, subtitle, date, sections, locale = "ko" }: LegalAccordionProps) {
  const homeHref = locale === "en" ? "/en" : "/";
  const homeLabel = locale === "en" ? "← Back to home" : "← 홈으로 돌아가기";
  return (
    <main className="w-full min-h-screen">
      {/* 히어로 (FAQ 스타일) */}
      <section className="pt-8 pb-8 border-b border-stone-100 dark:border-zinc-900">
        {label && <p className="text-[12px] font-semibold text-[#F9954E] mb-3">{label}</p>}
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

      {/* 조항 아코디언 */}
      <section className="py-6 pb-20">
        <div className="space-y-2">
          {sections.map((item, i) => (
            <details
              key={i}
              className="group rounded-2xl border border-stone-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 overflow-hidden"
            >
              <summary className="cursor-pointer list-none flex items-center justify-between gap-4 p-5">
                <span className="font-bold text-[15px] text-stone-900 dark:text-white leading-snug break-keep">
                  {item.q}
                </span>
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-stone-100 dark:bg-zinc-800 flex items-center justify-center text-[#F9954E] text-sm font-semibold transition-transform duration-200 group-open:rotate-45">
                  +
                </span>
              </summary>
              <div
                className="px-5 pb-5 text-sm text-stone-600 dark:text-stone-400 leading-[1.85]"
                style={{ whiteSpace: "pre-line" }}
              >
                {item.a}
              </div>
            </details>
          ))}
        </div>

        <div className="mt-10">
          <Link
            href={homeHref}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-stone-300 text-sm font-medium hover:bg-[#FBEEE7] dark:hover:bg-orange-950/20 hover:text-[#E8832E] dark:hover:text-[#FBAA60] transition-all duration-200"
          >
            {homeLabel}
          </Link>
        </div>
      </section>
    </main>
  );
}
