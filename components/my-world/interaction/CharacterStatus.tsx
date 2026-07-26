"use client";

// My World — 캐릭터 상태 단일 영역.
//  이전에는 EXP 가 Hero 안, 친밀도·감정이 상호작용 카드 안에 흩어져 있어 "지금 내 상태"를
//  한눈에 읽을 수 없었다. 성장(EXP)·관계(친밀도)·기분(감정)을 한 블록에 모은다.
//  · 색만으로 상태를 전달하지 않는다 — 라벨·수치를 항상 함께 쓴다.
//  · 오늘의 보상 상한에 도달하면 "왜 더 안 오르는지" 를 문장으로 알린다.
import { relationshipFor } from "@/lib/myWorld/interaction/catalog";
import type { DailyRewardProgress } from "@/lib/myWorld/interaction/availability";
import type { Emotion } from "@/lib/myWorld/interaction/types";
import { EMOTION_META } from "@/lib/myWorld/interaction/catalog";

const RELATIONSHIP_LABEL = {
  new: "새 친구",
  familiar: "익숙한 사이",
  close: "가까운 사이",
  best_friend: "단짝 친구",
} as const;

interface Props {
  /** 누적 EXP */
  exp: number;
  /** 현재 레벨 구간의 상단 누적 EXP */
  nextTotal: number;
  /** 레벨 진행률(0~100) */
  progress: number;
  level: number;
  affinity: number;
  emotion: Emotion;
  /** 비로그인 = 체험 모드(저장·적립 없음) */
  guest: boolean;
  daily: DailyRewardProgress;
}

function Bar({ percent, className }: { percent: number; className: string }) {
  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-stone-100 dark:bg-zinc-800">
      <div className={`h-full rounded-full transition-[width] duration-500 ${className}`} style={{ width: `${Math.min(Math.max(percent, 0), 100)}%` }} />
    </div>
  );
}

export default function CharacterStatus({ exp, nextTotal, progress, level, affinity, emotion, guest, daily }: Props) {
  const relationship = RELATIONSHIP_LABEL[relationshipFor(affinity)];
  const mood = EMOTION_META[emotion];

  return (
    <div className="mt-3 rounded-2xl bg-stone-50 p-3 dark:bg-zinc-900/60">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <h3 className="text-[12px] font-black text-stone-500 dark:text-zinc-400">지금 상태</h3>
        <div className="flex items-center gap-1.5">
          {guest && (
            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-stone-500 dark:bg-zinc-800 dark:text-zinc-300" title="로그인하면 친밀도와 EXP가 저장돼요">
              체험 중
            </span>
          )}
          <span
            className="rounded-full px-2.5 py-1 text-[11px] font-black text-white"
            style={{ backgroundColor: mood.color }}
            title={`현재 감정: ${mood.label}`}
          >
            <span aria-hidden>{mood.emoji}</span> {mood.label}
          </span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {/* 성장 — EXP */}
        <div aria-label={`레벨 ${level}, 경험치 ${exp} / ${nextTotal}`}>
          <div className="mb-1 flex items-baseline justify-between gap-2 text-[11px] font-bold">
            <span className="text-stone-600 dark:text-zinc-300">✨ Lv.{level} 경험치</span>
            <span className="tabular-nums text-amber-600 dark:text-amber-300">
              {exp.toLocaleString()} / {nextTotal.toLocaleString()}
            </span>
          </div>
          <Bar percent={progress} className="bg-gradient-to-r from-amber-400 to-[#F9954E]" />
        </div>

        {/* 관계 — 친밀도 */}
        <div aria-label={`친밀도 ${affinity}점 중 100점, ${relationship}`}>
          <div className="mb-1 flex items-baseline justify-between gap-2 text-[11px] font-bold">
            <span className="min-w-0 truncate text-stone-600 dark:text-zinc-300">💗 {relationship}</span>
            <span className="flex-none tabular-nums text-pink-600 dark:text-pink-300">{affinity} / 100</span>
          </div>
          <Bar percent={affinity} className="bg-gradient-to-r from-pink-400 to-rose-500" />
        </div>
      </div>

      {daily.exhausted && (
        <p className="mt-2.5 flex items-start gap-1.5 text-[11px] font-semibold leading-relaxed text-stone-500 dark:text-zinc-400">
          <span aria-hidden>🌙</span>
          <span>오늘 받을 친밀도·EXP를 모두 받았어요. 계속 놀 수는 있고, 내일 다시 쌓여요.</span>
        </p>
      )}
    </div>
  );
}
