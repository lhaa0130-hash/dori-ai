"use client";

// My World — 캐릭터와 함께 놀기.
//  이 컴포넌트의 책임은 셋으로 줄였다: 무대 렌더 · 포인터 제스처 · 하위 조립.
//   · 상태 표시(EXP·친밀도·감정) → CharacterStatus
//   · 행동 버튼 + cooldown      → InteractionActions
//   · 보상/안내 피드백          → WorldFeedback (무대 밖 — 캐릭터를 가리지 않는다)
import { useEffect, useMemo, useRef, type PointerEvent as ReactPointerEvent } from "react";
import { useCharacter } from "@/contexts/CharacterContext";
import { useInteraction } from "@/contexts/InteractionContext";
import { useInteractionAudio } from "@/contexts/InteractionAudioContext";
import { useRoom } from "@/contexts/RoomContext";
import RoomCanvas from "@/components/my-world/room/RoomCanvas";
import WorldPanel from "@/components/my-world/WorldPanel";
import CharacterImage from "@/components/my-world/CharacterImage";
import CharacterStatus from "@/components/my-world/interaction/CharacterStatus";
import InteractionActions, { type ActionDefinition } from "@/components/my-world/interaction/InteractionActions";
import SpeechBubble from "@/components/my-world/interaction/SpeechBubble";
import WorldFeedback from "@/components/my-world/interaction/WorldFeedback";
import { AffinityRing, EmotionAura, RisingRewards } from "@/components/my-world/interaction/CharacterAura";
import { dailyRewardProgress } from "@/lib/myWorld/interaction/availability";
import { resolveSyncBadge } from "@/lib/myWorld/view/worldView";
import { getRoomItem } from "@/lib/myWorld/room/registry";
import { itemBoxPercent } from "@/lib/myWorld/room/utils";
import type { GameProfileView } from "@/hooks/my-world/useGameProfile";

