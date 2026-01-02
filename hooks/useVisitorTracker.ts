"use client";

import { useEffect } from "react";

interface VisitorInfo {
  ip: string;
  country: string;
  region: string;
  city: string;
  timezone: string;
  timestamp: string;
}

export default function useVisitorTracker() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const TODAY_KEY = "dori_visitor_date";
    const DAILY_KEY = "dori_daily_visitors";
    const TOTAL_KEY = "dori_total_visitors";
    const HISTORY_KEY = "dori_visitor_history"; 
    const VISITORS_KEY = "dori_visitors_list"; // 방문자 목록
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

      // 방문자 정보 가져오기 및 저장
      const visitorsList: VisitorInfo[] = JSON.parse(localStorage.getItem(VISITORS_KEY) || "[]");
      const timestamp = new Date().toISOString();
      const todayCount = history[today] || 0;
      
      // 기본 방문자 정보 (API 호출 실패 시에도 사용)
      const defaultInfo: VisitorInfo = {
        ip: "알 수 없음",
        country: "알 수 없음",
        region: "알 수 없음",
        city: "알 수 없음",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Seoul",
        timestamp: timestamp
      };
      
      fetch("/api/visitor/info")
        .then(res => res.json())
        .then((info: VisitorInfo) => {
          // API에서 받은 정보 사용
          const visitorInfo: VisitorInfo = {
            ip: info.ip || defaultInfo.ip,
            country: info.country || defaultInfo.country,
            region: info.region || defaultInfo.region,
            city: info.city || defaultInfo.city,
            timezone: info.timezone || defaultInfo.timezone,
            timestamp: timestamp
          };
          
          // 중복 체크 (같은 IP가 오늘 이미 방문했는지)
          const todayVisitors = visitorsList.filter(v => {
            try {
              const visitorDate = new Date(v.timestamp).toISOString().split("T")[0];
              return visitorDate === today && v.ip === visitorInfo.ip;
            } catch (e) {
              return false;
            }
          });
          
          // 오늘 같은 IP로 방문한 기록이 없으면 추가
          if (todayVisitors.length === 0) {
            visitorsList.push(visitorInfo);
            
            // 최대 1000명까지만 저장 (성능 고려)
            if (visitorsList.length > 1000) {
              visitorsList.shift(); // 가장 오래된 것 제거
            }
            
            localStorage.setItem(VISITORS_KEY, JSON.stringify(visitorsList));
          }
        })
        .catch(err => {
          console.error("Failed to get visitor info:", err);
          // API 호출 실패 시에도 기본 정보로 저장 (통계 일치를 위해)
          const todayVisitors = visitorsList.filter(v => {
            try {
              const visitorDate = new Date(v.timestamp).toISOString().split("T")[0];
              return visitorDate === today;
            } catch (e) {
              return false;
            }
          });
          
          // 오늘 방문자 수가 히스토리와 맞지 않으면 기본 정보로 추가
          if (todayVisitors.length < todayCount) {
            const fallbackInfo: VisitorInfo = {
              ...defaultInfo,
              ip: `방문자-${todayVisitors.length + 1}`,
            };
            visitorsList.push(fallbackInfo);
            
            if (visitorsList.length > 1000) {
              visitorsList.shift();
            }
            
            localStorage.setItem(VISITORS_KEY, JSON.stringify(visitorsList));
          }
        });

      // "이 브라우저 탭에서는 이미 셌음" 표시
      sessionStorage.setItem(SESSION_KEY, "true");
    }
  }, []);
}