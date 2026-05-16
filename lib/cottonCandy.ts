// 솜사탕(CottonCandy) 포인트 시스템 - Firebase Firestore 기반

import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  increment,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getFirebaseFirestore } from "@/lib/firebase";

export interface CottonCandyHistoryEntry {
  date: string;
  amount: number;
  reason: string;
}

// 현재 로그인 유저 UID 가져오기
function getCurrentUid(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const auth = getAuth();
    return auth.currentUser?.uid || null;
  } catch {
    return null;
  }
}

// email → uid 매핑용 (uid 직접 사용 권장, email은 fallback)
function getUserDocPath(emailOrUid: string): string {
  // uid 형태가 아닌 경우 email을 그대로 문서 ID로 사용 (하위 호환)
  return `users/${emailOrUid}`;
}

/** 현재 솜사탕 잔액 반환 */
export async function getCottonCandyBalance(emailOrUid: string): Promise<number> {
  try {
    const db = getFirebaseFirestore();
    const uid = getCurrentUid() || emailOrUid;
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return 0;
    return snap.data().cottonCandy || 0;
  } catch {
    return 0;
  }
}

/** 솜사탕 지급 */
export async function addCottonCandy(emailOrUid: string, amount: number, reason: string): Promise<number> {
  if (amount <= 0) return getCottonCandyBalance(emailOrUid);
  try {
    const db = getFirebaseFirestore();
    const uid = getCurrentUid() || emailOrUid;
    const userRef = doc(db, "users", uid);

    // 잔액 업데이트
    await updateDoc(userRef, {
      cottonCandy: increment(amount),
      updatedAt: serverTimestamp(),
    });

    // 히스토리 기록
    const historyRef = collection(db, "users", uid, "cottonCandyHistory");
    await addDoc(historyRef, {
      amount,
      reason,
      date: new Date().toISOString(),
      createdAt: serverTimestamp(),
    });

    // stats 업데이트
    const statsRef = doc(db, "users", uid, "stats", "summary");
    await updateDoc(statsRef, {
      totalCottonCandyEarned: increment(amount),
      updatedAt: serverTimestamp(),
    }).catch(() => {
      setDoc(statsRef, { totalCottonCandyEarned: amount, updatedAt: serverTimestamp() }, { merge: true });
    });

    const snap = await getDoc(userRef);
    return snap.data()?.cottonCandy || 0;
  } catch (e) {
    console.error("addCottonCandy error:", e);
    return 0;
  }
}

/** 솜사탕 차감 */
export async function spendCottonCandy(emailOrUid: string, amount: number, reason: string): Promise<boolean> {
  if (amount <= 0) return true;
  try {
    const db = getFirebaseFirestore();
    const uid = getCurrentUid() || emailOrUid;
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return false;

    const current = snap.data().cottonCandy || 0;
    if (current < amount) return false;

    await updateDoc(userRef, {
      cottonCandy: increment(-amount),
      updatedAt: serverTimestamp(),
    });

    const historyRef = collection(db, "users", uid, "cottonCandyHistory");
    await addDoc(historyRef, {
      amount: -amount,
      reason,
      date: new Date().toISOString(),
      createdAt: serverTimestamp(),
    });

    return true;
  } catch (e) {
    console.error("spendCottonCandy error:", e);
    return false;
  }
}

/** 솜사탕 히스토리 반환 (최근 50건) */
export async function getCottonCandyHistory(emailOrUid: string): Promise<CottonCandyHistoryEntry[]> {
  try {
    const db = getFirebaseFirestore();
    const uid = getCurrentUid() || emailOrUid;
    const historyRef = collection(db, "users", uid, "cottonCandyHistory");
    const q = query(historyRef, orderBy("createdAt", "desc"), limit(50));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({
      date: d.data().date,
      amount: d.data().amount,
      reason: d.data().reason,
    }));
  } catch {
    return [];
  }
}

/** 오늘 획득한 솜사탕 양 */
export async function getTodayEarned(emailOrUid: string): Promise<number> {
  try {
    const db = getFirebaseFirestore();
    const uid = getCurrentUid() || emailOrUid;
    const todayStr = new Date().toISOString().split("T")[0];
    const historyRef = collection(db, "users", uid, "cottonCandyHistory");
    const q = query(historyRef, orderBy("createdAt", "desc"), limit(100));
    const snapshot = await getDocs(q);
    return snapshot.docs
      .filter((d) => d.data().amount > 0 && d.data().date?.startsWith(todayStr))
      .reduce((sum, d) => sum + d.data().amount, 0);
  } catch {
    return 0;
  }
}

