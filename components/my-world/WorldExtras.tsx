"use client";

// My World — 부가 기능 묶음(progressive disclosure).
//
//  최근 활동·오늘 만든 작품·업적은 아직 데이터 소스가 없어 항상 빈 상태로 렌더된다.
//  기능을 없애지 않되, 항상 펼쳐진 카드 3장이 실제 기능을 아래로 밀어내던 문제를 없애기 위해
//  하나의 접힌 그룹으로 모았다. 준비 중인 항목은 "준비 중" 이라고 밝혀, 해금 가능한 것처럼
//  보이지 않게 한다.
//
//  비로그인(guest)에서는 기록 관련 항목을 감추고 효과음만 남긴다 — 로그인해야 생기는 것을
//  빈 카드로 보여주면 "내 기록이 없다" 로 잘못 읽힌다.
import { useInteractionAudio } from "@/contexts/InteractionAudioContext";
import RecentActivityCard from "@/components/my-world/RecentActivityCard";
import CreationsCard from "@/components/my-world/CreationsCard";
import AchievementsCard from "@/components/my-world/AchievementsCard";

export default function WorldExtras({ guest = false }: { guest?: boolean }) {
  const { muted, volume, setMuted, setVolume } = useInteractionAudio();

  return (
    <details className="group rounded-3xl border border-stone-100 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <summary className="flex min-h-[52px] cursor-pointer select-none items-center justify-between gap-2 rounded-3xl px-4 py-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F9954E] sm:px-5">
        <span className="min-w-0">
          <span className="block text-[15px] font-extrabold text-stone-900 dark:text-white">
            {guest ? "설정" : "더 보기"}
          </span>
          <span className="mt-0.5 block break-keep text-[11px] font-medium text-stone-500 dark:text-zinc-400">
            {guest ? "효과음" : "효과음 · 최근 활동 · 작품 · 업적(준비 중)"}
          </span>
        </span>
        <span className="flex-none text-[12px] font-bold text-[#E07C2E] transition group-open:hidden">펼치기</span>
        <span className="hidden flex-none text-[12px] font-bold text-[#E07C2E] group-open:inline">접기</span>
      </summary>

      <div className="space-y-3 px-4 pb-4 sm:px-5 sm:pb-5">
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

        {!guest && (
          <>
            <RecentActivityCard />
            <CreationsCard />
            <AchievementsCard />
          </>
        )}
      </div>
    </details>
  );
}
