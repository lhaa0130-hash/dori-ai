// 솜사탕(CottonCandy) 포인트 시스템 헬퍼 함수

export interface CottonCandyHistoryEntry {
  date: string;       // ISO 날짜 문자열
  amount: number;     // 양수 = 획득, 음수 = 사용
  reason: string;     // 지급/차감 사유
}

const PROFILE_KEY = (email: string) => `dori_profile_${email}`;
const CANDY_HISTORY_KEY = (email: string) => `dori_candy_history_${email}`;
const TODAY_EARNED_KEY = (email: string) => `dori_candy_today_${email}`;

function getTodayDateStr(): string {
  return new Date().toISOString().split("T")[0]; // YYYY-MM-DD
}

/** 현재 솜사탕 잔액 반환 */
export function getCottonCandyBalance(email: string): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(PROFILE_KEY(email));
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    return parsed.cottonCandy || 0;
  } catch {
    return 0;
  }
}

/** 솜사탕 지급. 업데이트된 잔액 반환 */
export function addCottonCandy(email: string, amount: number, reason: string): number {
  if (typeof window === "undefined") return 0;
  if (amount <= 0) return getCottonCandyBalance(email);

  try {
    // 프로필 업데이트
    const raw = localStorage.getItem(PROFILE_KEY(email));
    const profile = raw ? JSON.parse(raw) : {};
    const newBalance = (profile.cottonCandy || 0) + amount;
    profile.cottonCandy = newBalance;
    localStorage.setItem(PROFILE_KEY(email), JSON.stringify(profile));

    // 히스토리 추가
    const historyRaw = localStorage.getItem(CANDY_HISTORY_KEY(email));
    const history: CottonCandyHistoryEntry[] = historyRaw ? JSON.parse(historyRaw) : [];
    history.unshift({ date: new Date().toISOString(), amount, reason });
    // 최근 200건만 유지
    if (history.length > 200) history.splice(200);
    localStorage.setItem(CANDY_HISTORY_KEY(email), JSON.stringify(history));

    // 오늘 획득량 업데이트
    const todayStr = getTodayDateStr();
    const todayRaw = localStorage.getItem(TODAY_EARNED_KEY(email));
    const todayData = todayRaw ? JSON.parse(todayRaw) : {};
    if (todayData.date !== todayStr) {
      todayData.date = todayStr;
      todayData.earned = 0;
    }
    todayData.earned = (todayData.earned || 0) + amount;
    localStorage.setItem(TODAY_EARNED_KEY(email), JSON.stringify(todayData));

    return newBalance;
  } catch {
    return getCottonCandyBalance(email);
  }
}

/** 솜사탕 차감. 잔액 부족 시 false 반환 */
export function spendCottonCandy(email: string, amount: number, reason: string): boolean {
  if (typeof window === "undefined") return false;
  if (amount <= 0) return true;

  try {
    const raw = localStorage.getItem(PROFILE_KEY(email));
    const profile = raw ? JSON.parse(raw) : {};
    const current = profile.cottonCandy || 0;
    if (current < amount) return false;

    const newBalance = current - amount;
    profile.cottonCandy = newBalance;
    localStorage.setItem(PROFILE_KEY(email), JSON.stringify(profile));

    // 히스토리 추가 (음수)
    const historyRaw = localStorage.getItem(CANDY_HISTORY_KEY(email));
    const history: CottonCandyHistoryEntry[] = historyRaw ? JSON.parse(historyRaw) : [];
    history.unshift({ date: new Date().toISOString(), amount: -amount, reason });
    if (history.length > 200) history.splice(200);
    localStorage.setItem(CANDY_HISTORY_KEY(email), JSON.stringify(history));

    return true;
  } catch {
    return false;
  }
}

/** 오늘 획득한 솜사탕 양 반환 */
export function getTodayEarned(email: string): number {
  if (typeof window === "undefined") return 0;
  try {
    const todayStr = getTodayDateStr();
    const raw = localStorage.getItem(TODAY_EARNED_KEY(email));
    if (!raw) return 0;
    const data = JSON.parse(raw);
    if (data.date !== todayStr) return 0;
    return data.earned || 0;
  } catch {
    return 0;
  }
}

