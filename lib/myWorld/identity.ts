// My World — 인증 신원 게이트 (05-06D).
//
// ⚠️ 사실관계(2026-07-25 조사): 이 저장소에는 **NextAuth 가 없다**.
//    `contexts/AuthContext.tsx` 는 Firebase Auth 전용 Provider 이며 next-auth 와 같은 모양의
//    session 객체를 흉내 낼 뿐이다(`useSession()` 은 호환 래퍼). session 은 전적으로
//    onAuthStateChanged(firebaseAuth) 에서 파생된다. 따라서 "NextAuth ↔ Firebase 주체 불일치"는
//    구조적으로 발생할 수 없다. next-auth 는 의존성에도 없다.
//
//    그럼에도 다음 두 가지는 실제로 발생한다:
//      1) 인증 판정/서버 로드가 끝나기 전의 쓰기(게스트 상태가 계정에 귀속될 수 있음)
//      2) 디바운스된 저장이 예약될 때의 사용자와 실행될 때의 사용자가 달라지는 경우
//         (로그아웃·계정 전환) → 이전 사용자 문서에 엉뚱한 상태가 기록될 수 있음
//    이 모듈은 그 경계를 한 곳에서 판정한다. Firestore 문서 ID 의 유일한 기준은 Firebase UID 다.

/** 인증 판정 결과. */
export type MyWorldIdentityStatus =
  | "loading"           // 아직 판정 중 — 원격 접근 금지
  | "guest"             // 비로그인 — 로컬 체험만
  | "ready"             // 로그인 + Firebase UID 확보 — 원격 허용
  | "firebase-missing"  // 세션은 있는데 Firebase 사용자가 없음 — 원격 금지
  | "session-missing";  // Firebase 사용자만 있고 앱 세션이 아직 없음 — 원격 금지

/** AuthContext 의 status 와 동일한 표현. */
export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface IdentityInput {
  /** useAuth().status — Firebase onAuthStateChanged 에서 파생된다. */
  authStatus: AuthStatus;
  /** getFirebaseAuth().currentUser?.uid — Firestore 권한의 유일한 기준. */
  firebaseUid: string | null;
}

export interface MyWorldIdentity {
  status: MyWorldIdentityStatus;
  /** canonical Firestore 문서 ID. ready 일 때만 존재한다. */
  firebaseUid: string | null;
  canReadRemote: boolean;
  canWriteRemote: boolean;
}

const DENY = { canReadRemote: false, canWriteRemote: false } as const;

/**
 * 원격 접근 가능 여부를 판정한다(순수).
 * `ready` 는 **앱 세션이 authenticated 이면서 Firebase UID 가 실제로 존재할 때만** 성립한다.
 * 이메일·displayName 은 신원 판정에 사용하지 않는다.
 */
export function resolveMyWorldIdentity({ authStatus, firebaseUid }: IdentityInput): MyWorldIdentity {
  const uid = typeof firebaseUid === "string" && firebaseUid.length > 0 ? firebaseUid : null;

  if (authStatus === "loading") return { status: "loading", firebaseUid: uid, ...DENY };
  if (authStatus === "authenticated") {
    return uid
      ? { status: "ready", firebaseUid: uid, canReadRemote: true, canWriteRemote: true }
      : { status: "firebase-missing", firebaseUid: null, ...DENY };
  }
  // unauthenticated
  return uid
    ? { status: "session-missing", firebaseUid: uid, ...DENY }
    : { status: "guest", firebaseUid: null, ...DENY };
}

/**
 * 예약된(디바운스된) 원격 쓰기를 **실행 시점에** 다시 검사한다.
 * 예약 당시 uid 와 현재 신원이 다르면(로그아웃·계정 전환) 쓰기를 취소해야 한다.
 * → 이전 사용자 문서에 다른 사용자의 상태가 기록되는 것을 막는다.
 */
export function canPersistFor(scheduledUid: string | null, identity: MyWorldIdentity): boolean {
  if (!scheduledUid) return false;
  if (!identity.canWriteRemote) return false;
  return identity.firebaseUid === scheduledUid;
}

/** 원격 상태를 읽어도 되는지(로드 시작 조건). */
export function canLoadRemote(identity: MyWorldIdentity): boolean {
  return identity.canReadRemote && !!identity.firebaseUid;
}
