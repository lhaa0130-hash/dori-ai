"use client";

/**
 * 한국시간 기준 오늘 날짜 키 생성 (YYYYMMDD)
 * 한국시간 자정(00:00) 기준으로 날짜 변경
 */
export function getKoreaTodayKey(): string {
  const now = new Date();
  // UTC+9 (한국시간)으로 변환
  const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  const year = koreaTime.getUTCFullYear();
  const month = String(koreaTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(koreaTime.getUTCDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * 한국시간 기준 자정까지 남은 시간 (밀리초)
 */
export function getTimeUntilKoreaMidnight(): number {
  const now = new Date();
  const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  const tomorrow = new Date(koreaTime);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);
  return tomorrow.getTime() - koreaTime.getTime();
}

/**
 * 일일 미션 정의
 */
export interface DailyMission {
  code: string;
  title: string;
  description: string;
  maxCount: number; // 최대 완료 횟수
  pointsPerAction: number; // 1회당 포인트
  maxPoints: number; // 최대 포인트
  type: 'click' | 'count'; // 클릭만 하면 완료 vs 카운트 필요
}

export const DAILY_MISSIONS: DailyMission[] = [
  {
    code: 'DAILY_CHECKIN',
    title: '출석체크',
    description: '누르기',
    maxCount: 1,
    pointsPerAction: 10,
    maxPoints: 10,
    type: 'click',
  },
  {
    code: 'WRITE_POST',
    title: '글 쓰기',
    description: '3회',
    maxCount: 3,
    pointsPerAction: 10,
    maxPoints: 30,
    type: 'count',
  },
  {
    code: 'WRITE_COMMENT',
    title: '댓글 쓰기',
    description: '5회',
    maxCount: 5,
    pointsPerAction: 5,
    maxPoints: 25,
    type: 'count',
  },
  {
    code: 'LIKE_POST',
    title: '좋아요 누르기',
    description: '10회',
    maxCount: 10,
    pointsPerAction: 3,
    maxPoints: 30,
    type: 'count',
  },
  {
    code: 'SHARE_SITE',
    title: '사이트 공유하기',
    description: '공유하기만 눌러도',
    maxCount: 1,
    pointsPerAction: 20,
    maxPoints: 20,
    type: 'click',
  },
];

/**
 * 미션 진행도 가져오기
 */
export function getMissionProgress(missionCode: string): number {
  if (typeof window === 'undefined') return 0;
  const todayKey = getKoreaTodayKey();
  const key = `daily_mission_progress_${missionCode}_${todayKey}`;
  const progress = localStorage.getItem(key);
  return progress ? parseInt(progress, 10) : 0;
}

/**
 * 미션 진행도 설정
 */
export function setMissionProgress(missionCode: string, count: number): void {
  if (typeof window === 'undefined') return;
  const todayKey = getKoreaTodayKey();
  const key = `daily_mission_progress_${missionCode}_${todayKey}`;
  localStorage.setItem(key, count.toString());
}

/**
 * 미션 진행도 증가
 */
export function incrementMissionProgress(missionCode: string, amount: number = 1): number {
  const current = getMissionProgress(missionCode);
  const mission = DAILY_MISSIONS.find(m => m.code === missionCode);
  if (!mission) return current;
  
  const newProgress = Math.min(current + amount, mission.maxCount);
  setMissionProgress(missionCode, newProgress);
  return newProgress;
}

/**
 * 미션 완료 여부 확인
 */
export function isMissionCompleted(missionCode: string): boolean {
  if (typeof window === 'undefined') return false;
  const todayKey = getKoreaTodayKey();
  const key = `daily_mission_completed_${missionCode}_${todayKey}`;
  return localStorage.getItem(key) === 'true';
}

/**
 * 미션 완료 표시
 */
export function markMissionCompleted(missionCode: string): void {
  if (typeof window === 'undefined') return;
  const todayKey = getKoreaTodayKey();
  const key = `daily_mission_completed_${missionCode}_${todayKey}`;
  localStorage.setItem(key, 'true');
}

/**
 * 미션 보상 수령 여부 확인
 */
export function isMissionClaimed(missionCode: string): boolean {
  if (typeof window === 'undefined') return false;
  const todayKey = getKoreaTodayKey();
  const key = `daily_mission_claimed_${missionCode}_${todayKey}`;
  return localStorage.getItem(key) === 'true';
}

/**
 * 미션 보상 수령 표시
 */
export function markMissionClaimed(missionCode: string): void {
  if (typeof window === 'undefined') return;
  const todayKey = getKoreaTodayKey();
  const key = `daily_mission_claimed_${missionCode}_${todayKey}`;
  localStorage.setItem(key, 'true');
}

/**
 * 미션 완료 처리 (클릭 타입)
 */
export async function completeClickMission(missionCode: string): Promise<boolean> {
  if (isMissionCompleted(missionCode)) return false;
  
  const mission = DAILY_MISSIONS.find(m => m.code === missionCode);
  if (!mission || mission.type !== 'click') return false;
  
  markMissionCompleted(missionCode);
  return true;
}

/**
 * 미션 진행도 업데이트 및 완료 체크 (카운트 타입)
 */
export function updateCountMission(missionCode: string, amount: number = 1): number {
  const mission = DAILY_MISSIONS.find(m => m.code === missionCode);
  if (!mission || mission.type !== 'count') return 0;
  
  const newProgress = incrementMissionProgress(missionCode, amount);
  
  // 최대 횟수에 도달하면 자동 완료
  if (newProgress >= mission.maxCount && !isMissionCompleted(missionCode)) {
    markMissionCompleted(missionCode);
  }
  
  return newProgress;
}

/**
 * 미션 보상 계산
 */
export function calculateMissionReward(missionCode: string): number {
  const mission = DAILY_MISSIONS.find(m => m.code === missionCode);
  if (!mission) return 0;
  
  if (mission.type === 'click') {
    return mission.maxPoints;
  }
  
  const progress = getMissionProgress(missionCode);
  const completedCount = Math.min(progress, mission.maxCount);
  return completedCount * mission.pointsPerAction;
}

/**
 * 오늘의 모든 미션 상태 가져오기
 */
export function getTodayMissionsStatus() {
  return DAILY_MISSIONS.map(mission => {
    const progress = getMissionProgress(mission.code);
    const completed = isMissionCompleted(mission.code);
    const claimed = isMissionClaimed(mission.code);
    const reward = calculateMissionReward(mission.code);
    
    let status: 'pending' | 'completed' | 'claimed' = 'pending';
    if (claimed) {
      status = 'claimed';
    } else if (completed) {
      status = 'completed';
    }
    
    return {
      ...mission,
      progress,
      completed,
      claimed,
      reward,
      status,
      progressText: mission.type === 'count' 
        ? `${progress}/${mission.maxCount}` 
        : completed ? '완료' : '미완료',
    };
  });
}