// ─── 출석 시스템 ───────────────────────────────────────────────────

export interface AttendanceData {
  lastChecked: string;
  streak: number;
  weekDays: string[];
  totalDays: number;
}

export async function getAttendanceData(emailOrUid: string): Promise<AttendanceData> {
  try {
    const db = getFirebaseFirestore();
    const uid = getCurrentUid() || emailOrUid;
    const attRef = doc(db, "users", uid, "attendance", "data");
    const snap = await getDoc(attRef);
    if (!snap.exists()) return { lastChecked: "", streak: 0, weekDays: [], totalDays: 0 };
    return snap.data() as AttendanceData;
  } catch {
    return { lastChecked: "", streak: 0, weekDays: [], totalDays: 0 };
  }
}

export async function checkAttendance(emailOrUid: string): Promise<{ success: boolean; bonus: boolean; message: string; earned: number }> {
  try {
    const db = getFirebaseFirestore();
    const uid = getCurrentUid() || emailOrUid;
    const todayStr = new Date().toISOString().split("T")[0];
    const data = await getAttendanceData(emailOrUid);

    if (data.lastChecked === todayStr) {
      return { success: false, bonus: false, message: "오늘 이미 출석했습니다.", earned: 0 };
    }

    let newStreak = 1;
    if (data.lastChecked) {
      const last = new Date(data.lastChecked);
      const today = new Date(todayStr);
      const diffDays = Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
      newStreak = diffDays === 1 ? data.streak + 1 : 1;
    }

    const today = new Date(todayStr);
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    const mondayStr = monday.toISOString().split("T")[0];

    const prevWeekDays = (data.weekDays || []).filter((d) => d >= mondayStr);
    if (!prevWeekDays.includes(todayStr)) prevWeekDays.push(todayStr);

    const newData: AttendanceData = {
      lastChecked: todayStr,
      streak: newStreak,
      weekDays: prevWeekDays,
      totalDays: (data.totalDays || 0) + 1,
    };

    const attRef = doc(db, "users", uid, "attendance", "data");
    await setDoc(attRef, newData, { merge: true });

    // stats 업데이트
    const statsRef = doc(db, "users", uid, "stats", "summary");
    await updateDoc(statsRef, {
      streak: newStreak,
      totalAttendanceDays: newData.totalDays,
      updatedAt: serverTimestamp(),
    }).catch(() => {});

    let earned = 50;
    let bonus = false;
    await addCottonCandy(emailOrUid, 50, "출석 체크");

    if (newStreak > 0 && newStreak % 7 === 0) {
      await addCottonCandy(emailOrUid, 200, `${newStreak}일 연속 출석 보너스`);
      earned += 200;
      bonus = true;
    }

    return { success: true, bonus, message: "출석 완료!", earned };
  } catch (e) {
    console.error("checkAttendance error:", e);
    return { success: false, bonus: false, message: "오류가 발생했습니다.", earned: 0 };
  }
}

// ─── 미션 시스템 ───────────────────────────────────────────────────

export interface MissionStatus {
  id: string;
  completedDate: string;
}

export async function getMissionStatuses(emailOrUid: string): Promise<MissionStatus[]> {
  try {
    const db = getFirebaseFirestore();
    const uid = getCurrentUid() || emailOrUid;
    const missionsRef = doc(db, "users", uid, "gameData", "missions");
    const snap = await getDoc(missionsRef);
    if (!snap.exists()) return [];
    return snap.data().statuses || [];
  } catch {
    return [];
  }
}

export async function isMissionCompletedToday(emailOrUid: string, missionId: string): Promise<boolean> {
  const todayStr = new Date().toISOString().split("T")[0];
  const statuses = await getMissionStatuses(emailOrUid);
  return statuses.some((s) => s.id === missionId && s.completedDate === todayStr);
}

