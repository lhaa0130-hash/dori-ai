const STATS = [
  { number: "130개+", label: "AI 기사" },
  { number: "200개+", label: "AI 도구" },
  { number: "20개+",  label: "미니게임" },
];

export default function StatsStrip() {
  return (
    <div className="border-y border-neutral-100 dark:border-zinc-900 py-8 mb-2">
      <div className="grid grid-cols-3 divide-x divide-neutral-100 dark:divide-zinc-900">
        {STATS.map((s) => (
          <div key={s.label} className="flex flex-col items-center gap-1.5">
            <span className="text-[30px] sm:text-[36px] font-black text-neutral-950 dark:text-white tracking-[-0.04em] leading-none">
              {s.number}
            </span>
            <span className="text-[12px] text-neutral-400 font-medium">
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
