const STATS = [
  { number: "130+", label: "AI 기사" },
  { number: "200+", label: "AI 도구" },
  { number: "20+",  label: "미니게임" },
];

export default function StatsStrip() {
  return (
    <div className="py-8 mb-2">
      <div className="grid grid-cols-3">
        {STATS.map((s, i) => (
          <div
            key={s.label}
            className={`flex flex-col items-center gap-1 ${i !== 0 ? "border-l border-neutral-100 dark:border-zinc-900" : ""}`}
          >
            <span className="text-[28px] font-extrabold text-neutral-950 dark:text-white tracking-tight leading-none">
              {s.number}
            </span>
            <span className="text-[11px] text-neutral-400 font-medium mt-0.5">
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
