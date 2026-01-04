"use client";

import { getTodayDateKey } from "./missions";

/**
 * 오늘의 미션 진행도 가져오기
 */
export function getMissionProgress(missionCode: string): number {
  const todayKey = getTodayDateKey();
  const key = `mission_progress_${missionCode}_${todayKey}`;
  const progress = localStorage.getItem(key);
  return progress ? parseInt(progress, 10) : 0;
}

/**
 * 미션 진행도 증가
 */
export function incrementMissionProgress(missionCode: string, amount: number = 1): number {
  const todayKey = getTodayDateKey();
  const key = `mission_progress_${missionCode}_${todayKey}`;
  const current = getMissionProgress(missionCode);
  const newProgress = current + amount;
  localStorage.setItem(key, newProgress.toString());
  return newProgress;
}

/**
 * 미션 진행도 리셋 (날짜 변경 시)
 */
export function resetMissionProgress(missionCode: string): void {
  const todayKey = getTodayDateKey();
  const key = `mission_progress_${missionCode}_${todayKey}`;
  localStorage.setItem(key, "0");
}

/**
 * 댓글 작성 카운트 증가 및 미션 완료 체크
 */
export async function handleCommentMission(): Promise<void> {
  const progress = incrementMissionProgress("WRITE_COMMENT_3");
  
  // 3개 이상 작성했고 아직 완료하지 않았다면
  if (progress >= 3) {
    const todayKey = getTodayDateKey();
    const completedKey = `mission_completed_WRITE_COMMENT_3_${todayKey}`;
    
    if (!localStorage.getItem(completedKey)) {
      const res = await fetch("/api/missions/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ missionCode: "WRITE_COMMENT_3" }),
      });
      
      if (res.ok) {
        localStorage.setItem(completedKey, "true");
      }
    }
  }
}

/**
 * 글 쓰기 미션 완료 처리
 */
export async function handlePostMission(): Promise<void> {
  const todayKey = getTodayDateKey();
  const completedKey = `mission_completed_WRITE_POST_1_${todayKey}`;
  
  if (!localStorage.getItem(completedKey)) {
    const res = await fetch("/api/missions/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ missionCode: "WRITE_POST_1" }),
    });
    
    if (res.ok) {
      localStorage.setItem(completedKey, "true");
    }
  }
}

