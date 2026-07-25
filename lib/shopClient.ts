// 상점 구매 클라이언트 (05-07) — 서버 권위 구매의 유일한 진입점.
//  · 클라이언트는 itemKey 만 보낸다. 가격·프리미엄 여부·보유 판정은 전부 서버가 결정한다.
//  · 성공 응답을 받기 전에는 잔액·보유를 낙관적으로 반영하지 않는다("지급 전 성공 표시 금지").
//  · 서버가 돌려준 balance 를 최종값으로 채택한다(로컬 캐시가 서버를 덮지 않는다).
import { getFirebaseAuth } from "@/lib/firebase";

export type PurchaseOutcome =
  | { status: "ok"; balance: number; itemKey: string; charged: number; duplicate: boolean; premiumGrant?: boolean }
  | { status: "insufficient"; balance: number; price: number }
  | { status: "rejected"; reason: string }      // 정책·검증 거부(재시도 무의미)
  | { status: "retry"; reason: string }         // 네트워크·일시 오류(같은 요청 재시도 가능)
  | { status: "unauthenticated" };

async function idToken(): Promise<string | null> {
  try { return (await getFirebaseAuth().currentUser?.getIdToken()) ?? null; } catch { return null; }
}

/**
 * 상점 구매. 서버가 원자적으로 차감+지급하고 최종 잔액을 돌려준다.
 * ⚠️ 같은 itemKey 재요청은 서버에서 멱등 처리되므로, 재시도해도 이중 차감되지 않는다.
 */
export async function purchaseItemOnServer(itemKey: string): Promise<PurchaseOutcome> {
  const t = await idToken();
  if (!t) return { status: "unauthenticated" };
  let res: Response;
  try {
    res = await fetch("/api/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify({ itemKey }),   // ⚠️ price 를 절대 보내지 않는다
    });
  } catch {
    return { status: "retry", reason: "network" };
  }
  let json: any = null;
  try { json = await res.json(); } catch { /* 비 JSON */ }

  if (res.status === 200 && json?.ok) {
    return {
      status: "ok",
      balance: Number(json.balance) || 0,
      itemKey: String(json.itemKey || itemKey),
      charged: Number(json.charged) || 0,
      duplicate: json.duplicate === true,
      premiumGrant: json.premiumGrant === true,
    };
  }
  if (res.status === 422 && json?.error === "insufficient_balance") {
    return { status: "insufficient", balance: Number(json.balance) || 0, price: Number(json.price) || 0 };
  }
  if (res.status === 401) return { status: "unauthenticated" };
  // 400/403/422 = 정책·검증 실패로 재시도 무의미. 그 외(409/429/5xx/0)는 재시도 가능.
  if (res.status === 400 || res.status === 403 || res.status === 422) {
    return { status: "rejected", reason: String(json?.detail || json?.error || `http_${res.status}`) };
  }
  return { status: "retry", reason: String(json?.error || `http_${res.status}`) };
}
