"use client";

export default function SpeechBubble({ speech, characterName }: { speech: string | null; characterName: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={`pointer-events-none absolute left-1/2 top-3 z-50 w-[min(82%,22rem)] -translate-x-1/2 transition-all duration-200 ${speech ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"}`}
    >
      <div className="relative rounded-2xl border border-white/80 bg-white/95 px-4 py-2.5 text-center text-[13px] font-bold text-stone-700 shadow-lg backdrop-blur-sm dark:border-zinc-700 dark:bg-zinc-900/95 dark:text-zinc-100">
        <span className="sr-only">{characterName}의 말: </span>
        {speech || " "}
        <span className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-white/80 bg-white/95 dark:border-zinc-700 dark:bg-zinc-900/95" aria-hidden />
      </div>
    </div>
  );
}
