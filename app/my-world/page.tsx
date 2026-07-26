"use client";

// ─────────────────────────────────────────────────────────────────────────────
// My World — "AI와 함께 살아가는 나만의 세계" 홈.
//  이 파일의 책임은 **조립뿐**이다: Provider 중첩 · 화면 순서 · 대표 캐릭터 선택 모달 연결.
//  마크업(Hero)·게임 프로필 조회·상태 표시는 각각 WorldHero / useGameProfile / 카드가 맡는다.
//
//  화면 순서는 사용 빈도 순이다.
//   1) 현재 상태(Hero) → 2) 함께 놀기 → 3) 내 방 → 4) 기록(일기) → 5) 부가(접힘)
//
//  · 대표 캐릭터는 CharacterProvider/useCharacter(공용)로 관리 → Profile·Diary·Room 재사용.
//  · 레벨/EXP/Candy 는 기존 게임 프로필 '읽기 전용'. Firestore/API/출석/레벨 변경 없음.
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from "react";
import Link from "next/link";
import { getCharacter } from "@/lib/myWorld/character/registry";
import { CharacterProvider, useCharacter } from "@/contexts/CharacterContext";
import { DiaryProvider, useDiary } from "@/contexts/DiaryContext";
import { RoomProvider } from "@/contexts/RoomContext";
import { InteractionProvider } from "@/contexts/InteractionContext";
import { InteractionAudioProvider } from "@/contexts/InteractionAudioContext";
import { buildCharacterSelectedEntry } from "@/lib/myWorld/diary/constants";
import { useGameProfile } from "@/hooks/my-world/useGameProfile";
import WorldHero from "@/components/my-world/WorldHero";
import WorldExtras from "@/components/my-world/WorldExtras";
import WorldSectionBoundary from "@/components/my-world/WorldSectionBoundary";
import CharacterSelectModal from "@/components/my-world/CharacterSelectModal";
import DiaryCard from "@/components/my-world/DiaryCard";
import RoomPreviewCard from "@/components/my-world/room/RoomPreviewCard";
import CharacterInteractionStage from "@/components/my-world/interaction/CharacterInteractionStage";

// Provider 로 감싸 useCharacter/useDiary/useRoom 사용. Room 은 Character·Diary 에 의존(캐릭터 레이어·저장 시 일기).
export default function MyWorldPage() {
  return (
    <CharacterProvider>
      <DiaryProvider>
        <RoomProvider>
          <InteractionAudioProvider>
            <InteractionProvider>
              <MyWorldContent />
            </InteractionProvider>
          </InteractionAudioProvider>
        </RoomProvider>
      </DiaryProvider>
    </CharacterProvider>
  );
}

function MyWorldContent() {
  const { character, selectCharacter, saving } = useCharacter();
  const { addEntry } = useDiary();
  const profile = useGameProfile();
  const [modalOpen, setModalOpen] = useState(false);

  const handleSelect = (id: string) => {
    // 실제 대표 캐릭터가 바뀔 때만 자동 기록(§5). 로그인 아니면 addEntry 내부에서 무시.
    if (id !== character.id) void addEntry(buildCharacterSelectedEntry(getCharacter(id)));
    void selectCharacter(id);
    setModalOpen(false);
  };

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-16 pt-4 sm:pt-6">
      <WorldHero character={character} profile={profile} onEditCharacter={() => setModalOpen(true)} />

      {!profile.loggedIn && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-stone-100 bg-stone-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/50">
          <span className="min-w-0 break-keep text-[13px] font-semibold text-stone-500 dark:text-stone-400">
            로그인하면 나만의 My World가 채워져요
          </span>
          <Link
            href="/login?next=/my-world"
            className="flex min-h-[44px] flex-none items-center justify-center whitespace-nowrap rounded-xl bg-[#F9954E] px-4 text-[13px] font-black text-white transition hover:bg-[#f0862f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F9954E]"
          >
            로그인
          </Link>
        </div>
      )}

      {/* 섹션마다 오류 경계를 둬, 한 카드가 실패해도 나머지 My World 는 그대로 쓸 수 있게 한다. */}
      <div className="mt-4 space-y-3">
        <WorldSectionBoundary title={`${character.name}와 함께 놀기`}>
          <CharacterInteractionStage profile={profile} />
        </WorldSectionBoundary>
        <WorldSectionBoundary title="내 방">
          <RoomPreviewCard />
        </WorldSectionBoundary>
        <WorldSectionBoundary title="AI 일기">
          <DiaryCard />
        </WorldSectionBoundary>
        <WorldSectionBoundary title="기록과 설정">
          <WorldExtras />
        </WorldSectionBoundary>
      </div>

      <CharacterSelectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        selectedId={character.id}
        saving={saving}
        onSelect={handleSelect}
      />
    </main>
  );
}
