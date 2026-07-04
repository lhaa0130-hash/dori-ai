"use client";

import Link from "next/link";
import SocialLinks from "@/components/layout/SocialLinks";

const LINKS = [
  { label: "인사이트", href: "/insight" },
  { label: "AI 도구", href: "/ai-tools" },
  { label: "AI 모델", href: "/ai-models" },
  { label: "AI 소식", href: "/ai-news" },
  { label: "AI영상", href: "/video" },
  { label: "동물도감", href: "/animal" },
  { label: "마켓", href: "/market" },
  { label: "심리테스트", href: "/psychtest" },
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
  { label: "저작권·라이선스", href: "/legal/copyright" },
  { label: "사업자정보", href: "/legal/business" },
];

export default function Footer() {
  return (
    <footer className="w-full bg-white dark:bg-black border-t border-neutral-100 dark:border-zinc-900 transition-colors">
      {/* 폭을 헤더/본문과 동일하게(xl:px-[260px] px-6) */}
      <div className="px-6 xl:px-[260px] py-9">

        {/* 상단: illo(좌) + SNS 5종(우측 끝) */}
        <div className="flex items-center justify-between gap-4 mb-7">
          <Link
            href="/"
            className="text-lg font-extrabold tracking-tight bg-[linear-gradient(to_right,#FBAA60,#F9954E_40%,#E8832E)] bg-clip-text text-transparent hover:opacity-80 transition-opacity"
          >
            illo
          </Link>
          <SocialLinks />
        </div>

        {/* 링크 */}
        <nav className="flex flex-wrap gap-x-5 gap-y-3 mb-7">
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

        {/* 하단: 제작사 + 저작권 */}
        <div className="flex items-center justify-between flex-wrap gap-3 pt-6 border-t border-neutral-100 dark:border-zinc-900">
          <span className="inline-flex items-center gap-2 text-[12px] text-neutral-400 dark:text-neutral-500">
            <img src="/illo-logo.png" alt="illo" width={22} height={22} className="w-[22px] h-[22px] rounded-md" loading="lazy" />
            made by <span className="font-extrabold text-neutral-600 dark:text-neutral-200">illo</span>
          </span>
          <div className="flex items-center gap-3 text-[11px] text-neutral-400">
            <span>© 2026 illo</span>
            <span className="text-neutral-200 dark:text-zinc-700">·</span>
            <a href="mailto:illo@illo.im" className="hover:text-[#F9954E] transition-colors">문의</a>
          </div>
        </div>

      </div>
    </footer>
  );
}
