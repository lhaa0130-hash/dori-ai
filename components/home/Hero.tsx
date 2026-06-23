// 토스 풍 미니멀 히어로 — 라이브 도트 + 절제된 슬로건.
export default function Hero() {
  return (
    <section className="pt-9 pb-7">
      <div className="flex items-center gap-1.5 mb-3.5 toss-fade-line">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F9954E] opacity-60" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#F9954E]" />
        </span>
        <span className="text-[11px] font-bold tracking-wide text-neutral-400 dark:text-neutral-500">AI로 만들고 · 배우고 · 익히고</span>
      </div>
      <h1 className="text-[27px] sm:text-[33px] font-extrabold tracking-tight leading-[1.18] text-neutral-950 dark:text-white break-keep">
        <span className="block toss-fade-line toss-delay-0">AI로 만들고, 배우고,</span>
        <span className="block toss-fade-line toss-delay-1 text-[#F9954E]">매일 익숙해지는 곳.</span>
      </h1>
    </section>
  );
}
