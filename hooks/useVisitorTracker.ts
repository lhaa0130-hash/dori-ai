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
    
    // 세션(탭 닫기 전) 기록 확인
    let isCounted = sessionStorage.getItem(SESSION_KEY);

    // 1. 날짜가 바뀌었으면? -> 오늘 방문자 0으로 리셋 & 세션 기록 무효화
    if (lastDate !== today) {
      localStorage.setItem(TODAY_KEY, today);
      localStorage.setItem(DAILY_KEY, "0");
      
      // 날짜가 다르면 "새로운 하루의 첫 방문"으로 쳐야 하므로 카운트 안 된 걸로 강제 변경
      sessionStorage.removeItem(SESSION_KEY);
      isCounted = null; 
    }

    // 2. 카운팅 로직 (오늘 아직 안 셌으면 +1)
    if (!isCounted) {
      const currentDaily = parseInt(localStorage.getItem(DAILY_KEY) || "0", 10);
      const currentTotal = parseInt(localStorage.getItem(TOTAL_KEY) || "0", 10); 

      // 숫자 증가
      localStorage.setItem(DAILY_KEY, (currentDaily + 1).toString());
      localStorage.setItem(TOTAL_KEY, (currentTotal + 1).toString());

      // 📊 그래프용 히스토리 저장
      const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "{}");
      history[today] = (history[today] || 0) + 1;
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));

      // "이 브라우저 탭에서는 이미 셌음" 표시
      sessionStorage.setItem(SESSION_KEY, "true");
    }
  }, []);
}