// 몽글로 동물도감 검수 상태 — Firestore 단일 문서(animalReview/status)에 승인/반려 no 배열 저장.
// 공개 /animal 페이지는 이 문서를 읽어 approved에 있는 종만 노출(정적 export라 클라이언트에서 필터링).
import { doc, getDoc, setDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { getFirebaseFirestore } from "@/lib/firebase";

export interface AnimalReviewStatus {
  approved: string[];
  rejected: string[];
}

const EMPTY: AnimalReviewStatus = { approved: [], rejected: [] };
const REF = () => doc(getFirebaseFirestore(), "animalReview", "status");

export async function getAnimalReviewStatus(): Promise<AnimalReviewStatus> {
  try {
    const s = await getDoc(REF());
    if (!s.exists()) return EMPTY;
    const d = s.data() as Partial<AnimalReviewStatus>;
    return {
      approved: Array.isArray(d.approved) ? d.approved : [],
      rejected: Array.isArray(d.rejected) ? d.rejected : [],
    };
  } catch {
    return EMPTY;
  }
}

export async function approveAnimal(no: string): Promise<boolean> {
  try {
    await setDoc(REF(), { approved: arrayUnion(no), rejected: arrayRemove(no) }, { merge: true });
    return true;
  } catch {
    return false;
  }
}

export async function rejectAnimal(no: string): Promise<boolean> {
  try {
    await setDoc(REF(), { rejected: arrayUnion(no), approved: arrayRemove(no) }, { merge: true });
    return true;
  } catch {
    return false;
  }
}

export async function resetAnimal(no: string): Promise<boolean> {
  try {
    await setDoc(REF(), { approved: arrayRemove(no), rejected: arrayRemove(no) }, { merge: true });
    return true;
  } catch {
    return false;
  }
}