export default function CharacterInteractionStage({ profile }: { profile: GameProfileView | null }) {
  const { character } = useCharacter();
  const { savedRoom } = useRoom();
  const {
    state, loading, syncing, offline, emotion: displayEmotion, signedIn,
    currentAnimation, speech, notices, claimingReward, perform, previewReaction, dismissNotice,
  } = useInteraction();
  const { muted, setMuted } = useInteractionAudio();
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const singleTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapAt = useRef(0);
  const longPressed = useRef(false);

  useEffect(() => () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    if (singleTapTimer.current) clearTimeout(singleTapTimer.current);
  }, []);

  const pointerSource = (pointerType: string) => pointerType === "touch" ? "touch" as const : pointerType === "mouse" ? "mouse" as const : "pointer" as const;

  const onPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    longPressed.current = false;
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    const source = pointerSource(event.pointerType);
    longPressTimer.current = setTimeout(() => {
      longPressed.current = true;
      perform({ type: "long_press", source });
    }, 650);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = null;
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    cancelLongPress();
    if (longPressed.current) return;
    const source = pointerSource(event.pointerType);
    const now = Date.now();
    if (now - lastTapAt.current <= 300) {
      if (singleTapTimer.current) clearTimeout(singleTapTimer.current);
      singleTapTimer.current = null;
      lastTapAt.current = 0;
      perform({ type: "double_tap", source });
      return;
    }
    lastTapAt.current = now;
    singleTapTimer.current = setTimeout(() => {
      perform({ type: "touch", source });
      lastTapAt.current = 0;
    }, 310);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    perform({ type: "touch", source: "keyboard" });
  };

  const handleAction = (type: ActionDefinition["type"], keyboard: boolean) => {
    perform({ type, source: keyboard ? "keyboard" : "pointer" });
  };

  // 동기화 배지 — 오프라인과 저장 지연을 구분해 표시한다(둘 다 아니면 자리를 차지하지 않는다).
  const syncBadge = resolveSyncBadge({ offline, syncing });
  const daily = useMemo(() => dailyRewardProgress(state), [state]);

  return (
    <WorldPanel
      title={`${character.name}와 함께 놀기`}
      subtitle="터치하거나 길게 눌러 반응을 만나보세요."
      labelledById="interaction-heading"
      tone="bare"
      bleed
      action={
        <>
          {!profile && (
            <span className="rounded-full bg-[#F9954E]/15 px-2 py-1 text-[10px] font-black text-[#9A4E14]">체험 중</span>
          )}
          {syncBadge && (
            <span className="rounded-full bg-white/80 px-2 py-1 text-[10px] font-bold text-stone-500 shadow-sm dark:bg-zinc-800 dark:text-zinc-300">
              {syncBadge}
            </span>
          )}
          <button
            type="button"
            onClick={() => setMuted(!muted)}
            aria-pressed={muted}
            aria-label={muted ? "효과음 켜기" : "효과음 끄기"}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/80 text-base shadow-sm transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F9954E] dark:bg-zinc-800 dark:hover:bg-zinc-700"
          >
            <span aria-hidden>{muted ? "🔇" : "🔊"}</span>
          </button>
        </>
      }
    >
      {/* 무대 프레임 — 우드 톤 테두리로 "방을 들여다보는 창" 처럼 만든다(흰 카드 안의 사각형 X).
          max-w 상한: 방은 4:3 이라 폭이 커지면 높이도 같이 커진다. 1920px 에서 메인 열이 1044px 가 되어
          캔버스가 1044x783 까지 부풀었다(문서 높이 +360px). 상한을 둬 아주 넓은 화면에서도 방이
          화면을 삼키지 않게 한다. 좌표는 퍼센트이므로 배치는 그대로 유지된다. */}
      <div className="relative mx-auto w-full max-w-[600px] overflow-hidden rounded-[20px] ring-1 ring-[#E3C9AE] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] dark:ring-zinc-800">
        <RoomCanvas room={savedRoom} compact hideCharacter />
        <SpeechBubble speech={speech} characterName={character.name} />

        {/* 감정은 캐릭터 뒤 후광으로, 친밀도는 발밑 링으로 읽히게 한다. */}
        <EmotionAura emotion={displayEmotion} top="78%" size="36%" />
        <AffinityRing affinity={state.affinity} top="94%" size="30%" />

        {savedRoom.placedItems.map((placed) => {
          const def = getRoomItem(placed.itemId);
          if (!def || placed.itemId === "rug-basic") return null;
          const box = itemBoxPercent(def, placed.scale);
          return (
            <button
              key={placed.instanceId}
              type="button"
              disabled={loading}
              aria-label={`${def.name} 살펴보기`}
              title={`${def.name} 살펴보기`}
              onClick={(event) => perform({ type: "room_item", source: event.detail === 0 ? "keyboard" : "room", roomItemId: def.id, roomItemName: def.name })}
              className="absolute z-20 rounded-xl bg-transparent transition hover:bg-white/10 focus-visible:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#F9954E]"
              style={{ left: `${placed.x}%`, top: `${placed.y}%`, width: `${box.w}%`, height: `${box.h}%`, transform: "translate(-50%, -50%)" }}
            />
          );
        })}

        {/* 캐릭터 접지 그림자 — 캐릭터가 바닥 위에 서 있게 보이도록. 캐릭터 아래(z-30) 레이어. */}
        <div
          aria-hidden
          className="pointer-events-none absolute z-30"
          style={{ left: "50%", top: "93.5%", width: "21%", height: "5%", transform: "translate(-50%, -50%)", background: "radial-gradient(50% 50% at 50% 50%, rgba(70,45,30,0.32) 0%, rgba(70,45,30,0) 72%)" }}
        />

        <button
          type="button"
          disabled={loading}
          aria-label={`${character.name} 터치하기. 두 번 누르거나 길게 누를 수 있습니다.`}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={cancelLongPress}
          onPointerLeave={cancelLongPress}
          onKeyDown={onKeyDown}
          onMouseEnter={() => previewReaction("look", "thinking")}
          onFocus={() => previewReaction("wave", "happy", `${character.name}, 여기 있어요!`)}
          className="absolute z-40 flex touch-manipulation select-none items-center justify-center rounded-full focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-white/90"
          style={{ left: "50%", top: "80%", width: "26%", aspectRatio: "1 / 1", transform: "translate(-50%, -50%)" }}
        >
          <span className={`mw-character mw-anim-${currentAnimation} flex h-full w-full items-center justify-center rounded-full`} style={{ filter: `drop-shadow(0 8px 10px ${character.themeColor}45)` }}>
            {/* 이미지 실패 시 깨진 아이콘 대신 이모지로 되돌린다(CharacterImage 가 담당). */}
            <CharacterImage character={character} emojiSize="clamp(2.6rem, 11vw, 5.2rem)" />
          </span>
        </button>

        {/* 보상 수치는 캐릭터 머리 위 여백에서 짧게 떠오른다 — 캐릭터를 덮지 않는다(실측 확인). */}
        <RisingRewards notices={notices} top="63%" />
      </div>

      {/* 안내·제한 문구는 무대 밖에서 — 캐릭터를 가리지 않는다. */}
      <WorldFeedback notices={notices} onDismiss={dismissNotice} />

      {/* 성장 수치는 "로그인 여부"(profile 존재)로만 가른다.
          identity gate(signedIn)는 원격 read/write 를 막는 장치이며 표시 조건으로 쓰면
          헤더(EXP 보임)와 상태 영역(EXP 숨김)이 어긋난다 — 같은 캐시 값을 보여줘야 한다. */}
      <CharacterStatus
        affinity={state.affinity}
        emotion={displayEmotion}
        growth={profile ? { level: profile.level, exp: profile.exp, nextTotal: profile.nextTotal, progress: profile.progress } : null}
        daily={daily}
      />

      <InteractionActions state={state} loading={loading} claiming={claimingReward} onPerform={handleAction} />
    </WorldPanel>
  );
}
