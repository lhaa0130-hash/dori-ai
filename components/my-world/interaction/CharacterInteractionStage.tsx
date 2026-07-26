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
import CharacterStatus from "@/components/my-world/interaction/CharacterStatus";
import InteractionActions, { type ActionDefinition } from "@/components/my-world/interaction/InteractionActions";
import SpeechBubble from "@/components/my-world/interaction/SpeechBubble";
import WorldFeedback from "@/components/my-world/interaction/WorldFeedback";
import { dailyRewardProgress } from "@/lib/myWorld/interaction/availability";
import { CHARACTER_ASSETS_READY } from "@/lib/myWorld/character/utils";
import { getRoomItem } from "@/lib/myWorld/room/registry";
import { itemBoxPercent } from "@/lib/myWorld/room/utils";
import type { GameProfileView } from "@/hooks/my-world/useGameProfile";

export default function CharacterInteractionStage({ profile }: { profile: GameProfileView }) {
  const { character } = useCharacter();
  const { savedRoom } = useRoom();
  const {
    state, loading, syncing, offline, emotion: displayEmotion, signedIn,
    currentAnimation, speech, notices, perform, previewReaction, dismissNotice,
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
  const syncBadge = offline ? "오프라인 · 기기에 저장 중" : syncing ? "저장 중" : null;
  const daily = useMemo(() => dailyRewardProgress(state), [state]);

  return (
    <section className="rounded-3xl border border-stone-100 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 sm:p-5" aria-labelledby="interaction-heading">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 id="interaction-heading" className="text-[15px] font-extrabold text-stone-900 dark:text-white">{character.name}와 함께 놀기</h2>
          <p className="mt-0.5 text-[11px] font-medium text-stone-500 dark:text-zinc-400">터치하거나 길게 눌러 반응을 만나보세요.</p>
        </div>
        <div className="flex flex-none items-center gap-1.5">
          {syncBadge && (
            <span className="rounded-full bg-stone-100 px-2 py-1 text-[10px] font-bold text-stone-500 dark:bg-zinc-800 dark:text-zinc-300">
              {syncBadge}
            </span>
          )}
          <button
            type="button"
            onClick={() => setMuted(!muted)}
            aria-pressed={muted}
            aria-label={muted ? "효과음 켜기" : "효과음 끄기"}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-stone-100 text-base transition hover:bg-stone-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F9954E] dark:bg-zinc-800 dark:hover:bg-zinc-700"
          >
            <span aria-hidden>{muted ? "🔇" : "🔊"}</span>
          </button>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl ring-1 ring-stone-100 dark:ring-zinc-800">
        <RoomCanvas room={savedRoom} compact hideCharacter />
        <SpeechBubble speech={speech} characterName={character.name} />

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
          style={{ left: "50%", top: "82%", width: "21%", aspectRatio: "1 / 1", transform: "translate(-50%, -50%)" }}
        >
          <span className={`mw-character mw-anim-${currentAnimation} flex h-full w-full items-center justify-center rounded-full`} style={{ filter: `drop-shadow(0 8px 10px ${character.themeColor}45)` }}>
            {CHARACTER_ASSETS_READY && character.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={character.image} alt="" draggable={false} className="h-full w-full object-contain" />
            ) : (
              <span className="text-[clamp(2.6rem,11vw,5.2rem)] leading-none" aria-hidden>{character.emoji}</span>
            )}
          </span>
        </button>
      </div>

      {/* 보상·안내는 무대 밖에서 — 캐릭터를 가리지 않는다. */}
      <WorldFeedback notices={notices} onDismiss={dismissNotice} />

      <CharacterStatus
        exp={profile.exp}
        nextTotal={profile.nextTotal}
        progress={profile.progress}
        level={profile.level}
        affinity={state.affinity}
        emotion={displayEmotion}
        guest={!signedIn}
        daily={daily}
      />

      <InteractionActions state={state} loading={loading} onPerform={handleAction} />
    </section>
  );
}