export async function completeMission(emailOrUid: string, missionId: string, reward: number, reason: string): Promise<boolean> {
  if (await isMissionCompletedToday(emailOrUid, missionId)) return false;
  try {
    const db = getFirebaseFirestore();
    const uid = getCurrentUid() || emailOrUid;
    const todayStr = new Date().toISOString().split("T")[0];
    const statuses = (await getMissionStatuses(emailOrUid)).filter((s) => s.id !== missionId);
    statuses.push({ id: missionId, completedDate: todayStr });

    const missionsRef = doc(db, "users", uid, "gameData", "missions");
    await setDoc(missionsRef, { statuses }, { merge: true });
    await addCottonCandy(emailOrUid, reward, reason);
    return true;
  } catch {
    return false;
  }
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
  cottonCandyTotal: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first_visit",   emoji: "🎉", name: "첫 방문",       description: "DORI-AI에 처음 방문",      reward: 10,   condition: () => true },
  { id: "first_post",    emoji: "📝", name: "첫 글쓰기",     description: "커뮤니티 글 1개 작성",      reward: 50,   condition: (s) => s.totalPosts >= 1 },
  { id: "comment_king",  emoji: "💬", name: "댓글왕",        description: "댓글 10개 달기",            reward: 100,  condition: (s) => s.totalComments >= 10 },
  { id: "streak_3",      emoji: "🔥", name: "3일 연속 출석", description: "3일 연속으로 출석",         reward: 100,  condition: (s) => s.streak >= 3 },
  { id: "streak_7",      emoji: "📅", name: "7일 연속 출석", description: "7일 연속으로 출석",         reward: 300,  condition: (s) => s.streak >= 7 },
  { id: "streak_30",     emoji: "🏆", name: "한 달 개근",    description: "30일 연속으로 출석",        reward: 1000, condition: (s) => s.streak >= 30 },
  { id: "popular",       emoji: "👍", name: "인기쟁이",      description: "받은 좋아요 10개",          reward: 150,  condition: (s) => s.totalReceivedLikes >= 10 },
  { id: "game_king",     emoji: "🎮", name: "게임왕",        description: "미니게임 10판 플레이",      reward: 200,  condition: (s) => s.minigamePlays >= 10 },
  { id: "quiz_master",   emoji: "🤓", name: "퀴즈마스터",    description: "퀴즈 20문제 정답",          reward: 250,  condition: (s) => s.quizCorrect >= 20 },
  { id: "level_10",      emoji: "💎", name: "레벨 10 달성",  description: "레벨 10에 도달",            reward: 500,  condition: (s) => s.level >= 10 },
];

export async function getClaimedAchievements(emailOrUid: string): Promise<string[]> {
  try {
    const db = getFirebaseFirestore();
    const uid = getCurrentUid() || emailOrUid;
    const achRef = doc(db, "users", uid, "gameData", "achievements");
    const snap = await getDoc(achRef);
    if (!snap.exists()) return [];
    return snap.data().claimed || [];
  } catch {
    return [];
  }
}

export async function checkNewAchievements(emailOrUid: string, stats: AchievementStats): Promise<Achievement[]> {
  const claimed = await getClaimedAchievements(emailOrUid);
  return ACHIEVEMENTS.filter((a) => !claimed.includes(a.id) && a.condition(stats));
}

export async function claimAchievement(emailOrUid: string, achievementId: string): Promise<number> {
  const achievement = ACHIEVEMENTS.find((a) => a.id === achievementId);
  if (!achievement) return 0;
  try {
    const db = getFirebaseFirestore();
    const uid = getCurrentUid() || emailOrUid;
    const claimed = await getClaimedAchievements(emailOrUid);
    if (claimed.includes(achievementId)) return 0;

    claimed.push(achievementId);
    const achRef = doc(db, "users", uid, "gameData", "achievements");
    await setDoc(achRef, { claimed }, { merge: true });
    await addCottonCandy(emailOrUid, achievement.reward, `업적 달성: ${achievement.name}`);
    return achievement.reward;
  } catch {
    return 0;
  }
}

// ─── 레벨업 보상 ───────────────────────────────────────────────────

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

export async function getClaimedLevelRewards(emailOrUid: string): Promise<number[]> {
  try {
    const db = getFirebaseFirestore();
    const uid = getCurrentUid() || emailOrUid;
    const ref = doc(db, "users", uid, "gameData", "levelRewards");
    const snap = await getDoc(ref);
    if (!snap.exists()) return [];
    return snap.data().claimed || [];
  } catch {
    return [];
  }
}

