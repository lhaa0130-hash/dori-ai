"use client";

// My World — 로그인 사용자 헤더(컴팩트).
//
// 이전 Hero 는 세로 그라데이션 카드가 화면 상단 1/3 을 먹으면서도 담는 정보는 적었다.
// 여기서는 아바타·이름·티어·Lv·EXP·솜사탕을 **한 줄 구조**로 눕혀 높이를 줄인다.
// 캐릭터를 크게 보는 곳은 아래 "함께 놀기" 무대이므로 헤더의 아바타는 신원 표시용으로 작다.
import CottonCandy from "@/components/icons/CottonCandy";
import CharacterAvatar from "@/components/my-world/CharacterAvatar";
import { RARITY_STYLE } from "@/lib/myWorld/character/utils";
import type { Character } from "@/lib/myWorld/character/types";
import type { GameProfileView } from "@/hooks/my-world/useGameProfile";

export default function WorldHeader({
  character,
  profile,
  onEditCharacter,
}: {
  character: Character;
  profile: GameProfileView;
  onEditCharacter: () => void;
}) {
  const rarity = RARITY_STYLE[character.rarity];
  const percent = Math.min(Math.max(profile.progress, 0), 100);

  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-[#F9954E]/20 p-4 sm:p-5"
      style={{ background: character.defaultBackground }}
      aria-label="내 프로필"
    >
      {/* 배경 위 가독성 확보용 얇은 오버레이 — 캐릭터별 그라데이션이 밝아도 흰 글자가 읽힌다. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-black/15" />

      <div className="relative flex items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={onEditCharacter}
          aria-label={`대표 캐릭터 바꾸기. 현재 ${character.name}, ${rarity.label}`}
          className="group relative flex-none rounded-full ring-2 ring-white/70 transition hover:ring-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <span className="block overflow-hidden rounded-full bg-white/90">
            <CharacterAvatar character={character} size={60} />
          </span>
          <span
            className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#F9954E] text-[11px] text-white shadow"
            aria-hidden
          >
            ✎
          </span>
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <h1 className="min-w-0 truncate text-[17px] font-extrabold text-white drop-shadow-sm">{profile.nickname}</h1>
            <span className="flex-none rounded-full bg-black/25 px-2 py-0.5 text-[10px] font-black text-white">
              {profile.tierName}
            </span>
            <span className="flex-none text-[13px] font-black text-white drop-shadow-sm">Lv.{profile.level}</span>
          </div>

          <p className="mt-0.5 truncate text-[11px] font-semibold text-white/85">
            {character.emoji} {character.name} · {rarity.label}
          </p>

          {/* EXP — 헤더에서 성장 진행만 짧게. 상세 수치는 "지금 상태" 에서 다시 보여준다. */}
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-white/35">
              <div className="h-full rounded-full bg-white transition-[width] duration-500" style={{ width: `${percent}%` }} />
            </div>
            <span className="flex-none text-[10px] font-black tabular-nums text-white/90">
              {profile.exp.toLocaleString()} / {profile.nextTotal.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex flex-none items-center gap-1.5 self-start rounded-full bg-white/90 px-3 py-1.5 shadow-sm">
          <CottonCandy className="h-4 w-4" />
          <span className="text-[13px] font-black tabular-nums text-stone-800">{profile.candy.toLocaleString()}</span>
          <span className="sr-only">솜사탕</span>
        </div>
      </div>
    </section>
  );
}
