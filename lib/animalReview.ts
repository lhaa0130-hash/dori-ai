// 몽글로 동물도감 검수 상태 — Firestore 단일 문서(animalReview/status)에 승인/반려 no 배열 저장.
// 공개 /animal 페이지는 이 문서를 읽어 approved에 있는 종만 노출(정적 export라 클라이언트에서 필터링).
// rejectReasons: 반려 사유(no→텍스트). 자동화(n8n)가 이 맵을 읽어 검토·수정. 문서는 read:true라 REST로 바로 읽힘.
import { doc, getDoc, setDoc, arrayUnion, arrayRemove, deleteField } from "firebase/firestore";
import { getFirebaseFirestore } from "@/lib/firebase";

export interface AnimalReviewStatus {
  approved: string[];
  rejected: string[];
  rejectReasons: Record<string, string>;
}

const EMPTY: AnimalReviewStatus = { approved: [], rejected: [], rejectReasons: {} };
const REF = () => doc(getFirebaseFirestore(), "animalReview", "status");

export async function getAnimalReviewStatus(): Promise<AnimalReviewStatus> {
  try {
    const s = await getDoc(REF());
    if (!s.exists()) return EMPTY;
    const d = s.data() as Partial<AnimalReviewStatus>;
    return {
      approved: Array.isArray(d.approved) ? d.approved : [],
      rejected: Array.isArray(d.rejected) ? d.rejected : [],
      rejectReasons: d.rejectReasons && typeof d.rejectReasons === "object" ? (d.rejectReasons as Record<string, string>) : {},
    };
  } catch {
    return EMPTY;
  }
}

export async function approveAnimal(no: string): Promise<boolean> {
  try {
    // 승인 시 반려 사유는 지움(스테일 방지)
    await setDoc(REF(), { approved: arrayUnion(no), rejected: arrayRemove(no), rejectReasons: { [no]: deleteField() } }, { merge: true });
    return true;
  } catch {
    return false;
  }
}

export async function rejectAnimal(no: string, reason = ""): Promise<boolean> {
  try {
    await setDoc(REF(), { rejected: arrayUnion(no), approved: arrayRemove(no), rejectReasons: { [no]: reason } }, { merge: true });
    return true;
  } catch {
    return false;
  }
}

// 반려 상태는 유지한 채 사유만 갱신(자동화가 처리 후 사유를 덧붙이거나 관리자가 사유 수정할 때)
export async function setRejectReason(no: string, reason: string): Promise<boolean> {
  try {
    await setDoc(REF(), { rejectReasons: { [no]: reason } }, { merge: true });
    return true;
  } catch {
    return false;
  }
}

export async function resetAnimal(no: string): Promise<boolean> {
  try {
    await setDoc(REF(), { approved: arrayRemove(no), rejected: arrayRemove(no), rejectReasons: { [no]: deleteField() } }, { merge: true });
    return true;
  } catch {
    return false;
  }
}
