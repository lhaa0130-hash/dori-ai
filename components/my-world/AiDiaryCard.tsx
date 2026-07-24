"use client";

// My World — AI 일기(카드 UI, 준비중). 향후 연결: 서버 생성 일기 요약을 표시.
export default function AiDiaryCard() {
  return (
    <section className="relative rounded-3xl border border-stone-100 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-[15px] font-extrabold text-stone-900 dark:text-white">AI 일기</h2>
        <span className="rounded-full bg-[#F9954E]/15 px-2.5 py-0.5 text-[11px] font-bold text-[#F9954E]">준비중</span>
      </div>
      <div className="flex items-center gap-3 rounded-2xl bg-stone-50 p-4 dark:bg-zinc-900/60">
        <span className="text-2xl">📖</span>
        <p className="text-[13px] leading-relaxed text-stone-500 dark:text-stone-400">
          AI가 하루를 기억하고 있습니다.
        </p>
      </div>
    </section>
  );
}
