// My World — 현재 운영 원본과 미래 서버 원본의 '경계'를 코드로 확정하는 최소 기반 (04-16).
// ─────────────────────────────────────────────────────────────────────────────
// ⚠️ 사실관계(04-16 실측):
//   · 재화·경험치·출석 등 성장 데이터의 '현재 운영 원본'은 이미 users/{uid} 다(uid 키).
//     - cottonCandy, cottonCandyTotal, doriExp, tier, level, attendance{...}, ownedItems[]
//     - 쓰기 경로: lib/gameData.ts, lib/cottonCandy.ts 가 전부 '클라이언트에서' increment/직접 계산.
//   · localStorage(dori_cc_${email} 등)는 email 네임스페이스의 '기기 로컬 캐시'일 뿐, 원본이 아니다.
//   · email 을 Firestore 문서 ID/쿼리로 쓰는 경로는 없다(실측 0건). 서버 식별자는 uid.
//
// 🔴 미해결 P0(이 파일이 '해결'하지 않는다 — 정확히 기록만):
//   users/{uid} 쓰기 규칙은 소유자면 PII 외 아무 필드나 쓰게 허용한다. 따라서 로그인 사용자가
//   DevTools 로 cottonCandy/doriExp 를 임의 값으로 바꿀 수 있다. 정당한 보상도 클라이언트가
//   increment(N) 을 부르는 동일 형태라 'Firestore Rules 만으로 정당/조작을 구분할 수 없다'.
//   → 재화 무결성은 '신뢰 가능한 서버 지급 경로'(Cloud Function/Admin)가 선결. 이번 단계 범위 밖.
//
// 이 파일이 하는 것(04-16 범위):
//   1) '현재 운영 원본' users/{uid} 를 uid 로 읽어 안전 정규화하는 읽기 계층(getCurrentMyWorldState).
//   2) localStorage 레거시를 '읽기 전용'으로 읽어, '현재 users 서버값'과 '비교만' 하는 어댑터.
//   3) '미래 목표 스키마'(TargetMyWorldState = userProgress) 를 타입/정규화 수준에서 '설계'로만 정의.
//      → 미래 마이그레이션 대상일 뿐, 운영 원본이 아니다. 이번 단계에서 컬렉션·Rules·문서를 만들지 않는다.
//
// 이 파일이 하지 않는 것: UI 연결 / 서버 쓰기 / 자동 이관 / localStorage 삭제 /
//   users Rules 변경 / userProgress 컬렉션·Rules 생성 / 프로덕션 문서 생성.

import { doc, getDoc } from "firebase/firestore";
import { getFirebaseFirestore } from "@/lib/firebase";
import { calculateLevel } from "@/lib/userProfile";

// 값 안전 상한 — 원본 신뢰가 아니라 '방어적 정규화'(표시·판정 폭주 방지).
export const CURRENCY_MAX = 100_000_000;
export const XP_MAX = 100_000_000;
export const LEVEL_MAX = 100;

// ── 안전 숫자/날짜 정규화 헬퍼(순수) ──────────────────────────────────────────
//  문자열 숫자 자동 신뢰 금지 / NaN·Infinity 차단 / 음수 0 클램프 / 정수화 / 상한.
function safeInt(v: unknown, max: number, def = 0): number {
  if (typeof v !== "number") return def;
  if (!Number.isFinite(v)) return def;
  if (v < 0) return 0;
  const n = Math.floor(v);
  return n > max ? max : n;
}
function normalizeDateStr(v: unknown): string | null {
  if (typeof v !== "string") return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
}

// ═══════════════════════════════════════════════════════════════════════════
//  A. 현재 운영 원본 — users/{uid} (실제로 UI·게임이 읽고 쓰는 곳)
// ═══════════════════════════════════════════════════════════════════════════

// 현재 원본 상태(정규화된 읽기 뷰). source 를 명시해 '어디서 왔는지'를 코드로 못박는다.
export interface CurrentMyWorldState {
  source: "users";              // 현재 원본은 users/{uid}
  currencies: { cottonCandy: number };
  progression: { xp: number; level: number }; // xp=doriExp 원본, level=xp 파생(저장값 불신)
  attendance: { streak: number; lastChecked: string | null };
  inventorySummary: { totalItems: number };    // ownedItems.length
}

