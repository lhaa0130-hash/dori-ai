"use client";

// My World — 캐릭터 상태 단일 영역.
//  성장(EXP)·관계(친밀도)·기분(감정)을 한 블록에 모은다.
//
//  ⚠️ 비로그인(체험)에서는 EXP·레벨을 **보여주지 않는다**. 저장되지도, 적립되지도 않는 값을
//     "내 상태" 처럼 보여주면 거짓이 된다. 체험 중에도 실제로 변하는 값(친밀도·감정)만 남기고
//     저장되지 않는다는 사실을 문장으로 알린다.
//  · 색만으로 상태를 전달하지 않는다 — 라벨·수치를 항상 함께 쓴다.
import { relationshipFor } from "@/lib/myWorld/interaction/catalog";
import { EMOTION_META } from "@/lib/myWorld/interaction/catalog";
import type { DailyRewardProgress } from "@/lib/myWorld/interaction/availability";
import type { Emotion } from "@/lib/myWorld/interaction/types";

const RELATIONSHIP_LABEL = {
  new: "새 친구",
  familiar: "익숙한 사이",
  close: "가까운 사이",
  best_friend: "단짝 친구",
} as const;

interface Props {
  affinity: number;
  emotion: Emotion;
  /** 로그인 사용자의 성장 수치. 비로그인이면 null — EXP 영역을 아예 렌더하지 않는다. */
  growth: { level: number; exp: number; nextTotal: number; progress: number } | null;
  daily: DailyRewardProgress;
}

function Bar({ percent, className }: { percent: number; className: string }) {
  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-[#F3E4D6] dark:bg-zinc-800">
      <div className={`h-full rounded-full transition-[width] duration-500 ${className}`} style={{ width: `${Math.min(Math.max(percent, 0), 100)}%` }} />
    </div>
  );
}

export default function CharacterStatus({ affinity, emotion, growth, daily }: Props) {
  const relationship = RELATIONSHIP_LABEL[relationshipFor(affinity)];
  const mood = EMOTION_META[emotion];
  const guest = growth === null;

  return (
    <div className="mt-3 border-t border-[#EFDFD2] pt-3 dark:border-zinc-800">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <h3 className="text-[12px] font-black text-stone-500 dark:text-zinc-400">지금 상태</h3>
        {/* 감정 칩 — 감정색은 파스텔이라 흰 글자로는 2.65:1(AA 미달)이었다.
            어두운 갈색 글자 + 흰 링으로 바꿔 대비를 확보하면서 감정색은 그대로 쓴다. */}
        <span
          className="rounded-full px-2.5 py-1 text-[11px] font-black text-[#3A2A1B] ring-1 ring-white/70"
          style={{ backgroundColor: mood.color }}
          title={`현재 감정: ${mood.label}`}
        >
          <span aria-hidden>{mood.emoji}</span> {mood.label}
        </span>
      </div>

      <div className={growth ? "grid gap-3 sm:grid-cols-2" : ""}>
        {/* 관계 — 친밀도. 체험/로그인 모두 실제로 변하는 값이다. */}
        <div aria-label={`친밀도 ${affinity}점 중 100점, ${relationship}`}>
          <div className="mb-1 flex items-baseline justify-between gap-2 text-[11px] font-bold">
            <span className="min-w-0 truncate text-stone-600 dark:text-zinc-300">💗 {relationship}</span>
            <span className="flex-none tabular-nums text-pink-700 dark:text-pink-300">{affinity} / 100</span>
          </div>
          <Bar percent={affinity} className="bg-gradient-to-r from-pink-400 to-rose-500" />
        </div>

        {/* 성장 — EXP. 로그인 사용자에게만 있다. */}
        {growth && (
          <div aria-label={`레벨 ${growth.level}, 경험치 ${growth.exp} / ${growth.nextTotal}`}>
            <div className="mb-1 flex items-baseline justify-between gap-2 text-[11px] font-bold">
              <span className="text-stone-600 dark:text-zinc-300">✨ Lv.{growth.level} 경험치</span>
              <span className="tabular-nums text-amber-700 dark:text-amber-300">
                {growth.exp.toLocaleString()} / {growth.nextTotal.toLocaleString()}
              </span>
            </div>
            <Bar percent={growth.progress} className="bg-gradient-to-r from-amber-400 to-[#F9954E]" />
          </div>
        )}
      </div>

      {guest ? (
        <p className="mt-2.5 flex items-start gap-1.5 text-[11px] font-semibold leading-relaxed text-stone-500 dark:text-zinc-400">
          <span aria-hidden>🔓</span>
          <span className="break-keep">체험 중이에요. 친밀도와 EXP는 로그인한 뒤부터 저장돼요.</span>
        </p>
      ) : (
        daily.exhausted && (
          <p className="mt-2.5 flex items-start gap-1.5 text-[11px] font-semibold leading-relaxed text-stone-500 dark:text-zinc-400">
            <span aria-hidden>🌙</span>
            <span className="break-keep">오늘 받을 친밀도·EXP를 모두 받았어요. 계속 놀 수는 있고, 내일 다시 쌓여요.</span>
          </p>
        )
      )}
    </div>
  );
}
