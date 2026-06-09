"use client";

import { Youtube, Instagram, ArrowRight } from "lucide-react";

export default function SNSBanner() {
  return (
    <section className="py-6 pb-4">
      <div className="scroll-reveal rounded-3xl bg-white dark:bg-zinc-950 border border-neutral-100 dark:border-zinc-900 px-6 pt-9 pb-9">
        <p className="text-[12px] font-semibold text-[#F9954E] mb-3">팔로우</p>
        <h2 className="text-[28px] font-extrabold text-neutral-950 dark:text-white leading-[1.15] tracking-tight mb-2 break-keep">
          최신 AI 소식을<br />가장 먼저 받아보세요
        </h2>
        <p className="text-[14px] text-neutral-400 dark:text-white/40 mb-8">구독하고 함께 성장해요.</p>

        <div className="flex flex-col gap-2.5">
          <a
            href="https://www.youtube.com/@lhaa0130"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 py-3.5 px-4 rounded-2xl bg-neutral-50 dark:bg-white/10 border border-neutral-100 dark:border-transparent active:opacity-80 transition-opacity"
          >
            <Youtube className="w-5 h-5 text-neutral-700 dark:text-white flex-shrink-0" />
            <span className="text-[14px] font-semibold text-neutral-900 dark:text-white">YouTube 구독</span>
            <ArrowRight className="w-4 h-4 text-neutral-400 ml-auto" />
          </a>
          <a
            href="https://www.instagram.com/lhaa0130/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 py-3.5 px-4 rounded-2xl bg-[#F9954E] active:opacity-80 transition-opacity"
          >
            <Instagram className="w-5 h-5 text-white flex-shrink-0" />
            <span className="text-[14px] font-semibold text-white">Instagram 팔로우</span>
            <ArrowRight className="w-4 h-4 text-white/60 ml-auto" />
          </a>
        </div>
      </div>
    </section>
  );
}