/** users/{uid} 문서(임의 입력)를 CurrentMyWorldState 로 안전 정규화(순수·비변형). */
export function normalizeCurrentFromUsers(raw: unknown): CurrentMyWorldState {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const att = (r.attendance && typeof r.attendance === "object" ? r.attendance : {}) as Record<string, unknown>;
  const owned = Array.isArray(r.ownedItems) ? (r.ownedItems as unknown[]) : [];
  const xp = safeInt(r.doriExp, XP_MAX);
  return {
    source: "users",
    currencies: { cottonCandy: safeInt(r.cottonCandy, CURRENCY_MAX) },
    progression: { xp, level: Math.min(LEVEL_MAX, Math.max(1, calculateLevel(xp))) },
    attendance: {
      streak: safeInt(att.streak, 100_000),
      lastChecked: normalizeDateStr(att.lastChecked),
    },
    inventorySummary: { totalItems: owned.length },
  };
}

/**
 * 현재 운영 원본 읽기 — uid 로 users/{uid} 를 읽는다(email 아님).
 *  · 문서 없으면 null. 오류 시 null(localStorage 를 원본처럼 승격하지 않는다).
 *  · 읽기 전용. 여기서 문서를 만들지 않는다.
 */
export async function getCurrentMyWorldState(uid: string): Promise<CurrentMyWorldState | null> {
  if (!uid || typeof uid !== "string") return null;
  try {
    const snap = await getDoc(doc(getFirebaseFirestore(), "users", uid));
    if (!snap.exists()) return null;
    return normalizeCurrentFromUsers(snap.data());
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  B. 미래 목표 스키마 — userProgress/{uid} (설계 전용, 이번 단계 미생성)
// ═══════════════════════════════════════════════════════════════════════════
//  ⚠️ 아직 운영 원본이 아니다. 운영 앱은 이 컬렉션을 읽지도 쓰지도 않는다.
//     '언젠가 users/{uid} 의 성장 필드를 신뢰 서버 경로와 함께 이관할 목표 형태'로만 정의한다.
//     운영 read 함수(getDoc)는 의도적으로 노출하지 않는다(이중 원본 오인 방지).

export const TARGET_SCHEMA_VERSION = 1;
export const TARGET_COLLECTION = "userProgress"; // 미래 대상 컬렉션 이름(미생성)

export interface TargetMyWorldState {
  schemaVersion: number;
  currencies: { cottonCandy: number };
  progression: { xp: number; level: number };
  missionSummary: { dailyCompletedCount: number; currentStreak: number; lastResetDate: string | null };
  inventorySummary: { totalItems: number };
}

/** 미래 대상 문서 정규화(순수). 이관 로직·설계 검증용. 운영 read 아님. */
export function normalizeTargetState(raw: unknown): TargetMyWorldState {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const cur = (r.currencies && typeof r.currencies === "object" ? r.currencies : {}) as Record<string, unknown>;
  const prog = (r.progression && typeof r.progression === "object" ? r.progression : {}) as Record<string, unknown>;
  const mis = (r.missionSummary && typeof r.missionSummary === "object" ? r.missionSummary : {}) as Record<string, unknown>;
  const inv = (r.inventorySummary && typeof r.inventorySummary === "object" ? r.inventorySummary : {}) as Record<string, unknown>;
  const xp = safeInt(prog.xp, XP_MAX);
  return {
    schemaVersion: safeInt(r.schemaVersion, 1_000_000, TARGET_SCHEMA_VERSION) || TARGET_SCHEMA_VERSION,
    currencies: { cottonCandy: safeInt(cur.cottonCandy, CURRENCY_MAX) },
    progression: { xp, level: Math.min(LEVEL_MAX, Math.max(1, calculateLevel(xp))) },
    missionSummary: {
      dailyCompletedCount: safeInt(mis.dailyCompletedCount, 10_000),
      currentStreak: safeInt(mis.currentStreak, 100_000),
      lastResetDate: normalizeDateStr(mis.lastResetDate),
    },
    inventorySummary: { totalItems: safeInt(inv.totalItems, 1_000_000) },
  };
}

// 미래 Inventory 구조(설계 전용, 미생성): userProgress/{uid}/inventory/{itemId} 서브컬렉션(구조 B).
//  근거: 아이템 수 증가·수량형·장착 상태·개별 삭제·구매 기록에 유리, 사용자 문서 배열 비대화 회피.
export type InventoryCategory = "room" | "avatar" | "pet" | "collectible";
export interface InventoryItem {
  itemId: string;
  category: InventoryCategory;
  quantity: number;
  acquiredAt: number;
  source: string;
  equipped: boolean;
}
export const INVENTORY_CATEGORIES: InventoryCategory[] = ["room", "avatar", "pet", "collectible"];

// ═══════════════════════════════════════════════════════════════════════════
//  C. 레거시(localStorage) 읽기 전용 어댑터 + '현재 users 서버값'과 비교
// ═══════════════════════════════════════════════════════════════════════════
//  ⚠️ email 만으로 현재 사용자를 판별하지 않는다. 호출부가 현재 Auth 계정의 email 을 넘겨야 하며,
//     다른 계정의 레거시 키는 읽지 않는다. 값은 로그로 남기지 않는다.

export interface LegacyMyWorldState {
  cottonCandy: number | null;
  xp: number | null;
  level: number | null;
  ownedCount: number | null;
}

const LEGACY_CC_KEY = (email: string) => `dori_cc_${email}`;
const LEGACY_GAME_PROFILE_KEY = (email: string) => `dori_game_profile_${email}`;
const LEGACY_OWNED_KEY = (email: string) => `dori_owned_${email}`;

function lsGet(key: string): string | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** 현재 로그인 계정 email 로만 레거시 캐시를 읽는다(읽기 전용). 미존재 필드는 null. */
export function getLegacyLocalState(email: string | null | undefined): LegacyMyWorldState | null {
  if (!email || typeof email !== "string") return null;
  const ccRaw = lsGet(LEGACY_CC_KEY(email));
  const gpRaw = lsGet(LEGACY_GAME_PROFILE_KEY(email));
  const ownedRaw = lsGet(LEGACY_OWNED_KEY(email));

  let cottonCandy: number | null = null;
  if (ccRaw != null) {
    const n = parseInt(ccRaw, 10);
    cottonCandy = Number.isFinite(n) && n >= 0 ? Math.min(n, CURRENCY_MAX) : null;
  }
  let xp: number | null = null;
  let level: number | null = null;
  if (gpRaw != null) {
    try {
      const gp = JSON.parse(gpRaw) as Record<string, unknown>;
      if (typeof gp.doriExp === "number" && Number.isFinite(gp.doriExp) && gp.doriExp >= 0) {
        xp = Math.min(Math.floor(gp.doriExp), XP_MAX);
        level = Math.min(LEVEL_MAX, Math.max(1, calculateLevel(xp)));
      }
    } catch { /* 손상 JSON → null */ }
  }
  let ownedCount: number | null = null;
  if (ownedRaw != null) {
    try {
      const arr = JSON.parse(ownedRaw);
      if (Array.isArray(arr)) ownedCount = arr.length;
    } catch { /* 손상 → null */ }
  }
  if (cottonCandy === null && xp === null && ownedCount === null) return null;
  return { cottonCandy, xp, level, ownedCount };
}

export type RecommendedMigrationAction =
  | "none"               // 서버(users)만 있거나 둘 다 없음 → 레거시 무시(서버 우선)
  | "initialize-server"  // 서버 없음 + 레거시 있음 → 초기 씨딩 후보(자동 아님)
  | "review-conflict";   // 서버·레거시 모두 있는데 값이 다름 → 사람/서버 검토 필요

export interface LegacyComparison {
  hasLegacy: boolean;
  hasServer: boolean;
  conflicts: Array<{ field: string; legacyValue: number; serverValue: number }>;
  recommendedAction: RecommendedMigrationAction;
}

/**
 * '현재 운영 원본(users)' 과 '레거시(localStorage)' 를 비교만 한다(자동 병합·자동 선택 없음).
 *  · 서버(users)가 있으면 서버가 원본. 레거시는 참고.
 *  · 값을 합산하지 않고, 큰 값을 무조건 고르지 않는다. 결과는 '이관 후보 탐지'까지만.
 */
export function compareLegacyAndServerState(
  server: CurrentMyWorldState | null,
  legacy: LegacyMyWorldState | null
): LegacyComparison {
  const hasServer = server !== null;
  const hasLegacy = legacy !== null;

  const conflicts: LegacyComparison["conflicts"] = [];
  if (hasServer && hasLegacy) {
    if (legacy!.cottonCandy !== null && legacy!.cottonCandy !== server!.currencies.cottonCandy) {
      conflicts.push({ field: "cottonCandy", legacyValue: legacy!.cottonCandy, serverValue: server!.currencies.cottonCandy });
    }
    if (legacy!.xp !== null && legacy!.xp !== server!.progression.xp) {
      conflicts.push({ field: "xp", legacyValue: legacy!.xp, serverValue: server!.progression.xp });
    }
  }

  let recommendedAction: RecommendedMigrationAction = "none";
  if (!hasServer && hasLegacy) recommendedAction = "initialize-server";
  else if (hasServer && hasLegacy && conflicts.length > 0) recommendedAction = "review-conflict";

  return { hasLegacy, hasServer, conflicts, recommendedAction };
}
