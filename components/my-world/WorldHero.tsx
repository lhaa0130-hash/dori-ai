"use client";

// My World — Hero(정체성 영역). page.tsx 에 인라인돼 있던 마크업을 분리했다.
//  Hero 는 "내가 누구와 함께 있는지"만 말한다 — 캐릭터·닉네임·티어·레벨·솜사탕.
//  성장 수치(EXP)와 관계 수치(친밀도)는 CharacterStatus 한 곳으로 모았으므로 여기서 반복하지 않는다.
import CottonCandy from "@/components/icons/CottonCandy";
import BackgroundHero from "@/components/my-world/BackgroundHero";
import CharacterCard from "@/components/my-world/CharacterCard";
import { RARITY_STYLE } from "@/lib/myWorld/character/utils";
import type { Character } from "@/lib/myWorld/character/types";
import type { GameProfileView } from "@/hooks/my-world/useGameProfile";

// 오늘의 한마디 — 저장 없이 날짜 기반 결정적 선택.
const HELLOS = [
  "오늘도 하나 만들어보자.",
  "작은 세계가 조금씩 자라고 있어요.",
  "오늘의 나를 기록해볼까요?",
  "새로운 친구를 만들어봐요.",
  "천천히, 나만의 속도로.",
];

export function todaysHello(at: Date = new Date()): string {
  const idx = (at.getFullYear() * 372 + (at.getMonth() + 1) * 31 + at.getDate()) % HELLOS.length;
  return HELLOS[idx];
}

export default function WorldHero({
  character,
  profile,
  onEditCharacter,
}: {
  character: Character;
  profile: GameProfileView;
  onEditCharacter: () => void;
}) {
  const rarity = RARITY_STYLE[character.rarity];

  return (
    <BackgroundHero gradient={character.defaultBackground}>
      <div className="flex flex-col items-center px-5 pb-6 pt-8 text-center">
        <CharacterCard size={104} character={character} onEdit={onEditCharacter} />

        <div className="mt-3 inline-flex max-w-full items-center gap-1.5 rounded-full bg-black/25 px-3 py-1">
          <span className="truncate text-[13px] font-black text-white">{character.name}</span>
          <span className="flex-none text-[10px] font-bold text-white/85">· {rarity.label}</span>
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          <span className="rounded-full bg-black/25 px-2.5 py-0.5 text-[11px] font-black text-white">
            {profile.tierName}
          </span>
          <span className="text-[15px] font-black text-white drop-shadow-sm">Lv.{profile.level}</span>
        </div>

        <h1 className="mt-1.5 max-w-full break-keep text-[20px] font-extrabold text-white drop-shadow-sm">
          {profile.nickname}
        </h1>
        <p className="mt-0.5 break-keep text-[13px] font-medium text-white/90 drop-shadow-sm">
          “{todaysHello()}”
        </p>

        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3.5 py-1.5 shadow-sm">
          <CottonCandy className="h-4 w-4" />
          <span className="text-[13px] font-black tabular-nums text-stone-800">{profile.candy.toLocaleString()}</span>
          <span className="sr-only">솜사탕</span>
        </div>
      </div>
    </BackgroundHero>
  );
}
