"use client";

// My World — 팔레트 가구 카드(클릭 시 방에 추가). (05-05)
import RoomItemSprite from "@/components/my-world/room/RoomItemSprite";
import type { RoomItemDefinition } from "@/lib/myWorld/room/types";

export default function RoomItemCard({
  def, onAdd, disabled,
}: {
  def: RoomItemDefinition; onAdd: (itemId: string) => void; disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onAdd(def.id)}
      disabled={disabled}
      aria-label={`${def.name} 추가`}
      title={disabled ? "최대 개수에 도달했어요" : `${def.name} 추가`}
      className="group flex w-full flex-col items-center gap-1 rounded-2xl border border-stone-100 bg-white p-2 transition hover:border-[#F9954E]/50 hover:bg-[#F9954E]/5 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <span className="h-12 w-12">
        <RoomItemSprite def={def} />
      </span>
      <span className="w-full truncate text-center text-[11px] font-bold text-stone-700 dark:text-stone-200">{def.name}</span>
    </button>
  );
}
