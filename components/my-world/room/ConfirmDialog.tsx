"use client";

// My World — 앱 내부 확인 모달(브라우저 confirm 대체). (05-05)
//  접근성: role=dialog, ESC 취소, 열릴 때 확인 버튼 focus.
import { useEffect, useRef } from "react";

export default function ConfirmDialog({
  open, title, message, confirmLabel = "확인", cancelLabel = "취소", danger, onConfirm, onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onCancel(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative w-full max-w-xs rounded-3xl bg-white p-5 shadow-xl dark:bg-zinc-900">
        <h3 className="text-[15px] font-extrabold text-stone-900 dark:text-white">{title}</h3>
        <p className="mt-1.5 whitespace-pre-line text-[13px] leading-relaxed text-stone-500 dark:text-stone-400">{message}</p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-11 flex-1 rounded-xl bg-stone-100 text-[13px] font-bold text-stone-600 hover:bg-stone-200 dark:bg-zinc-800 dark:text-stone-200"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className={[
              "h-11 flex-1 rounded-xl text-[13px] font-black text-white",
              danger ? "bg-red-500 hover:bg-red-600" : "bg-[#F9954E] hover:bg-[#f0862f]",
            ].join(" ")}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
