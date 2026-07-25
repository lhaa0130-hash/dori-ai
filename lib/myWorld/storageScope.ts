// My World — UID 기반 저장 스코프 & localStorage 키 규약 (05-06E).
//
// 원칙(불변):
//  · 인증 사용자의 저장 식별자는 Firebase UID 다. 이메일은 표시·연락처 정보일 뿐 권한 식별자가 아니다.
//  · 신규 authenticated localStorage 키에는 이메일(PII)을 넣지 않는다.
//  · guest 는 UID 키를 쓰지 않고 별도 guest namespace 를 쓴다.
//  · guest 캐시를 로그인 사용자 캐시로 자동 복사하지 않는다.
//  · localStorage 는 서버 데이터의 권위 있는 출처가 아니다(표시용 fallback 까지만).
//  · 서버 데이터가 있으면 서버가 legacy 로컬 캐시보다 우선한다.
//
// 이 모듈은 firebase 를 import 하지 않는다(순수) → node:test 로 직접 검증 가능.
import type { MyWorldIdentity } from "@/lib/myWorld/identity";
import type { KeyValueStorage } from "@/lib/myWorld/interaction/storage";

/** ready 상태에서만 생성되는 저장 스코프. 전역 싱글톤으로 두지 않는다. */
export interface AuthenticatedStorageScope {
  uid: string;
  /** 과거 email-keyed 캐시 탐색 전용. Firestore payload 의 user ID 로 절대 쓰지 않는다. */
  legacyEmail: string | null;
}

/**
 * Identity Gate 가 ready 이고, 전달된 currentUser 가 게이트의 uid 와 일치할 때만 스코프를 만든다.
 * (uid 와 email 을 같은 currentUser 에서 원자적으로 얻게 하여 account switch 중 불일치를 차단)
 */
export function createAuthenticatedScope(
  identity: MyWorldIdentity,
  currentUser: { uid: string; email: string | null } | null,
): AuthenticatedStorageScope | null {
  if (identity.status !== "ready" || !identity.firebaseUid) return null;
  if (!currentUser || currentUser.uid !== identity.firebaseUid) return null;
  return { uid: identity.firebaseUid, legacyEmail: currentUser.email ?? null };
}

// ── 키 규약 ──────────────────────────────────────────────────────────
const UID_KEY_RE = /^[A-Za-z0-9_-]+$/;

/** 키에 PII(이메일 등)가 섞였는지 검사. 신규 키 이름 검증·테스트에 사용. */
export function keyHasPii(key: string): boolean {
  return key.includes("@") || /email/i.test(key);
}

/** 인증 사용자 캐시 키: myworld_{name}_uid_{uid}. 이메일 없음. */
export function uidCacheKey(scope: AuthenticatedStorageScope, name: string): string {
  if (!UID_KEY_RE.test(scope.uid)) throw new Error("invalid uid for cache key");
  if (!/^[a-z0-9_]+$/.test(name)) throw new Error("invalid cache name");
  const key = `myworld_${name}_uid_${scope.uid}`;
  if (keyHasPii(key)) throw new Error("cache key must not contain PII");
  return key;
}

/** guest 캐시 키: myworld_{name}_guest. UID 키와 겹치지 않는다. */
export function guestCacheKey(name: string): string {
  if (!/^[a-z0-9_]+$/.test(name)) throw new Error("invalid cache name");
  return `myworld_${name}_guest`;
}

// ── Legacy email-key 마이그레이션 ────────────────────────────────────
export type ReadSource = "uid" | "legacy" | "none";

/** 안전한 JSON 파싱(실패 시 null). */
function parseJson<T>(raw: string | null): T | null {
  if (raw == null) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}

/**
 * 표시용 읽기(권위 아님). UID 키가 유효하면 UID 우선, 없으면 legacy 를 임시 fallback 으로.
 * validate 를 통과하지 못한 값(손상/조작)은 무시한다.
 */
export function readWithLegacyFallback<T>(
  storage: KeyValueStorage | null,
  uidKey: string,
  legacyKey: string | null,
  validate: (value: T) => boolean,
): { value: T | null; source: ReadSource } {
  if (!storage) return { value: null, source: "none" };
  const fromUid = parseJson<T>(storage.getItem(uidKey));
  if (fromUid != null && validate(fromUid)) return { value: fromUid, source: "uid" };
  if (legacyKey) {
    const fromLegacy = parseJson<T>(storage.getItem(legacyKey));
    if (fromLegacy != null && validate(fromLegacy)) return { value: fromLegacy, source: "legacy" };
  }
  return { value: null, source: "none" };
}

/**
 * 서버(권위) 값을 UID 키에 저장하고, **저장 성공 후에만** legacy 키를 제거한다.
 * idempotent: 반복 호출해도 동일 결과(중복 없음). legacy 총량을 서버로 업로드하지 않는다.
 */
export function commitAuthoritativeToUidKey(
  storage: KeyValueStorage | null,
  uidKey: string,
  legacyKey: string | null,
  value: unknown,
): { committed: boolean; legacyRemoved: boolean } {
  if (!storage) return { committed: false, legacyRemoved: false };
  try {
    storage.setItem(uidKey, JSON.stringify(value));
  } catch {
    return { committed: false, legacyRemoved: false }; // 저장 실패 → legacy 유지
  }
  let legacyRemoved = false;
  if (legacyKey && legacyKey !== uidKey && storage.getItem(legacyKey) != null) {
    try { storage.removeItem(legacyKey); legacyRemoved = true; } catch { /* 유지 */ }
  }
  return { committed: true, legacyRemoved };
}
