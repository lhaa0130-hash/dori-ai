"use client";

import { DAILY_MISSIONS } from "@/constants/missions";

/**
 * 미션 완료 처리 헬퍼 함수
 */
export async function completeMission(missionCode: string): Promise<boolean> {
  try {
    const res = await fetch("/api/missions/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ missionCode }),
    });
    const result = await res.json();
    return result.ok === true;
  } catch (error) {
    console.error("미션 완료 오류:", error);
    return false;
  }
}

/**
 * 오늘 이미 완료했는지 확인 (로컬 스토리지 기반)
 */
export function isMissionCompletedToday(missionCode: string): boolean {
  const todayKey = new Date().toISOString().split("T")[0].replace(/-/g, "");
  const key = `mission_${missionCode}_${todayKey}`;
  return localStorage.getItem(key) === "true";
}

/**
 * 미션 완료 표시 (로컬 스토리지)
 */
export function markMissionCompletedToday(missionCode: string): void {
  const todayKey = new Date().toISOString().split("T")[0].replace(/-/g, "");
  const key = `mission_${missionCode}_${todayKey}`;
  localStorage.setItem(key, "true");
}

/**
 * 액션 타입 미션 완료 (도구 저장 등)
 */
export async function completeActionMission(missionCode: string): Promise<void> {
  if (isMissionCompletedToday(missionCode)) return;
  
  const success = await completeMission(missionCode);
  if (success) {
    markMissionCompletedToday(missionCode);
  }
}

