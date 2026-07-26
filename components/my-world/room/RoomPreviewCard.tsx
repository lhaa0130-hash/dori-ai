"use client";

// My World — 내 방 요약 + 편집 진입.
//
// 방을 보는 창구는 위 "함께 놀기" 무대 하나다(같은 savedRoom·같은 렌더러를 두 번 그리지 않는다).
// 이 패널은 상태 확인과 편집 진입만 맡는다 — 가구 수·저장 상태·오류·편집 버튼.
import { useState } from "react";
import { useRoom } from "@/contexts/RoomContext";
import { useCharacter } from "@/contexts/CharacterContext";
import WorldPanel from "@/components/my-world/WorldPanel";
import RoomEditorModal from "@/components/my-world/room/RoomEditorModal";
import { MAX_PLACED_ITEMS } from "@/lib/myWorld/room/constants";
import { resolveSaveView } from "@/lib/myWorld/view/worldView";

export default function RoomPreviewCard() {
  const { savedRoom, loading, loadError, reloadRoom, dirty, saving, error, loggedIn } = useRoom();
  const { character } = useCharacter();
  const [editorOpen, setEditorOpen] = useState(false);
  const count = savedRoom.placedItems.length;

  // 저장 상태는 색만으로 전달하지 않고 아이콘 + 문장을 함께 쓴다(순수 함수가 결정).
  const save = resolveSaveView({ authState: loggedIn ? "signed" : "guest", saving, dirty, saveError: error });
  const SAVE_TONE_CLASS: Record<string, string> = {
    saving: "text-stone-500 dark:text-zinc-400",
    dirty: "text-[#9A4E14]",
    saved: "text-emerald-600 dark:text-emerald-400",
    guest: "text-stone-500 dark:text-zinc-400",
    failed: "text-red-600 dark:text-red-400",
  };

  return (
    <WorldPanel
      title="내 방"
      subtitle={`${character.emoji} ${character.name}의 방 · 가구 ${loading ? "…" : `${count} / ${MAX_PLACED_ITEMS}`}`}
      labelledById="room-heading"
      tone="glass"
      action={
        <button
          type="button"
          onClick={() => setEditorOpen(true)}
          className="flex min-h-[44px] items-center whitespace-nowrap rounded-xl bg-[#AD5B18] px-4 text-[13px] font-black text-white transition hover:bg-[#8F4A12] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F9954E]"
        >
          방 꾸미기
        </button>
      }
    >
      <p className={`flex items-center gap-1.5 text-[12px] font-bold ${SAVE_TONE_CLASS[save.tone]}`} aria-live="polite">
        <span aria-hidden>{save.icon}</span>
        {save.text}
      </p>

      {count === 0 && !loading && (
        <p className="mt-2 break-keep text-[11px] font-medium text-stone-600 dark:text-zinc-300">
          아직 가구가 없어요. 침대·책상·화분을 놓아 방을 시작해보세요.
        </p>
      )}

      {loadError && (
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-900 dark:bg-amber-950/40">
          <p className="min-w-0 break-keep text-[12px] font-semibold text-amber-800 dark:text-amber-200">{loadError}</p>
          <button
            type="button"
            onClick={() => { void reloadRoom(); }}
            className="flex min-h-[36px] flex-none items-center rounded-lg bg-white px-3 text-[12px] font-bold text-amber-800 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F9954E] dark:bg-zinc-900 dark:text-amber-200"
          >
            다시 시도
          </button>
        </div>
      )}

      <RoomEditorModal open={editorOpen} onClose={() => setEditorOpen(false)} />
    </WorldPanel>
  );
}
