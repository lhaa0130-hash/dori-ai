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
      className="group flex min-h-[88px] w-full flex-col items-center justify-center gap-1 rounded-2xl border border-stone-100 bg-white p-2 transition hover:border-[#F9954E]/50 hover:bg-[#F9954E]/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F9954E] disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-900"
    >
      {/* 팔레트에서는 카드 형태가 알아보기 쉬우므로 후광 대신 옅은 타일 배경을 쓴다. */}
      <span
        className="flex h-12 w-12 items-center justify-center rounded-xl"
        style={{ background: `linear-gradient(160deg, ${def.themeColor}40 0%, ${def.themeColor}1a 100%)` }}
      >
        <RoomItemSprite def={def} withBackground={false} />
      </span>
      <span className="w-full truncate text-center text-[11px] font-bold text-stone-700 dark:text-stone-200">{def.name}</span>
    </button>
  );
}