/** 이번 달 획득한 솜사탕 양 반환 */
export function getMonthEarned(email: string): number {
  if (typeof window === "undefined") return 0;
  try {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const raw = localStorage.getItem(CANDY_HISTORY_KEY(email));
    if (!raw) return 0;
    const history: CottonCandyHistoryEntry[] = JSON.parse(raw);
    return history
      .filter((h) => h.amount > 0 && h.date.startsWith(yearMonth))
      .reduce((sum, h) => sum + h.amount, 0);
  } catch {
    return 0;
  }
}

/** 솜사탕 내역 반환 (최근 순) */
export function getCottonCandyHistory(email: string): CottonCandyHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CANDY_HISTORY_KEY(email));
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// ─── 출석 시스템 ───────────────────────────────────────────────────

export interface AttendanceData {
  lastChecked: string;   // YYYY-MM-DD
  streak: number;
  weekDays: string[];    // 이번 주 출석한 날짜 배열 (YYYY-MM-DD)
  totalDays: number;
}

const ATTENDANCE_KEY = (email: string) => `dori_attendance_${email}`;

export function getAttendanceData(email: string): AttendanceData {
  if (typeof window === "undefined") {
    return { lastChecked: "", streak: 0, weekDays: [], totalDays: 0 };
  }
  try {
    const raw = localStorage.getItem(ATTENDANCE_KEY(email));
    if (!raw) return { lastChecked: "", streak: 0, weekDays: [], totalDays: 0 };
    return JSON.parse(raw);
  } catch {
    return { lastChecked: "", streak: 0, weekDays: [], totalDays: 0 };
  }
}

export function checkAttendance(email: string): { success: boolean; bonus: boolean; message: string; earned: number } {
  if (typeof window === "undefined") return { success: false, bonus: false, message: "서버 환경", earned: 0 };

  const todayStr = getTodayDateStr();
  const data = getAttendanceData(email);

  if (data.lastChecked === todayStr) {
    return { success: false, bonus: false, message: "오늘 이미 출석했습니다.", earned: 0 };
  }

  // 연속 출석 계산
  let newStreak = 1;
  if (data.lastChecked) {
    const last = new Date(data.lastChecked);
    const today = new Date(todayStr);
    const diffDays = Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      newStreak = data.streak + 1;
    } else {
      newStreak = 1;
    }
  }

  // 이번 주 날짜 계산 (월~일)
  const today = new Date(todayStr);
  const dayOfWeek = today.getDay(); // 0=일, 1=월, ...6=토
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);

  const weekDays: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const ds = d.toISOString().split("T")[0];
    if (ds <= todayStr && data.weekDays?.includes(ds)) {
      weekDays.push(ds);
    } else if (ds === todayStr) {
      weekDays.push(ds);
    } else if (ds <= todayStr && data.weekDays?.includes(ds)) {
      weekDays.push(ds);
    }
  }
  // 기존 이번 주 출석에서 오늘 날짜 추가
  const prevWeekDays = (data.weekDays || []).filter((d) => d >= monday.toISOString().split("T")[0]);
  if (!prevWeekDays.includes(todayStr)) prevWeekDays.push(todayStr);

  const newData: AttendanceData = {
    lastChecked: todayStr,
    streak: newStreak,
    weekDays: prevWeekDays,
    totalDays: (data.totalDays || 0) + 1,
  };
  localStorage.setItem(ATTENDANCE_KEY(email), JSON.stringify(newData));

  // 솜사탕 지급
  let earned = 50;
  let bonus = false;
  addCottonCandy(email, 50, "출석 체크");

  // 7일 연속 보너스
  if (newStreak > 0 && newStreak % 7 === 0) {
    addCottonCandy(email, 200, `${newStreak}일 연속 출석 보너스`);
    earned += 200;
    bonus = true;
  }

  return { success: true, bonus, message: "출석 완료!", earned };
}

