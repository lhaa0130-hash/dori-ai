"use client";

import type { InteractionNotice } from "@/lib/myWorld/interaction/types";

const TONES: Record<InteractionNotice["tone"], string> = {
  affinity: "border-pink-200 bg-pink-50 text-pink-700 dark:border-pink-900 dark:bg-pink-950/90 dark:text-pink-200",
  exp: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/90 dark:text-amber-200",
  info: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/90 dark:text-sky-200",
  limit: "border-stone-200 bg-white text-stone-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200",
};

export default function InteractionNotices({ notices, onDismiss }: { notices: InteractionNotice[]; onDismiss: (id: string) => void }) {
  return (
    <div className="pointer-events-none absolute inset-x-3 bottom-3 z-[70] flex flex-col items-center gap-1.5" aria-live="polite" aria-atomic="false">
      {notices.map((notice) => (
        <button
          key={notice.id}
          type="button"
          onClick={() => onDismiss(notice.id)}
          className={`pointer-events-auto animate-[mw-notice-in_180ms_ease-out] rounded-full border px-3 py-1.5 text-[12px] font-black shadow-md ${TONES[notice.tone]}`}
        >
          <span aria-hidden>{notice.emoji}</span> {notice.label}
        </button>
      ))}
    </div>
  );
}