export async function claimLevelReward(emailOrUid: string, level: number): Promise<number> {
  const rewardEntry = LEVEL_REWARDS.find((r) => r.level === level);
  if (!rewardEntry) return 0;
  try {
    const db = getFirebaseFirestore();
    const uid = getCurrentUid() || emailOrUid;
    const claimed = await getClaimedLevelRewards(emailOrUid);
    if (claimed.includes(level)) return 0;

    claimed.push(level);
    const ref = doc(db, "users", uid, "gameData", "levelRewards");
    await setDoc(ref, { claimed }, { merge: true });
    await addCottonCandy(emailOrUid, rewardEntry.reward, `레벨 ${level} 달성 보상`);
    return rewardEntry.reward;
  } catch {
    return 0;
  }
}

// ─── 상점 시스템 ───────────────────────────────────────────────────

export async function getPurchasedItems(emailOrUid: string): Promise<string[]> {
  try {
    const db = getFirebaseFirestore();
    const uid = getCurrentUid() || emailOrUid;
    const ref = doc(db, "users", uid, "gameData", "shop");
    const snap = await getDoc(ref);
    if (!snap.exists()) return [];
    return snap.data().purchased || [];
  } catch {
    return [];
  }
}

export async function isPremiumUser(emailOrUid: string): Promise<boolean> {
  try {
    const db = getFirebaseFirestore();
    const uid = getCurrentUid() || emailOrUid;
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) return false;
    return snap.data().isPremium === true;
  } catch {
    return false;
  }
}

export async function purchaseItem(emailOrUid: string, itemId: string, price: number): Promise<{ success: boolean; message: string }> {
  try {
    const purchased = await getPurchasedItems(emailOrUid);
    if (purchased.includes(itemId)) {
      return { success: false, message: "이미 구매한 아이템입니다." };
    }

    const premium = await isPremiumUser(emailOrUid);
    if (!premium) {
      const balance = await getCottonCandyBalance(emailOrUid);
      if (balance < price) {
        return { success: false, message: `솜사탕이 부족합니다. (현재 ${balance.toLocaleString()}개, 필요 ${price.toLocaleString()}개)` };
      }
      await spendCottonCandy(emailOrUid, price, `상점 구매: ${itemId}`);
    }

    const db = getFirebaseFirestore();
    const uid = getCurrentUid() || emailOrUid;
    purchased.push(itemId);
    const ref = doc(db, "users", uid, "gameData", "shop");
    await setDoc(ref, { purchased }, { merge: true });
    return { success: true, message: premium ? "💎 프리미엄 혜택으로 무료 구매!" : "구매 완료!" };
  } catch {
    return { success: false, message: "구매 중 오류가 발생했습니다." };
  }
}

// ─── 미니게임 / 퀴즈 통계 ─────────────────────────────────────────

export async function getMinigamePlays(emailOrUid: string): Promise<number> {
  try {
    const db = getFirebaseFirestore();
    const uid = getCurrentUid() || emailOrUid;
    const snap = await getDoc(doc(db, "users", uid, "stats", "summary"));
    return snap.exists() ? snap.data().minigamePlays || 0 : 0;
  } catch { return 0; }
}

export async function incrementMinigamePlays(emailOrUid: string): Promise<void> {
  try {
    const db = getFirebaseFirestore();
    const uid = getCurrentUid() || emailOrUid;
    const ref = doc(db, "users", uid, "stats", "summary");
    await updateDoc(ref, { minigamePlays: increment(1), updatedAt: serverTimestamp() });
  } catch {}
}

export async function getQuizCorrect(emailOrUid: string): Promise<number> {
  try {
    const db = getFirebaseFirestore();
    const uid = getCurrentUid() || emailOrUid;
    const snap = await getDoc(doc(db, "users", uid, "stats", "summary"));
    return snap.exists() ? snap.data().quizCorrect || 0 : 0;
  } catch { return 0; }
}

export async function incrementQuizCorrect(emailOrUid: string): Promise<void> {
  try {
    const db = getFirebaseFirestore();
    const uid = getCurrentUid() || emailOrUid;
    const ref = doc(db, "users", uid, "stats", "summary");
    await updateDoc(ref, { quizCorrect: increment(1), updatedAt: serverTimestamp() });
  } catch {}
}
