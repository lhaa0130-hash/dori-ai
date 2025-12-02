import { TEXTS } from "@/constants/texts";

interface AdminStatsProps {
  stats: {
    community: number;
    suggestions: number;
    academy: number;
    market: number;
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
    { title: t.communityCount.ko, count: stats.community, icon: "💬", color: "text-blue-500" },
    { title: t.suggestionsCount.ko, count: stats.suggestions, icon: "📫", color: "text-red-500" },
    { title: t.academyCount.ko, count: stats.academy, icon: "🎓", color: "text-green-500" },
    { title: t.marketCount.ko, count: stats.market, icon: "🛒", color: "text-purple-500" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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