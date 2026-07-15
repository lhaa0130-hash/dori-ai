// 토스 풍 미니멀 히어로 — 라이브 도트 + 절제된 슬로건. (locale-aware)
export default function Hero({ locale = "ko" }: { locale?: "ko" | "en" }) {
  const en = locale === "en";
  return (
    <section className="pt-9 pb-7">
      <div className="flex items-center gap-1.5 mb-3.5 toss-fade-line">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F9954E] opacity-60" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#F9954E]" />
        </span>
        <span className="text-[11px] font-bold tracking-wide text-stone-400 dark:text-stone-500">{en ? "Create · Learn · Master with AI" : "AI로 만들고 · 배우고 · 익히고"}</span>
      </div>
      <h1 className="text-[23px] sm:text-[30px] font-extrabold tracking-tight leading-[1.2] text-stone-950 dark:text-white break-keep toss-fade-line toss-delay-0">
        {en ? (
          <>Create, learn &amp; <span className="text-[#F9954E]">master with AI.</span></>
        ) : (
          <>AI로 만들고, 배우고, <span className="text-[#F9954E]">익히고.</span></>
        )}
      </h1>
      <p className="mt-2.5 text-[13px] sm:text-[15px] font-medium text-stone-500 dark:text-stone-400 break-keep toss-fade-line toss-delay-0">
        {en ? (
          <>All your scattered AI in one place. Everything, in <span className="font-bold text-[#F9954E]">illo.</span><span className="text-stone-400 dark:text-stone-500"> (illo = bring all your work into one)</span></>
        ) : (
          <>흩어진 AI를 한 곳에서. 모든 일을, <span className="font-bold text-[#F9954E]">일로.</span><span className="text-stone-400 dark:text-stone-500"> (일로 = 모든 일을 하나로, 이리로)</span></>
        )}
      </p>
    </section>
  );
}
