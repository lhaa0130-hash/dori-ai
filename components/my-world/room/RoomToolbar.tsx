"use client";

// My World — Room 선택 아이템 편집 Toolbar (05-05). 회전/크기/반전/레이어/복제/삭제.
import { useRoom } from "@/contexts/RoomContext";
import { getRoomItem } from "@/lib/myWorld/room/registry";

function TBtn({
  label, onClick, disabled, danger, children,
}: {
  label: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={[
        "flex h-11 min-w-[44px] items-center justify-center gap-1 rounded-xl px-2.5 text-[13px] font-bold transition",
        "disabled:cursor-not-allowed disabled:opacity-40",
        danger
          ? "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/15 dark:text-red-400"
          : "bg-stone-100 text-stone-700 hover:bg-stone-200 dark:bg-zinc-800 dark:text-stone-200 dark:hover:bg-zinc-700",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export default function RoomToolbar() {
  const { selectedItem, rotateItem, scaleItem, flipItem, bringForward, sendBackward, duplicateItem, removeItem, atLimit } = useRoom();

  if (!selectedItem) {
    return (
      <div className="flex h-11 items-center justify-center rounded-xl bg-stone-50 px-3 text-[12px] font-semibold text-stone-400 dark:bg-zinc-900/60">
        가구를 선택하면 편집할 수 있어요
      </div>
    );
  }

  const def = getRoomItem(selectedItem.itemId);
  if (!def) return null;

  return (
    <div className="rounded-2xl bg-stone-50 p-2.5 dark:bg-zinc-900/60">
      {/* 선택 정보 */}
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="flex items-center gap-1.5 text-[13px] font-extrabold text-stone-800 dark:text-white">
          <span aria-hidden>{def.placeholderEmoji}</span>{def.name}
        </span>
        <span className="text-[11px] font-semibold text-stone-400">
          {def.canRotate && <>{selectedItem.rotation}° · </>}{Math.round(selectedItem.scale * 100)}%
        </span>
      </div>
      {/* 버튼들 */}
      <div className="flex flex-wrap gap-1.5">
        {def.canRotate && (
          <>
            <TBtn label="왼쪽으로 회전" onClick={() => rotateItem(selectedItem.instanceId, -1)}>↺</TBtn>
            <TBtn label="오른쪽으로 회전" onClick={() => rotateItem(selectedItem.instanceId, 1)}>↻</TBtn>
          </>
        )}
        <TBtn label="작게" onClick={() => scaleItem(selectedItem.instanceId, -1)} disabled={selectedItem.scale <= def.minScale + 1e-6}>－</TBtn>
        <TBtn label="크게" onClick={() => scaleItem(selectedItem.instanceId, 1)} disabled={selectedItem.scale >= def.maxScale - 1e-6}>＋</TBtn>
        {def.canFlip && <TBtn label="좌우 반전" onClick={() => flipItem(selectedItem.instanceId)}>⇋</TBtn>}
        <TBtn label="뒤로 보내기" onClick={() => sendBackward(selectedItem.instanceId)}>뒤로</TBtn>
        <TBtn label="앞으로 가져오기" onClick={() => bringForward(selectedItem.instanceId)}>앞으로</TBtn>
        <TBtn label="복제" onClick={() => duplicateItem(selectedItem.instanceId)} disabled={atLimit}>복제</TBtn>
        <TBtn label="삭제" danger onClick={() => removeItem(selectedItem.instanceId)}>🗑 삭제</TBtn>
      </div>
    </div>
  );
}
