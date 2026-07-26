"use client";

// My World — 안내·제한 피드백 (무대 밖).
//
// 역할 분리(3단):
//   · 말풍선(SpeechBubble)       = 캐릭터의 대사        → 무대 안 상단
//   · 상승 피드백(RisingRewards) = 친밀도/EXP 적립       → 캐릭터 머리 위, 짧게 떠오름
//   · 이 컴포넌트                = 안내·제한(로그인·cooldown·상한) → 무대 밖 한 줄
//
// 왜 무대 밖인가: 초기 구조는 알림을 무대 안쪽 하단에 세로로 쌓아 캐릭터를 최대 80% 가렸다
// (360/390px 실측). 성격이 다른 안내 문구는 세계 안이 아니라 세계 밖에서 말한다.
// 높이를 미리 확보(min-h)해 나타날 때 아래 내용이 밀리지 않게 한다.
import type { InteractionNotice } from "@/lib/myWorld/interaction/types";

const NOTE_TONE: Record<"info" | "limit", string> = {
  info: "border-[#CFE6F5] bg-[#EFF8FE] text-[#2F6E93] dark:border-sky-900 dark:bg-sky-950/70 dark:text-sky-200",
  limit: "border-[#EEDFD3] bg-[#FFF8F1] text-stone-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200",
};

export default function WorldFeedback({ notices, onDismiss }: { notices: InteractionNotice[]; onDismiss: (id: string) => void }) {
  const notes = notices.filter((n) => n.tone === "info" || n.tone === "limit");

  return (
    <div className="mt-2 min-h-[36px]" aria-live="polite" aria-atomic="false">
      {notes.length > 0 && (
        <ul className="space-y-1">
          {notes.map((note) => (
            <li key={note.id}>
              <button
                type="button"
                onClick={() => onDismiss(note.id)}
                title="눌러서 닫기"
                className={`flex min-h-[36px] w-full items-center gap-1.5 rounded-2xl border px-3 py-1.5 text-left text-[12px] font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#F9954E] ${NOTE_TONE[note.tone as "info" | "limit"]}`}
              >
                <span aria-hidden>{note.emoji}</span>
                <span className="min-w-0 flex-1 break-keep">{note.label}</span>
                <span className="flex-none text-[11px] font-semibold opacity-60" aria-hidden>닫기</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
