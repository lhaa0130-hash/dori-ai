"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { TEXTS } from "@/constants/texts";

interface VisitorInfo {
  ip: string;
  country: string;
  region: string;
  city: string;
  timezone: string;
  timestamp: string;
}

export default function AdminVisitorsList() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [visitors, setVisitors] = useState<VisitorInfo[]>([]);
  const [filter, setFilter] = useState<"all" | "today" | "week" | "month">("today");

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    
    const updateVisitors = () => {
      const visitorsList: VisitorInfo[] = JSON.parse(
        localStorage.getItem("dori_visitors_list") || "[]"
      );
      
      const now = new Date();
      let filtered = visitorsList;
      
      if (filter === "today") {
        const today = now.toISOString().split("T")[0];
        filtered = visitorsList.filter(v => {
          const visitorDate = new Date(v.timestamp).toISOString().split("T")[0];
          return visitorDate === today;
        });
      } else if (filter === "week") {
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        filtered = visitorsList.filter(v => new Date(v.timestamp) >= weekAgo);
      } else if (filter === "month") {
        const monthAgo = new Date(now);
        monthAgo.setMonth(now.getMonth() - 1);
        filtered = visitorsList.filter(v => new Date(v.timestamp) >= monthAgo);
      }
      
      // 최신순 정렬
      filtered.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      setVisitors(filtered);
    };
    
    updateVisitors();
    const intervalId = setInterval(updateVisitors, 5000);
    
    return () => clearInterval(intervalId);
  }, [mounted, filter]);

  const isDark = mounted && theme === 'dark';

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getLocationString = (visitor: VisitorInfo) => {
    const parts = [visitor.country, visitor.region, visitor.city].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "알 수 없음";
  };

  const btnClass = (active: boolean) => 
    `px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
      active 
        ? "bg-blue-500 text-white" 
        : "bg-gray-100 dark:bg-white/10 text-gray-500 hover:bg-gray-200 dark:hover:bg-white/20"
    }`;

  return (
    <div 
      className="p-6 rounded-[1.5rem] border shadow-sm"
      style={{ 
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#ffffff',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
      }}
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: isDark ? '#ffffff' : '#1d1d1f' }}>
          👥 방문자 목록 {filter === "today" && `(오늘: ${visitors.length}명)`}
        </h3>
        <div className="flex gap-2">
          <button onClick={() => setFilter("all")} className={btnClass(filter === "all")}>전체</button>
          <button onClick={() => setFilter("today")} className={btnClass(filter === "today")}>오늘</button>
          <button onClick={() => setFilter("week")} className={btnClass(filter === "week")}>주간</button>
          <button onClick={() => setFilter("month")} className={btnClass(filter === "month")}>월간</button>
        </div>
      </div>

      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {visitors.length === 0 ? (
          <div className="text-center py-8" style={{ color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }}>
            방문자 정보가 없습니다.
          </div>
        ) : (
          visitors.map((visitor, idx) => (
            <div
              key={`${visitor.ip}-${visitor.timestamp}-${idx}`}
              className="p-4 rounded-xl transition-all hover:scale-[1.01]"
              style={{
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
              }}
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold" style={{ color: isDark ? '#ffffff' : '#1d1d1f' }}>
                      {visitor.ip}
                    </span>
                    <span 
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                        color: isDark ? '#60a5fa' : '#2563eb',
                      }}
                    >
                      {visitor.country}
                    </span>
                  </div>
                  <div className="text-sm" style={{ color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' }}>
                    {getLocationString(visitor)}
                  </div>
                </div>
                <div className="text-xs text-right" style={{ color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }}>
                  {formatDate(visitor.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

