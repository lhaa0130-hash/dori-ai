"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full bg-white dark:bg-black border-t border-neutral-200 dark:border-neutral-800 transition-colors duration-300">
      <div className="max-w-3xl mx-auto px-6 py-6">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-6">
          {/* Left: Brand & Manifesto */}
          <div className="space-y-4">
            <Link href="/" className="text-lg font-bold bg-[linear-gradient(to_right,#FBAA60,#F9954E_30%,#F9954E_70%,#E8832E)] bg-clip-text text-transparent animate-gradient-x hover:opacity-80 transition-opacity inline-block">
              DORI-AI
            </Link>

            {/* Manifesto Block: Clean & Styled */}
            <div className="text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400 border-l-2 border-[#F9954E] pl-3 py-1">
              <div className="flex flex-col gap-0.5">
                <span>
                  DORI-AI는 <strong className="font-semibold text-neutral-800 dark:text-neutral-200">바이브코딩</strong>으로 제작되었습니다.
                </span>
                <span>우리는 AI 사용 사실을 숨기지 않습니다.</span>
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                  숨기는 것이 가짜이기 때문입니다.
                </span>
              </div>
            </div>
          </div>

          {/* Right: Links & Contact */}
          <div className="flex flex-col md:items-end gap-4 justify-between">
            <div className="flex flex-wrap gap-4 text-xs font-medium text-neutral-600 dark:text-neutral-400">
              <Link href="/notice" className="hover:text-[#F9954E] transition-colors">
                공지사항
              </Link>
              <Link href="/suggestion" className="hover:text-[#F9954E] transition-colors">
                건의사항
              </Link>
              <Link href="/legal/privacy" className="hover:text-[#F9954E] transition-colors">
                개인정보처리방침
              </Link>
              <Link href="/legal/terms" className="hover:text-[#F9954E] transition-colors">
                이용약관
              </Link>
            </div>

            <div className="text-xs text-neutral-500 dark:text-neutral-400 md:text-right flex items-center gap-2 mt-auto">
              <span className="font-bold text-neutral-900 dark:text-white">Contact</span>
              <a href="mailto:lhaa0130@gmail.com" className="hover:text-[#F9954E] transition-colors">
                lhaa0130@gmail.com
              </a>
            </div>
          </div>
        </div>

        {/* Bottom: Copyright */}
        <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] text-neutral-400">
          <p>© 2026 DORI-AI. All rights reserved.</p>
          <p>Designed by DORI-AI Team</p>
        </div>

      </div>
    </footer>
  );
}