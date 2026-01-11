"use client";

import { getTodayDateKey } from "./missions";

/**
 * 오늘의 미션 진행도 가져오기
 */
export function getMissionProgress(missionCode: string): number {
  if (typeof window === 'undefined') return 0;
  const todayKey = getTodayDateKey();
  const key = `mission_progress_${missionCode}_${todayKey}`;
  const progress = localStorage.getItem(key);
  return progress ? parseInt(progress, 10) : 0;
}

/**
 * 미션 진행도 증가
 */
export function incrementMissionProgress(missionCode: string, amount: number = 1): number {
  if (typeof window === 'undefined') return 0;
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
  if (typeof window === 'undefined') return;
  const todayKey = getTodayDateKey();
  const key = `mission_progress_${missionCode}_${todayKey}`;
  localStorage.setItem(key, "0");
}

/**
 * 출석체크 미션 완료 처리
 */
export async function handleCheckinMission(): Promise<void> {
  if (typeof window === 'undefined') return;
  
  const todayKey = getTodayDateKey();
  const key = `mission_checkin_${todayKey}`;
  
  // 오늘 이미 출석체크를 했다면 무시
  if (localStorage.getItem(key) === 'true') return;
  
  // 출석체크 완료 표시
  localStorage.setItem(key, 'true');
  
  // DORI Score 증가 (미션 완료는 스코어로)
  await addDoriScore(10, '출석체크 미션 완료');
}

/**
 * 글 작성 미션 진행도 업데이트
 */
export async function handlePostMission(): Promise<void> {
  if (typeof window === 'undefined') return;
  
  const progress = incrementMissionProgress('post');
  const totalNeeded = 3;
  
  // 글 작성 시마다 DORI Score 증가 (글 작성은 스코어로)
  await addDoriScore(10, '글 작성');
  
  // 3개 모두 완료했는지 확인 (UI 업데이트용)
  if (progress >= totalNeeded) {
    const todayKey = getTodayDateKey();
    const completedKey = `mission_completed_post_${todayKey}`;
    localStorage.setItem(completedKey, 'true');
    // 미션 완료 보너스 스코어
    await addDoriScore(30, '글 3개 작성 미션 완료');
  }
}

/**
 * 댓글 작성 미션 진행도 업데이트
 */
export async function handleCommentMission(): Promise<void> {
  if (typeof window === 'undefined') return;
  
  const progress = incrementMissionProgress('comment');
  const totalNeeded = 5;
  
  // 댓글 작성 시마다 DORI Score 증가 (댓글 작성은 스코어로)
  await addDoriScore(3, '댓글 작성');
  
  // 5개 모두 완료했는지 확인 (UI 업데이트용)
  if (progress >= totalNeeded) {
    const todayKey = getTodayDateKey();
    const completedKey = `mission_completed_comment_${todayKey}`;
    localStorage.setItem(completedKey, 'true');
    // 미션 완료 보너스 스코어
    await addDoriScore(10, '댓글 5회 작성 미션 완료');
  }
}

/**
 * 좋아요 미션 진행도 업데이트
 */
export async function handleLikeMission(): Promise<void> {
  if (typeof window === 'undefined') return;
  
  const progress = incrementMissionProgress('like');
  const totalNeeded = 10;
  
  // 좋아요는 미션 진행도만 업데이트 (포인트는 받는 사람이 받음)
  
  // 10개 모두 완료했는지 확인 (UI 업데이트용)
  if (progress >= totalNeeded) {
    const todayKey = getTodayDateKey();
    const completedKey = `mission_completed_like_${todayKey}`;
    localStorage.setItem(completedKey, 'true');
    // 미션 완료 보너스 스코어
    await addDoriScore(10, '좋아요 10개 미션 완료');
  }
}

/**
 * 사이트 공유 미션 완료 처리
 */
export async function handleShareMission(): Promise<void> {
  if (typeof window === 'undefined') return;
  
  const todayKey = getTodayDateKey();
  const key = `mission_share_${todayKey}`;
  
  // 오늘 이미 공유했다면 무시
  if (localStorage.getItem(key) === 'true') return;
  
  // 공유 완료 표시
  localStorage.setItem(key, 'true');
  
  // DORI Score 증가 (미션 완료는 스코어로)
  await addDoriScore(10, '사이트 공유 미션 완료');
}

/**
 * DORI Score 추가 (미션 완료 시)
 */
async function addDoriScore(score: number, reason: string): Promise<void> {
  if (typeof window === 'undefined') return;
  
  try {
    // 미션 업데이트 이벤트 발생
    window.dispatchEvent(new CustomEvent('missionUpdate'));
    
    // DORI Score 업데이트 이벤트 발생
    window.dispatchEvent(new CustomEvent('doriScoreAdded', { 
      detail: { score, reason } 
    }));
    
    // 프로필 업데이트 이벤트 발생 (프로필이 자동으로 재계산됨)
    window.dispatchEvent(new CustomEvent('profileUpdated'));
  } catch (error) {
    console.error('DORI Score 적립 오류:', error);
  }
}

/**
 * 포인트 추가 (좋아요 받을 때)
 */
export async function addPoints(points: number, reason: string): Promise<void> {
  if (typeof window === 'undefined') return;
  
  try {
    // 포인트 추가 이벤트 발생
    window.dispatchEvent(new CustomEvent('pointsAdded', { 
      detail: { points, reason } 
    }));
    
    // 프로필 업데이트 이벤트 발생
    window.dispatchEvent(new CustomEvent('profileUpdated'));
  } catch (error) {
    console.error('포인트 적립 오류:', error);
  }
}
