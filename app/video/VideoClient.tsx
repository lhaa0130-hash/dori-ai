"use client";

import { useState } from "react";
import Link from "next/link";
import { Play, Clapperboard } from "lucide-react";
import { VIDEO_CATEGORIES } from "@/constants/videoCategories";

export interface VideoItem {
  slug: string;
  title: string;
  thumbnail?: string;
  date: string;
  cat: string; // 카테고리 key
}

function fmtDate(s?: string) {
  if (!s) return "";
  const d = new Date(s);
  if (isNaN(d.getTime())) return "";
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function VideoCard({ v }: { v: VideoItem }) {
  return (
    <Link
      href={`/insight/article/${v.slug}`}
      className="group flex flex-col rounded-2xl overflow-hidden border border-stone-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 hover:border-[#F9954E]/40 hover:shadow-lg hover:shadow-[#F9954E]/5 transition-all duration-200"
    >
      <div className="relative w-full aspect-video bg-stone-100 dark:bg-zinc-900 overflow-hidden">
        {v.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={v.thumbnail}
            alt=""
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-300 dark:text-zinc-700">
            <Clapperboard className="w-8 h-8" />
          </div>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/15 group-hover:bg-black/25 transition-colors">
          <span className="flex items-center justify-center w-11 h-11 rounded-full bg-red-600 text-white shadow-lg">
            <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
          </span>
        </span>
      </div>
      <div className="p-3">
        <h3 className="text-[13.5px] font-bold text-stone-900 dark:text-white leading-snug break-keep line-clamp-2 group-hover:text-[#F9954E] transition-colors">
          {v.title}
        </h3>
        <span className="text-[11px] text-stone-400 dark:text-stone-500 mt-1 inline-block">{fmtDate(v.date)}</span>
      </div>
    </Link>
  );
}

export default function VideoClient({ videos = [] }: { videos?: VideoItem[] }) {
  const [active, setActive] = useState<string>("all");
  const list = active === "all" ? videos : videos.filter((v) => v.cat === active);
  const countOf = (key: string) => videos.filter((v) => v.cat === key).length;

  return (
    <main className="w-full min-h-screen">
      {/* 히어로 */}
      <section className="pt-8 pb-5 border-b border-stone-100 dark:border-zinc-900">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FBEEE7] dark:bg-[#F9954E]/10 mb-4">
          <Clapperboard className="w-3.5 h-3.5 text-[#F9954E]" />
          <span className="text-[11px] font-bold text-[#F9954E]">AI 영상 {videos.length}개</span>
        </div>
        <h1 className="text-[34px] sm:text-[44px] font-extrabold text-stone-950 dark:text-white leading-[1.12] tracking-tight mb-2 break-keep">
          AI 영상 모음
        </h1>
        <p className="text-[14px] text-stone-500 dark:text-stone-500 leading-relaxed break-keep">
          매일 엄선한 AI 추천 영상을 카테고리별로 모았어요. 보고 싶은 주제만 골라보세요.
        </p>

        {/* 카테고리 칩 */}
        <div className="-mx-6 px-6 overflow-x-auto scrollbar-hide pt-5">
          <div className="flex gap-1.5 w-max">
            <button
              onClick={() => setActive("all")}
              className={`px-3 py-1 rounded-full text-[12px] font-semibold whitespace-nowrap transition-colors ${
                active === "all"
                  ? "bg-stone-950 dark:bg-white text-white dark:text-stone-950"
                  : "text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white"
              }`}
            >
              전체 {videos.length}
            </button>
            {VIDEO_CATEGORIES.map((c) => {
              const n = countOf(c.key);
              if (n === 0) return null;
              return (
                <button
                  key={c.key}
                  onClick={() => setActive(c.key)}
                  className={`px-3 py-1 rounded-full text-[12px] font-semibold whitespace-nowrap transition-colors ${
                    active === c.key
                      ? "bg-stone-950 dark:bg-white text-white dark:text-stone-950"
                      : "text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white"
                  }`}
                >
                  {c.emoji} {c.label} {n}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 카테고리 설명 (선택 시) */}
      {active !== "all" && (
        <p className="pt-5 text-[13px] text-stone-500 dark:text-stone-500 break-keep">
          {VIDEO_CATEGORIES.find((c) => c.key === active)?.desc}
        </p>
      )}

      {/* 영상 그리드 */}
      <section className="py-6 pb-16">
        {list.length === 0 ? (
          <p className="py-20 text-center text-[13px] text-stone-400 dark:text-stone-500">아직 영상이 없습니다.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {list.map((v) => (
              <VideoCard key={v.slug} v={v} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
