"use client";

// My World — 오늘 만든 작품(카드 UI). 이미지 Grid 자리 + Empty State.
// 향후 연결: images prop 에 오늘 생성한 창작물 썸네일 URL 배열을 넣어 Grid 렌더.
export default function CreationsCard({ images = [] }: { images?: string[] }) {
  return (
    <section className="rounded-2xl bg-stone-50 p-4 dark:bg-zinc-900/60">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-[13px] font-extrabold text-stone-900 dark:text-white">오늘 만든 작품</h3>
        {images.length === 0 && (
          <span className="flex-none rounded-full bg-stone-200/70 px-2 py-0.5 text-[10px] font-black text-stone-500 dark:bg-zinc-800 dark:text-zinc-400">
            준비 중
          </span>
        )}
      </div>
      {images.length === 0 ? (
        <p className="break-keep text-[12px] font-medium text-stone-500 dark:text-zinc-400">
          스튜디오에서 만든 이미지를 여기 모아 보여줄 예정이에요.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {images.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={src} alt="" className="aspect-square w-full rounded-xl object-cover" />
          ))}
        </div>
      )}
    </section>
  );
}
