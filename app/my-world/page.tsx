"use client";

// ─────────────────────────────────────────────────────────────────────────────
// My World — "캐릭터와 교감하고, 방을 꾸미고, 성장 기록을 확인하는 내 공간".
//
// 이 파일의 책임은 **조립뿐**이다: Provider 중첩 · 인증 상태별 화면 선택 · 열 구성.
//
// Phase 3 구성 원칙
//  · 모든 구획은 하나의 월드 표면(WorldSurface) 위에 놓인다 — 흰 카드가 떠 있는 대시보드 X.
//  · 첫 화면의 중심은 캐릭터와 방이다. 월드 바는 얇은 띠로 오늘 지표까지 흡수한다.
//  · 일기·성장은 카드 두 장이 아니라 하나의 기록 영역이다.
//  · 비로그인은 개인 수치를 하나도 렌더하지 않고, 체험을 먼저 하게 한 뒤 CTA 를 한 번만 만난다.
// ─────────────────────────────────────────────────────────────────────────────
import { useMemo, useState } from "react";
import { getCharacter } from "@/lib/myWorld/character/registry";
import { CharacterProvider, useCharacter } from "@/contexts/CharacterContext";
import { DiaryProvider, useDiary } from "@/contexts/DiaryContext";
import { RoomProvider } from "@/contexts/RoomContext";
import { InteractionProvider, useInteraction } from "@/contexts/InteractionContext";
import { InteractionAudioProvider } from "@/contexts/InteractionAudioContext";
import { buildCharacterSelectedEntry } from "@/lib/myWorld/diary/constants";
import { dailyRewardProgress } from "@/lib/myWorld/interaction/availability";
import { useGameProfile } from "@/hooks/my-world/useGameProfile";
import WorldSurface from "@/components/my-world/WorldSurface";
import WorldBar from "@/components/my-world/WorldBar";
import WorldExtras from "@/components/my-world/WorldExtras";
import WorldGuide from "@/components/my-world/WorldGuide";
import WorldSectionBoundary from "@/components/my-world/WorldSectionBoundary";
import WorldNotices from "@/components/my-world/WorldNotices";
import GuestInvite from "@/components/my-world/GuestInvite";
import RecordsPanel from "@/components/my-world/RecordsPanel";
import CharacterSelectModal from "@/components/my-world/CharacterSelectModal";
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
  const { state } = useInteraction();
  const profile = useGameProfile();
  const [modalOpen, setModalOpen] = useState(false);
  // 인증 확인 중 / 게스트 / 로그인 을 셋으로 구분한다.
  //  · checking 에서 게스트 화면을 보여주면 로그인 사용자에게 "저장 안 됨" 이 잠깐 보인다(거짓 + 깜빡임).
  //  · 그래서 확인 중에는 초대 CTA·게스트 안내를 렌더하지 않고 자리만 지킨다.
  const authState = profile.authState;
  const loggedIn = authState === "signed";
  const confirmedGuest = authState === "guest";
  const daily = useMemo(() => dailyRewardProgress(state), [state]);

  const handleSelect = (id: string) => {
    // 실제 대표 캐릭터가 바뀔 때만 자동 기록(§5). 로그인 아니면 addEntry 내부에서 무시.
    if (id !== character.id) void addEntry(buildCharacterSelectedEntry(getCharacter(id)));
    void selectCharacter(id);
    setModalOpen(false);
  };

  return (
    // 하단 여백: 공용 레이아웃이 lg 이상에서 pb-[200px] 을 더한다(전역이라 바꾸지 않는다).
    // 이 페이지에서만 음수 마진으로 일부를 되돌린다 — 다른 페이지에 영향 없음.
    // ⚠️ <main> 을 쓰지 않는다 — 공용 LayoutClient 가 이미 <main> 을 렌더하므로 중첩되면
    //    landmark 가 2개가 되어(HTML 위반) 스크린리더의 "본문으로 이동" 이 모호해진다.
    <div data-my-world="root" className="mx-auto w-full max-w-2xl px-4 pb-4 pt-4 sm:pt-6 md:max-w-3xl lg:-mb-[120px] xl:max-w-none">
      <WorldSurface>
        <WorldBar
          character={character}
          profile={loggedIn ? profile : null}
          daily={daily}
          authState={authState}
          onEditCharacter={() => setModalOpen(true)}
        />

        {/* 저장 실패처럼 삼켜지면 거짓이 되는 알림을 월드 바 바로 아래에서 한 번만 알린다. */}
        <WorldNotices />

        {/* md 이상 2열. 각 패널은 한 번만 렌더한다(중복 id·중복 aria 방지).
            모바일 흐름 = 월드 바 → 무대(캐릭터) → 방 → 기록 → 더 보기. */}
        <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_300px] md:items-start xl:grid-cols-[minmax(0,1fr)_340px] xl:gap-4">
          {/* ── 메인 열: 캐릭터와 방(세계의 중심) ── */}
          <div className="space-y-3">
            <WorldSectionBoundary title={`${character.name}와 함께 놀기`}>
              <CharacterInteractionStage profile={loggedIn ? profile : null} />
            </WorldSectionBoundary>

            {/* 게스트는 체험을 해본 **뒤** 초대를 만난다 — 상단을 광고로 채우지 않는다.
                확인 중에는 띄우지 않는다(로그인 사용자에게 잠깐 보이면 안 된다). */}
            {confirmedGuest && (
              <WorldSectionBoundary title="내 세계 만들기">
                <GuestInvite />
              </WorldSectionBoundary>
            )}
          </div>

          {/* ── 사이드 열: 방 · 기록 · 안내 ── */}
          <aside className="space-y-3" aria-label="내 방과 기록">
            <WorldSectionBoundary title="내 방">
              <RoomPreviewCard />
            </WorldSectionBoundary>

            {loggedIn && (
              <WorldSectionBoundary title="기록">
                <RecordsPanel profile={profile} authState={authState} />
              </WorldSectionBoundary>
            )}
            {confirmedGuest && (
              <WorldSectionBoundary title="이렇게 놀아요">
                <WorldGuide />
              </WorldSectionBoundary>
            )}

            <WorldSectionBoundary title={loggedIn ? "더 보기" : "설정"}>
              <WorldExtras guest={!loggedIn} />
            </WorldSectionBoundary>
          </aside>
        </div>
      </WorldSurface>

      <CharacterSelectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        selectedId={character.id}
        saving={saving}
        onSelect={handleSelect}
      />
    </div>
  );
}
