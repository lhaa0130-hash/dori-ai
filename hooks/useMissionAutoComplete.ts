"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { DAILY_MISSIONS } from "@/constants/missions";

/**
 * 미션 자동 완료 훅
 * - auto 타입: 첫 접속 시 자동 완료
 * - visit 타입: 특정 페이지 방문 시 완료
 * - timer 타입: 페이지에서 일정 시간 머물면 완료
 */
export function useMissionAutoComplete() {
  const { data: session } = useSession();
  const pathname = usePathname();

  useEffect(() => {
    if (!session?.user?.email) return;

    // auto 타입 미션 자동 완료 (출석 체크)
    const checkinMission = DAILY_MISSIONS.find(m => m.code === "DAILY_CHECKIN" && m.type === "auto");
    if (checkinMission) {
      const todayKey = new Date().toISOString().split("T")[0].replace(/-/g, "");
      const checkinKey = `mission_auto_${checkinMission.code}_${todayKey}`;
      
      // 오늘 이미 체크했는지 확인
      if (!localStorage.getItem(checkinKey)) {
        // 자동 완료 처리
        fetch("/api/missions/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ missionCode: checkinMission.code }),
        }).then(() => {
          localStorage.setItem(checkinKey, "true");
        }).catch(console.error);
      }
    }

    // visit 타입 미션 자동 완료
    const visitMissions = DAILY_MISSIONS.filter(m => m.type === "visit");
    for (const mission of visitMissions) {
      if (mission.meta?.path && pathname === mission.meta.path) {
        const todayKey = new Date().toISOString().split("T")[0].replace(/-/g, "");
        const visitKey = `mission_visit_${mission.code}_${todayKey}`;
        
        if (!localStorage.getItem(visitKey)) {
          fetch("/api/missions/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ missionCode: mission.code }),
          }).then(() => {
            localStorage.setItem(visitKey, "true");
          }).catch(console.error);
        }
      }
    }
  }, [session, pathname]);
}

/**
 * 타이머 기반 미션 완료 훅 (30초 읽기 등)
 */
export function useMissionTimer(missionCode: string, secondsRequired: number) {
  const { data: session } = useSession();
  const [startTime] = useState<number>(Date.now());
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!session?.user?.email || completed) return;

    const todayKey = new Date().toISOString().split("T")[0].replace(/-/g, "");
    const timerKey = `mission_timer_${missionCode}_${todayKey}`;
    
    // 이미 완료했는지 확인
    if (localStorage.getItem(timerKey)) {
      setCompleted(true);
      return;
    }

    // 타이머 설정
    const timer = setTimeout(() => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= secondsRequired * 1000) {
        fetch("/api/missions/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ missionCode }),
        }).then(() => {
          localStorage.setItem(timerKey, "true");
          setCompleted(true);
        }).catch(console.error);
      }
    }, secondsRequired * 1000);

    return () => clearTimeout(timer);
  }, [session, missionCode, secondsRequired, startTime, completed]);

  return { completed };
}

