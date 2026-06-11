// 미니게임 명예의 전당 — Firestore 전역 랭킹 (정적 export 호환, 솜사탕과 동일 패턴)
// ─────────────────────────────────────────────────────────────
// 회원(로그인)만 기록 등록. 회원당 1개 문서(uid)에 "개인 최고점"만 보관 →
// 점수가 기존보다 높을 때만 갱신. 화면에는 상위 5명만 노출.
//
//   lb_animalmerge/{uid}  { name, score, updatedAt }
//
// ⚠️ Firestore 보안 규칙 필요(로그인 사용자 쓰기 허용):
//   match /lb_animalmerge/{uid} { allow read: if true; allow write: if request.auth != null; }

import {
  doc, getDoc, setDoc, getDocs, collection, query, orderBy, limit, serverTimestamp,
} from "firebase/firestore";
import { getFirebaseFirestore, getFirebaseAuth } from "@/lib/firebase";

const COL = "lb_animalmerge";

export interface ScoreEntry {
  uid: string;
  name: string;
  score: number;
}

export interface SubmitResult {
  isNewBest: boolean; // 개인 최고 기록을 갱신했는지
  rank: number;       // 갱신 후 전체 순위(1~), 미진입/실패 시 0
}

function currentUid(): string | null {
  try {
    return getFirebaseAuth().currentUser?.uid || null;
  } catch {
    return null;
  }
}

/** 동물합치기 점수 등록 — 개인 최고 갱신 시에만 기록. 비로그인/0점은 무시. */
export async function submitAnimalMergeScore(name: string, score: number): Promise<SubmitResult> {
  const uid = currentUid();
  if (!uid || !score || score <= 0) return { isNewBest: false, rank: 0 };
  try {
    const db = getFirebaseFirestore();
    const ref = doc(db, COL, uid);
    const snap = await getDoc(ref);
    const prev = snap.exists() ? Number(snap.data().score || 0) : 0;
    if (score <= prev) return { isNewBest: false, rank: 0 };

    await setDoc(
      ref,
      { name: (name || "익명").slice(0, 16), score, updatedAt: serverTimestamp() },
      { merge: true }
    );

    // 갱신 후 순위 계산 (상위 50명 안에서)
    const top = await getTopScores(50);
    const rank = top.findIndex((e) => e.uid === uid) + 1;
    return { isNewBest: true, rank };
  } catch {
    return { isNewBest: false, rank: 0 };
  }
}

/** 상위 N명 (점수 내림차순). 기본 5명. */
export async function getTopScores(n = 5): Promise<ScoreEntry[]> {
  try {
    const db = getFirebaseFirestore();
    const q = query(collection(db, COL), orderBy("score", "desc"), limit(n));
    const snap = await getDocs(q);
    const arr: ScoreEntry[] = [];
    snap.forEach((d) => {
      const x = d.data() as Record<string, unknown>;
      arr.push({ uid: d.id, name: String(x.name || "익명"), score: Number(x.score || 0) });
    });
    return arr;
  } catch {
    return [];
  }
}

/** 명예의 전당 TOP 5 */
export function getAnimalMergeTop5(): Promise<ScoreEntry[]> {
  return getTopScores(5);
}
