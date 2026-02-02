"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 w-full z-50 bg-white border-t border-neutral-200 dark:border-[#27272a] transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-6 py-6">

        {/* Row 1: Logo, Copyright, Links (One Line on Desktop) */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8 mb-4 border-b border-neutral-200 dark:border-[#27272a] pb-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xl font-bold whitespace-nowrap bg-[linear-gradient(to_right,#facc15,#f97316_20%,#f97316_80%,#ef4444)] bg-clip-text text-transparent animate-gradient-x hover:opacity-80 transition-opacity">
              DORI-AI
            </Link>
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              © 2026 DORI-AI. All rights reserved.
            </p>
          </div>

          <div className="flex-1 hidden md:block" /> {/* Spacer */}

          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-muted-foreground">
            <Link href="/suggestion" className="hover:text-foreground transition-colors">
              건의사항
            </Link>
            <Link href="/legal/privacy" className="hover:text-foreground transition-colors">
              개인정보처리방침
            </Link>
            <Link href="/legal/terms" className="hover:text-foreground transition-colors">
              이용약관
            </Link>
          </div>
        </div>

        {/* Row 2: Manifesto & Contact (Compressed to ~3 lines) */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 text-xs text-muted-foreground">

          {/* Manifesto Area */}
          <div className="flex gap-3 items-start max-w-3xl">
            <span className="text-lg leading-none mt-0.5">🤖</span>
            <div className="flex flex-col gap-1">
              <span className="font-bold text-foreground">AI Manifesto</span>
              <p className="leading-relaxed">
                DORI-AI는 바이브코딩으로 작업된 사이트입니다. 우리는 AI 사용 사실을 숨기지 않습니다.<br className="hidden md:inline" />
                <span className="text-foreground/80 font-semibold">숨기는 것이 가짜입니다.</span>
              </p>
            </div>
          </div>

          {/* Contact Area */}
          <div className="flex flex-col gap-1 md:text-right mt-1 md:mt-0">
            <span className="font-bold text-foreground">Contact</span>
            <a href="mailto:lhaa0130@gmail.com" className="hover:text-foreground transition-colors">
              lhaa0130@gmail.com
            </a>
          </div>

        </div>

      </div>
    </footer>
  );
}