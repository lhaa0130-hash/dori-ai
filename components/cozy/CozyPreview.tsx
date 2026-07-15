"use client";

// 코지홈 미리보기 배너 — 상점 "입어보기"/구매 확인에서 적용 모습을 그대로 보여줌
import BannerFx from "./BannerFx";
import { bgGradOf, frameRingOf, nameClassOf, petEmojiOf } from "@/lib/shopItems";

export interface CozyLook {
  name: string;
  photoURL?: string;
  bg: string;
  frame: string;
  nameEffect: string;
  title: string;
  mood: string;
  stickers: string[];
  pet: string;
  bannerEffect: string;
  accent?: string;
}

export default function CozyPreview({ look }: { look: CozyLook }) {
  const letter = (look.name || "?").trim().charAt(0) || "?";
  const accent = look.accent || "#F9954E";
  const nameCls = nameClassOf(look.nameEffect);
  const petEmoji = petEmojiOf(look.pet);
  return (
    <div className="relative rounded-2xl border border-stone-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 overflow-hidden min-h-[128px]">
      <div className={`absolute inset-0 ${bgGradOf(look.bg)}`} aria-hidden />
      {look.bannerEffect && look.bannerEffect !== "none" && <BannerFx id={look.bannerEffect} count={8} />}
      <div className="relative p-4">
        <div className="flex items-start gap-3">
          <div className="relative w-14 h-14 shrink-0">
            {look.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={look.photoURL} alt="" className={`w-14 h-14 rounded-full object-cover shadow ring-offset-2 ring-offset-white dark:ring-offset-zinc-950 ${frameRingOf(look.frame)}`} />
            ) : (
              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-extrabold shadow ring-offset-2 ring-offset-white dark:ring-offset-zinc-950 ${frameRingOf(look.frame)}`} style={{ backgroundColor: accent }}>
                {letter}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[17px] font-extrabold tracking-tight truncate">
              {look.mood && <span className="mr-1">{look.mood}</span>}
              <span className={nameCls || "text-stone-900 dark:text-white"}>{look.name}</span>
            </p>
            {look.title && (
              <span className="inline-flex items-center rounded-full px-2 py-0.5 mt-1 text-[10px] font-bold text-white" style={{ backgroundColor: accent }}>
                {look.title}
              </span>
            )}
          </div>
        </div>
        {look.stickers.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1 text-[20px] leading-none select-none">
            {look.stickers.map((s, i) => <span key={`${s}-${i}`}>{s}</span>)}
          </div>
        )}
      </div>
      {petEmoji && (
        <span className="absolute bottom-2 right-3 text-[38px] leading-none arcade-float drop-shadow-md select-none" aria-hidden>{petEmoji}</span>
      )}
    </div>
  );
}
