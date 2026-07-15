"use client";

import SocialLinks from "@/components/layout/SocialLinks";

export default function SNSBanner() {
  return (
    <section className="py-6 pb-4">
      <div className="scroll-reveal rounded-3xl bg-white dark:bg-zinc-950 border border-stone-100 dark:border-zinc-900 px-6 pt-9 pb-9">
        <p className="text-[12px] font-semibold text-[#F9954E] mb-3">팔로우</p>
        <h2 className="text-[28px] font-extrabold text-stone-950 dark:text-white leading-[1.15] tracking-tight mb-2 break-keep">
          최신 AI 소식을<br />가장 먼저 받아보세요
        </h2>
        <p className="text-[14px] text-stone-400 dark:text-white/40 mb-7">구독하고 함께 성장해요.</p>

        <SocialLinks />
      </div>
    </section>
  );
}
