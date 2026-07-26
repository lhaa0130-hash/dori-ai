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

// ⚠️ P0 보안(05-07): 클라이언트에서 cottonCandy/cottonCandyTotal 을 Firestore 에 쓰던 fsAddCandy 는 제거됐다.
//   localStorage 게이트만 통과하면 임의 금액을 increment 할 수 있어 무한 지급이 가능했다(=P0).
//   이제 재화 증감은 전부 서버 권위 경로만 사용한다:
//     · 적립 → POST /api/claim-reward (금액·상한·멱등을 서버가 소유, lib/gameReward.ts)
//     · 차감 → POST /api/purchase     (가격·프리미엄·보유판정을 서버가 소유, lib/shopClient.ts)
//   아래 로컬 함수들은 '표시 캐시'만 갱신한다. Firestore Rules 도 cottonCandy 변경을 차단한다.
//   (레거시 라이터가 재등장하면 tests/candy-cutover-guard.test.ts 가 실패한다.)

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
// ⚠️ P0(05-07): 클라이언트에서 대상 users 문서를 직접 쓰던 경로와, 실패 시 notifications 에
//    '지급 예약'을 남기고 대상이 스스로 본인 문서에 반영하던 경로를 **전부 제거**했다.
//    알림 생성 규칙은 `fromUid == auth.uid && fromUid != uid` 만 요구하므로, 누구나 **다른 uid 의
//    알림함**에 금액을 마음대로 적은 candy_grant 를 넣을 수 있었다 → 계정 두 개로 무한 재화·프리미엄(=P0).
//    이제 관리자 지급은 서버가 관리자임을 확인하고 서버가 반영한다(POST /api/admin/grant).
export type GrantResult = { mode: "instant" | "queued" | "fail"; error?: string };

async function adminIdToken(): Promise<string | null> {
  try { return (await getFirebaseAuth().currentUser?.getIdToken()) ?? null; } catch { return null; }
}

/** 지급 요청마다 안정적인 operationId — 재시도해도 이중 지급되지 않는다. */
function grantOperationId(): string {
  const rnd = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID().replace(/-/g, "")
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return `grant_${rnd}`.slice(0, 86);
}

async function callAdminGrant(payload: Record<string, unknown>): Promise<GrantResult> {
  const t = await adminIdToken();
  if (!t) return { mode: "fail", error: "로그인이 필요합니다." };
  try {
    const res = await fetch("/api/admin/grant", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify({ operationId: grantOperationId(), ...payload }),
    });
    const json: any = await res.json().catch(() => null);
    if (res.status === 200 && json?.ok) return { mode: "instant" };
    // 초기 배포 정책(05-07C): REWARD_ADMIN_UIDS 미설정 → 관리자 지급만 fail-closed 로 꺼둔다.
    //   '장애'가 아니라 '의도된 비활성'이므로 관리자가 바로 알아볼 수 있게 문구를 분리한다.
    if (res.status === 503 && json?.error === "reward_admin_not_configured") {
      return { mode: "fail", error: "관리자 지급 기능이 꺼져 있습니다(REWARD_ADMIN_UIDS 미설정). 의도된 상태입니다." };
    }
    if (res.status === 403 && json?.error === "self_grant_forbidden") return { mode: "fail", error: "본인 계정에는 지급할 수 없습니다." };
    if (res.status === 403) return { mode: "fail", error: "관리자 권한이 없습니다." };
    if (res.status === 401) return { mode: "fail", error: "인증이 만료됐습니다. 다시 로그인해 주세요." };
    if (res.status === 409) return { mode: "fail", error: "같은 요청 ID가 다른 금액으로 이미 사용됐습니다." };
    return { mode: "fail", error: String(json?.detail || json?.error || `http_${res.status}`) };
  } catch {
    return { mode: "fail", error: "network" };
  }
}

export async function adminGrantCandy(
  targetUid: string,
  amount: number,
  _fromName = "관리자"
): Promise<GrantResult> {
  if (!targetUid || !amount) return { mode: "fail", error: "대상/금액 오류" };
  return await callAdminGrant({ targetUid, candy: amount });
}

