"use client";

// My World — 내 방 요약 + 편집 진입.
//
// 왜 미리보기 캔버스를 뺐는가: 바로 위 "함께 놀기" 무대가 같은 `savedRoom` 을 같은 렌더러로
// 이미 그린다. 데스크톱에서 완전히 동일한 그림이 두 번(565px) 반복돼 화면 우선순위를 흐렸다.
// 방을 보는 창구는 무대 하나로 두고, 이 카드는 상태 확인과 편집 진입만 맡는다.
// 기능은 유지된다 — 방 보기(무대) · 가구 수 · 저장 상태 · 편집(모달).
import { useState } from "react";
import { useRoom } from "@/contexts/RoomContext";
import { useCharacter } from "@/contexts/CharacterContext";
import RoomEditorModal from "@/components/my-world/room/RoomEditorModal";
import { MAX_PLACED_ITEMS } from "@/lib/myWorld/room/constants";

export default function RoomPreviewCard() {
  const { savedRoom, loading, loadError, reloadRoom, dirty, saving, loggedIn } = useRoom();
  const { character } = useCharacter();
  const [editorOpen, setEditorOpen] = useState(false);
  const count = savedRoom.placedItems.length;

  // 저장 상태는 색만으로 전달하지 않고 아이콘 + 문장을 함께 쓴다.
  const state = saving
    ? { icon: "⏳", text: "저장 중", tone: "text-stone-500 dark:text-zinc-400" }
    : dirty
      ? { icon: "✏️", text: "저장 안 된 변경 있음", tone: "text-[#F9954E]" }
      : loggedIn
        ? { icon: "✅", text: "저장됨", tone: "text-emerald-600 dark:text-emerald-400" }
        : { icon: "ℹ️", text: "체험 모드 · 로그인하면 저장돼요", tone: "text-stone-500 dark:text-zinc-400" };

  return (
    <section className="rounded-3xl border border-stone-100 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[15px] font-extrabold text-stone-900 dark:text-white">내 방</h2>
          <p className="mt-0.5 truncate text-[11px] font-medium text-stone-500 dark:text-zinc-400">
            {character.emoji} {character.name}의 방 · 가구 {loading ? "…" : `${count} / ${MAX_PLACED_ITEMS}`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditorOpen(true)}
          className="flex min-h-[44px] flex-none items-center rounded-xl bg-[#F9954E] px-4 text-[13px] font-black text-white transition hover:bg-[#f0862f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F9954E]"
        >
          방 꾸미기
        </button>
      </div>

      <p className={`mt-2.5 flex items-center gap-1.5 text-[12px] font-bold ${state.tone}`} aria-live="polite">
        <span aria-hidden>{state.icon}</span>
        {state.text}
      </p>

      {loadError && (
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-900 dark:bg-amber-950/40">
          <p className="min-w-0 text-[12px] font-semibold text-amber-800 dark:text-amber-200">{loadError}</p>
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
    </section>
  );
}
