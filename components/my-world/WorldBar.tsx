"use client";

// My World — 월드 바(세계의 머리띠).
//
// 이전 헤더는 그라데이션 카드가 한 덩어리로 떠 있어 "프로필 카드" 로 읽혔다.
// 여기서는 세계 안의 얇은 띠로 만들어 **주인이 누구인지 + 오늘 상태**만 짧게 말한다.
//  · 오늘 지표(친밀도·EXP)를 얇은 미터로 흡수해, 별도 "오늘" 카드가 캐릭터를 아래로
//    밀어내지 않게 한다(모바일에서 무대까지 도달이 빨라진다).
//  · EXP·친밀도·솜사탕을 모두 크게 노출하지 않는다 — 이름/레벨 > 오늘 지표 > 솜사탕 순.
//  · 비로그인에서는 개인 수치를 하나도 렌더하지 않는다.
import CottonCandy from "@/components/icons/CottonCandy";
import CharacterAvatar from "@/components/my-world/CharacterAvatar";
import type { Character } from "@/lib/myWorld/character/types";
import type { DailyRewardProgress } from "@/lib/myWorld/interaction/availability";
import type { GameProfileView, WorldAuthState } from "@/hooks/my-world/useGameProfile";

/** 오늘 적립 미터 — 얇게, 수치는 작게. 색만으로 전달하지 않도록 라벨을 항상 붙인다. */
function TodayMeter({
  label,
  value,
  max,
  className,
  valueClassName,
}: {
  label: string;
  value: number;
  max: number;
  className: string;
  valueClassName: string;
}) {
  const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="min-w-0 flex-1" aria-label={`오늘의 ${label} ${value} / ${max}`}>
      <div className="flex items-baseline justify-between gap-1">
        <span className="truncate text-[10px] font-bold text-stone-500 dark:text-zinc-400">{label}</span>
        <span className={`flex-none text-[10px] font-black tabular-nums ${valueClassName}`}>
          {value}
          <span className="font-bold text-stone-400">/{max}</span>
        </span>
      </div>
      <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-white/70 dark:bg-zinc-800">
        <div className={`h-full rounded-full transition-[width] duration-500 ${className}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export default function WorldBar({
  character,
  profile,
  daily,
  authState,
  onEditCharacter,
}: {
  character: Character;
  /** 비로그인/확인중이면 null — 개인 수치를 렌더하지 않는다. */
  profile: GameProfileView | null;
  daily: DailyRewardProgress;
  /** checking 은 guest 와 다르게 표시한다 — "저장 안 됨" 을 성급히 말하지 않는다. */
  authState: WorldAuthState;
  onEditCharacter: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-3xl border border-[#F2D9C6] bg-[#FBEEE7]/80 px-3 py-2.5 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/60 sm:px-4">
      <button
        type="button"
        onClick={onEditCharacter}
        aria-label={`대표 캐릭터 바꾸기. 현재 ${character.name}`}
        className="group relative flex-none rounded-full transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F9954E]"
      >
        <span
          className="block overflow-hidden rounded-full ring-2 ring-white/90 transition group-hover:ring-[#F9954E]/60"
          style={{ background: `radial-gradient(circle at 50% 40%, ${character.themeColor}26 0%, #FFFFFF 76%)` }}
        >
          <CharacterAvatar character={character} size={48} />
        </span>
        <span
          className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#9A4E14] text-[10px] text-white shadow-sm"
          aria-hidden
        >
          ✎
        </span>
      </button>

      <div className="min-w-0 flex-1">
        {profile ? (
          <>
            <div className="flex min-w-0 items-baseline gap-1.5">
              <h1 className="min-w-0 truncate text-[14px] font-extrabold text-stone-800 dark:text-zinc-100">
                {profile.nickname}의 세계
              </h1>
              <span className="flex-none text-[11px] font-black text-[#9A4E14]">Lv.{profile.level}</span>
            </div>
            <div className="mt-1 flex items-end gap-2.5">
              <TodayMeter
                label="오늘 친밀도"
                value={daily.affinityGained}
                max={daily.affinityMax}
                className="bg-gradient-to-r from-pink-400 to-rose-500"
                valueClassName="text-pink-700 dark:text-pink-300"
              />
              <TodayMeter
                label="오늘 EXP"
                value={daily.expGained}
                max={daily.expMax}
                className="bg-gradient-to-r from-amber-400 to-[#F9954E]"
                valueClassName="text-amber-700 dark:text-amber-300"
              />
            </div>
          </>
        ) : authState === "checking" ? (
          // 인증 확인 중 — 게스트 문구("저장 안 됨")를 쓰면 로그인 사용자에게 거짓이 된다.
          // 같은 높이의 조용한 자리만 지킨다(전환 시 흔들림 방지).
          <div aria-busy="true" aria-label="로그인 상태를 확인하는 중">
            <div className="h-[17px] w-32 animate-pulse rounded bg-white/70 dark:bg-zinc-800" />
            <div className="mt-1.5 h-[13px] w-44 animate-pulse rounded bg-white/60 dark:bg-zinc-800/70" />
          </div>
        ) : (
          <>
            {/* 게스트도 페이지의 h1 을 가져야 한다 — 이전에는 p 여서 heading outline 이 h2 에서 시작했다. */}
            <h1 className="truncate text-[14px] font-extrabold text-stone-800 dark:text-zinc-100">
              {character.name}의 세계를 둘러보는 중
            </h1>
            <p className="mt-0.5 break-keep text-[11px] font-medium leading-relaxed text-stone-600 dark:text-zinc-300">
              만져보고 꾸며볼 수 있어요 · 저장은 안 돼요
            </p>
          </>
        )}
      </div>

      {profile && (
        <div className="flex flex-none items-center gap-1 self-start rounded-full bg-white/90 px-2.5 py-1 shadow-sm dark:bg-zinc-800">
          <CottonCandy className="h-3.5 w-3.5" />
          <span className="text-[12px] font-black tabular-nums text-stone-700 dark:text-zinc-100">
            {profile.candy.toLocaleString()}
          </span>
          <span className="sr-only">솜사탕</span>
        </div>
      )}
    </div>
  );
}
