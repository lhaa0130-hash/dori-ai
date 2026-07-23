// 클라이언트 → 신뢰 서버 보상 게이트 호출 (04-19).
// ⚠️ 클라이언트는 rewardType 만 보낸다. 금액·날짜·uid 는 서버가 결정한다(POST /api/claim-reward).
//    직접 Firestore 재화/경험치 지급을 하지 않는다. 서버 응답만 신뢰한다.
import { getFirebaseAuth } from "@/lib/firebase";

export type ClaimStatus = "granted" | "already_claimed" | "legacy_recognized" | "error";

export interface ClaimResult {
  status: ClaimStatus;
  cottonCandy: number; // 서버가 지급한 금액(granted 외에는 0)
  exp: number;
  httpStatus: number;  // 진단용(로그·표시 아님)
}

/** 일일 출석 보상 요청. 서버가 멱등·금액·날짜를 결정. 성공/이미지급/레거시/오류만 구분. */
export async function claimDailyAttendance(): Promise<ClaimResult> {
  try {
    const user = getFirebaseAuth().currentUser;
    if (!user) return { status: "error", cottonCandy: 0, exp: 0, httpStatus: 0 };
    const token = await user.getIdToken();
    const res = await fetch("/api/claim-reward", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ rewardType: "daily_attendance" }),
    });
    let data: { ok?: boolean; status?: string; reward?: { cottonCandy?: number; exp?: number } } | null = null;
    try { data = await res.json(); } catch { data = null; }

    if (
      res.ok && data?.ok &&
      (data.status === "granted" || data.status === "already_claimed" || data.status === "legacy_recognized")
    ) {
      return {
        status: data.status,
        cottonCandy: data.reward?.cottonCandy || 0,
        exp: data.reward?.exp || 0,
        httpStatus: res.status,
      };
    }
    // 403(allowlist)·500·503·네트워크 등은 전부 error — 거짓 성공 금지.
    return { status: "error", cottonCandy: 0, exp: 0, httpStatus: res.status };
  } catch {
    return { status: "error", cottonCandy: 0, exp: 0, httpStatus: 0 };
  }
}
