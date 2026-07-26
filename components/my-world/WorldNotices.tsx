"use client";

// My World — 세계 단위 알림(저장 실패처럼 "조용히 삼켜지면 거짓이 되는" 것들).
//
// 이전에는 대표 캐릭터 저장 실패·일기 기록 실패를 Context 가 catch {} 로 삼켜서
// 실패했는데 성공한 것처럼 보였다(다음 로드에서 조용히 되돌아감).
// 여기서 한 곳에 모아 알리고, 사용자가 닫을 수 있게 한다.
//
// 계약
//  · Firebase 원문을 노출하지 않는다(Context 가 이미 사용자 문구로 변환한다).
//  · 자리를 미리 확보하지 않는다 — 알림이 없을 때 빈 줄을 남기면 세계가 헐거워 보인다.
//    대신 삽입 위치를 월드 바 바로 아래로 고정해, 나타날 때 무대가 밀리는 폭을 최소화한다.
//  · aria-live=polite 로 한 번만 읽힌다(같은 문구를 반복 낭독하지 않는다).
import { useCharacter } from "@/contexts/CharacterContext";
import { useDiary } from "@/contexts/DiaryContext";

function Notice({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <li>
      <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-900 dark:bg-amber-950/40">
        <span aria-hidden className="flex-none text-[13px]">⚠️</span>
        <p className="min-w-0 flex-1 break-keep text-[12px] font-semibold text-amber-800 dark:text-amber-200">{message}</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="알림 닫기"
          className="flex h-6 min-h-0 w-6 flex-none items-center justify-center rounded-full text-[12px] font-black text-amber-700 transition hover:bg-amber-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#F9954E] dark:text-amber-200"
        >
          ✕
        </button>
      </div>
    </li>
  );
}

export default function WorldNotices() {
  const { saveError: characterSaveError, clearSaveError } = useCharacter();
  const { writeError: diaryWriteError, clearWriteError } = useDiary();

  const hasAny = !!characterSaveError || !!diaryWriteError;
  if (!hasAny) return null;

  return (
    <ul className="mt-3 space-y-2" aria-live="polite" aria-atomic="false">
      {characterSaveError && <Notice message={characterSaveError} onClose={clearSaveError} />}
      {diaryWriteError && <Notice message={diaryWriteError} onClose={clearWriteError} />}
    </ul>
  );
}
