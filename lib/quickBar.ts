// 우측 퀵바(바로가기 레일) 영속화 — 사용자가 고른 카테고리 키 배열.
// 비로그인: localStorage 만. 로그인: users/{uid}.quickBar 에 자동 저장(기기 간 동기화).
//
//   users/{uid}  { ..., quickBar: string[], quickBarUpdatedAt }
//
// Firestore 규칙(firestore.rules)상 users/{uid} 는 본인(소유자)만 쓰기 가능 → 규칙 변경 불필요.
// (gameSave.ts 와 동일한 currentUser.uid 패턴)

import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { getFirebaseFirestore, getFirebaseAuth } from "@/lib/firebase";

function currentUid(): string | null {
  try {
    return getFirebaseAuth().currentUser?.uid || null;
  } catch {
    return null;
  }
}

/**
 * 원격 퀵바 불러오기.
 * - 비로그인/문서없음/필드없음/오류 → null (저장된 적 없음으로 간주)
 * - 저장된 적 있으면(빈 배열 포함) string[] 반환 (원격이 권위)
 */
export async function loadQuickBarRemote(): Promise<string[] | null> {
  const uid = currentUid();
  if (!uid) return null;
  try {
    const snap = await getDoc(doc(getFirebaseFirestore(), "users", uid));
    if (!snap.exists()) return null;
    const v = (snap.data() as Record<string, unknown>).quickBar;
    if (!Array.isArray(v)) return null;
    return v.filter((x): x is string => typeof x === "string");
  } catch {
    return null;
  }
}

/** 원격 퀵바 저장(merge). 비로그인이면 무시(false). */
export async function saveQuickBarRemote(keys: string[]): Promise<boolean> {
  const uid = currentUid();
  if (!uid) return false;
  try {
    await setDoc(
      doc(getFirebaseFirestore(), "users", uid),
      { quickBar: keys.slice(0, 40), quickBarUpdatedAt: serverTimestamp() },
      { merge: true }
    );
    return true;
  } catch {
    return false;
  }
}
