"use client";

// My World — 오늘 요약.
//
// "오늘 할 일이 한눈에 안 보인다" 는 문제를 실제 데이터로만 해결한다.
// 새 미션·업적·보상 체계를 만들지 않는다 — 이미 존재하는 값(오늘 상호작용 횟수,
// 일일 보상 상한 잔여, 방 저장 상태, 오늘 일기 수)을 모아 보여줄 뿐이다.
import { useMemo } from "react";
import { useDiary } from "@/contexts/DiaryContext";
import { useInteraction } from "@/contexts/InteractionContext";
import { useRoom } from "@/contexts/RoomContext";
import WorldPanel from "@/components/my-world/WorldPanel";
import { dailyRewardProgress } from "@/lib/myWorld/interaction/availability";
import { localDateKey } from "@/lib/myWorld/interaction/engine";

function Bar({ value, max, className }: { value: number; max: number; className: string }) {
  const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-stone-200/70 dark:bg-zinc-800">
      <div className={`h-full rounded-full transition-[width] duration-500 ${className}`} style={{ width: `${percent}%` }} />
    </div>
  );
}

export default function TodayCard() {
  const { state } = useInteraction();
  const { dirty } = useRoom();
  const { entries } = useDiary();

  const daily = useMemo(() => dailyRewardProgress(state), [state]);
  const todayCount = state.daily.date === localDateKey() ? state.daily.count : 0;
  const todayDiary = useMemo(() => {
    const key = localDateKey();
    return entries.filter((e) => localDateKey(e.createdAt) === key).length;
  }, [entries]);

  const affinityLeft = Math.max(0, daily.affinityMax - daily.affinityGained);
  const expLeft = Math.max(0, daily.expMax - daily.expGained);

  return (
    <WorldPanel
      title="오늘"
      subtitle={todayCount > 0 ? `지금까지 ${todayCount}번 교감했어요` : "아직 오늘 교감하지 않았어요"}
      tone="tinted"
      labelledById="today-heading"
    >
      <div className="space-y-3">
        <div>
          <div className="flex items-baseline justify-between gap-2 text-[12px] font-bold">
            <span className="text-stone-600 dark:text-zinc-300">💗 오늘의 친밀도</span>
            <span className="tabular-nums text-pink-600 dark:text-pink-300">
              {daily.affinityGained} / {daily.affinityMax}
            </span>
          </div>
          <Bar value={daily.affinityGained} max={daily.affinityMax} className="bg-gradient-to-r from-pink-400 to-rose-500" />
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-2 text-[12px] font-bold">
            <span className="text-stone-600 dark:text-zinc-300">✨ 오늘의 EXP</span>
            <span className="tabular-nums text-amber-600 dark:text-amber-300">
              {daily.expGained} / {daily.expMax}
            </span>
          </div>
          <Bar value={daily.expGained} max={daily.expMax} className="bg-gradient-to-r from-amber-400 to-[#F9954E]" />
        </div>

        <p className="flex items-start gap-1.5 rounded-2xl bg-white/70 px-3 py-2 text-[11px] font-semibold leading-relaxed text-stone-600 dark:bg-zinc-900/60 dark:text-zinc-300">
          <span aria-hidden>{daily.exhausted ? "🌙" : "🎯"}</span>
          <span className="break-keep">
            {daily.exhausted
              ? "오늘 받을 친밀도·EXP를 모두 받았어요. 계속 놀 수는 있고, 내일 다시 쌓여요."
              : `오늘 친밀도 ${affinityLeft}, EXP ${expLeft} 더 받을 수 있어요.`}
          </span>
        </p>

        {/* 가구 수·저장 상태는 옆 "내 방" 패널이 이미 보여준다 —
            여기서는 "지금 해야 할 일"(저장 안 된 변경)일 때만 되풀이한다. */}
        <div className={dirty ? "grid grid-cols-2 gap-2" : ""}>
          {dirty && (
            <div className="rounded-2xl bg-white/70 px-3 py-2 dark:bg-zinc-900/60">
              <p className="text-[11px] font-bold text-stone-500 dark:text-zinc-400">내 방</p>
              <p className="mt-0.5 text-[12px] font-black text-[#E07C2E]">✏️ 저장 대기</p>
            </div>
          )}
          <div className="rounded-2xl bg-white/70 px-3 py-2 dark:bg-zinc-900/60">
            <p className="text-[11px] font-bold text-stone-500 dark:text-zinc-400">오늘 일기</p>
            <p className="mt-0.5 text-[12px] font-black text-stone-800 dark:text-zinc-100">
              {todayDiary > 0 ? `📖 ${todayDiary}건` : "🌱 아직 없음"}
            </p>
          </div>
        </div>
      </div>
    </WorldPanel>
  );
}
