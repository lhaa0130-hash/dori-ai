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
    <section className="rounded-3xl border border-stone-100 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="mb-3 text-[15px] font-extrabold text-stone-900 dark:text-white">최근 활동</h2>
      {activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
          <span className="text-3xl">🌱</span>
          <p className="text-[13px] font-medium text-stone-400 dark:text-stone-500">아직 활동이 없습니다.</p>
        </div>
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
