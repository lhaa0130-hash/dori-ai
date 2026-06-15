// 솜사탕(CottonCandy) 포인트 시스템 헬퍼 함수
// ──────────────────────────────────────────────────────────────────
// [이관] 회원 인증이 Firebase로 옮겨가면서, 솜사탕/출석도 Firestore users/{uid}에
// 영구 저장(기기 무관)되도록 변경했습니다.
// - localStorage = 즉시 동기 읽기용 캐시 (UI 깜빡임 방지)
// - Firestore   = 진짜 저장소 (다른 기기/브라우저에서도 동일하게 유지)
// 기존 페이지(마이페이지·미니게임 22개·상점 등)는 함수 시그니처가 그대로라 수정 불필요.
// 로그인하면 hydrateGameData()가 Firestore → localStorage로 동기화하고
// "dori-gamedata-synced" 이벤트를 쏩니다. 화면은 이 이벤트로 잔액을 다시 읽습니다.

import { doc, getDoc, setDoc, updateDoc, addDoc, collection, getDocs, query, orderBy, limit, increment, serverTimestamp, runTransaction, arrayUnion } from "firebase/firestore";
import { getFirebaseFirestore, getFirebaseAuth } from "@/lib/firebase";
import { calculateTier, calculateLevel } from "@/lib/userProfile";

export interface CottonCandyHistoryEntry {
  date: string;       // ISO 날짜 문자열
  amount: number;     // 양수 = 획득, 음수 = 사용
  reason: string;     // 지급/차감 사유
}

// ─── localStorage 키 ───────────────────────────────────────────────
const PROFILE_KEY = (email: string) => `dori_profile_${email}`;          // 레거시(구버전 호환)
const CC_KEY = (email: string) => `dori_cc_${email}`;                    // 솜사탕 잔액 캐시
const CC_TOTAL_KEY = (email: string) => `dori_cc_total_${email}`;        // 누적 획득량 캐시
const GAME_PROFILE_KEY = (email: string) => `dori_game_profile_${email}`;// Firestore 프로필 캐시(티어/레벨/경험치)
const CANDY_HISTORY_KEY = (email: string) => `dori_candy_history_${email}`;
const TODAY_EARNED_KEY = (email: string) => `dori_candy_today_${email}`;
const ATTENDANCE_KEY = (email: string) => `dori_attendance_${email}`;
const OWNED_KEY = (email: string) => `dori_owned_${email}`;            // 코지홈 아이템 보유 캐시 (slot::id 배열)

