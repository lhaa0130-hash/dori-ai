// 미니게임 명예의 전당 — Firestore 전역 랭킹 (정적 export 호환, 솜사탕과 동일 패턴)
// ─────────────────────────────────────────────────────────────
// 회원(로그인)만 기록 등록. 게임별·회원당 1개 문서에 "개인 최고 기록"만 보관.
// 점수가 더 좋을 때만 갱신(desc=높을수록/asc=낮을수록 좋음). 화면엔 상위 5명만 노출.
//
//   leaderboards/{game}/scores/{uid}   { name, score, updatedAt }
//   예) leaderboards/animalmerge/scores/{uid}, leaderboards/2048/scores/{uid}
//
// ⚠️ Firestore 보안 규칙(한 줄로 모든 게임 커버):
//   match /leaderboards/{game}/scores/{uid} {
//     allow read: if true;                    // 순위표는 누구나 조회
//     allow write: if request.auth != null;   // 로그인 회원만 등록
//   }

import {
  doc, getDoc, setDoc, getDocs, collection, query, orderBy, limit, serverTimestamp,
} from "firebase/firestore";
import { getFirebaseFirestore, getFirebaseAuth } from "@/lib/firebase";

export type RankOrder = "desc" | "asc"; // desc=높을수록 좋음(점수), asc=낮을수록 좋음(무브/시도)

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

function scoresCol(game: string) {
  return collection(getFirebaseFirestore(), "leaderboards", game, "scores");
}

/** 점수 등록 — 개인 기록 갱신 시에만 저장. 비로그인/0이하는 무시. */
export async function submitScore(
  game: string,
  name: string,
  score: number,
  order: RankOrder = "desc"
): Promise<SubmitResult> {
  const uid = currentUid();
  if (!uid || !Number.isFinite(score) || score <= 0) return { isNewBest: false, rank: 0 };
  try {
    const ref = doc(getFirebaseFirestore(), "leaderboards", game, "scores", uid);
    const snap = await getDoc(ref);
    const has = snap.exists();
    const prev = has ? Number(snap.data().score || 0) : 0;
    const better = order === "asc" ? !has || score < prev : score > prev;
    if (!better) return { isNewBest: false, rank: 0 };

    await setDoc(
      ref,
      { name: (name || "익명").slice(0, 16), score, updatedAt: serverTimestamp() },
      { merge: true }
    );

    // 갱신 후 순위 계산 (상위 50명 안에서)
    const top = await getTopScores(game, 50, order);
    const rank = top.findIndex((e) => e.uid === uid) + 1;
    return { isNewBest: true, rank };
  } catch {
    return { isNewBest: false, rank: 0 };
  }
}

/** 상위 N명 (order 방향 정렬). 기본 5명·내림차순. */
export async function getTopScores(game: string, n = 5, order: RankOrder = "desc"): Promise<ScoreEntry[]> {
  try {
    const q = query(scoresCol(game), orderBy("score", order), limit(n));
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

// ─── 동물합치기 하위호환 래퍼 (기존 merge 페이지가 사용) ───────────────
export function submitAnimalMergeScore(name: string, score: number): Promise<SubmitResult> {
  return submitScore("animalmerge", name, score, "desc");
}
export function getAnimalMergeTop5(): Promise<ScoreEntry[]> {
  return getTopScores("animalmerge", 5, "desc");
}
