"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SocialLinks from "@/components/layout/SocialLinks";

// 헤더 네비와 중복되는 콘텐츠 링크는 제외. 푸터는 회사·고객지원·법적 링크 중심.
const LINKS = [
  { label: "회사 소개", labelEn: "About", href: "/legal/about" },
  { label: "공지사항", labelEn: "Notice", href: "/notice" },
  { label: "FAQ", labelEn: "FAQ", href: "/faq" },
  { label: "건의사항", labelEn: "Feedback", href: "/suggestion" },
  { label: "코지홈", labelEn: "Cozy Home", href: "/profile" },
  { label: "개인정보처리방침", labelEn: "Privacy Policy", href: "/legal/privacy" },
  { label: "이용약관", labelEn: "Terms", href: "/legal/terms" },
  { label: "저작권·라이선스", labelEn: "Copyright & License", href: "/legal/copyright" },
  { label: "청소년보호정책", labelEn: "Youth Protection", href: "/legal/youth" },
  { label: "사업자정보", labelEn: "Business Info", href: "/legal/business" },
];

export default function Footer() {
  const pathname = usePathname();
  const isEn = (pathname || "").startsWith("/en");

  return (
    <footer className="w-full bg-white dark:bg-black border-t border-neutral-100 dark:border-zinc-900 transition-colors">
      {/* 폭을 헤더/본문과 동일하게(xl:px-[260px] px-6) */}
      <div className="px-6 xl:px-[260px] py-9">

        {/* 상단: illo(좌) + SNS 5종(우측 끝) */}
        <div className="flex items-start justify-between gap-4 mb-7">
          <div>
            <Link
              href={isEn ? "/en" : "/"}
              className="text-lg font-extrabold tracking-tight bg-[linear-gradient(to_right,#FBAA60,#F9954E_40%,#E8832E)] bg-clip-text text-transparent hover:opacity-80 transition-opacity"
            >
              illo
            </Link>
            <p className="text-[11.5px] leading-relaxed text-neutral-400 dark:text-neutral-500 mt-1.5 break-keep max-w-[300px]">
              {isEn ? (
                <>
                  <span className="font-bold text-neutral-500 dark:text-neutral-400">All your work, in one place.</span><br />
                  Scattered AI, brought together — <b>illo</b> means bringing all your work into one place.
                </>
              ) : (
                <>
                  <span className="font-bold text-neutral-500 dark:text-neutral-400">모든 일을, 하나의 일로.</span><br />
                  흩어진 AI를 한 곳에서 — <b>일로</b>는 ‘모든 일(work)을 하나로, 이리로’라는 뜻이에요.
                </>
              )}
            </p>
          </div>
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
              {isEn ? l.labelEn : l.label}
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
            <a href="mailto:illo@illo.im" className="hover:text-[#F9954E] transition-colors">{isEn ? "Contact" : "문의"}</a>
          </div>
        </div>

      </div>
    </footer>
  );
}