export async function adminSetPremium(targetUid: string, isPremium: boolean): Promise<GrantResult> {
  if (!targetUid) return { mode: "fail", error: "대상 오류" };
  return await callAdminGrant({ targetUid, isPremium });
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

    // ── 솜사탕 잔액: **서버 값을 그대로 채택**한다(05-07).
    //   예전엔 `Firestore >= 로컬일 때만` 반영해서, 로컬을 999999 로 조작하면 영원히 서버 값으로
    //   내려오지 않았다(=표시 위조 + 상점 잔액판정 오염). EXP 와 동일하게 서버가 단일 원본이다.
    if (typeof d.cottonCandy === "number") {
      localStorage.setItem(CC_KEY(email), String(Math.max(0, Math.floor(d.cottonCandy))));
    }
    if (typeof d.cottonCandyTotal === "number") {
      localStorage.setItem(CC_TOTAL_KEY(email), String(Math.max(0, Math.floor(d.cottonCandyTotal))));
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
    // ⚠️ P0(05-06K): EXP 는 서버가 유일한 권위다. 예전엔 Math.max(서버, 로컬)로 "절대 내리지 않음"
    //   이었는데(클라 적립이 서버보다 앞설 수 있었던 시절의 규칙), 이제 클라는 EXP 를 만들지 않는다.
    //   그 규칙을 남겨두면 조작된 로컬 캐시(예: 999999)가 영원히 화면에 남아 서버 값으로 복구되지 않는다.
    //   → 서버 값을 그대로 채택한다(조작 캐시 자동 교정).
    const localProfile = getCachedGameProfile(email);
    const finalExp = d.doriExp || 0;
    localStorage.setItem(
      GAME_PROFILE_KEY(email),
      JSON.stringify({
        cottonCandy: Math.max(0, Math.floor(d.cottonCandy || 0)),   // 05-07: 서버 값 채택(로컬 max 금지)
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
    // ⚠️ 05-07: '지급 예약 자동 반영'(applyPendingCandyGrants) 제거.
    //    관리자 지급은 서버(POST /api/admin/grant)가 대상 문서에 직접 반영하므로,
    //    다음 hydrate 에서 자연히 내려온다. 클라이언트가 자기 잔액을 올릴 통로는 남기지 않는다.
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

// ⚠️ P0 보안(05-06H): 클라이언트는 더 이상 doriExp/level/tier 를 Firestore 에 쓰지 않는다.
//   과거의 클라이언트 EXP 라이터 4종(경험치 적립·절대 끌어올림·게임프로필 기록·Firestore EXP set)은
//   localStorage 캐시를 근거로 서버 EXP 를 절대값 merge 로 덮어써 조작에 취약했다(=P0). 전부 제거됨.
//   이제 EXP 적립은 전부 서버 권위 엔드포인트(POST /api/claim-reward)를 통한다
//   — lib/gameReward.ts 의 submitGameReward 참고. 화면 수치는 서버 응답 후 hydrateGameData 가 재동기화.
//   (레거시 라이터가 재등장하면 tests/reward-cutover-guard.test.ts 가 실패한다.)

/** 현재 경험치(동기, 캐시 기준 — 읽기 전용). */
export function getDoriExp(email: string): number {
  return getCachedGameProfile(email)?.doriExp || 0;
}

/**
 * 서버 보상 응답(권위 값)을 화면 캐시에 그대로 반영한다(05-06K).
 *  · 클라이언트는 EXP 를 계산하지 않는다 — 서버가 준 doriExp/level/tier 를 받아쓰기만 한다.
 *  · Firestore 재조회(hydrate)는 방금 커밋과 경합할 수 있어 표시가 늦는다. 응답으로 즉시 교정한다.
 *  · 조작된 캐시(예: 999999)도 이 경로에서 서버 값으로 내려간다.
 */
export function applyServerRewardResult(result: { doriExp?: number; level?: number; tier?: number; cottonCandy?: number }): void {
  if (typeof window === "undefined") return;
  const exp = typeof result?.doriExp === "number" && result.doriExp >= 0 ? Math.floor(result.doriExp) : null;
  // 05-07: 솜사탕도 서버 응답 값을 그대로 채택한다(클라 계산·낙관적 증가 없음).
  const candy = typeof result?.cottonCandy === "number" && result.cottonCandy >= 0 ? Math.floor(result.cottonCandy) : null;
  if (exp === null && candy === null) return;
  try {
    const email = getFirebaseAuth().currentUser?.email;
    if (!email) return;
    const cur = getCachedGameProfile(email) || { cottonCandy: 0, doriExp: 0, tier: 1, level: 1 };
    const next = { ...cur };
    if (exp !== null) {
      next.doriExp = exp;
      next.tier = typeof result.tier === "number" ? result.tier : calculateTier(exp);
      next.level = typeof result.level === "number" ? result.level : calculateLevel(exp);
    }
    if (candy !== null) {
      next.cottonCandy = candy;
      localStorage.setItem(CC_KEY(email), String(candy));
    }
    localStorage.setItem(GAME_PROFILE_KEY(email), JSON.stringify(next));
    window.dispatchEvent(new Event("dori-gamedata-synced"));
  } catch { /* noop */ }
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

/**
 * 서버가 확정한 지급을 **내역/오늘 획득량 표시**에만 기록한다(05-07). 잔액은 건드리지 않는다.
 * 잔액의 단일 원본은 서버 응답(applyServerRewardResult) → hydrateGameData 다.
 */
export function recordCandyHistory(email: string, amount: number, reason: string): void {
  if (typeof window === "undefined" || !email || amount <= 0) return;
  try {
    const historyRaw = localStorage.getItem(CANDY_HISTORY_KEY(email));
    const history: CottonCandyHistoryEntry[] = historyRaw ? JSON.parse(historyRaw) : [];
    history.unshift({ date: new Date().toISOString(), amount, reason });
    if (history.length > 200) history.splice(200);
    localStorage.setItem(CANDY_HISTORY_KEY(email), JSON.stringify(history));

    const todayStr = getTodayDateStr();
    const todayRaw = localStorage.getItem(TODAY_EARNED_KEY(email));
    const todayData = todayRaw ? JSON.parse(todayRaw) : {};
    if (todayData.date !== todayStr) { todayData.date = todayStr; todayData.earned = 0; }
    todayData.earned = (todayData.earned || 0) + amount;
    localStorage.setItem(TODAY_EARNED_KEY(email), JSON.stringify(todayData));
  } catch { /* noop */ }
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

/**
 * 플레이타임 보상 청구(05-07 — 서버 권위).
 *  · 금액(`_amount`)은 더 이상 클라이언트가 정하지 않는다. 서버 정책표(minigame_play)가 소유한다.
 *  · **서버가 지급을 확정한 뒤에만** granted=true 를 돌려준다("지급 전 성공 표시 금지").
 *  · 로컬 날짜 키는 중복 요청을 줄이는 힌트일 뿐, 실제 1일 1회 보장은 서버 원장(operationId)이 한다.
 */
export async function grantPlaytimeReward(
  email: string,
  _amount = 50
): Promise<{ granted: boolean; amount: number }> {
  if (typeof window === "undefined" || !email) return { granted: false, amount: 0 };
  const todayStr = getTodayDateStr();
  try {
    if (localStorage.getItem(PLAYTIME_REWARD_KEY(email)) === todayStr) {
      return { granted: false, amount: 0 };
    }
    const m = await import("./gameReward");
    const outcome = await m.claimGameReward("minigame_play", { sourceId: `playtime_${todayStr}` });
    if (outcome.status !== "applied" && outcome.status !== "duplicate") {
      return { granted: false, amount: 0 }; // 미지급 → 로컬 키도 남기지 않는다(다음에 재시도)
    }
    localStorage.setItem(PLAYTIME_REWARD_KEY(email), todayStr);
    const awarded = Number(outcome.result?.awardedCandy) || 0;
    // 잔액 캐시는 applyServerRewardResult 가 서버 값으로 이미 확정했다.
    if (awarded > 0) recordCandyHistory(email, awarded, "1분 이상 플레이 보상");
    // 05-07: 일일 미션 '미니게임 1판'도 **실제 플레이가 확인된 이 자리**에서만 완료 처리한다.
    void completeMission(email, "play_minigame");
    return { granted: awarded > 0, amount: awarded };
  } catch {
    return { granted: false, amount: 0 };
  }
}

/**
 * 솜사탕 차감 **표시 캐시**만 반영(05-07). Firestore 를 쓰지 않는다.
 * 실제 차감은 서버(POST /api/purchase)가 한다 — 클라 차감은 화면 지연을 없애기 위한 것뿐이다.
 */
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

/** @deprecated 05-07 — 호출부 없음. 출석 지급은 claimDailyAttendance(서버 권위)만 사용한다. */
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

  // ⚠️ P0(05-07): 여기서 하던 Firestore cottonCandy/cottonCandyTotal increment 를 제거했다.
  //   실제 출석 지급은 서버 권위 경로(claimDailyAttendance → POST /api/claim-reward)가 소유한다.
  //   이 함수는 현재 호출부가 없는 레거시이며, 로컬 표시 계산만 남긴다.

  // ── 경험치 적립: 서버 권위 청구(daily_attendance). 클라이언트는 금액을 정하지 않는다.
  //    (레거시 addExp(+5) 제거 — 서버가 출석 EXP·상한·멱등을 소유)
  void import("./gameReward").then((m) => m.submitGameReward("game_activity", { seed: `attendance_${todayStr}`, kind: "attendance" })).catch(() => {});

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

/**
 * 미션 완료 청구(05-07 — 서버 권위).
 *  · ⚠️ 이 함수는 **실제 활동이 일어난 그 자리**에서만 호출한다. '받기' 버튼으로 호출하지 않는다.
 *    (예전엔 /my 의 받기 버튼이 활동 없이 클라 인자 reward 만큼 지급했다 = P0)
 *  · 금액은 서버 정책표(MISSION_CANDY)가 소유한다. 클라이언트는 missionId 와 날짜만 보낸다.
 *  · operationId = mission_{missionId}_{날짜} → 미션당 1일 1회를 서버 원장이 보장한다.
 *    (localStorage 를 지워도 재수령되지 않는다.)
 */
export async function completeMission(
  email: string, missionId: string, reason = `미션 완료: ${missionId}`,
): Promise<{ granted: boolean; amount: number }> {
  if (typeof window === "undefined" || !email) return { granted: false, amount: 0 };
  const todayStr = getTodayDateStr();
  if (isMissionCompletedToday(email, missionId)) return { granted: false, amount: 0 };
  try {
    const m = await import("./gameReward");
    const outcome = await m.claimGameReward("mission_complete", { sourceId: `${missionId}_${todayStr}` });
    if (outcome.status !== "applied" && outcome.status !== "duplicate") return { granted: false, amount: 0 };

    const statuses = getMissionStatuses(email).filter((s) => s.id !== missionId);
    statuses.push({ id: missionId, completedDate: todayStr });
    localStorage.setItem(MISSIONS_KEY(email), JSON.stringify(statuses));
    const awarded = Number(outcome.result?.awardedCandy) || 0;
    if (awarded > 0) recordCandyHistory(email, awarded, reason);
    return { granted: awarded > 0, amount: awarded };
  } catch {
    return { granted: false, amount: 0 };
  }
}

// ─── 업적 시스템 ───────────────────────────────────────────────────

export interface Achievement {
  id: string;
  emoji: string;
  name: string;
  description: string;
  nameEn: string;        // 영어판(/en/*) 표기 — 값 자체는 id 로 저장되므로 표시용
  descriptionEn: string;
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
  { id: "first_visit",   emoji: "🎉", name: "첫 방문",          description: "illo에 처음 방문", nameEn: "First visit", descriptionEn: "Visited illo for the first time",           reward: 10,   condition: () => true },
  { id: "first_post",    emoji: "📝", name: "첫 글쓰기",        description: "커뮤니티 글 1개 작성", nameEn: "First post", descriptionEn: "Wrote your first community post",           reward: 50,   condition: (s) => s.totalPosts >= 1 },
  { id: "comment_king",  emoji: "💬", name: "댓글왕",           description: "댓글 10개 달기", nameEn: "Comment king", descriptionEn: "Left 10 comments",                 reward: 100,  condition: (s) => s.totalComments >= 10 },
  { id: "streak_3",      emoji: "🔥", name: "3일 연속 출석",    description: "3일 연속으로 출석", nameEn: "3-day streak", descriptionEn: "Checked in 3 days in a row",              reward: 100,  condition: (s) => s.streak >= 3 },
  { id: "streak_7",      emoji: "📅", name: "7일 연속 출석",    description: "7일 연속으로 출석", nameEn: "7-day streak", descriptionEn: "Checked in 7 days in a row",              reward: 300,  condition: (s) => s.streak >= 7 },
  { id: "streak_30",     emoji: "🏆", name: "한 달 개근",       description: "30일 연속으로 출석", nameEn: "Perfect month", descriptionEn: "Checked in 30 days in a row",             reward: 1000, condition: (s) => s.streak >= 30 },
  { id: "popular",       emoji: "👍", name: "인기쟁이",         description: "받은 좋아요 10개", nameEn: "Crowd pleaser", descriptionEn: "Received 10 likes",               reward: 150,  condition: (s) => s.totalReceivedLikes >= 10 },
  { id: "game_king",     emoji: "🎮", name: "게임왕",           description: "미니게임 10판 플레이", nameEn: "Game king", descriptionEn: "Played 10 mini-games",           reward: 200,  condition: (s) => s.minigamePlays >= 10 },
  { id: "quiz_master",   emoji: "🤓", name: "퀴즈마스터",       description: "퀴즈 20문제 정답", nameEn: "Quiz master", descriptionEn: "Answered 20 quiz questions correctly",               reward: 250,  condition: (s) => s.quizCorrect >= 20 },
  { id: "level_10",      emoji: "💎", name: "레벨 10 달성",     description: "레벨 10에 도달", nameEn: "Level 10", descriptionEn: "Reached level 10",                 reward: 500,  condition: (s) => s.level >= 10 },
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

/**
 * 업적 수령(05-07 — 서버 권위). 금액은 서버 표(ACHIEVEMENT_CANDY)가 소유하고,
 * 원장(ach_{id})이 **평생 1회**를 보장한다. 지급된 뒤에만 로컬 수령 표시를 남긴다.
 */
export async function claimAchievement(email: string, achievementId: string): Promise<number> {
  if (typeof window === "undefined" || !email) return 0;
  const achievement = ACHIEVEMENTS.find((a) => a.id === achievementId);
  if (!achievement) return 0;

  const claimed = getClaimedAchievements(email);
  if (claimed.includes(achievementId)) return 0;

  try {
    const m = await import("./gameReward");
    const outcome = await m.claimGameReward("achievement_claim", { sourceId: achievementId });
    if (outcome.status !== "applied" && outcome.status !== "duplicate") return 0;

    claimed.push(achievementId);
    localStorage.setItem(ACHIEVEMENT_CLAIMED_KEY(email), JSON.stringify(claimed));
    const awarded = Number(outcome.result?.awardedCandy) || 0;
    if (awarded > 0) recordCandyHistory(email, awarded, `업적 달성: ${achievement.name}`);
    return awarded;
  } catch {
    return 0;
  }
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

/**
 * 레벨 보상 수령(05-07 — 서버 권위·서버 검증).
 * 서버가 users.doriExp 로 레벨을 **재계산**해 도달 여부를 확인하므로,
 * 로컬 캐시 레벨을 조작해도 지급되지 않는다(level_not_reached).
 */
export async function claimLevelReward(email: string, level: number): Promise<number> {
  if (typeof window === "undefined" || !email) return 0;
  const rewardEntry = LEVEL_REWARDS.find((r) => r.level === level);
  if (!rewardEntry) return 0;

  const claimed = getClaimedLevelRewards(email);
  if (claimed.includes(level)) return 0;

  try {
    const m = await import("./gameReward");
    const outcome = await m.claimGameReward("level_reward", { sourceId: String(level) });
    if (outcome.status !== "applied" && outcome.status !== "duplicate") return 0;

    claimed.push(level);
    localStorage.setItem(LEVEL_REWARD_KEY(email), JSON.stringify(claimed));
    const awarded = Number(outcome.result?.awardedCandy) || 0;
    if (awarded > 0) recordCandyHistory(email, awarded, `레벨 ${level} 달성 보상`);
    return awarded;
  } catch {
    return 0;
  }
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

/**
 * 프리미엄 여부 — **표시 전용**(05-07).
 *  · 결제 판정에 쓰지 않는다. 무료 지급 여부는 서버(POST /api/purchase)가 users/{uid}.isPremium 으로만 정한다.
 *  · 값의 출처를 hydrateGameData 가 Firestore 에서 받아 넣은 게임 프로필 캐시로 좁혔다.
 *    (예전엔 사용자가 자유롭게 쓰는 PROFILE_KEY 블롭도 봤다 → 로컬 플래그 하나로 전 품목 무료였음)
 */
export function isPremiumUser(email: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return (getCachedGameProfile(email) as any)?.isPremium === true;
  } catch {
    return false;
  }
}

/** @deprecated 05-07 — 호출부 없음. 상점 구매는 purchaseShopItem(서버 권위)만 사용한다. */
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
// 구매 결과 안내 문구. 영어판(/en/shop)에서도 같은 함수를 쓰므로 로케일을 받는다.
// ⚠️ 히스토리 reason("상점 구매: …")은 저장되는 데이터 값이라 한글 고정 — 번역 대상 아님.
const BUY_MSG = {
  ko: {
    cannot: "구매할 수 없습니다.",
    needLogin: "로그인이 필요합니다.",
    alreadyOwned: "이미 보유한 아이템입니다.",
    premiumFree: "💎 프리미엄 혜택으로 무료 획득!",
    short: (bal: number, price: number) => `솜사탕이 부족해요. (보유 ${bal.toLocaleString()} / 필요 ${price.toLocaleString()})`,
    failed: "구매에 실패했어요.",
    done: "구매 완료!",
    network: "네트워크 오류로 구매에 실패했어요. 잠시 후 다시 시도해주세요.",
  },
  en: {
    cannot: "Purchase is unavailable.",
    needLogin: "Please sign in first.",
    alreadyOwned: "You already own this item.",
    premiumFree: "💎 Claimed free with your premium benefit!",
    short: (bal: number, price: number) => `Not enough cotton candy. (You have ${bal.toLocaleString()} / need ${price.toLocaleString()})`,
    failed: "Purchase failed.",
    done: "Purchase complete!",
    network: "Purchase failed due to a network error. Please try again in a moment.",
  },
} as const;

/**
 * 상점 구매 — 서버 권위 경로(POST /api/purchase)로만 처리한다. (05-07 P0)
 *
 * ⚠️ 이 함수가 예전에 가지고 있던 취약점(전부 제거됨):
 *   1) `price` 를 클라이언트 인자로 받아 그대로 차감 → 0 으로 호출하면 무료였다.
 *   2) `isPremiumUser()` 가 localStorage 만 보고 무료 지급 + `ownedItems` 를 Firestore 에 직접 기록
 *      → 로컬 플래그 위조만으로 전 품목 영구 획득이 가능했다.
 *   3) uid 를 못 읽을 때 로컬 잔액만으로 구매를 성립시키는 폴백이 있었다.
 * 이제 가격·프리미엄·보유판정·차감·지급은 **서버 트랜잭션**이 전담하고,
 * 클라이언트는 itemKey 만 보내며 서버가 돌려준 잔액을 그대로 채택한다.
 *
 * ⚠️ price 파라미터는 호출부 호환을 위해 남겨두지만 **전송하지 않으며 판정에도 쓰지 않는다.**
 */
export async function purchaseShopItem(
  email: string,
  itemKeyStr: string,
  _price?: number,
  locale: "ko" | "en" = "ko"
): Promise<{ success: boolean; message: string; balance: number }> {
  const m = BUY_MSG[locale] || BUY_MSG.ko;
  if (typeof window === "undefined") return { success: false, message: m.cannot, balance: 0 };
  if (!email) return { success: false, message: m.needLogin, balance: 0 };

  const { purchaseItemOnServer } = await import("./shopClient");
  const r = await purchaseItemOnServer(itemKeyStr);

  if (r.status === "ok") {
    // 서버 응답이 최종값 — 로컬 캐시는 여기서만 수렴시킨다.
    try { localStorage.setItem(CC_KEY(email), String(r.balance)); } catch { /* noop */ }
    setOwnedShopCache(email, Array.from(new Set([...getOwnedShopItems(email), itemKeyStr])));
    if (r.charged > 0) {
      try {
        const hraw = localStorage.getItem(CANDY_HISTORY_KEY(email));
        const history: CottonCandyHistoryEntry[] = hraw ? JSON.parse(hraw) : [];
        history.unshift({ date: new Date().toISOString(), amount: -r.charged, reason: `상점 구매: ${itemKeyStr}` });
        if (history.length > 200) history.splice(200);
        localStorage.setItem(CANDY_HISTORY_KEY(email), JSON.stringify(history));
      } catch { /* noop */ }
    }
    window.dispatchEvent(new Event("dori-gamedata-synced"));
    const msg = r.duplicate ? m.alreadyOwned : r.premiumGrant ? m.premiumFree : m.done;
    return { success: true, message: msg, balance: r.balance };
  }
  if (r.status === "insufficient") return { success: false, message: m.short(r.balance, r.price), balance: r.balance };
  if (r.status === "unauthenticated") return { success: false, message: m.needLogin, balance: getCottonCandyBalance(email) };
  if (r.status === "retry") return { success: false, message: m.network, balance: getCottonCandyBalance(email) };
  return { success: false, message: m.failed, balance: getCottonCandyBalance(email) };
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
