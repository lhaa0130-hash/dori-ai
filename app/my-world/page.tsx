"use client";

// ─────────────────────────────────────────────────────────────────────────────
// My World — "캐릭터와 교감하고, 방을 꾸미고, 성장 기록을 확인하는 내 공간".
//
// 이 파일의 책임은 **조립뿐**이다: Provider 중첩 · 인증 상태별 화면 선택 · 열 구성.
//
// 비로그인과 로그인 화면을 명확히 나눈다.
//  · 비로그인: 공간의 목적 + 로그인 CTA(단 하나) + 실제로 만져보는 체험(무대·방).
//             저장·적립되지 않는 값(이름·Lv·EXP·솜사탕)은 보여주지 않는다.
//  · 로그인:   컴팩트 헤더 → 오늘 → 함께 놀기 → 내 방 → 일기 → 성장 기록.
//
// 레이아웃: 모바일 단일 열, md 이상 2열(메인=교감·방 / 사이드=오늘·일기·성장).
//  폭은 LayoutClient 의 `xl:px-[260px]` 가 광고 레일 자리를 이미 비워두므로 그 안에서만 넓힌다.
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from "react";
import { getCharacter } from "@/lib/myWorld/character/registry";
import { CharacterProvider, useCharacter } from "@/contexts/CharacterContext";
import { DiaryProvider, useDiary } from "@/contexts/DiaryContext";
import { RoomProvider } from "@/contexts/RoomContext";
import { InteractionProvider } from "@/contexts/InteractionContext";
import { InteractionAudioProvider } from "@/contexts/InteractionAudioContext";
import { buildCharacterSelectedEntry } from "@/lib/myWorld/diary/constants";
import { useGameProfile } from "@/hooks/my-world/useGameProfile";
import WorldHeader from "@/components/my-world/WorldHeader";
import WorldIntro from "@/components/my-world/WorldIntro";
import WorldExtras from "@/components/my-world/WorldExtras";
import WorldGuide from "@/components/my-world/WorldGuide";
import WorldSectionBoundary from "@/components/my-world/WorldSectionBoundary";
import TodayCard from "@/components/my-world/TodayCard";
import GrowthCard from "@/components/my-world/GrowthCard";
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
  const loggedIn = profile.loggedIn;

  const handleSelect = (id: string) => {
    // 실제 대표 캐릭터가 바뀔 때만 자동 기록(§5). 로그인 아니면 addEntry 내부에서 무시.
    if (id !== character.id) void addEntry(buildCharacterSelectedEntry(getCharacter(id)));
    void selectCharacter(id);
    setModalOpen(false);
  };

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-6 pt-4 sm:pt-6 md:max-w-3xl xl:max-w-none">
      {loggedIn ? (
        <WorldHeader character={character} profile={profile} onEditCharacter={() => setModalOpen(true)} />
      ) : (
        <WorldIntro character={character} />
      )}

      {/* md 이상 2열. 각 카드는 한 번만 렌더한다(중복 렌더 → 중복 id·중복 aria 를 만들지 않는다).
          모바일 흐름 순서 = 오늘 → 교감 → 방 → 일기 → 성장 → 더 보기. */}
      <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_300px] md:items-start xl:grid-cols-[minmax(0,1fr)_340px] xl:gap-4">
        {/* ── 메인 열: 오늘 + 교감(+ 게스트는 교감만) ── */}
        <div className="space-y-3">
          {loggedIn && (
            <WorldSectionBoundary title="오늘">
              <TodayCard />
            </WorldSectionBoundary>
          )}

          <WorldSectionBoundary title={`${character.name}와 함께 놀기`}>
            <CharacterInteractionStage profile={loggedIn ? profile : null} />
          </WorldSectionBoundary>
        </div>

        {/* ── 사이드 열: 방 · 일기 · 성장 · 더 보기 ── */}
        <aside className="space-y-3" aria-label="내 방과 기록">
          <WorldSectionBoundary title="내 방">
            <RoomPreviewCard />
          </WorldSectionBoundary>

          {/* 게스트에게는 일기 패널 대신 조작 안내를 둔다.
              — 로그인 후 생기는 기능은 상단 소개에서 이미 알렸고, 처음 온 사람에게는
                "무엇을 할 수 있는지" 가 더 필요하다. */}
          {!loggedIn && (
            <WorldSectionBoundary title="이렇게 놀아요">
              <WorldGuide />
            </WorldSectionBoundary>
          )}

          {loggedIn && (
            <>
              <WorldSectionBoundary title="AI 일기">
                <DiaryCard />
              </WorldSectionBoundary>
              <WorldSectionBoundary title="성장 기록">
                <GrowthCard profile={profile} />
              </WorldSectionBoundary>
            </>
          )}

          <WorldSectionBoundary title={loggedIn ? "더 보기" : "설정"}>
            <WorldExtras guest={!loggedIn} />
          </WorldSectionBoundary>
        </aside>
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
