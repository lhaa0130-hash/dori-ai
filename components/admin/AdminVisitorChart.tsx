"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { TEXTS } from "@/constants/texts";

// Recharts를 동적 임포트로 로드 (코드 스플리팅)
const AreaChart = dynamic(
  () => import("recharts").then((mod) => mod.AreaChart),
  { ssr: false }
);
const Area = dynamic(
  () => import("recharts").then((mod) => mod.Area),
  { ssr: false }
);
const XAxis = dynamic(
  () => import("recharts").then((mod) => mod.XAxis),
  { ssr: false }
);
const YAxis = dynamic(
  () => import("recharts").then((mod) => mod.YAxis),
  { ssr: false }
);
const CartesianGrid = dynamic(
  () => import("recharts").then((mod) => mod.CartesianGrid),
  { ssr: false }
);
const Tooltip = dynamic(
  () => import("recharts").then((mod) => mod.Tooltip),
  { ssr: false }
);
const ResponsiveContainer = dynamic(
  () => import("recharts").then((mod) => mod.ResponsiveContainer),
  { ssr: false }
);

type Period = "daily" | "weekly" | "monthly" | "yearly";

export default function AdminVisitorChart() {
  const t = TEXTS.admin.chart;
  const tTitle = TEXTS.admin.sections.visitorChart;

  const [period, setPeriod] = useState<Period>("daily");
  const [data, setData] = useState<{ name: string; count: number }[]>([]);

  useEffect(() => {
    // LocalStorage에서 히스토리 데이터 가져오기
    const history = JSON.parse(localStorage.getItem("dori_visitor_history") || "{}");
    
    // 차트용 데이터 가공
    const chartData = processData(history, period);
    setData(chartData);
  }, [period]);

  // 데이터 가공 로직
  const processData = (history: Record<string, number>, period: Period) => {
    const today = new Date();
    const result = [];

    if (period === "daily") {
      // 최근 7일 데이터 생성 (데이터 없으면 0으로 채움)
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const key = d.toISOString().split("T")[0]; // YYYY-MM-DD
        result.push({
          name: d.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' }), // 5/20
          count: history[key] || 0
        });
      }
    } else if (period === "weekly") {
      // 최근 4주 데이터 생성
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - (i * 7) - (today.getDay() || 7) + 1); // 월요일 기준
        
        let weekCount = 0;
        for (let j = 0; j < 7; j++) {
          const d = new Date(weekStart);
          d.setDate(weekStart.getDate() + j);
          const key = d.toISOString().split("T")[0];
          weekCount += history[key] || 0;
        }
        
        const weekLabel = i === 0 
          ? '이번주' 
          : `${weekStart.getMonth() + 1}/${weekStart.getDate()}주`;
        result.push({ name: weekLabel, count: weekCount });
      }
    } else if (period === "monthly") {
      // 최근 6개월 데이터 생성
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
        
        let monthCount = 0;
        for (const [dateStr, count] of Object.entries(history)) {
          if (dateStr.startsWith(monthKey)) {
            monthCount += count;
          }
        }
        
        result.push({
          name: `${monthDate.getMonth() + 1}월`,
          count: monthCount
        });
      }
    } else if (period === "yearly") {
      // 최근 5년 데이터 생성
      const currentYear = today.getFullYear();
      for (let i = 4; i >= 0; i--) {
        const year = currentYear - i;
        let yearCount = 0;
        
        for (const [dateStr, count] of Object.entries(history)) {
          if (dateStr.startsWith(String(year))) {
            yearCount += count;
          }
        }
        
        result.push({
          name: `${year}년`,
          count: yearCount
        });
      }
    }

    return result;
  };

  const btnClass = (active: boolean) => 
    `px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
      active 
        ? "bg-blue-500 text-white" 
        : "bg-gray-100 dark:bg-white/10 text-gray-500 hover:bg-gray-200 dark:hover:bg-white/20"
    }`;

  return (
    <div 
      className="p-6 rounded-[1.5rem] border shadow-sm h-[400px] flex flex-col"
      style={{ 
        backgroundColor: 'var(--card-bg)', 
        borderColor: 'var(--card-border)', 
        color: 'var(--text-main)' 
      }}
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          📈 {tTitle.ko}
        </h3>
        <div className="flex gap-2">
          <button onClick={() => setPeriod("daily")} className={btnClass(period === "daily")}>{t.daily.ko}</button>
          <button onClick={() => setPeriod("weekly")} className={btnClass(period === "weekly")}>{t.weekly.ko}</button>
          <button onClick={() => setPeriod("monthly")} className={btnClass(period === "monthly")}>{t.monthly.ko}</button>
          <button onClick={() => setPeriod("yearly")} className={btnClass(period === "yearly")}>{t.yearly.ko}</button>
        </div>
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--card-border)" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'var(--text-sub)', fontSize: 12 }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'var(--text-sub)', fontSize: 12 }} 
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--card-bg)', 
                borderColor: 'var(--card-border)', 
                borderRadius: '12px',
                color: 'var(--text-main)'
              }}
              itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
            />
            <Area 
              type="monotone" 
              dataKey="count" 
              stroke="#3b82f6" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorCount)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}