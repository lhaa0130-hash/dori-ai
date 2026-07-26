"use client";

// My World — 부가 기능 묶음(progressive disclosure).
//  최근 활동·오늘 만든 작품·업적은 아직 데이터 소스가 없어 항상 빈 상태로 렌더된다.
//  기능을 없애지 않되, 항상 펼쳐진 카드 3장이 실제 기능(함께 놀기·내 방·일기)을 아래로
//  밀어내던 문제를 없애기 위해 하나의 접힌 그룹으로 모았다. 효과음 볼륨도 여기로 옮겼다.
import { useInteractionAudio } from "@/contexts/InteractionAudioContext";
import RecentActivityCard from "@/components/my-world/RecentActivityCard";
import CreationsCard from "@/components/my-world/CreationsCard";
import AchievementsCard from "@/components/my-world/AchievementsCard";

export default function WorldExtras() {
  const { muted, volume, setMuted, setVolume } = useInteractionAudio();

  return (
    <details className="group rounded-3xl border border-stone-100 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <summary className="flex min-h-[52px] cursor-pointer select-none items-center justify-between gap-2 rounded-3xl px-4 py-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F9954E] sm:px-5">
        <span className="min-w-0">
          <span className="block text-[15px] font-extrabold text-stone-900 dark:text-white">기록과 설정</span>
          <span className="mt-0.5 block text-[11px] font-medium text-stone-500 dark:text-zinc-400">
            최근 활동 · 오늘 만든 작품 · 업적 · 효과음
          </span>
        </span>
        <span className="flex-none text-[12px] font-bold text-[#F9954E] transition group-open:hidden">펼치기</span>
        <span className="hidden flex-none text-[12px] font-bold text-[#F9954E] group-open:inline">접기</span>
      </summary>

      <div className="space-y-3 px-4 pb-4 sm:px-5 sm:pb-5">
        <RecentActivityCard />
        <CreationsCard />
        <AchievementsCard />

        <section className="rounded-2xl bg-stone-50 p-4 dark:bg-zinc-900/60">
          <h3 className="text-[13px] font-extrabold text-stone-900 dark:text-white">효과음</h3>
          <div className="mt-2.5 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMuted(!muted)}
              aria-pressed={muted}
              className="flex min-h-[44px] flex-none items-center gap-1.5 rounded-xl bg-white px-3 text-[12px] font-bold text-stone-700 shadow-sm transition hover:bg-stone-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F9954E] dark:bg-zinc-800 dark:text-zinc-100"
            >
              <span aria-hidden>{muted ? "🔇" : "🔊"}</span>
              {muted ? "꺼짐" : "켜짐"}
            </button>
            <label className="flex min-w-0 flex-1 items-center gap-2 text-[11px] font-bold text-stone-500 dark:text-zinc-400">
              <span className="flex-none">볼륨</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                disabled={muted}
                onChange={(event) => setVolume(Number(event.target.value))}
                aria-label="상호작용 효과음 볼륨"
                className="h-11 w-full accent-[#F9954E] disabled:opacity-40"
              />
              <span className="w-9 flex-none text-right tabular-nums">{Math.round(volume * 100)}%</span>
            </label>
          </div>
        </section>
      </div>
    </details>
  );
}
