// 미션 관련 유틸리티 함수

/**
 * Asia/Seoul timezone 기준으로 오늘 날짜를 YYYY-MM-DD 형식으로 반환
 */
export function getTodayPeriodKey(): string {
  const now = new Date();
  // Asia/Seoul은 UTC+9
  const seoulTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  const year = seoulTime.getUTCFullYear();
  const month = String(seoulTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(seoulTime.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Asia/Seoul timezone 기준으로 이번 주의 ISO week key를 반환 (YYYY-Www)
 */
export function getWeekPeriodKey(): string {
  const now = new Date();
  // Asia/Seoul은 UTC+9
  const seoulTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  const year = seoulTime.getUTCFullYear();
  
  // ISO week 계산 (월요일 시작)
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayOfYear = Math.floor((seoulTime.getTime() - jan4.getTime()) / (24 * 60 * 60 * 1000)) + 1;
  const week = Math.ceil((dayOfYear + ((jan4.getUTCDay() + 6) % 7)) / 7);
  
  return `${year}-W${String(week).padStart(2, '0')}`;
}

/**
 * 미션 코드에 따라 적절한 period_key 반환
 */
export function getPeriodKeyForMission(resetType: 'daily' | 'weekly'): string {
  return resetType === 'daily' ? getTodayPeriodKey() : getWeekPeriodKey();
}

/**
 * 오늘 지급된 포인트 총합 계산 (Asia/Seoul 기준)
 */
export function getTodayPointsTotal(db: any, userId: string): number {
  const today = getTodayPeriodKey();
  // SQLite에서는 날짜 문자열 비교 사용 (YYYY-MM-DD 형식)
  const result = db.prepare(`
    SELECT COALESCE(SUM(delta), 0) as total
    FROM point_ledger
    WHERE user_id = ? AND substr(created_at, 1, 10) = ?
  `).get(userId, today) as { total: number } | undefined;
  
  return result?.total || 0;
}

/**
 * KST 기준 오늘 날짜를 YYYYMMDD 형식으로 반환
 */
export function getTodayDateKey(): string {
  const now = new Date();
  // Asia/Seoul은 UTC+9
  const seoulTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  const year = seoulTime.getUTCFullYear();
  const month = String(seoulTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(seoulTime.getUTCDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

