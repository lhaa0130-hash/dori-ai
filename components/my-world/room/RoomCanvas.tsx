"use client";

// My World — Room Canvas(공용 렌더러). Preview(editable=false)·Editor(editable) 동일 렌더.
//  레이어: 벽 → 바닥 → 접지 그림자 → 가구(zIndex 순) → 캐릭터 → 선택 UI. 좌표=퍼센트(고정 4:3 → 기기 무관).
//
//  깊이감: 가구와 캐릭터가 배경 위에 "떠 있는" 데모처럼 보이던 문제를 해결하기 위해
//  ① 벽 하단 그라데이션 ② 벽/바닥 접합선 ③ 바닥 원근 하이라이트 ④ 물체별 접지 타원 그림자
//  ⑤ 모서리 비네트를 더한다. 좌표계·저장 형식·가구 정의는 그대로다(시각 레이어만 추가).
import { memo, useCallback, useRef, useState, type RefObject, type PointerEvent as RPointerEvent, type KeyboardEvent as RKeyboardEvent } from "react";
import { useCharacter } from "@/contexts/CharacterContext";
import { CHARACTER_ASSETS_READY, themeTint } from "@/lib/myWorld/character/utils";
import RoomItemSprite from "@/components/my-world/room/RoomItemSprite";
import type { PlacedRoomItem, RoomState } from "@/lib/myWorld/room/types";
import { getRoomFloor, getRoomItem, getRoomWall } from "@/lib/myWorld/room/registry";
import { FLOOR_BAND_PERCENT, NUDGE_STEP, NUDGE_STEP_LARGE, ROOM_ASPECT } from "@/lib/myWorld/room/constants";
import { clientToPercent, itemTransform, sortedByZ } from "@/lib/myWorld/room/calculations";
import { itemBoxPercent } from "@/lib/myWorld/room/utils";

interface CanvasProps {
  room: RoomState;
  editable?: boolean;
  selectedItemId?: string | null;
  onSelect?: (id: string | null) => void;
  onMove?: (id: string, x: number, y: number) => void;
  onNudge?: (id: string, dx: number, dy: number) => void;
  onDeleteSelected?: (id: string) => void;
  compact?: boolean; // preview(작게) — 선택 UI 없음
  hideCharacter?: boolean; // interaction stage가 자체 애니메이션 캐릭터 레이어를 렌더할 때
}

const RoomItemView = memo(function RoomItemView({
  placed, editable, selected, canvasRef, onSelect, onMove,
}: {
  placed: PlacedRoomItem;
  editable: boolean;
  selected: boolean;
  canvasRef: RefObject<HTMLDivElement>;
  onSelect?: (id: string | null) => void;
  onMove?: (id: string, x: number, y: number) => void;
}) {
  const def = getRoomItem(placed.itemId);
  const dragRef = useRef<{ pointerId: number; offX: number; offY: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [focused, setFocused] = useState(false);
  if (!def) return null;

  const { w, h } = itemBoxPercent(def, placed.scale);

  const handleDown = (e: RPointerEvent<HTMLDivElement>) => {
    if (!editable) return;
    e.stopPropagation();
    onSelect?.(placed.instanceId);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const p = clientToPercent(e.clientX, e.clientY, rect);
    dragRef.current = { pointerId: e.pointerId, offX: placed.x - p.x, offY: placed.y - p.y };
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch { /* noop */ }
    setDragging(true);
  };
  const handleMove = (e: RPointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId) return;
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const p = clientToPercent(e.clientX, e.clientY, rect);
    onMove?.(placed.instanceId, p.x + d.offX, p.y + d.offY);
  };
  const endDrag = (e: RPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* noop */ }
    dragRef.current = null;
    setDragging(false);
  };

  // 키보드로도 가구를 선택할 수 있어야 한다 — 이전에는 tabIndex=-1 이라 방향키 이동·삭제를
  // 쓸 방법이 포인터뿐이었다. Enter/Space 로 선택하면 캔버스의 방향키 핸들러가 이어받는다.
  const handleKeyDown = (e: RKeyboardEvent<HTMLDivElement>) => {
    if (!editable) return;
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    e.stopPropagation();
    onSelect?.(placed.instanceId);
  };

  return (
    <div
      role={editable ? "button" : undefined}
      aria-label={editable ? `${def.name}${selected ? " — 선택됨. 방향키로 옮기고 Delete 로 지웁니다." : ". Enter 로 선택합니다."}` : undefined}
      aria-pressed={editable ? selected : undefined}
      tabIndex={editable ? 0 : -1}
      onKeyDown={handleKeyDown}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      style={{
        position: "absolute",
        left: `${placed.x}%`,
        top: `${placed.y}%`,
        width: `${w}%`,
        height: `${h}%`,
        transform: itemTransform(placed.rotation, placed.flipped),
        transformOrigin: "center",
        zIndex: placed.zIndex + 10,
        cursor: editable ? (dragging ? "grabbing" : "grab") : "default",
        touchAction: editable ? "none" : undefined,
        transition: dragging ? "none" : "filter 150ms ease",
        // 선택은 주황 실선, 키보드 포커스는 점선 — 둘을 구별할 수 있게 한다.
        outline: selected ? "2.5px solid #F9954E" : focused ? "2.5px dashed #F9954E" : "none",
        outlineOffset: "2px",
        borderRadius: "16px",
        filter: selected ? "drop-shadow(0 6px 14px rgba(249,149,78,0.35))" : "none",
        WebkitUserSelect: "none",
        userSelect: "none",
      }}
    >
      <RoomItemSprite def={def} />
    </div>
  );
});

