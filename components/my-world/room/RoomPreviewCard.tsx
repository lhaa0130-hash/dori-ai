"use client";

// My World — 내 방 미리보기 카드(05-05). 기존 MyRoomCard placeholder 대체.
//  savedRoom(서버 원본)을 축소 렌더 + "방 꾸미기"로 Editor 진입. 미리보기는 편집 불가.
import { useState } from "react";
import { useRoom } from "@/contexts/RoomContext";
import { useCharacter } from "@/contexts/CharacterContext";
import RoomCanvas from "@/components/my-world/room/RoomCanvas";
import RoomEditorModal from "@/components/my-world/room/RoomEditorModal";

export default function RoomPreviewCard() {
  const { savedRoom, loading, loggedIn } = useRoom();
  const { character } = useCharacter();
  const [editorOpen, setEditorOpen] = useState(false);
  const count = savedRoom.placedItems.length;

  return (
    <section className="rounded-3xl border border-stone-100 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[15px] font-extrabold text-stone-900 dark:text-white">내 방</h2>
        <button
          type="button"
          onClick={() => setEditorOpen(true)}
          className="rounded-full bg-[#F9954E] px-3.5 py-1.5 text-[12px] font-black text-white hover:bg-[#f0862f]"
        >
          방 꾸미기
        </button>
      </div>

      {/* 축소 미리보기(공용 RoomCanvas, 편집 불가) */}
      <button
        type="button"
        onClick={() => setEditorOpen(true)}
        aria-label="방 꾸미기 열기"
        className="block w-full overflow-hidden rounded-2xl ring-1 ring-stone-100 transition hover:ring-[#F9954E]/40 dark:ring-zinc-800"
      >
        {loading ? (
          <div className="flex aspect-[4/3] w-full animate-pulse items-center justify-center bg-stone-100 dark:bg-zinc-800">
            <span className="text-3xl">🏠</span>
          </div>
        ) : (
          <RoomCanvas room={savedRoom} compact />
        )}
      </button>

      {/* 상태 줄 */}
      <div className="mt-3 flex items-center justify-between text-[12px]">
        <span className="font-semibold text-stone-500 dark:text-stone-400">
          {character.emoji} {character.name}의 방 · 가구 {count}개
        </span>
        <span className="font-semibold text-stone-400">
          {loggedIn ? "내 방" : "체험 모드"}
        </span>
      </div>

      <RoomEditorModal open={editorOpen} onClose={() => setEditorOpen(false)} />
    </section>
  );
}
