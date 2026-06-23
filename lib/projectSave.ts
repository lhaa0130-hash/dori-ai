// 프로젝트 개인 저장 — 로그인 회원별로 프로젝트 작업/설정을 Firestore에 보관.
// (애니멀일로 제외. 아크일로=설계도면, 워크일로=작업·결과물, 트레이더일로=관심·설정)
//
//   projectSaves/{project}/users/{uid}   { data: <json string>, updatedAt }
//
// 규칙(firestore.rules): 본인(uid)만 읽기/쓰기. gameSave.ts 와 동일 패턴.

import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { getFirebaseFirestore, getFirebaseAuth } from "@/lib/firebase";

function currentUid(): string | null {
  try {
    return getFirebaseAuth().currentUser?.uid || null;
  } catch {
    return null;
  }
}

/** 프로젝트 데이터 저장(JSON 문자열). 비로그인이면 무시(false). */
export async function saveProject(project: string, data: string): Promise<boolean> {
  const uid = currentUid();
  if (!uid || !data) return false;
  try {
    const ref = doc(getFirebaseFirestore(), "projectSaves", project, "users", uid);
    // Firestore 문서 1MB 한계 — 안전 상한
    await setDoc(ref, { data: String(data).slice(0, 900000), updatedAt: serverTimestamp() }, { merge: true });
    return true;
  } catch {
    return false;
  }
}

/** 프로젝트 데이터 불러오기. 없거나 비로그인이면 null. */
export async function loadProject(project: string): Promise<string | null> {
  const uid = currentUid();
  if (!uid) return null;
  try {
    const ref = doc(getFirebaseFirestore(), "projectSaves", project, "users", uid);
    const snap = await getDoc(ref);
    return snap.exists() ? String((snap.data() as Record<string, unknown>).data || "") : null;
  } catch {
    return null;
  }
}