function getTodayDateStr(): string {
  // ⚠️ toISOString()은 UTC 기준 → 한국(UTC+9) 자정~오전9시 사이엔 어제 날짜 반환
  // 로컬 날짜로 계산해야 정확함
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ─── Firestore 연동(쓰기는 fire-and-forget, 실패해도 화면은 정상) ────
function currentUid(): string | null {
  try {
    return getFirebaseAuth().currentUser?.uid || null;
  } catch {
    return null;
  }
}

function fsAddCandy(amount: number) {
  const uid = currentUid();
  if (!uid || amount === 0) return;
  try {
    const db = getFirebaseFirestore();
    setDoc(
      doc(db, "users", uid),
      {
        cottonCandy: increment(amount),
        ...(amount > 0 ? { cottonCandyTotal: increment(amount) } : {}),
        lastActiveAt: serverTimestamp(),
      },
      { merge: true }
    ).catch(() => {});
  } catch {
    /* noop */
  }
}

function fsSetAttendance(att: AttendanceData) {
  const uid = currentUid();
  if (!uid) return;
  try {
    const db = getFirebaseFirestore();
    setDoc(
      doc(db, "users", uid),
      { attendance: att, lastActiveAt: serverTimestamp() },
      { merge: true }
    ).catch(() => {});
  } catch {
    /* noop */
  }
}

// ─── 관리자 전용: 다른 회원에게 솜사탕 지급 / 프리미엄 설정 ──────────
// 대상 회원의 Firestore users/{uid} 문서에 직접 반영(진짜 저장소).
// firestore.rules 에서 관리자 이메일만 타인 문서 쓰기를 허용해야 동작합니다.
// 대상 유저는 다음 접속 시 hydrateGameData 가 Firestore→로컬 캐시로 동기화합니다.
// 반환 mode: 'instant'=즉시 반영(본인/규칙게시됨) · 'queued'=회원 접속 시 반영 · false=실패
export async function adminGrantCandy(
  targetUid: string,
  amount: number,
  fromName = "관리자"
): Promise<"instant" | "queued" | false> {
  if (!targetUid || !amount) return false;
  const db = getFirebaseFirestore();
  // 1) 직접 반영 시도(본인 문서이거나 관리자 규칙이 게시된 경우 성공)
  try {
    await setDoc(
      doc(db, "users", targetUid),
      {
        cottonCandy: increment(amount),
        ...(amount > 0 ? { cottonCandyTotal: increment(amount) } : {}),
        lastActiveAt: serverTimestamp(),
      },
      { merge: true }
    );
    return "instant";
  } catch {
    /* 권한 거부 → 큐로 폴백 */
  }
  // 2) 폴백: 대상 회원의 알림에 '지급 예약'을 남김(누구나 알림 생성 가능 규칙 활용)
  //    대상이 접속하면 applyPendingCandyGrants()가 본인 잔액에 반영함.
  try {
    await addDoc(collection(db, "notifications", targetUid, "items"), {
      type: "candy_grant",
      amount,
      applied: false,
      fromName: (fromName || "관리자").slice(0, 20),
      text: `관리자가 솜사탕 ${amount.toLocaleString()}개를 지급했어요 🍭`,
      link: "/my",
      read: false,
      createdAt: serverTimestamp(),
    });
    return "queued";
  } catch (e) {
    console.warn("[admin] 솜사탕 지급 실패:", e);
    return false;
  }
}

/**
 * 로그인/하이드레이트 시: 나에게 온 '솜사탕 지급 예약'을 본인 잔액에 적용.
 * 본인 문서 쓰기는 항상 허용되므로 규칙 변경 없이 동작. applied=true 로 중복 방지.
 */
export async function applyPendingCandyGrants(): Promise<void> {
  if (typeof window === "undefined") return;
  let user;
  try { user = getFirebaseAuth().currentUser; } catch { return; }
  if (!user || !user.email) return;
  const uid = user.uid;
  const email = user.email;
  try {
    const db = getFirebaseFirestore();
    const snap = await getDocs(query(collection(db, "notifications", uid, "items"), orderBy("createdAt", "desc"), limit(50)));
    const candy: { id: string; amount: number }[] = [];
    const premiumGrants: { id: string; premium: boolean }[] = [];
    snap.forEach((d) => {
      const x = d.data() as Record<string, unknown>;
      if (x.applied === true) return;
      if (x.type === "candy_grant") {
        const amt = Number(x.amount) || 0;
        if (amt > 0) candy.push({ id: d.id, amount: amt });
      } else if (x.type === "premium_grant") {
        premiumGrants.push({ id: d.id, premium: x.premium === true });
      }
    });
    if (candy.length === 0 && premiumGrants.length === 0) return;

    const total = candy.reduce((s, p) => s + p.amount, 0);
    const userPatch: Record<string, unknown> = { lastActiveAt: serverTimestamp() };
    if (total > 0) { userPatch.cottonCandy = increment(total); userPatch.cottonCandyTotal = increment(total); }
    // 프리미엄은 가장 최근 예약값 적용(목록은 createdAt desc 정렬이라 첫 항목이 최신)
    if (premiumGrants.length > 0) userPatch.isPremium = premiumGrants[0].premium;

    // 본인 문서에 반영(소유자 쓰기 — 항상 허용)
    await setDoc(doc(db, "users", uid), userPatch, { merge: true });
    // 예약 항목 applied 처리(중복 적용 방지)
    const allIds = [...candy.map((c) => c.id), ...premiumGrants.map((p) => p.id)];
    await Promise.all(allIds.map((id) => updateDoc(doc(db, "notifications", uid, "items", id), { applied: true, read: true }).catch(() => {})));
    // 로컬 캐시 동기화
    if (total > 0) {
      localStorage.setItem(CC_KEY(email), String(getCottonCandyBalance(email) + total));
      localStorage.setItem(CC_TOTAL_KEY(email), String(getCottonCandyTotal(email) + total));
    }
    window.dispatchEvent(new Event("dori-gamedata-synced"));
  } catch (e) {
    console.warn("[candy] 지급 예약 적용 실패:", e);
  }
}

export async function adminSetPremium(targetUid: string, isPremium: boolean): Promise<"instant" | "queued" | false> {
  if (!targetUid) return false;
  const db = getFirebaseFirestore();
  try {
    await setDoc(doc(db, "users", targetUid), { isPremium, lastActiveAt: serverTimestamp() }, { merge: true });
    return "instant";
  } catch {
    /* 권한 거부 → 큐로 폴백 */
  }
  try {
    await addDoc(collection(db, "notifications", targetUid, "items"), {
      type: "premium_grant",
      premium: isPremium,
      applied: false,
      fromName: "관리자",
      text: isPremium ? "관리자가 프리미엄을 적용했어요 💎" : "프리미엄이 해제되었어요",
      link: "/my",
      read: false,
      createdAt: serverTimestamp(),
    });
    return "queued";
  } catch (e) {
    console.warn("[admin] 프리미엄 설정 실패:", e);
    return false;
  }
}

/**
 * 로그인 직후 Firestore → localStorage 동기화 (Firestore가 진짜 값).
 * 새 기기/브라우저에서 로그인해도 솜사탕·출석이 그대로 따라옵니다.
 * 끝나면 "dori-gamedata-synced" 이벤트를 발생시켜 화면이 다시 읽도록 합니다.
 */
export async function hydrateGameData(): Promise<void> {
  if (typeof window === "undefined") return;
  let user;
  try {
    user = getFirebaseAuth().currentUser;
  } catch {
    return;
  }
  if (!user || !user.email) return;
  const email = user.email;
  try {
    const db = getFirebaseFirestore();
    const snap = await getDoc(doc(db, "users", user.uid));
    if (!snap.exists()) return;
    const d: any = snap.data();

    // ── 솜사탕 잔액: 로컬이 더 크면 (방금 출석 등 써서 아직 Firestore에 반영 전) 덮어쓰지 않음
    if (typeof d.cottonCandy === "number") {
      const localCandy = getCottonCandyBalance(email);
      // Firestore 값이 더 크거나 로컬에 없을 때만 업데이트 (race condition 방지)
      if (d.cottonCandy >= localCandy) {
        localStorage.setItem(CC_KEY(email), String(d.cottonCandy));
      }
    }
    if (typeof d.cottonCandyTotal === "number") {
      const localTotal = getCottonCandyTotal(email);
      if (d.cottonCandyTotal >= localTotal) {
        localStorage.setItem(CC_TOTAL_KEY(email), String(d.cottonCandyTotal));
      }
    }
    // ── 코지홈 아이템 보유 목록: Firestore 값과 로컬 캐시를 합집합(둘 다 보존)
    if (Array.isArray(d.ownedItems)) {
      const local = getOwnedShopItems(email);
      const merged = Array.from(new Set([...(d.ownedItems as string[]), ...local]));
      localStorage.setItem(OWNED_KEY(email), JSON.stringify(merged));
    }
    // ── 출석: Firestore의 lastChecked가 로컬보다 같거나 최신일 때만 업데이트
    if (d.attendance) {
      const localAtt = getAttendanceData(email);
      const fsChecked = d.attendance.lastChecked || "";
      const localChecked = localAtt.lastChecked || "";
      if (fsChecked >= localChecked) {
        localStorage.setItem(ATTENDANCE_KEY(email), JSON.stringify(d.attendance));
      }
    }

    // 마이페이지/프로필 카드용 캐시 (티어·레벨·경험치)
    // 경험치는 로컬이 더 높으면(방금 활동으로 적립, 아직 FS 반영 전) 유지 — 절대 내리지 않음
    const localProfile = getCachedGameProfile(email);
    const fsExp = d.doriExp || 0;
    const localExp = localProfile?.doriExp || 0;
    const finalExp = Math.max(fsExp, localExp);
    localStorage.setItem(
      GAME_PROFILE_KEY(email),
      JSON.stringify({
        cottonCandy: Math.max(d.cottonCandy || 0, localProfile?.cottonCandy || 0),
        doriExp: finalExp,
        tier: calculateTier(finalExp),
        level: calculateLevel(finalExp),
        nickname: d.name || undefined,
        gender: d.gender || undefined,
        ageGroup: d.ageGroup || undefined,
        isPremium: d.isPremium === true,
      })
    );

    window.dispatchEvent(new Event("dori-gamedata-synced"));

    // 관리자가 보낸 '솜사탕 지급 예약'을 본인 잔액에 자동 반영(규칙 변경 불필요)
    void applyPendingCandyGrants();
  } catch (e) {
    console.warn("[cottonCandy] hydrate fail:", e);
  }
}

/** Firestore에서 동기화해 둔 프로필(티어/레벨/경험치) 캐시 읽기 (동기) */
export function getCachedGameProfile(
  email: string
): { cottonCandy: number; doriExp: number; tier: number; level: number; nickname?: string; gender?: string; ageGroup?: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(GAME_PROFILE_KEY(email));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ─── 경험치(doriExp) / 레벨 / 등급 ─────────────────────────────────
// 솜사탕과 동일하게 localStorage 캐시(GAME_PROFILE) 우선 + Firestore 동기화.
// 화면(ProfileHero·AccountMenu·HomeClient)은 getCachedGameProfile()를 읽으므로 즉시 반영됨.

function writeGameProfile(
  email: string,
  patch: Partial<{ cottonCandy: number; doriExp: number; tier: number; level: number }>
) {
  const cur = getCachedGameProfile(email) || {
    cottonCandy: getCottonCandyBalance(email),
    doriExp: 0,
    tier: 1,
    level: 1,
  };
  const next = { ...cur, ...patch };
  try { localStorage.setItem(GAME_PROFILE_KEY(email), JSON.stringify(next)); } catch {}
  return next;
}

function fsSetExp(exp: number, tier: number, level: number) {
  const uid = currentUid();
  if (!uid) return;
  try {
    const db = getFirebaseFirestore();
    setDoc(
      doc(db, "users", uid),
      { doriExp: exp, tier, level, lastActiveAt: serverTimestamp() },
      { merge: true }
    ).catch(() => {});
  } catch { /* noop */ }
}

/** 현재 경험치(동기, 캐시 기준) */
export function getDoriExp(email: string): number {
  return getCachedGameProfile(email)?.doriExp || 0;
}

export interface ExpResult {
  exp: number;
  level: number;
  tier: number;
  gained: number;
  leveledUp: boolean;
  tierUp: boolean;
}

/**
 * 경험치 적립(+티어/레벨 자동 재계산). 활동 시점에 호출.
 * localStorage 즉시 반영 + Firestore fire-and-forget + 'dori-gamedata-synced' 이벤트.
 */
export function addExp(email: string, amount: number, reason = "활동"): ExpResult {
  const empty: ExpResult = { exp: getDoriExp(email), level: 1, tier: 1, gained: 0, leveledUp: false, tierUp: false };
  if (typeof window === "undefined" || !email || !amount) return empty;

  const cur = getCachedGameProfile(email) || {
    cottonCandy: getCottonCandyBalance(email), doriExp: 0, tier: 1, level: 1,
  };
  const oldLevel = cur.level || 1;
  const oldTier = cur.tier || 1;
  const newExp = Math.max(0, (cur.doriExp || 0) + amount);
  const tier = calculateTier(newExp);
  const level = calculateLevel(newExp);

  writeGameProfile(email, { doriExp: newExp, tier, level });
  fsSetExp(newExp, tier, level);
  try { window.dispatchEvent(new Event("dori-gamedata-synced")); } catch {}

  return { exp: newExp, level, tier, gained: amount, leveledUp: level > oldLevel, tierUp: tier > oldTier };
}

/** 절대 경험치로 끌어올림(내리지 않음) — 활동량 기반 백필용(마이페이지) */
export function ensureExpAtLeast(email: string, exp: number): ExpResult | null {
  const cur = getDoriExp(email);
  if (exp > cur) return addExp(email, exp - cur, "활동 반영");
  return null;
}

// ⚠️ 중복 제거: hydrateGameData()는 AuthContext.tsx의 onAuthStateChanged에서 이미 호출됨
// 여기서 또 onAuthStateChanged를 등록하면 로그인 시 2번 Firestore 읽기 → race condition 발생
// (이전 코드 삭제됨)

// ─── 솜사탕 잔액 ───────────────────────────────────────────────────

/** 현재 솜사탕 잔액 반환 (localStorage 캐시 기준, 동기) */
export function getCottonCandyBalance(email: string): number {
  if (typeof window === "undefined") return 0;
  try {
    const v = localStorage.getItem(CC_KEY(email));
    if (v != null) return parseInt(v, 10) || 0;
    // 레거시: 구버전이 프로필에 박아둔 솜사탕 → 1회 승계
    const raw = localStorage.getItem(PROFILE_KEY(email));
    if (raw) {
      const legacy = JSON.parse(raw)?.cottonCandy || 0;
      if (legacy > 0) localStorage.setItem(CC_KEY(email), String(legacy));
      return legacy;
    }
    return 0;
  } catch {
    return 0;
  }
}

/** 누적 획득 솜사탕 (업적 판정용) */
export function getCottonCandyTotal(email: string): number {
  if (typeof window === "undefined") return 0;
  try {
    return parseInt(localStorage.getItem(CC_TOTAL_KEY(email)) || "0", 10) || 0;
  } catch {
    return 0;
  }
}

/** 솜사탕 지급. 업데이트된 잔액 반환 */
export function addCottonCandy(email: string, amount: number, reason: string): number {
  if (typeof window === "undefined") return 0;
  if (amount <= 0) return getCottonCandyBalance(email);

  try {
    const newBalance = getCottonCandyBalance(email) + amount;
    localStorage.setItem(CC_KEY(email), String(newBalance));
    localStorage.setItem(CC_TOTAL_KEY(email), String(getCottonCandyTotal(email) + amount));

    // 히스토리 추가
    const historyRaw = localStorage.getItem(CANDY_HISTORY_KEY(email));
    const history: CottonCandyHistoryEntry[] = historyRaw ? JSON.parse(historyRaw) : [];
    history.unshift({ date: new Date().toISOString(), amount, reason });
    if (history.length > 200) history.splice(200);
    localStorage.setItem(CANDY_HISTORY_KEY(email), JSON.stringify(history));

    // 오늘 획득량
    const todayStr = getTodayDateStr();
    const todayRaw = localStorage.getItem(TODAY_EARNED_KEY(email));
    const todayData = todayRaw ? JSON.parse(todayRaw) : {};
    if (todayData.date !== todayStr) {
      todayData.date = todayStr;
      todayData.earned = 0;
    }
    todayData.earned = (todayData.earned || 0) + amount;
    localStorage.setItem(TODAY_EARNED_KEY(email), JSON.stringify(todayData));

    fsAddCandy(amount); // Firestore 영구 저장
    return newBalance;
  } catch {
    return getCottonCandyBalance(email);
  }
}

/** 플레이타임 보상: 1분 이상 플레이 시 1일 1회 솜사탕 지급 (게임 공용) */
const PLAYTIME_REWARD_KEY = (email: string) => `dori_playtime_reward_${email}`;

export function hasClaimedPlaytimeToday(email: string): boolean {
  if (typeof window === "undefined" || !email) return false;
  try {
    return localStorage.getItem(PLAYTIME_REWARD_KEY(email)) === getTodayDateStr();
  } catch {
    return false;
  }
}

export function grantPlaytimeReward(
  email: string,
  amount = 50
): { granted: boolean; amount: number } {
  if (typeof window === "undefined" || !email) return { granted: false, amount: 0 };
  try {
    if (localStorage.getItem(PLAYTIME_REWARD_KEY(email)) === getTodayDateStr()) {
      return { granted: false, amount: 0 };
    }
    localStorage.setItem(PLAYTIME_REWARD_KEY(email), getTodayDateStr());
    addCottonCandy(email, amount, "1분 이상 플레이 보상");
    addExp(email, 5, "미니게임 플레이"); // 경험치 적립
    return { granted: true, amount };
  } catch {
    return { granted: false, amount: 0 };
  }
}

/** 솜사탕 차감. 잔액 부족 시 false 반환 */
export function spendCottonCandy(email: string, amount: number, reason: string): boolean {
  if (typeof window === "undefined") return false;
  if (amount <= 0) return true;

  try {
    const current = getCottonCandyBalance(email);
    if (current < amount) return false;

    const newBalance = current - amount;
    localStorage.setItem(CC_KEY(email), String(newBalance));

    const historyRaw = localStorage.getItem(CANDY_HISTORY_KEY(email));
    const history: CottonCandyHistoryEntry[] = historyRaw ? JSON.parse(historyRaw) : [];
    history.unshift({ date: new Date().toISOString(), amount: -amount, reason });
    if (history.length > 200) history.splice(200);
    localStorage.setItem(CANDY_HISTORY_KEY(email), JSON.stringify(history));

    fsAddCandy(-amount); // Firestore 영구 저장
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

export function getAttendanceData(email: string): AttendanceData {
  if (typeof window === "undefined") {
    return { lastChecked: "", streak: 0, weekDays: [], totalDays: 0 };
  }
  try {
    const raw = localStorage.getItem(ATTENDANCE_KEY(email));
    if (!raw) return { lastChecked: "", streak: 0, weekDays: [], totalDays: 0 };
    const parsed = JSON.parse(raw);
    // 구버전 홈 화면이 {lastDate, streak}로 저장한 경우 호환 변환
    if (parsed && parsed.lastChecked === undefined && parsed.lastDate !== undefined) {
      return { lastChecked: parsed.lastDate || "", streak: parsed.streak || 0, weekDays: [], totalDays: parsed.streak || 0 };
    }
    return {
      lastChecked: parsed.lastChecked || "",
      streak: parsed.streak || 0,
      weekDays: parsed.weekDays || [],
      totalDays: parsed.totalDays || 0,
    };
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
    newStreak = diffDays === 1 ? data.streak + 1 : 1;
  }

  // 이번 주(월요일 기준) 출석 날짜 갱신
  const today = new Date(todayStr);
  const dayOfWeek = today.getDay(); // 0=일
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
  // 솜사탕 지급량 먼저 계산
  let earned = 50;
  let bonus = false;
  if (newStreak > 0 && newStreak % 7 === 0) {
    earned += 200;
    bonus = true;
  }

  // ── localStorage 먼저 업데이트 (즉각 UI 반영)
  localStorage.setItem(ATTENDANCE_KEY(email), JSON.stringify(newData));
  const newBalance = getCottonCandyBalance(email) + earned;
  localStorage.setItem(CC_KEY(email), String(newBalance));
  localStorage.setItem(CC_TOTAL_KEY(email), String(getCottonCandyTotal(email) + earned));

  // 히스토리 추가
  const historyRaw = localStorage.getItem(CANDY_HISTORY_KEY(email));
  const history: CottonCandyHistoryEntry[] = historyRaw ? JSON.parse(historyRaw) : [];
  history.unshift({ date: new Date().toISOString(), amount: earned, reason: bonus ? `출석 체크 (${newStreak}일 연속 보너스 포함)` : "출석 체크" });
  if (history.length > 200) history.splice(200);
  localStorage.setItem(CANDY_HISTORY_KEY(email), JSON.stringify(history));

  // 오늘 획득량
  const todayEarnedRaw = localStorage.getItem(TODAY_EARNED_KEY(email));
  const todayEarnedData = todayEarnedRaw ? JSON.parse(todayEarnedRaw) : {};
  if (todayEarnedData.date !== todayStr) { todayEarnedData.date = todayStr; todayEarnedData.earned = 0; }
  todayEarnedData.earned = (todayEarnedData.earned || 0) + earned;
  localStorage.setItem(TODAY_EARNED_KEY(email), JSON.stringify(todayEarnedData));

  // ── Firestore: 출석 + 솜사탕을 단일 write로 처리 (race condition 방지)
  const uid = currentUid();
  if (uid) {
    try {
      const db = getFirebaseFirestore();
      setDoc(
        doc(db, "users", uid),
        {
          attendance: newData,
          cottonCandy: increment(earned),
          cottonCandyTotal: increment(earned),
          lastActiveAt: serverTimestamp(),
        },
        { merge: true }
      ).catch((e) => console.warn("[출석] Firestore 저장 실패:", e));
    } catch (e) {
      console.warn("[출석] Firestore 저장 예외:", e);
    }
  }

  // ── 경험치 적립 (출석 +5) — 등급/레벨 활성화
  addExp(email, 5, "출석 체크");

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

/** 프리미엄(무료 이용) 여부 확인 */
export function isPremiumUser(email: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const cached = getCachedGameProfile(email) as any;
    if (cached?.isPremium === true) return true;
    const raw = localStorage.getItem(PROFILE_KEY(email));
    if (!raw) return false;
    return JSON.parse(raw)?.isPremium === true;
  } catch {
    return false;
  }
}

export function purchaseItem(email: string, itemId: string, price: number): { success: boolean; message: string } {
  const purchased = getPurchasedItems(email);
  if (purchased.includes(itemId)) {
    return { success: false, message: "이미 구매한 아이템입니다." };
  }

  // 💎 프리미엄 회원은 무료로 구매
  const premium = isPremiumUser(email);
  if (!premium) {
    const balance = getCottonCandyBalance(email);
    if (balance < price) {
      return { success: false, message: `솜사탕이 부족합니다. (현재 ${balance.toLocaleString()}개, 필요 ${price.toLocaleString()}개)` };
    }
    spendCottonCandy(email, price, `상점 구매: ${itemId}`);
  }

  purchased.push(itemId);
  localStorage.setItem(SHOP_KEY(email), JSON.stringify(purchased));
  return { success: true, message: premium ? "💎 프리미엄 혜택으로 무료 구매!" : "구매 완료!" };
}

// ─── 코지홈 아이템 보유/구매 (Firestore 영구 저장 + 트랜잭션 안전 차감) ───
// ownedItems 에는 shopItems 의 itemKey(slot, id) = "slot::id" 형태로 저장한다.

/** 보유한 코지홈 아이템 목록(slot::id) — localStorage 캐시 기준(동기) */
export function getOwnedShopItems(email: string): string[] {
  if (typeof window === "undefined" || !email) return [];
  try {
    const raw = localStorage.getItem(OWNED_KEY(email));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setOwnedShopCache(email: string, keys: string[]): void {
  try {
    localStorage.setItem(OWNED_KEY(email), JSON.stringify(Array.from(new Set(keys))));
  } catch {
    /* noop */
  }
}

/**
 * 코지홈 아이템 구매. Firestore 트랜잭션으로 잔액을 확인·차감하고
 * ownedItems 에 추가한다(잔액 음수/이중차감 방지). 성공 시 로컬 캐시 동기화.
 * itemKeyStr = "slot::id".
 */
export async function purchaseShopItem(
  email: string,
  itemKeyStr: string,
  price: number
): Promise<{ success: boolean; message: string; balance: number }> {
  if (typeof window === "undefined") return { success: false, message: "구매할 수 없습니다.", balance: 0 };
  if (!email) return { success: false, message: "로그인이 필요합니다.", balance: 0 };

  const owned = getOwnedShopItems(email);
  if (owned.includes(itemKeyStr)) {
    return { success: true, message: "이미 보유한 아이템입니다.", balance: getCottonCandyBalance(email) };
  }

  // 💎 프리미엄 회원: 무료 지급
  if (isPremiumUser(email)) {
    const next = [...owned, itemKeyStr];
    setOwnedShopCache(email, next);
    const uid = currentUid();
    if (uid) {
      try {
        await setDoc(doc(getFirebaseFirestore(), "users", uid), { ownedItems: arrayUnion(itemKeyStr), lastActiveAt: serverTimestamp() }, { merge: true });
      } catch { /* 캐시는 이미 반영됨 */ }
    }
    window.dispatchEvent(new Event("dori-gamedata-synced"));
    return { success: true, message: "💎 프리미엄 혜택으로 무료 획득!", balance: getCottonCandyBalance(email) };
  }

  const uid = currentUid();
  // 로그인은 됐지만 uid 를 못 읽는 예외 상황 — 로컬 잔액으로라도 처리(차선)
  if (!uid) {
    const bal = getCottonCandyBalance(email);
    if (bal < price) return { success: false, message: `솜사탕이 부족해요. (보유 ${bal.toLocaleString()} / 필요 ${price.toLocaleString()})`, balance: bal };
    const ok = spendCottonCandy(email, price, `상점 구매: ${itemKeyStr}`);
    if (!ok) return { success: false, message: "구매에 실패했어요.", balance: bal };
    setOwnedShopCache(email, [...owned, itemKeyStr]);
    window.dispatchEvent(new Event("dori-gamedata-synced"));
    return { success: true, message: "구매 완료!", balance: getCottonCandyBalance(email) };
  }

  // 정상 경로: Firestore 트랜잭션 (서버 잔액 기준 원자적 차감 + 보유 추가)
  try {
    const db = getFirebaseFirestore();
    const ref = doc(db, "users", uid);
    let newBalance = 0;
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      const cur = Number(snap.data()?.cottonCandy ?? getCottonCandyBalance(email));
      const already: string[] = Array.isArray(snap.data()?.ownedItems) ? (snap.data()!.ownedItems as string[]) : [];
      if (already.includes(itemKeyStr)) { newBalance = cur; return; } // 다른 기기에서 이미 구매
      if (cur < price) throw new Error("INSUFFICIENT");
      newBalance = cur - price;
      tx.set(ref, { cottonCandy: newBalance, ownedItems: arrayUnion(itemKeyStr), lastActiveAt: serverTimestamp() }, { merge: true });
    });
    // 로컬 캐시 동기화 (잔액 + 보유 + 히스토리)
    localStorage.setItem(CC_KEY(email), String(newBalance));
    setOwnedShopCache(email, [...owned, itemKeyStr]);
    try {
      const hraw = localStorage.getItem(CANDY_HISTORY_KEY(email));
      const history: CottonCandyHistoryEntry[] = hraw ? JSON.parse(hraw) : [];
      history.unshift({ date: new Date().toISOString(), amount: -price, reason: `상점 구매: ${itemKeyStr}` });
      if (history.length > 200) history.splice(200);
      localStorage.setItem(CANDY_HISTORY_KEY(email), JSON.stringify(history));
    } catch { /* noop */ }
    window.dispatchEvent(new Event("dori-gamedata-synced"));
    return { success: true, message: "구매 완료!", balance: newBalance };
  } catch (e: unknown) {
    const bal = getCottonCandyBalance(email);
    if (e instanceof Error && e.message === "INSUFFICIENT") {
      return { success: false, message: `솜사탕이 부족해요. (보유 ${bal.toLocaleString()} / 필요 ${price.toLocaleString()})`, balance: bal };
    }
    return { success: false, message: "네트워크 오류로 구매에 실패했어요. 잠시 후 다시 시도해주세요.", balance: bal };
  }
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
