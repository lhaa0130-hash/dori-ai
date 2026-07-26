"use client";

// My World — 비로그인 방문자용 소개.
//
// 이전 화면은 비로그인인데도 이름 "나", Lv.1, EXP 0/50, 솜사탕 0 을 보여줘서 마치 그 사람의
// 데이터인 것처럼 읽혔다. 저장되지 않는 값을 "내 상태" 처럼 보여주는 것은 거짓이므로 전부 없앤다.
// 대신 이 공간이 무엇인지 한 문장으로 말하고, 로그인 CTA 를 **여기 한 곳에만** 둔다.
// (아래 무대·방은 로그인 없이 실제로 만져볼 수 있는 체험이다.)
import Link from "next/link";
import CharacterAvatar from "@/components/my-world/CharacterAvatar";
import type { Character } from "@/lib/myWorld/character/types";

const BENEFITS = [
  { emoji: "💗", title: "친밀도와 성장", body: "교감할수록 관계가 쌓이고 EXP가 올라요." },
  { emoji: "🛋️", title: "내 방 저장", body: "가구를 배치한 방이 기기와 상관없이 남아요." },
  { emoji: "📖", title: "AI 일기", body: "함께한 순간이 자동으로 기록돼요." },
];

export default function WorldIntro({ character }: { character: Character }) {
  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-[#F9954E]/20 p-4 sm:p-6"
      style={{ background: character.defaultBackground }}
      aria-labelledby="world-intro-heading"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-black/15" />

      {/* 모바일에서도 아바타와 제목을 한 줄로 눕혀 높이를 줄인다(세로로 쌓으면 인트로만 480px). */}
      <div className="relative flex items-start gap-3 sm:gap-4 md:items-center md:gap-6">
        <div className="flex-none rounded-full bg-white/85 p-1 shadow-sm sm:p-1.5">
          <CharacterAvatar character={character} size={52} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-wide text-white/80">MY WORLD</p>
          <h1 id="world-intro-heading" className="mt-0.5 break-keep text-[18px] font-extrabold leading-snug text-white drop-shadow-sm sm:text-[21px]">
            캐릭터와 교감하고, 방을 꾸미고,
            <br className="hidden sm:inline" /> 성장 기록을 확인하는 내 공간
          </h1>
          <p className="mt-1.5 break-keep text-[12px] font-medium leading-relaxed text-white/90 sm:text-[13px]">
            로그인하지 않아도 아래에서 바로 체험할 수 있어요. 다만 기록은 저장되지 않아요.
          </p>

          <Link
            href="/login?next=/my-world"
            className="mt-3 inline-flex min-h-[48px] items-center justify-center gap-1.5 whitespace-nowrap rounded-2xl bg-white px-5 text-[14px] font-black text-[#E07C2E] shadow-sm transition hover:bg-white/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            로그인하고 내 세계 만들기
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>

      {/* 로그인하면 무엇이 달라지는지 — 가짜 수치 대신 설명으로 알린다.
          모바일에서는 카드 3장을 쌓지 않고 한 장 안의 목록으로 붙여 높이를 줄인다. */}
      <ul className="relative mt-4 divide-y divide-stone-200/70 overflow-hidden rounded-2xl bg-white/85 backdrop-blur-sm dark:divide-zinc-800 dark:bg-zinc-900/80 sm:grid sm:grid-cols-3 sm:gap-2 sm:divide-y-0 sm:bg-transparent sm:backdrop-blur-none dark:sm:bg-transparent">
        {BENEFITS.map((b) => (
          <li key={b.title} className="px-3 py-2 sm:rounded-2xl sm:bg-white/85 sm:py-2.5 sm:backdrop-blur-sm dark:sm:bg-zinc-900/80">
            <p className="flex items-center gap-1.5 text-[12px] font-black text-stone-800 dark:text-zinc-100">
              <span aria-hidden>{b.emoji}</span>
              {b.title}
            </p>
            <p className="mt-0.5 break-keep text-[11px] font-medium leading-relaxed text-stone-500 dark:text-zinc-400">{b.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