// ─── 미션 시스템 ───────────────────────────────────────────────────

export interface MissionStatus {
  id: string;
  completedDate: string; // YYYY-MM-DD, 오늘 완료 여부 확인용
}

const MISSIONS_KEY = (email: string) => `dori_missions_${email}`;

export function getMissionStatuses(email: string): MissionStatus[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(MISSIONS_KEY(email));
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function isMissionCompletedToday(email: string, missionId: string): boolean {
  const todayStr = getTodayDateStr();
  const statuses = getMissionStatuses(email);
  return statuses.some((s) => s.id === missionId && s.completedDate === todayStr);
}

export function completeMission(email: string, missionId: string, reward: number, reason: string): boolean {
  if (isMissionCompletedToday(email, missionId)) return false;

  const todayStr = getTodayDateStr();
  const statuses = getMissionStatuses(email).filter((s) => s.id !== missionId);
  statuses.push({ id: missionId, completedDate: todayStr });
  localStorage.setItem(MISSIONS_KEY(email), JSON.stringify(statuses));
  addCottonCandy(email, reward, reason);
  return true;
}

// ─── 업적 시스템 ───────────────────────────────────────────────────

export interface Achievement {
  id: string;
  emoji: string;
  name: string;
  description: string;
  reward: number;
  condition: (stats: AchievementStats) => boolean;
}

export interface AchievementStats {
  totalPosts: number;
  totalComments: number;
  totalReceivedLikes: number;
  streak: number;
  totalAttendanceDays: number;
  level: number;
  minigamePlays: number;
  quizCorrect: number;
  cottonCandyTotal: number; // 누적 획득 총량
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first_visit",   emoji: "🎉", name: "첫 방문",          description: "DORI-AI에 처음 방문",           reward: 10,   condition: () => true },
  { id: "first_post",    emoji: "📝", name: "첫 글쓰기",        description: "커뮤니티 글 1개 작성",           reward: 50,   condition: (s) => s.totalPosts >= 1 },
  { id: "comment_king",  emoji: "💬", name: "댓글왕",           description: "댓글 10개 달기",                 reward: 100,  condition: (s) => s.totalComments >= 10 },
  { id: "streak_3",      emoji: "🔥", name: "3일 연속 출석",    description: "3일 연속으로 출석",              reward: 100,  condition: (s) => s.streak >= 3 },
  { id: "streak_7",      emoji: "📅", name: "7일 연속 출석",    description: "7일 연속으로 출석",              reward: 300,  condition: (s) => s.streak >= 7 },
  { id: "streak_30",     emoji: "🏆", name: "한 달 개근",       description: "30일 연속으로 출석",             reward: 1000, condition: (s) => s.streak >= 30 },
  { id: "popular",       emoji: "👍", name: "인기쟁이",         description: "받은 좋아요 10개",               reward: 150,  condition: (s) => s.totalReceivedLikes >= 10 },
  { id: "game_king",     emoji: "🎮", name: "게임왕",           description: "미니게임 10판 플레이",           reward: 200,  condition: (s) => s.minigamePlays >= 10 },
  { id: "quiz_master",   emoji: "🤓", name: "퀴즈마스터",       description: "퀴즈 20문제 정답",               reward: 250,  condition: (s) => s.quizCorrect >= 20 },
  { id: "level_10",      emoji: "💎", name: "레벨 10 달성",     description: "레벨 10에 도달",                 reward: 500,  condition: (s) => s.level >= 10 },
];

const ACHIEVEMENT_CLAIMED_KEY = (email: string) => `dori_achievements_${email}`;

export function getClaimedAchievements(email: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ACHIEVEMENT_CLAIMED_KEY(email));
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/** 달성 가능한 업적 중 아직 수령하지 않은 것들 반환 */
export function checkNewAchievements(email: string, stats: AchievementStats): Achievement[] {
  const claimed = getClaimedAchievements(email);
  return ACHIEVEMENTS.filter(
    (a) => !claimed.includes(a.id) && a.condition(stats)
  );
}

/** 업적 수령 처리 */
export function claimAchievement(email: string, achievementId: string): number {
  const achievement = ACHIEVEMENTS.find((a) => a.id === achievementId);
  if (!achievement) return 0;

  const claimed = getClaimedAchievements(email);
  if (claimed.includes(achievementId)) return 0;

  claimed.push(achievementId);
  localStorage.setItem(ACHIEVEMENT_CLAIMED_KEY(email), JSON.stringify(claimed));
  addCottonCandy(email, achievement.reward, `업적 달성: ${achievement.name}`);
  return achievement.reward;
}

// ─── 레벨업 보상 시스템 ────────────────────────────────────────────

export interface LevelReward {
  level: number;
  reward: number;
}

export const LEVEL_REWARDS: LevelReward[] = [
  { level: 5,  reward: 100 },
  { level: 10, reward: 300 },
  { level: 15, reward: 200 },
  { level: 20, reward: 500 },
  { level: 30, reward: 400 },
  { level: 40, reward: 600 },
  { level: 50, reward: 1000 },
];

const LEVEL_REWARD_KEY = (email: string) => `dori_level_rewards_${email}`;

export function getClaimedLevelRewards(email: string): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LEVEL_REWARD_KEY(email));
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function claimLevelReward(email: string, level: number): number {
  const rewardEntry = LEVEL_REWARDS.find((r) => r.level === level);
  if (!rewardEntry) return 0;

  const claimed = getClaimedLevelRewards(email);
  if (claimed.includes(level)) return 0;

  claimed.push(level);
  localStorage.setItem(LEVEL_REWARD_KEY(email), JSON.stringify(claimed));
  addCottonCandy(email, rewardEntry.reward, `레벨 ${level} 달성 보상`);
  return rewardEntry.reward;
}

