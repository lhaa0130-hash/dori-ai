"use client";

import Link from "next/link";

const SERVICE_LINKS = [
  { label: "인사이트", href: "/insight" },
  { label: "AI 도구", href: "/ai-tools" },
  { label: "커뮤니티", href: "/community" },
  { label: "미니게임", href: "/minigame" },
  { label: "피드", href: "/feed" },
  { label: "코지홈", href: "/profile" },
];

const COMPANY_LINKS = [
  { label: "회사 소개", href: "/legal/about" },
  { label: "공지사항", href: "/notice" },
  { label: "FAQ", href: "/faq" },
  { label: "건의사항", href: "/suggestion" },
  { label: "개인정보처리방침", href: "/legal/privacy" },
  { label: "이용약관", href: "/legal/terms" },
];

export default function Footer() {
  return (
    <footer className="relative w-full bg-white dark:bg-black border-t border-neutral-200/70 dark:border-zinc-900 transition-colors duration-300">
      {/* 상단 그라데이션 헤어라인 */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#F9954E]/60 to-transparent" />

      <div className="max-w-5xl mx-auto px-6 py-12">

        <div className="grid grid-cols-2 md:grid-cols-[1.7fr_1fr_1fr] gap-10 md:gap-12">

          {/* 브랜드 */}
          <div className="col-span-2 md:col-span-1 space-y-5">
            <Link
              href="/"
              className="text-2xl font-extrabold tracking-tight bg-[linear-gradient(to_right,#FBAA60,#F9954E_30%,#F9954E_70%,#E8832E)] bg-clip-text text-transparent hover:opacity-80 transition-opacity inline-block"
            >
              DORI-AI
            </Link>
            <p className="text-[12.5px] text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-xs">
              dori-ai.com — 최신 AI 트렌드와 도구, 커뮤니티, 미니게임을 한곳에서.
            </p>

            {/* 매니페스토 */}
            <div className="text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400 border-l-2 border-[#F9954E]/70 pl-3">
              <span className="block">
                <strong className="font-semibold text-neutral-700 dark:text-neutral-300">바이브코딩</strong>으로 만들어졌습니다.
              </span>
              <span className="block">우리는 AI 사용 사실을 숨기지 않습니다.</span>
            </div>

            {/* Made by illo — 링크 없음(브랜드 표기 전용) */}
            <div className="inline-flex items-center gap-3 rounded-2xl border border-neutral-100 dark:border-zinc-800/80 bg-neutral-50/80 dark:bg-zinc-950 px-3.5 py-2.5">
              <span className="grid place-items-center w-9 h-9 rounded-xl bg-white dark:bg-black ring-1 ring-[#F9954E]/20 shadow-sm">
                <img src="/illo-logo.png" alt="illo" width={26} height={26} className="w-[26px] h-[26px]" loading="lazy" />
              </span>
              <span className="leading-tight">
                <span className="block text-[9px] font-semibold uppercase tracking-[0.18em] text-neutral-400">Made by</span>
                <span className="block text-[15px] font-extrabold tracking-tight text-neutral-900 dark:text-white">illo</span>
              </span>
            </div>
          </div>

          {/* 둘러보기 */}
          <nav aria-label="서비스">
            <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#F9954E] mb-4">둘러보기</p>
            <ul className="space-y-3">
              {SERVICE_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-[13px] text-neutral-600 dark:text-neutral-400 hover:text-[#F9954E] hover:underline underline-offset-4 decoration-[#F9954E]/40 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* 고객지원 */}
          <nav aria-label="고객지원">
            <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#F9954E] mb-4">고객지원</p>
            <ul className="space-y-3">
              {COMPANY_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-[13px] text-neutral-600 dark:text-neutral-400 hover:text-[#F9954E] hover:underline underline-offset-4 decoration-[#F9954E]/40 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
              <li>
                <a href="mailto:lhaa0130@gmail.com" className="text-[13px] text-neutral-600 dark:text-neutral-400 hover:text-[#F9954E] hover:underline underline-offset-4 decoration-[#F9954E]/40 transition-colors">
                  문의 메일
                </a>
              </li>
            </ul>
          </nav>
        </div>

        {/* 하단 바 */}
        <div className="mt-12 pt-6 border-t border-neutral-100 dark:border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-neutral-400">
          <p>© 2026 <span className="font-semibold text-neutral-500 dark:text-neutral-300">illo</span>. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            <span className="font-semibold text-neutral-500 dark:text-neutral-300">dori-ai.com</span>
            <span className="text-neutral-300 dark:text-zinc-700">·</span>
            <span>made with</span>
            <span className="text-[#F9954E]">🧡</span>
            <span>by illo</span>
          </p>
        </div>

      </div>
    </footer>
  );
}
