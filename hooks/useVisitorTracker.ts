"use client";

import { useEffect } from "react";

export default function useVisitorTracker() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const TODAY_KEY = "dori_visitor_date";
    const DAILY_KEY = "dori_daily_visitors";
    const TOTAL_KEY = "dori_total_visitors";
    const HISTORY_KEY = "dori_visitor_history"; 
    const SESSION_KEY = "dori_session_counted";

    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const lastDate = localStorage.getItem(TODAY_KEY);
    const isCounted = sessionStorage.getItem(SESSION_KEY);

    // 1. 날짜 변경 체크 및 리셋
    if (lastDate !== today) {
      localStorage.setItem(TODAY_KEY, today);
      localStorage.setItem(DAILY_KEY, "0");
      sessionStorage.removeItem(SESSION_KEY);
    }

    // 2. 카운팅 로직 (세션당 1회)
    if (!isCounted) {
      const currentDaily = parseInt(localStorage.getItem(DAILY_KEY) || "0", 10);
      const currentTotal = parseInt(localStorage.getItem(TOTAL_KEY) || "0", 10); 

      localStorage.setItem(DAILY_KEY, (currentDaily + 1).toString());
      localStorage.setItem(TOTAL_KEY, (currentTotal + 1).toString());

      // 📊 그래프용 히스토리 저장
      const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "{}");
      history[today] = (history[today] || 0) + 1;
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));

      // 세션 마킹
      sessionStorage.setItem(SESSION_KEY, "true");
    }
  }, []);
}