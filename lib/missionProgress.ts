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
export async function handleCheckinMission(userEmail?: string): Promise<void> {
  if (typeof window === 'undefined') return;
  
  const todayKey = getTodayDateKey();
  const key = `mission_checkin_${todayKey}`;
  
  // 오늘 이미 출석체크를 했다면 무시
  if (localStorage.getItem(key) === 'true') {
    return;
  }
  
  // 출석체크 완료 표시
  localStorage.setItem(key, 'true');
  
  // DORI EXP 증가 (미션 완료는 경험치로)
  await addDoriExp(10, '출석체크 미션 완료', userEmail);
}

/**
 * 글 작성 미션 진행도 업데이트
 */
export async function handlePostMission(): Promise<void> {
  if (typeof window === 'undefined') return;
  
  const progress = incrementMissionProgress('post');
  const totalNeeded = 3;
  
  // 글 작성 시마다 DORI EXP 증가 (글 작성은 경험치로)
  await addDoriExp(10, '글 작성');
  
  // 3개 모두 완료했는지 확인 (UI 업데이트용)
  if (progress >= totalNeeded) {
    const todayKey = getTodayDateKey();
    const completedKey = `mission_completed_post_${todayKey}`;
    localStorage.setItem(completedKey, 'true');
    // 미션 완료 보너스 경험치
    await addDoriExp(30, '글 3개 작성 미션 완료');
  }
}

/**
 * 댓글 작성 미션 진행도 업데이트
 */
export async function handleCommentMission(): Promise<void> {
  if (typeof window === 'undefined') return;
  
  const progress = incrementMissionProgress('comment');
  const totalNeeded = 5;
  
  // 댓글 작성 시마다 DORI EXP 증가 (댓글 작성은 경험치로)
  await addDoriExp(3, '댓글 작성');
  
  // 5개 모두 완료했는지 확인 (UI 업데이트용)
  if (progress >= totalNeeded) {
    const todayKey = getTodayDateKey();
    const completedKey = `mission_completed_comment_${todayKey}`;
    localStorage.setItem(completedKey, 'true');
    // 미션 완료 보너스 경험치
    await addDoriExp(10, '댓글 5회 작성 미션 완료');
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
    // 미션 완료 보너스 경험치
    await addDoriExp(10, '좋아요 10개 미션 완료');
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
  
  // DORI EXP 증가 (미션 완료는 경험치로)
  await addDoriExp(10, '사이트 공유 미션 완료');
}

/**
 * DORI EXP 추가 (미션 완료 시)
 */
async function addDoriExp(exp: number, reason: string, userEmail?: string): Promise<void> {
  if (typeof window === 'undefined') return;
  
  try {
    // 사용자 이메일 찾기
    let email = userEmail;
    
    if (!email) {
      // localStorage에서 최근 사용자 이메일 찾기
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith('dori_profile_')) {
          email = key.replace('dori_profile_', '');
          break;
        }
      }
    }
    
    if (!email) {
      console.warn('사용자 이메일을 찾을 수 없어 경험치를 저장할 수 없습니다.');
      // 이벤트는 발생시켜서 UI는 업데이트되도록 함
      window.dispatchEvent(new CustomEvent('missionUpdate'));
      window.dispatchEvent(new CustomEvent('doriExpAdded', { 
        detail: { exp, reason } 
      }));
      window.dispatchEvent(new CustomEvent('profileUpdated'));
      return;
    }
    
    // 프로필 로드 및 업데이트
    const profileKey = `dori_profile_${email}`;
    const savedProfile = localStorage.getItem(profileKey);
    
    if (savedProfile) {
      try {
        const profile = JSON.parse(savedProfile);
        const updatedProfile = {
          ...profile,
          doriExp: (profile.doriExp || 0) + exp,
        };
        
        // 티어와 레벨 재계산
        const { calculateTier, calculateLevel } = require('./userProfile');
        updatedProfile.tier = calculateTier(updatedProfile.doriExp);
        updatedProfile.level = calculateLevel(updatedProfile.doriExp * 10);
        
        // 프로필 저장
        localStorage.setItem(profileKey, JSON.stringify(updatedProfile));
      } catch (e) {
        console.error('프로필 업데이트 오류:', e);
      }
    } else {
      // 프로필이 없으면 미션 경험치만 별도 저장
      const missionExpKey = `dori_mission_exp_${email}`;
      const currentMissionExp = parseInt(localStorage.getItem(missionExpKey) || '0', 10);
      localStorage.setItem(missionExpKey, (currentMissionExp + exp).toString());
    }
    
    // 미션 업데이트 이벤트 발생
    window.dispatchEvent(new CustomEvent('missionUpdate'));
    
    // DORI EXP 업데이트 이벤트 발생
    window.dispatchEvent(new CustomEvent('doriExpAdded', { 
      detail: { exp, reason } 
    }));
    
    // 프로필 업데이트 이벤트 발생
    window.dispatchEvent(new CustomEvent('profileUpdated'));
  } catch (error) {
    console.error('DORI EXP 적립 오류:', error);
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
