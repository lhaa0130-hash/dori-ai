"use client";

// My World — Room Canvas(공용 렌더러). Preview(editable=false)·Editor(editable) 동일 렌더.
//  레이어: 벽 → 바닥 → 가구(zIndex 순) → 캐릭터 → 선택 UI. 좌표=퍼센트(고정 4:3 → 기기 무관).
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

  return (
    <div
      role={editable ? "button" : undefined}
      aria-label={editable ? def.name : undefined}
      aria-selected={editable ? selected : undefined}
      tabIndex={-1}
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
        outline: selected ? "2.5px solid #F9954E" : "none",
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
      style={{ aspectRatio: ROOM_ASPECT, background: wall.background }}
    >
      {/* 바닥 밴드 */}
      <div
        data-canvas-bg="1"
        className="absolute inset-x-0 bottom-0"
        style={{ height: `${FLOOR_BAND_PERCENT}%`, background: floor.background, boxShadow: "inset 0 1px 0 rgba(0,0,0,0.06)" }}
      />

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
    </div>
  );
}

export default memo(RoomCanvasInner);
