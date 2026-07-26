"use client";

// My World — 상호작용 피드백 표시.
//
// 왜 무대 "밖" 인가: 이전 구조(InteractionNotices)는 알림을 방 무대 안쪽 하단에 절대배치해
// 세로로 쌓았고, 캐릭터가 같은 무대의 top:82% 에 있어 알림 2~3개가 쌓이면 캐릭터를
// 최대 80% 가렸다(360/390px 실측). 그래서 피드백은 무대 아래 전용 줄로 내리고,
// 역할을 셋으로 분리한다.
//   · 말풍선(SpeechBubble) = 캐릭터의 대사        → 무대 안 상단
//   · 보상 수치(이 컴포넌트) = 친밀도/EXP 적립     → 무대 밖, 종류별로 합쳐 한 줄
//   · 안내·제한(이 컴포넌트) = 로그인·cooldown·상한 → 보상 줄과 시각적으로 구분
//
// 높이를 미리 확보(min-h)해 알림이 나타날 때 아래 내용이 밀리지 않게 한다.
import type { InteractionNotice } from "@/lib/myWorld/interaction/types";

interface RewardPart {
  emoji: string;
  label: string;
  className: string;
  value: number;
}

const METRIC_META: Record<"affinity" | "exp", Omit<RewardPart, "value">> = {
  affinity: { emoji: "💗", label: "친밀도", className: "text-pink-600 dark:text-pink-300" },
  exp: { emoji: "✨", label: "EXP", className: "text-amber-600 dark:text-amber-300" },
};

const NOTE_TONE: Record<"info" | "limit", string> = {
  info: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/70 dark:text-sky-200",
  limit: "border-stone-200 bg-stone-50 text-stone-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200",
};

/** 같은 종류의 보상 알림을 합친다 — 동시에 여러 번 적립돼도 한 줄로 읽힌다. */
function sumRewards(notices: InteractionNotice[]) {
  let affinity = 0;
  let exp = 0;
  for (const n of notices) {
    if (n.metric === "affinity") affinity += n.value ?? 0;
    else if (n.metric === "exp") exp += n.value ?? 0;
  }
  return { affinity, exp };
}

export default function WorldFeedback({ notices, onDismiss }: { notices: InteractionNotice[]; onDismiss: (id: string) => void }) {
  const rewards = notices.filter((n) => n.metric === "affinity" || n.metric === "exp");
  const notes = notices.filter((n) => n.tone === "info" || n.tone === "limit");
  const { affinity, exp } = sumRewards(rewards);
  const parts: RewardPart[] = [];
  if (affinity > 0) parts.push({ ...METRIC_META.affinity, value: affinity });
  if (exp > 0) parts.push({ ...METRIC_META.exp, value: exp });

  return (
    <div className="mt-2 min-h-[36px]" aria-live="polite" aria-atomic="false">
      {parts.length > 0 && (
        <div className="flex animate-[mw-notice-in_180ms_ease-out] items-center justify-center gap-2 rounded-2xl border border-stone-100 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
          {parts.map((p, i) => (
            <span key={p.label} className="flex items-center gap-1 text-[13px] font-black">
              {i > 0 && <span className="mr-1 text-stone-300 dark:text-zinc-600" aria-hidden>·</span>}
              <span aria-hidden>{p.emoji}</span>
              <span className={p.className}>{p.label} +{p.value}</span>
            </span>
          ))}
        </div>
      )}

      {notes.length > 0 && (
        <ul className="mt-1.5 space-y-1">
          {notes.map((note) => (
            <li key={note.id}>
              <button
                type="button"
                onClick={() => onDismiss(note.id)}
                title="눌러서 닫기"
                className={`flex min-h-[36px] w-full items-center gap-1.5 rounded-2xl border px-3 py-1.5 text-left text-[12px] font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#F9954E] ${NOTE_TONE[note.tone as "info" | "limit"]}`}
              >
                <span aria-hidden>{note.emoji}</span>
                <span className="min-w-0 flex-1">{note.label}</span>
                <span className="flex-none text-[11px] font-semibold opacity-60" aria-hidden>닫기</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
