"use client";

// My World — 최근 활동(카드 UI). 데이터 없으면 빈 상태.
// 향후 연결: activities prop 에 실제 활동(피드·창작·출석 등) 배열을 넣어 목록 렌더.
export interface ActivityItem {
  id: string;
  icon: string;
  text: string;
  at?: string;
}

export default function RecentActivityCard({ activities = [] }: { activities?: ActivityItem[] }) {
  return (
    <section className="rounded-2xl bg-stone-50 p-4 dark:bg-zinc-900/60">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-[13px] font-extrabold text-stone-900 dark:text-white">최근 활동</h3>
        {activities.length === 0 && (
          <span className="flex-none rounded-full bg-stone-200/70 px-2 py-0.5 text-[10px] font-black text-stone-500 dark:bg-zinc-800 dark:text-zinc-400">
            준비 중
          </span>
        )}
      </div>
      {activities.length === 0 ? (
        <p className="break-keep text-[12px] font-medium text-stone-500 dark:text-zinc-400">
          피드·창작·출석 활동을 여기 모아 보여줄 예정이에요. 지금은 연결된 활동이 없어요.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {activities.map((a) => (
            <li key={a.id} className="flex items-center gap-3">
              <span className="text-lg">{a.icon}</span>
              <span className="flex-1 text-[13px] text-stone-700 dark:text-stone-300">{a.text}</span>
              {a.at && <span className="text-[11px] text-stone-400">{a.at}</span>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
