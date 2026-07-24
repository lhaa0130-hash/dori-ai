"use client";

// My World — Room Editor 모달 (05-05).
//  모바일: 전체 화면 / 데스크톱: 중앙 대형 모달. draft 편집 → 저장 시에만 Firestore.
//  접근성: role=dialog, ESC(변경 있으면 확인), 열릴 때 focus, 닫을 때 복귀, 저장상태 aria-live.
import Link from "next/link";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRoom } from "@/contexts/RoomContext";
import RoomCanvas from "@/components/my-world/room/RoomCanvas";
import RoomToolbar from "@/components/my-world/room/RoomToolbar";
import RoomItemPalette from "@/components/my-world/room/RoomItemPalette";
import ConfirmDialog from "@/components/my-world/room/ConfirmDialog";

export default function RoomEditorModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const {
    draftRoom, selectedItemId, selectItem, moveItem, nudgeItem, removeItem,
    dirty, saving, error, itemCount, saveRoom, resetDraft, discardDraft,
  } = useRoom();

  const [resetConfirm, setResetConfirm] = useState(false);
  const [discardConfirm, setDiscardConfirm] = useState(false);
  const [loginPrompt, setLoginPrompt] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const anyDialog = resetConfirm || discardConfirm || loginPrompt;

  // focus 이동 + body scroll lock + 닫을 때 focus 복귀.
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtnRef.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      prev?.focus?.();
    };
  }, [open]);

  const requestClose = useCallback(() => {
    if (dirty) setDiscardConfirm(true);
    else onClose();
  }, [dirty, onClose]);

  // ESC — 하위 다이얼로그가 열려있으면 그쪽이 처리.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !anyDialog) { e.preventDefault(); requestClose(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, anyDialog, requestClose]);

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  if (!open) return null;

  const status = saving ? "저장 중…" : error ? "저장 실패" : dirty ? "수정됨" : "저장됨";
  const statusTone = error ? "text-red-500" : dirty ? "text-[#F9954E]" : "text-emerald-500";

  const handleSave = async () => {
    const r = await saveRoom();
    if (r.needLogin) { setLoginPrompt(true); return; }
    if (r.ok) {
      setSavedToast(true);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setSavedToast(false), 1800);
    }
    // 실패 시: error 상태로 draft 유지(context 처리) → 사용자 재시도 가능.
  };

  const confirmDiscard = () => { setDiscardConfirm(false); discardDraft(); onClose(); };
  const confirmReset = () => { setResetConfirm(false); resetDraft(); };

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-stretch justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="방 꾸미기">
      <div className="absolute inset-0 bg-black/45" onClick={requestClose} />

      <div className="relative flex h-full w-full flex-col bg-white shadow-2xl dark:bg-zinc-950 sm:h-auto sm:max-h-[92vh] sm:max-w-4xl sm:rounded-3xl">
        {/* ── 헤더 ── */}
        <header className="flex items-center justify-between gap-2 border-b border-stone-100 px-4 py-3 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <h2 className="text-[16px] font-extrabold text-stone-900 dark:text-white">방 꾸미기</h2>
            <span aria-live="polite" className={`rounded-full bg-stone-100 px-2.5 py-0.5 text-[11px] font-bold dark:bg-zinc-800 ${statusTone}`}>{status}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-[12px] font-semibold text-stone-400 sm:inline">가구 {itemCount} / 30</span>
            <button
              ref={closeBtnRef}
              type="button"
              onClick={requestClose}
              aria-label="닫기"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 dark:bg-zinc-800 dark:text-stone-300"
            >
              ✕
            </button>
          </div>
        </header>

        {/* ── 본문: 데스크톱 좌우 분할 / 모바일 세로 ── */}
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          {/* 캔버스 + 툴바 */}
          <div className="flex min-h-0 flex-col gap-2.5 overflow-y-auto p-4 md:flex-1">
            <div className="mx-auto w-full max-w-xl">
              <RoomCanvas
                room={draftRoom}
                editable
                selectedItemId={selectedItemId}
                onSelect={selectItem}
                onMove={moveItem}
                onNudge={nudgeItem}
                onDeleteSelected={removeItem}
              />
            </div>
            <div className="mx-auto w-full max-w-xl">
              <RoomToolbar />
            </div>
          </div>

          {/* 팔레트 */}
          <div className="min-h-0 border-t border-stone-100 p-4 dark:border-zinc-800 md:w-80 md:border-l md:border-t-0">
            <div className="h-56 md:h-full md:max-h-[60vh]">
              <RoomItemPalette />
            </div>
          </div>
        </div>

        {/* ── 푸터: 초기화 / 취소 / 저장 ── */}
        <footer className="flex items-center justify-between gap-2 border-t border-stone-100 px-4 py-3 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setResetConfirm(true)}
            className="h-11 rounded-xl px-3 text-[13px] font-bold text-stone-500 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-zinc-800"
          >
            초기화
          </button>
          <div className="flex items-center gap-2">
            {error && <span className="hidden text-[12px] font-semibold text-red-500 sm:inline">{error}</span>}
            <button
              type="button"
              onClick={requestClose}
              className="h-11 rounded-xl bg-stone-100 px-4 text-[13px] font-bold text-stone-600 hover:bg-stone-200 dark:bg-zinc-800 dark:text-stone-200"
            >
              닫기
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="h-11 rounded-xl bg-[#F9954E] px-5 text-[13px] font-black text-white hover:bg-[#f0862f] disabled:opacity-50"
            >
              {saving ? "저장 중…" : "저장"}
            </button>
          </div>
        </footer>

        {/* 저장 성공 토스트 */}
        {savedToast && (
          <div className="pointer-events-none absolute bottom-20 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-4 py-2 text-[13px] font-bold text-white shadow-lg" role="status">
            방을 저장했어요 ✨
          </div>
        )}
      </div>

      {/* 초기화 확인 */}
      <ConfirmDialog
        open={resetConfirm}
        title="방을 초기화할까요?"
        message={"방을 처음 상태로 되돌릴까요?\n현재 배치한 가구가 모두 사라집니다.\n(저장해야 실제로 반영돼요)"}
        confirmLabel="초기화"
        danger
        onConfirm={confirmReset}
        onCancel={() => setResetConfirm(false)}
      />

      {/* 저장 안 한 변경 확인 */}
      <ConfirmDialog
        open={discardConfirm}
        title="저장하지 않은 변경사항이 있어요"
        message="정말 나갈까요? 변경사항이 사라집니다."
        confirmLabel="나가기"
        danger
        onConfirm={confirmDiscard}
        onCancel={() => setDiscardConfirm(false)}
      />

      {/* 비로그인 저장 유도 */}
      {loginPrompt && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="로그인 필요">
          <div className="absolute inset-0 bg-black/40" onClick={() => setLoginPrompt(false)} />
          <div className="relative w-full max-w-xs rounded-3xl bg-white p-5 text-center shadow-xl dark:bg-zinc-900">
            <span className="text-3xl">🔒</span>
            <h3 className="mt-2 text-[15px] font-extrabold text-stone-900 dark:text-white">로그인하면 방을 저장할 수 있어요</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-stone-500 dark:text-stone-400">
              방 꾸미기는 체험할 수 있지만, 저장하려면 로그인이 필요해요.
            </p>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => setLoginPrompt(false)} className="h-11 flex-1 rounded-xl bg-stone-100 text-[13px] font-bold text-stone-600 dark:bg-zinc-800 dark:text-stone-200">
                계속 체험
              </button>
              <Link href="/login?next=/my-world" className="flex h-11 flex-1 items-center justify-center rounded-xl bg-[#F9954E] text-[13px] font-black text-white">
                로그인
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}
