// 미니게임 클라우드 세이브 — 로그인 회원의 게임 진행도를 Firestore에 보관(게임별·회원당 1문서).
// 보스 클리커 등 진행형 게임이 사용. 게임은 JSON 문자열만 주고받는다.
//
//   gameSaves/{game}/players/{uid}   { data: <json string>, updatedAt }
//
// ⚠️ Firestore 보안 규칙(본인 것만 읽기/쓰기):
//   match /gameSaves/{game}/players/{uid} {
//     allow read, write: if request.auth != null && request.auth.uid == uid;
//   }

import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { getFirebaseFirestore, getFirebaseAuth } from "@/lib/firebase";

function currentUid(): string | null {
  try {
    return getFirebaseAuth().currentUser?.uid || null;
  } catch {
    return null;
  }
}

/** 진행도 저장(JSON 문자열). 비로그인이면 무시(false). */
export async function saveGameState(game: string, data: string): Promise<boolean> {
  const uid = currentUid();
  if (!uid || !data) return false;
  try {
    const ref = doc(getFirebaseFirestore(), "gameSaves", game, "players", uid);
    await setDoc(ref, { data: String(data).slice(0, 6000), updatedAt: serverTimestamp() }, { merge: true });
    return true;
  } catch {
    return false;
  }
}

/** 진행도 불러오기. 없거나 비로그인이면 null. */
export async function loadGameState(game: string): Promise<string | null> {
  const uid = currentUid();
  if (!uid) return null;
  try {
    const ref = doc(getFirebaseFirestore(), "gameSaves", game, "players", uid);
    const snap = await getDoc(ref);
    return snap.exists() ? String((snap.data() as Record<string, unknown>).data || "") : null;
  } catch {
    return null;
  }
}
