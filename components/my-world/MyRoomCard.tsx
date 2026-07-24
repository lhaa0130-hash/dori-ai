"use client";

// My World — 내 방(카드 UI, 준비중). 향후 연결: 방 썸네일/편집 진입.
export default function MyRoomCard() {
  return (
    <section className="rounded-3xl border border-stone-100 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[15px] font-extrabold text-stone-900 dark:text-white">내 방</h2>
        <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[11px] font-bold text-stone-400 dark:bg-zinc-800 dark:text-stone-500">준비중</span>
      </div>
      {/* 썸네일 자리 */}
      <div className="flex aspect-[16/10] items-center justify-center rounded-2xl border border-dashed border-stone-200 bg-stone-50 dark:border-zinc-700 dark:bg-zinc-900/60">
        <div className="flex flex-col items-center gap-1.5 text-center">
          <span className="text-3xl">🏠</span>
          <span className="text-[12px] font-medium text-stone-400 dark:text-stone-500">준비중</span>
        </div>
      </div>
    </section>
  );
}
