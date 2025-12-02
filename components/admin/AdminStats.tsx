import { TEXTS } from "@/constants/texts";

interface AdminStatsProps {
  stats: {
    community: number;
    suggestions: number;
    academy: number;
    market: number;
    todayVisitors: number; // 👈 이 부분이 꼭 있어야 합니다!
    totalVisitors: number; // 👈 이 부분이 꼭 있어야 합니다!
  };
}

export default function AdminStats({ stats }: AdminStatsProps) {
  const t = TEXTS.admin.stats;

  const cardStyle = {
    backgroundColor: 'var(--card-bg)',
    borderColor: 'var(--card-border)',
    color: 'var(--text-main)',
  };

  const statItems = [
    // 1. 방문자 통계 (가장 중요하니까 맨 앞에)
    { title: t.todayVisitors.ko, count: stats.todayVisitors, icon: "🔥", color: "text-orange-500" },
    { title: t.totalVisitors.ko, count: stats.totalVisitors, icon: "👥", color: "text-indigo-500" },
    
    // 2. 콘텐츠 통계
    { title: t.communityCount.ko, count: stats.community, icon: "💬", color: "text-blue-500" },
    { title: t.suggestionsCount.ko, count: stats.suggestions, icon: "📫", color: "text-red-500" },
    { title: t.academyCount.ko, count: stats.academy, icon: "🎓", color: "text-green-500" },
    { title: t.marketCount.ko, count: stats.market, icon: "🛒", color: "text-purple-500" },
  ];

  return (
    // 6개 카드이므로 3열 그리드로 배치
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      {statItems.map((item, idx) => (
        <div key={idx} className="p-6 rounded-[1.5rem] border shadow-sm flex flex-col justify-between hover:-translate-y-1 transition-transform" style={cardStyle}>
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-bold opacity-60">{item.title}</span>
            <span className="text-2xl">{item.icon}</span>
          </div>
          <div className={`text-3xl font-extrabold ${item.color}`}>
            {item.count.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}