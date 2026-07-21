// 비공개 계정 정보 — userPrivate/{uid} (본인·관리자만 read/write)
// ──────────────────────────────────────────────────────────────────
// ⚠️ users/{uid}는 공개 읽기(read:if true)라 이메일 등 PII를 두면 누구나 읽는다.
//    이메일·성별·연령대·provider는 이 컬렉션에 분리 저장한다. (01-A: 이메일 공개 노출 차단)
//    firestore.rules: match /userPrivate/{uid} { read,write: owner || isAdmin() }
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { getFirebaseFirestore, getFirebaseAuth } from "@/lib/firebase";

export interface UserPrivate {
  email?: string;
  gender?: string | null;
  ageGroup?: string | null;
  provider?: string;
}

function db() { return getFirebaseFirestore(); }
function uidOf(): string | null {
  try { return getFirebaseAuth().currentUser?.uid || null; } catch { return null; }
}

/** 내 비공개 정보 저장(본인만, merge). 비로그인 false. */
export async function saveMyPrivate(patch: UserPrivate): Promise<boolean> {
  const uid = uidOf();
  if (!uid) return false;
  try {
    await setDoc(doc(db(), "userPrivate", uid), { ...patch, updatedAt: serverTimestamp() }, { merge: true });
    return true;
  } catch { return false; }
}

/** 내 비공개 정보 읽기(본인만). 없으면 null. */
export async function getMyPrivate(): Promise<UserPrivate | null> {
  const uid = uidOf();
  if (!uid) return null;
  try {
    const s = await getDoc(doc(db(), "userPrivate", uid));
    return s.exists() ? (s.data() as UserPrivate) : null;
  } catch { return null; }
}

/** 내 이메일 — Firebase Auth 우선(항상 최신), 폴백으로 userPrivate. */
export async function getMyEmail(): Promise<string> {
  try {
    const authEmail = getFirebaseAuth().currentUser?.email;
    if (authEmail) return authEmail;
  } catch { /* ignore */ }
  return (await getMyPrivate())?.email || "";
}