function RoomCanvasInner({ room, editable = false, selectedItemId = null, onSelect, onMove, onNudge, onDeleteSelected, compact = false, hideCharacter = false }: CanvasProps) {
  const { character } = useCharacter();
  const canvasRef = useRef<HTMLDivElement>(null);
  const wall = getRoomWall(room.wallId);
  const floor = getRoomFloor(room.floorId);
  const ordered = sortedByZ(room.placedItems);

  const onBackgroundDown = useCallback((e: RPointerEvent<HTMLDivElement>) => {
    if (!editable) return;
    if (e.target === e.currentTarget || (e.target as HTMLElement).dataset?.canvasBg === "1") onSelect?.(null);
  }, [editable, onSelect]);

  const onKeyDown = useCallback((e: RKeyboardEvent<HTMLDivElement>) => {
    if (!editable || !selectedItemId) return;
    const step = e.shiftKey ? NUDGE_STEP_LARGE : NUDGE_STEP;
    if (e.key === "ArrowLeft") { e.preventDefault(); onNudge?.(selectedItemId, -step, 0); }
    else if (e.key === "ArrowRight") { e.preventDefault(); onNudge?.(selectedItemId, step, 0); }
    else if (e.key === "ArrowUp") { e.preventDefault(); onNudge?.(selectedItemId, 0, -step); }
    else if (e.key === "ArrowDown") { e.preventDefault(); onNudge?.(selectedItemId, 0, step); }
    else if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); onDeleteSelected?.(selectedItemId); }
  }, [editable, selectedItemId, onNudge, onDeleteSelected]);

  const charSize = compact ? "18%" : "22%";

  return (
    <div
      ref={canvasRef}
      data-canvas-bg="1"
      onPointerDown={onBackgroundDown}
      onKeyDown={onKeyDown}
      tabIndex={editable ? 0 : -1}
      className="relative w-full overflow-hidden rounded-2xl outline-none"
      // isolate: 캔버스 내부 z-index(그림자·비네트)를 캔버스 안에 가둔다.
      // 없으면 비네트(z 950)가 무대의 캐릭터 버튼(z 40)보다 위에 그려진다.
      style={{ aspectRatio: ROOM_ASPECT, background: wall.background, isolation: "isolate" }}
    >
      {/* 벽 하단 그라데이션 — 위로 열린 공간감 */}
      <div
        data-canvas-bg="1"
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0"
        style={{ height: `${100 - FLOOR_BAND_PERCENT}%`, background: "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.05) 100%)" }}
      />

      {/* 바닥 밴드 */}
      <div
        data-canvas-bg="1"
        className="absolute inset-x-0 bottom-0"
        style={{ height: `${FLOOR_BAND_PERCENT}%`, background: floor.background, boxShadow: "inset 0 1px 0 rgba(0,0,0,0.06)" }}
      />

      {/* 벽/바닥 접합 — 굽도리 선 + 바닥으로 떨어지는 그림자 */}
      <div
        data-canvas-bg="1"
        aria-hidden
        className="pointer-events-none absolute inset-x-0"
        style={{
          bottom: `${FLOOR_BAND_PERCENT}%`,
          height: "3%",
          background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(90,60,40,0.16) 100%)",
        }}
      />
      <div
        data-canvas-bg="1"
        aria-hidden
        className="pointer-events-none absolute inset-x-0"
        style={{
          bottom: `${FLOOR_BAND_PERCENT}%`,
          height: "6%",
          background: "linear-gradient(180deg, rgba(90,60,40,0.20) 0%, rgba(90,60,40,0) 100%)",
          transform: "translateY(100%)",
        }}
      />

      {/* 바닥 나무판 — 아주 옅은 결. 이미지 에셋이 오기 전까지 "그라데이션 두 장" 느낌을 줄인다.
          앞쪽으로 갈수록 간격이 넓어지게 두 겹을 겹쳐 원근을 흉내 낸다. */}
      <div
        data-canvas-bg="1"
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0"
        style={{
          height: `${FLOOR_BAND_PERCENT}%`,
          background:
            "repeating-linear-gradient(90deg, rgba(140,100,65,0.09) 0 1px, rgba(140,100,65,0) 1px 14%)," +
            "repeating-linear-gradient(0deg, rgba(140,100,65,0.055) 0 1px, rgba(140,100,65,0) 1px 34%)",
          maskImage: "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,1) 100%)",
          WebkitMaskImage: "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,1) 100%)",
        }}
      />

      {/* 바닥 원근 하이라이트 — 앞쪽이 밝아 바닥이 눕혀 보인다 */}
      <div
        data-canvas-bg="1"
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0"
        style={{
          height: `${FLOOR_BAND_PERCENT}%`,
          background: "radial-gradient(120% 90% at 50% 115%, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0) 60%)",
        }}
      />

      {/* 벽 좌우 모서리 음영 — 벽이 평면이 아니라 공간의 안쪽처럼 보이게 한다 */}
      <div
        data-canvas-bg="1"
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0"
        style={{
          height: `${100 - FLOOR_BAND_PERCENT}%`,
          background:
            "linear-gradient(90deg, rgba(120,85,55,0.10) 0%, rgba(120,85,55,0) 18%, rgba(120,85,55,0) 82%, rgba(120,85,55,0.12) 100%)",
        }}
      />

      {/* 가구 접지 그림자 — 물체가 바닥에 놓여 있게 보이도록 별도 레이어로 깐다.
          가구 박스는 회전/반전 transform 을 갖기 때문에 그림자를 자식으로 두면 함께 돌아간다. */}
      {ordered.map((it) => {
        const def = getRoomItem(it.itemId);
        if (!def || def.layer >= 3) return null; // 벽걸이(액자 등)는 바닥 그림자가 없다
        const { w, h } = itemBoxPercent(def, it.scale);
        return (
          <div
            key={`shadow-${it.instanceId}`}
            aria-hidden
            className="pointer-events-none absolute"
            style={{
              left: `${it.x}%`,
              top: `${it.y + h / 2}%`,
              width: `${w * 0.86}%`,
              height: `${Math.max(2.4, h * 0.16)}%`,
              transform: "translate(-50%, -60%)",
              zIndex: it.zIndex + 9,
              background: "radial-gradient(50% 50% at 50% 50%, rgba(70,45,30,0.28) 0%, rgba(70,45,30,0) 72%)",
            }}
          />
        );
      })}

      {/* 가구 */}
      {ordered.map((it) => (
        <RoomItemView
          key={it.instanceId}
          placed={it}
          editable={editable}
          selected={editable && it.instanceId === selectedItemId}
          canvasRef={canvasRef}
          onSelect={onSelect}
          onMove={onMove}
        />
      ))}

      {/* 캐릭터 접지 그림자 — hideCharacter 인 경우는 무대(CharacterInteractionStage)가 자체로 깐다. */}
      {!hideCharacter && (
        <div
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            left: "50%",
            top: `calc(84% + ${compact ? 8 : 10}%)`,
            width: compact ? "16%" : "20%",
            height: "4%",
            transform: "translate(-50%, -50%)",
            zIndex: 890,
            background: "radial-gradient(50% 50% at 50% 50%, rgba(70,45,30,0.30) 0%, rgba(70,45,30,0) 72%)",
          }}
        />
      )}

      {/* 캐릭터(별도 레이어, 중앙 하단, 드래그 불가). CharacterAvatar placeholder 구조 재사용(이미지 우선→이모지). */}
      {!hideCharacter && <div
        className="pointer-events-none absolute"
        style={{ left: "50%", top: "84%", width: charSize, transform: "translate(-50%, -50%)", zIndex: 900 }}
        aria-label={`${character.name} 캐릭터`}
        role="img"
      >
        <div
          className="relative"
          style={{
            aspectRatio: "1 / 1",
            borderRadius: "9999px",
            background: `radial-gradient(circle at 50% 40%, ${themeTint(character.themeColor, "40")} 0%, rgba(255,255,255,0) 74%)`,
          }}
        >
          {CHARACTER_ASSETS_READY && character.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={character.image} alt={character.name} className="h-full w-full object-contain" draggable={false} />
          ) : (
            <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden focusable="false">
              <text x="50" y="56" textAnchor="middle" dominantBaseline="central" fontSize="62">{character.emoji}</text>
            </svg>
          )}
        </div>
      </div>}

      {/* 모서리 비네트 — 장면을 안쪽으로 모아준다 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ zIndex: 950, background: "radial-gradient(120% 100% at 50% 45%, rgba(0,0,0,0) 55%, rgba(60,40,25,0.10) 100%)" }}
      />
    </div>
  );
}

export default memo(RoomCanvasInner);
