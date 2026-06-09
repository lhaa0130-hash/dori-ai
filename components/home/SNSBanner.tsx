"use client";

import { Youtube, Instagram, ArrowRight } from "lucide-react";

export default function SNSBanner() {
  return (
    <section className="py-8 pb-4">
      <div className="rounded-3xl bg-neutral-950 px-6 pt-10 pb-10">
        <p className="text-[11px] font-bold text-[#F9954E] tracking-[0.22em] uppercase mb-5">
          FOLLOW
        </p>

        <h2 className="text-[36px] sm:text-[44px] font-black text-white leading-[1.0] tracking-[-0.03em] mb-3 break-keep">
          DORI-AI<br />팔로우하기
        </h2>

        <p className="text-[14px] text-neutral-400 mb-10 leading-relaxed">
          최신 AI 소식을 가장 먼저<br />받아보세요.
        </p>

        <div className="flex flex-col gap-3">
          <a
            href="https://www.youtube.com/@lhaa0130"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 py-4 px-5 rounded-2xl bg-white active:opacity-80 transition-opacity"
          >
            <Youtube className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span className="text-[15px] font-bold text-neutral-900">YouTube 구독</span>
            <ArrowRight className="w-4 h-4 text-neutral-400 ml-auto" />
          </a>

          <a
            href="https://www.instagram.com/lhaa0130/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 py-4 px-5 rounded-2xl bg-neutral-800 active:opacity-80 transition-opacity"
          >
            <Instagram className="w-5 h-5 text-white flex-shrink-0" />
            <span className="text-[15px] font-bold text-white">Instagram 팔로우</span>
            <ArrowRight className="w-4 h-4 text-neutral-500 ml-auto" />
          </a>
        </div>
      </div>
    </section>
  );
}
