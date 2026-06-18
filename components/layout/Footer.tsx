"use client";

import Link from "next/link";
import SocialLinks from "@/components/layout/SocialLinks";

const LINKS = [
  { label: "인사이트", href: "/insight" },
  { label: "AI 도구", href: "/ai-tools" },
  { label: "커뮤니티", href: "/community" },
  { label: "미니게임", href: "/minigame" },
  { label: "피드", href: "/feed" },
  { label: "코지홈", href: "/profile" },
  { label: "회사 소개", href: "/legal/about" },
  { label: "공지사항", href: "/notice" },
  { label: "FAQ", href: "/faq" },
  { label: "건의사항", href: "/suggestion" },
  { label: "개인정보처리방침", href: "/legal/privacy" },
  { label: "이용약관", href: "/legal/terms" },
];

export default function Footer() {
  return (
    <footer className="w-full bg-white dark:bg-black border-t border-neutral-100 dark:border-zinc-900 transition-colors">
      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* 상단: 브랜드 + 제작사 */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <Link
            href="/"
            className="text-lg font-extrabold tracking-tight bg-[linear-gradient(to_right,#FBAA60,#F9954E_40%,#E8832E)] bg-clip-text text-transparent hover:opacity-80 transition-opacity"
          >
            DORI-AI
          </Link>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-neutral-400">
            <img src="/illo-logo.png" alt="illo" width={16} height={16} className="w-4 h-4 rounded" loading="lazy" />
            made by <span className="font-bold text-neutral-500 dark:text-neutral-300">illo</span>
          </span>
        </div>

        {/* 링크 — 한 줄 미니멀 */}
        <nav className="flex flex-wrap gap-x-5 gap-y-2.5 mb-7">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-[12.5px] text-neutral-500 dark:text-neutral-400 hover:text-[#F9954E] transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* 소셜 */}
        <div className="mb-7">
          <p className="text-[12px] font-semibold text-neutral-400 dark:text-neutral-500 mb-3">팔로우</p>
          <SocialLinks />
        </div>

        {/* 하단: 저작권 + 문의 */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-5 border-t border-neutral-100 dark:border-zinc-900 text-[11px] text-neutral-400">
          <p>© 2026 illo · dori-ai.com</p>
          <a href="mailto:lhaa0130@gmail.com" className="hover:text-[#F9954E] transition-colors">
            문의: lhaa0130@gmail.com
          </a>
        </div>

      </div>
    </footer>
  );
}
