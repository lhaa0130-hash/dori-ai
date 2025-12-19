"use client";

import { TEXTS } from "@/constants/texts";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface AdminStatsProps {
  stats: {
    community: number;
    suggestions: number;
    academy: number;
    market: number;
    todayVisitors: number;
    totalVisitors: number;
  };
}

export default function AdminStats({ stats }: AdminStatsProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const t = TEXTS.admin.stats;

  useEffect(() => setMounted(true), []);

  const isDark = mounted && theme === 'dark';

  const statItems = [
    { title: t.todayVisitors.ko, count: stats.todayVisitors, icon: "🔥", gradient: "from-orange-500 to-red-500" },
    { title: t.totalVisitors.ko, count: stats.totalVisitors, icon: "👥", gradient: "from-indigo-500 to-purple-500" },
    { title: t.communityCount.ko, count: stats.community, icon: "💬", gradient: "from-blue-500 to-cyan-500" },
    { title: t.suggestionsCount.ko, count: stats.suggestions, icon: "📫", gradient: "from-red-500 to-pink-500" },
    { title: t.academyCount.ko, count: stats.academy, icon: "🎓", gradient: "from-green-500 to-emerald-500" },
    { title: t.marketCount.ko, count: stats.market, icon: "🛒", gradient: "from-purple-500 to-violet-500" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      {statItems.map((item, idx) => (
        <div 
          key={idx} 
          className="group relative p-6 rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02]"
          style={{
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#ffffff',
            boxShadow: isDark ? '0 4px 6px rgba(0, 0, 0, 0.1)' : '0 4px 6px rgba(0, 0, 0, 0.02)',
          }}
        >
          <div 
            className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 bg-gradient-to-br ${item.gradient}`}
          />
          
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-4">
              <span 
                className="text-sm font-bold"
                style={{ color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' }}
              >
                {item.title}
              </span>
              <span className="text-2xl">{item.icon}</span>
            </div>
            <div 
              className={`text-3xl font-extrabold bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent`}
            >
              {item.count.toLocaleString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}