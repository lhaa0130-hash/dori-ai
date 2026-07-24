"use client";

// My World — 업적(카드 UI). 잠긴 업적 아이콘 표시.
// 향후 연결: unlocked prop 으로 해금 여부/아이콘/이름을 실제 업적 데이터에 연결.
interface Achievement {
  id: string;
  emoji: string;
  label: string;
  unlocked?: boolean;
}

const PLACEHOLDER: Achievement[] = [
  { id: "first-step", emoji: "👣", label: "첫걸음" },
  { id: "creator", emoji: "🎨", label: "창작가" },
  { id: "streak-7", emoji: "🔥", label: "7일 연속" },
  { id: "explorer", emoji: "🧭", label: "탐험가" },
  { id: "collector", emoji: "🏆", label: "수집가" },
  { id: "friend", emoji: "🤝", label: "친구" },
];

export default function AchievementsCard({ items = PLACEHOLDER }: { items?: Achievement[] }) {
  return (
    <section className="rounded-3xl border border-stone-100 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="mb-3 text-[15px] font-extrabold text-stone-900 dark:text-white">업적</h2>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {items.map((a) => (
          <div key={a.id} className="flex flex-col items-center gap-1.5">
            <div
              className={`flex aspect-square w-full items-center justify-center rounded-2xl text-2xl ${
                a.unlocked
                  ? "bg-[#F9954E]/15"
                  : "bg-stone-100 grayscale dark:bg-zinc-800"
              }`}
            >
              <span className={a.unlocked ? "" : "opacity-40"}>{a.unlocked ? a.emoji : "🔒"}</span>
            </div>
            <span className="text-center text-[10px] font-medium text-stone-400 dark:text-stone-500">{a.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
