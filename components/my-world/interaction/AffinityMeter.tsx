"use client";

import { relationshipFor } from "@/lib/myWorld/interaction/catalog";

const LABELS = { new: "새 친구", familiar: "익숙한 사이", close: "가까운 사이", best_friend: "단짝 친구" } as const;

export default function AffinityMeter({ affinity, guest = false }: { affinity: number; guest?: boolean }) {
  const relationship = relationshipFor(affinity);
  const label = LABELS[relationship];
  return (
    <div
      className="min-w-0 flex-1"
      aria-label={guest ? `친밀도 ${affinity}점, ${label}. 체험 모드라 저장되지 않습니다.` : `친밀도 ${affinity}점, ${label}`}
    >
      <div className="mb-1 flex items-center justify-between gap-2 text-[11px] font-bold">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="truncate text-stone-600 dark:text-zinc-300">💗 {label}</span>
          {guest && (
            <span
              className="shrink-0 rounded-full bg-stone-100 px-1.5 py-0.5 text-[10px] font-black text-stone-500 dark:bg-zinc-800 dark:text-zinc-400"
              title="로그인하면 친밀도와 EXP가 저장돼요"
            >
              체험 중
            </span>
          )}
        </span>
        <span className="shrink-0 text-pink-600 dark:text-pink-300">{affinity}/100</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-pink-100 dark:bg-pink-950" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={affinity}>
        <div className="h-full rounded-full bg-gradient-to-r from-pink-400 to-rose-500 transition-[width] duration-500" style={{ width: `${affinity}%` }} />
      </div>
    </div>
  );
}
