"use client";

// My World — 오늘 만든 작품(카드 UI). 이미지 Grid 자리 + Empty State.
// 향후 연결: images prop 에 오늘 생성한 창작물 썸네일 URL 배열을 넣어 Grid 렌더.
export default function CreationsCard({ images = [] }: { images?: string[] }) {
  return (
    <section className="rounded-3xl border border-stone-100 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="mb-3 text-[15px] font-extrabold text-stone-900 dark:text-white">오늘 만든 작품</h2>
      {images.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
          <span className="text-3xl">🎨</span>
          <p className="text-[13px] font-medium text-stone-400 dark:text-stone-500">아직 만든 작품이 없습니다.</p>
        </div>
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
