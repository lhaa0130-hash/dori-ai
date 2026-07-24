"use client";

import { relationshipFor } from "@/lib/myWorld/interaction/catalog";

const LABELS = { new: "새 친구", familiar: "익숙한 사이", close: "가까운 사이", best_friend: "단짝 친구" } as const;

export default function AffinityMeter({ affinity }: { affinity: number }) {
  const relationship = relationshipFor(affinity);
  return (
    <div className="min-w-0 flex-1" aria-label={`친밀도 ${affinity}점, ${LABELS[relationship]}`}>
      <div className="mb-1 flex items-center justify-between gap-2 text-[11px] font-bold">
        <span className="text-stone-600 dark:text-zinc-300">💗 {LABELS[relationship]}</span>
        <span className="text-pink-600 dark:text-pink-300">{affinity}/100</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-pink-100 dark:bg-pink-950" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={affinity}>
        <div className="h-full rounded-full bg-gradient-to-r from-pink-400 to-rose-500 transition-[width] duration-500" style={{ width: `${affinity}%` }} />
      </div>
    </div>
  );
}
