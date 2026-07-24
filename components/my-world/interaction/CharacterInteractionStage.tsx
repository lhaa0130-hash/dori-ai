"use client";

import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";
import { useCharacter } from "@/contexts/CharacterContext";
import { useInteraction } from "@/contexts/InteractionContext";
import { useInteractionAudio } from "@/contexts/InteractionAudioContext";
import { useRoom } from "@/contexts/RoomContext";
import RoomCanvas from "@/components/my-world/room/RoomCanvas";
import AffinityMeter from "@/components/my-world/interaction/AffinityMeter";
import InteractionNotices from "@/components/my-world/interaction/InteractionNotices";
import SpeechBubble from "@/components/my-world/interaction/SpeechBubble";
import { EMOTION_META } from "@/lib/myWorld/interaction/catalog";
import { CHARACTER_ASSETS_READY } from "@/lib/myWorld/character/utils";
import { getRoomItem } from "@/lib/myWorld/room/registry";
import { itemBoxPercent } from "@/lib/myWorld/room/utils";

const ACTIONS = [
  { type: "pet" as const, icon: "🫳", label: "쓰다듬기" },
  { type: "greet" as const, icon: "👋", label: "인사하기" },
  { type: "gift" as const, icon: "🎁", label: "선물하기" },
  { type: "sleep" as const, icon: "🌙", label: "재우기" },
];

export default function CharacterInteractionStage() {
  const { character } = useCharacter();
  const { savedRoom } = useRoom();
  const { state, loading, syncing, offline, emotion: displayEmotion, signedIn, currentAnimation, speech, notices, perform, previewReaction, dismissNotice } = useInteraction();
  const { muted, volume, setMuted, setVolume } = useInteractionAudio();
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

  const emotion = EMOTION_META[displayEmotion];

  return (
    <section className="rounded-3xl border border-stone-100 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 sm:p-5" aria-labelledby="interaction-heading">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 id="interaction-heading" className="text-[16px] font-extrabold text-stone-900 dark:text-white">{character.name}와 함께 놀기</h2>
          <p className="mt-0.5 text-[11px] font-medium text-stone-500 dark:text-zinc-400">터치하거나 길게 눌러 반응을 만나보세요.</p>
        </div>
        <div className="flex items-center gap-1.5">
          {(offline || syncing) && <span className="rounded-full bg-stone-100 px-2 py-1 text-[10px] font-bold text-stone-500 dark:bg-zinc-800 dark:text-zinc-300">{offline ? "오프라인 저장 중" : "동기화 중"}</span>}
          <button type="button" onClick={() => setMuted(!muted)} aria-pressed={muted} aria-label={muted ? "효과음 켜기" : "효과음 끄기"} className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-sm transition hover:bg-stone-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#F9954E] dark:bg-zinc-800 dark:hover:bg-zinc-700">
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

        <InteractionNotices notices={notices} onDismiss={dismissNotice} />
      </div>

      <div className="mt-3 flex items-center gap-3 rounded-2xl bg-stone-50 px-3 py-2.5 dark:bg-zinc-900">
        <AffinityMeter affinity={state.affinity} guest={!signedIn} />
        <span className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black text-white" style={{ backgroundColor: emotion.color }} title={`현재 감정: ${emotion.label}`}>
          <span aria-hidden>{emotion.emoji}</span> {emotion.label}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="상호작용 메뉴">
        {ACTIONS.map((action) => (
          <button
            key={action.type}
            type="button"
            disabled={loading}
            onClick={(event) => perform({ type: action.type, source: event.detail === 0 ? "keyboard" : "pointer" })}
            className="rounded-2xl border border-stone-100 bg-white px-2 py-2.5 text-[12px] font-black text-stone-700 shadow-sm transition hover:-translate-y-0.5 hover:border-[#F9954E]/40 hover:shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#F9954E] active:translate-y-0 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
          >
            <span className="mr-1" aria-hidden>{action.icon}</span>{action.label}
          </button>
        ))}
      </div>

      <details className="mt-3 text-[11px] text-stone-500 dark:text-zinc-400">
        <summary className="cursor-pointer select-none font-bold">효과음 설정</summary>
        <label className="mt-2 flex items-center gap-2">
          <span>볼륨</span>
          <input type="range" min="0" max="1" step="0.05" value={volume} disabled={muted} onChange={(event) => setVolume(Number(event.target.value))} className="w-full accent-[#F9954E]" aria-label="상호작용 효과음 볼륨" />
          <span className="w-8 text-right">{Math.round(volume * 100)}%</span>
        </label>
      </details>
    </section>
  );
}
