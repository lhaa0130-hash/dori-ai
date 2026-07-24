"use client";

// My World — 대표 캐릭터 선택 모달(공용). 12종 grid, 잠금(🔒 + unlockLevel), 선택.
//  ⚠️ 선택만 담당. 성장/의상/표정/포즈/AI생성 없음.
import { useEffect } from "react";
import {
  CHARACTERS,
  getCharacter,
  isCharacterUnlocked,
  RARITY_STYLE,
} from "@/lib/myWorld/characters";

export default function CharacterSelectModal({
  open,
  onClose,
  selectedId,
  userLevel,
  saving,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  selectedId: string;
  userLevel: number;
  saving?: boolean;
  onSelect: (characterId: string) => void; // 해금된 캐릭터만 호출됨
}) {
  // 열려 있을 때 body 스크롤 잠금
  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="대표 캐릭터 선택"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 dark:bg-zinc-950 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[17px] font-extrabold text-stone-900 dark:text-white">대표 캐릭터 선택</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-500 dark:bg-zinc-800 dark:text-stone-400"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {CHARACTERS.map((c) => {
            const unlocked = isCharacterUnlocked(c, userLevel);
            const isSel = c.id === selectedId;
            const rarity = RARITY_STYLE[c.rarity];
            return (
              <button
                key={c.id}
                type="button"
                disabled={!unlocked || saving}
                onClick={() => unlocked && onSelect(c.id)}
                aria-label={`${c.name}${unlocked ? "" : ` (Lv.${c.unlockLevel} 필요, 잠김)`}${isSel ? ", 선택됨" : ""}`}
                aria-pressed={isSel}
                className={`relative flex flex-col items-center gap-1.5 rounded-2xl border p-2.5 transition-colors ${
                  isSel
                    ? "border-[#F9954E] bg-[#F9954E]/10"
                    : "border-stone-100 bg-stone-50 dark:border-zinc-800 dark:bg-zinc-900/60"
                } ${!unlocked ? "opacity-90" : "active:scale-95"}`}
              >
                {/* rarity dot */}
                <span
                  className="absolute left-2 top-2 h-2 w-2 rounded-full"
                  style={{ backgroundColor: rarity.color }}
                  title={rarity.label}
                />
                <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm dark:bg-zinc-800">
                  <span className={`text-3xl ${unlocked ? "" : "grayscale"}`}>{c.avatar}</span>
                  {!unlocked && (
                    <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/35 text-lg">🔒</span>
                  )}
                </div>
                <span className={`text-[12px] font-bold ${unlocked ? "text-stone-800 dark:text-stone-200" : "text-stone-400"}`}>
                  {c.name}
                </span>
                {!unlocked ? (
                  <span className="text-[10px] font-bold text-stone-400">Lv.{c.unlockLevel}</span>
                ) : isSel ? (
                  <span className="text-[10px] font-black text-[#F9954E]">선택됨</span>
                ) : (
                  <span className="text-[10px] text-stone-300 dark:text-stone-600">선택</span>
                )}
              </button>
            );
          })}
        </div>

        <p className="mt-4 text-center text-[11px] text-stone-400">
          잠긴 캐릭터는 레벨을 올리면 해금돼요. ({getCharacter(selectedId).name} 사용 중)
        </p>
      </div>
    </div>
  );
}
