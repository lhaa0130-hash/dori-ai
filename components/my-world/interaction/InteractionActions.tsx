"use client";

// My World — 빠른 상호작용 버튼.
//  개선점
//   · cooldown 을 누른 뒤 알림으로 알리지 않고, 버튼에 남은 초를 미리 표시하고 비활성화한다.
//   · 라벨이 글자 단위로 찢어지지 않도록 `whitespace-nowrap` 을 못 박는다(한국어 4글자 + 아이콘).
//   · 모든 breakpoint 에서 최소 48px 높이 — 태블릿(768)에서도 터치 영역을 잃지 않는다.
//   · 사용할 수 없는 이유를 색·흐림이 아니라 텍스트("N초 후")로 알린다.
import { useEffect, useState } from "react";
import { resolveActionAvailability, type ActionAvailability } from "@/lib/myWorld/interaction/availability";
import type { InteractionState, InteractionType } from "@/lib/myWorld/interaction/types";

export interface ActionDefinition {
  type: Extract<InteractionType, "pet" | "greet" | "gift" | "sleep">;
  icon: string;
  label: string;
  /** 스크린리더용 설명 — 아이콘 의미를 문자열로 보완한다. */
  hint: string;
}

export const ACTIONS: ActionDefinition[] = [
  { type: "pet", icon: "🫳", label: "쓰다듬기", hint: "쓰다듬어 친밀도를 올려요" },
  { type: "greet", icon: "👋", label: "인사하기", hint: "인사를 건네요" },
  { type: "gift", icon: "🎁", label: "선물하기", hint: "선물을 줘요" },
  { type: "sleep", icon: "🌙", label: "재우기", hint: "잠자리에 들게 해요" },
];

/**
 * cooldown 이 남아 있는 동안에만 1초 간격으로 시각을 갱신한다.
 * 고정 delay 로 버튼을 잠그지 않고 실제 상태(state.cooldowns)를 기준으로 계산한다.
 * SSR/최초 렌더에서는 0 을 반환해 서버·클라이언트 마크업이 어긋나지 않게 한다.
 */
function useCooldownClock(state: InteractionState): number {
  const [now, setNow] = useState(0);
  const pending = Object.values(state.cooldowns).some((until) => typeof until === "number" && until > 0);

  useEffect(() => {
    setNow(Date.now());
    if (!pending) return;
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, [pending]);

  return now;
}

const ALWAYS_AVAILABLE: ActionAvailability = { type: "idle", available: true, retryAfterMs: 0, retryAfterSeconds: 0 };

export default function InteractionActions({
  state,
  loading,
  onPerform,
}: {
  state: InteractionState;
  loading: boolean;
  onPerform: (type: ActionDefinition["type"], keyboard: boolean) => void;
}) {
  const now = useCooldownClock(state);

  return (
    <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4" role="group" aria-label="상호작용 메뉴">
      {ACTIONS.map((action) => {
        const availability = now === 0 ? ALWAYS_AVAILABLE : resolveActionAvailability(state, action.type, now);
        const waiting = !availability.available;
        const disabled = loading || waiting;
        return (
          <button
            key={action.type}
            type="button"
            disabled={disabled}
            onClick={(event) => onPerform(action.type, event.detail === 0)}
            aria-label={waiting ? `${action.label} — ${availability.retryAfterSeconds}초 후에 다시 할 수 있어요` : `${action.label} — ${action.hint}`}
            className="flex min-h-[56px] flex-col items-center justify-center rounded-2xl border border-stone-100 bg-white px-2 py-2 text-[13px] font-black text-stone-700 shadow-sm transition hover:-translate-y-0.5 hover:border-[#F9954E]/40 hover:shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F9954E] active:translate-y-0 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
          >
            <span className="whitespace-nowrap">
              <span className="mr-1" aria-hidden>{action.icon}</span>
              {action.label}
            </span>
            {/* 남은 시간 자리를 항상 확보한다 — 나타날 때 버튼이 커지며 아래 내용이 밀리지 않게. */}
            <span className="h-[14px] whitespace-nowrap text-[10px] font-bold leading-[14px] tabular-nums text-stone-400 dark:text-zinc-500">
              {waiting ? `${availability.retryAfterSeconds}초 후` : " "}
            </span>
          </button>
        );
      })}
    </div>
  );
}
