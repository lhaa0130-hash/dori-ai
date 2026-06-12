"use client";

import Link from "next/link";

const SERVICE_LINKS = [
  { label: "인사이트", href: "/insight" },
  { label: "AI 도구", href: "/ai-tools" },
  { label: "커뮤니티", href: "/community" },
  { label: "미니게임", href: "/minigame" },
  { label: "피드", href: "/feed" },
  { label: "미니홈피", href: "/profile" },
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
    <footer className="w-full bg-white dark:bg-black border-t border-neutral-200 dark:border-zinc-900 transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-6 py-10">

        <div className="grid grid-cols-2 md:grid-cols-[1.6fr_1fr_1fr] gap-8 md:gap-10">

          {/* Brand & manifesto */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <Link
              href="/"
              className="text-xl font-extrabold tracking-tight bg-[linear-gradient(to_right,#FBAA60,#F9954E_30%,#F9954E_70%,#E8832E)] bg-clip-text text-transparent hover:opacity-80 transition-opacity inline-block"
            >
              DORI-AI
            </Link>
            <p className="text-[12px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
              dori-ai.com · 최신 AI 트렌드와 도구, 커뮤니티, 미니게임을 한곳에서.
            </p>

            {/* Manifesto */}
            <div className="text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400 border-l-2 border-[#F9954E] pl-3 py-1">
              <span className="block">
                DORI-AI는 <strong className="font-semibold text-neutral-800 dark:text-neutral-200">바이브코딩</strong>으로 제작되었습니다.
              </span>
              <span className="block">우리는 AI 사용 사실을 숨기지 않습니다.</span>
              <span className="block font-semibold text-neutral-800 dark:text-neutral-200">숨기는 것이 가짜이기 때문입니다.</span>
            </div>

            {/* Made by illo */}
            <a
              href="/projects"
              className="inline-flex items-center gap-2.5 rounded-2xl border border-neutral-100 dark:border-zinc-800 bg-neutral-50 dark:bg-zinc-950 px-3 py-2 hover:border-[#F9954E]/40 transition-colors group"
            >
              <img src="/illo-logo.png" alt="illo" width={28} height={28} className="w-7 h-7 rounded-lg" loading="lazy" />
              <span className="leading-tight">
                <span className="block text-[9px] font-semibold uppercase tracking-widest text-neutral-400">Made by</span>
                <span className="block text-sm font-extrabold text-neutral-900 dark:text-white group-hover:text-[#F9954E] transition-colors">illo</span>
              </span>
            </a>
          </div>

          {/* Service links */}
          <div>
            <p className="text-[11px] font-bold tracking-widest uppercase text-[#F9954E] mb-3">둘러보기</p>
            <ul className="space-y-2.5">
              {SERVICE_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-[13px] text-neutral-600 dark:text-neutral-400 hover:text-[#F9954E] transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div>
            <p className="text-[11px] font-bold tracking-widest uppercase text-[#F9954E] mb-3">illo · 고객지원</p>
            <ul className="space-y-2.5">
              {COMPANY_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-[13px] text-neutral-600 dark:text-neutral-400 hover:text-[#F9954E] transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
              <li>
                <a href="mailto:lhaa0130@gmail.com" className="text-[13px] text-neutral-600 dark:text-neutral-400 hover:text-[#F9954E] transition-colors">
                  문의: lhaa0130@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-5 border-t border-neutral-100 dark:border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-neutral-400">
          <p>© 2026 <span className="font-semibold text-neutral-500 dark:text-neutral-300">illo</span>. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            <span className="font-semibold text-neutral-500 dark:text-neutral-300">dori-ai.com</span>
            <span className="text-neutral-300 dark:text-zinc-600">—</span>
            <span>made with</span>
            <span className="text-[#F9954E]">🧡</span>
            <span>by illo</span>
          </p>
        </div>

      </div>
    </footer>
  );
}