// ─── 상점 시스템 ───────────────────────────────────────────────────

const SHOP_KEY = (email: string) => `dori_shop_purchased_${email}`;

export function getPurchasedItems(email: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SHOP_KEY(email));
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function purchaseItem(email: string, itemId: string, price: number): { success: boolean; message: string } {
  const balance = getCottonCandyBalance(email);
  if (balance < price) {
    return { success: false, message: `솜사탕이 부족합니다. (현재 ${balance.toLocaleString()}개, 필요 ${price.toLocaleString()}개)` };
  }
  const purchased = getPurchasedItems(email);
  if (purchased.includes(itemId)) {
    return { success: false, message: "이미 구매한 아이템입니다." };
  }

  spendCottonCandy(email, price, `상점 구매: ${itemId}`);
  purchased.push(itemId);
  localStorage.setItem(SHOP_KEY(email), JSON.stringify(purchased));
  return { success: true, message: "구매 완료!" };
}

// ─── 미니게임 / 퀴즈 통계 ─────────────────────────────────────────

const MINIGAME_KEY = (email: string) => `dori_minigame_plays_${email}`;
const QUIZ_KEY = (email: string) => `dori_quiz_correct_${email}`;

export function getMinigamePlays(email: string): number {
  if (typeof window === "undefined") return 0;
  try {
    return parseInt(localStorage.getItem(MINIGAME_KEY(email)) || "0", 10);
  } catch { return 0; }
}

export function incrementMinigamePlays(email: string): void {
  if (typeof window === "undefined") return;
  const current = getMinigamePlays(email);
  localStorage.setItem(MINIGAME_KEY(email), String(current + 1));
}

export function getQuizCorrect(email: string): number {
  if (typeof window === "undefined") return 0;
  try {
    return parseInt(localStorage.getItem(QUIZ_KEY(email)) || "0", 10);
  } catch { return 0; }
}

export function incrementQuizCorrect(email: string): void {
  if (typeof window === "undefined") return;
  const current = getQuizCorrect(email);
  localStorage.setItem(QUIZ_KEY(email), String(current + 1));
}
