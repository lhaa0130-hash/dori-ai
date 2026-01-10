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
  
  // 포인트 적립 (10포인트)
  await addPoints(10, '출석체크');
}

/**
 * 글 작성 미션 진행도 업데이트
 */
export async function handlePostMission(): Promise<void> {
  if (typeof window === 'undefined') return;
  
  const progress = incrementMissionProgress('post');
  const totalNeeded = 3;
  
  // 글 작성 시마다 포인트 적립 (각 10포인트)
  await addPoints(10, '글 작성');
  
  // 3개 모두 완료했는지 확인 (UI 업데이트용)
  if (progress >= totalNeeded) {
    const todayKey = getTodayDateKey();
    const completedKey = `mission_completed_post_${todayKey}`;
    localStorage.setItem(completedKey, 'true');
  }
}

/**
 * 댓글 작성 미션 진행도 업데이트
 */
export async function handleCommentMission(): Promise<void> {
  if (typeof window === 'undefined') return;
  
  const progress = incrementMissionProgress('comment');
  const totalNeeded = 5;
  
  // 댓글 작성 시마다 포인트 적립 (각 2포인트)
  await addPoints(2, '댓글 작성');
  
  // 5개 모두 완료했는지 확인 (UI 업데이트용)
  if (progress >= totalNeeded) {
    const todayKey = getTodayDateKey();
    const completedKey = `mission_completed_comment_${todayKey}`;
    localStorage.setItem(completedKey, 'true');
  }
}

/**
 * 좋아요 미션 진행도 업데이트
 */
export async function handleLikeMission(): Promise<void> {
  if (typeof window === 'undefined') return;
  
  const progress = incrementMissionProgress('like');
  const totalNeeded = 10;
  
  // 좋아요 시마다 포인트 적립 (각 1포인트)
  await addPoints(1, '좋아요');
  
  // 10개 모두 완료했는지 확인 (UI 업데이트용)
  if (progress >= totalNeeded) {
    const todayKey = getTodayDateKey();
    const completedKey = `mission_completed_like_${todayKey}`;
    localStorage.setItem(completedKey, 'true');
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
  
  // 포인트 적립 (10포인트)
  await addPoints(10, '사이트 공유');
}

/**
 * 포인트 추가
 */
async function addPoints(points: number, reason: string): Promise<void> {
  if (typeof window === 'undefined') return;
  
  try {
    // 미션 업데이트 이벤트 발생
    window.dispatchEvent(new CustomEvent('missionUpdate'));
    
    // 포인트 추가 이벤트 발생
    window.dispatchEvent(new CustomEvent('pointsAdded', { 
      detail: { points, reason } 
    }));
    
    // 서버에 포인트 업데이트 요청 (선택적)
    try {
      const response = await fetch('/api/user/points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points, reason }),
      });
      
      if (response.ok) {
        const data = await response.json();
        // 포인트 업데이트 이벤트 발생
        window.dispatchEvent(new CustomEvent('pointsUpdated', { 
          detail: { points: data.points } 
        }));
      }
    } catch (apiError) {
      // API 호출 실패해도 로컬에서 포인트 업데이트는 진행
      console.error('포인트 API 오류:', apiError);
    }
  } catch (error) {
    console.error('포인트 적립 오류:', error);
  }
}
