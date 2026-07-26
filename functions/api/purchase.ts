// Cloudflare Pages Function — POST /api/purchase (05-07)
// 상점 구매의 유일한 권위 경로. 가격·구매가능여부·아이템 종류·프리미엄 여부를 **서버가** 결정한다.
//
// ⚠️ 이 엔드포인트가 닫는 P0:
//   1) purchaseShopItem(email, key, price) 의 price 가 클라이언트 인자였다 → 0 으로 호출하면 무료
//   2) isPremiumUser() 가 localStorage 만 봤다 → 로컬 플래그 위조로 전 품목 무료 영구 획득
//   3) ownedItems 가 Rules 미보호였다 → 콘솔에서 직접 추가 가능
//
// 원자성: 인증 → catalog 검증 → 잔액 확인 → 차감 → 아이템 부여 → 원장 기록을 한 트랜잭션에서.
//   중간 실패 시 아무것도 반영되지 않는다.
// 멱등: users/{uid}/purchases/{operationId} 가 있으면 재지급 없이 저장된 결과 반환.
// ⚠️ Secret·전체 문서·stack 을 응답/로그에 노출하지 않는다.
import { sanitizePurchaseRequest } from "../_shared/shopCatalog";
import { getAccessToken } from "../_shared/googleAuth";
import { beginTransaction, batchGet, commit, rollback, verifyIdTokenOwnsUid, waitBeforeRetry, type FirestoreTarget } from "../_shared/firestoreRest";
import { resolveRewardEnv } from "../_shared/rewardEnv";
import { resolveCandyGate } from "../_shared/candyEnv";
import { parseAllowlist, todayKST } from "../_shared/rewardPolicy";

const J = (o: any, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });

const MAX_BODY = 2048;
const PROD_PROJECT_ID = "dori-ai-0130";
const MAX_OWNED_ITEMS = 2000; // 폭주 방어(정상 카탈로그는 300여 개)

function uidFromToken(idToken: string): { uid: string; aud: string; iss: string; exp: number } | null {
  try {
    const p = idToken.split(".");
    if (p.length !== 3) return null;
    const j = JSON.parse(decodeURIComponent(escape(atob(p[1].replace(/-/g, "+").replace(/_/g, "/")))));
    const uid = j.user_id || j.sub;
    if (!uid || typeof uid !== "string") return null;
    return { uid, aud: String(j.aud || ""), iss: String(j.iss || ""), exp: Number(j.exp || 0) };
  } catch { return null; }
}

export const onRequestPost: any = async (context: any) => {
  const cid = Math.random().toString(36).slice(2, 8);
  try {
    const { request, env } = context;

    // ── 환경·롤아웃 해석(fail-closed). EXP 엔드포인트와 동일 계약을 재사용한다. ──
    const renv = resolveRewardEnv(env);
    if (!renv.ok) return J({ ok: false, error: renv.error }, renv.status);
    const mode = renv.env.mode;
    const rollout = renv.env.rollout;
    const target: FirestoreTarget = renv.env.target;
    const expectedProject = mode === "emulator" ? (renv.env as { projectId: string }).projectId : PROD_PROJECT_ID;
    const allow = parseAllowlist(env.REWARD_TEST_UIDS);

    if (mode === "production") {
      const { clientEmail, privateKey } = renv.env as { clientEmail: string; privateKey: string };
      if (!clientEmail || !privateKey) return J({ ok: false, error: "dependency_unavailable" }, 503);
    }
    if (rollout === "canary" && allow.size === 0) return J({ ok: false, error: "canary_requires_allowlist" }, 503);

    // ── 요청 정제: itemKey 만 허용. price/amount/uid/email 등은 거부. ──
    const raw = await request.text();
    if (raw.length > MAX_BODY) return J({ ok: false, error: "invalid_request" }, 400);
    let body: unknown;
    try { body = JSON.parse(raw); } catch { return J({ ok: false, error: "invalid_request" }, 400); }
    const clean = sanitizePurchaseRequest(body);
    if (!clean.ok) return J({ ok: false, error: "invalid_request", detail: clean.error }, 400);
    const { entry, operationId } = clean;

    // ── 인증 ──
    const authz = String(request.headers.get("Authorization") || "");
    const m = authz.match(/^Bearer\s+(.+)$/);
    if (!m) return J({ ok: false, error: "unauthenticated" }, 401);
    const idToken = m[1].trim();
    const decoded = uidFromToken(idToken);
    if (!decoded) return J({ ok: false, error: "unauthenticated" }, 401);
    if (decoded.aud !== expectedProject) return J({ ok: false, error: "unauthenticated" }, 401);
    if (!decoded.iss.endsWith(expectedProject)) return J({ ok: false, error: "unauthenticated" }, 401);
    if (!decoded.exp || decoded.exp * 1000 < Date.now()) return J({ ok: false, error: "unauthenticated" }, 401);
    const uid = decoded.uid;

    if (rollout === "canary" && !allow.has(uid)) return J({ ok: false, error: "rollout_disabled" }, 403);

    // ⚠️ 재화 전용 게이트(05-07B). EXP 롤아웃(all)을 재사용하면 배포 즉시 전체 개방이라 카나리가 없다.
    //    미설정·오타·off → fail-closed. 구매는 재화를 차감하므로 EXP 와 달리 게이트가 닫히면 전면 거부한다.
    const gate = resolveCandyGate(env, mode === "emulator" ? "emulator" : "production", uid, allow);
    if (!gate.ok) return J({ ok: false, error: gate.error }, gate.status);

    const own = await verifyIdTokenOwnsUid(target, idToken, uid);
    if (own === "invalid") return J({ ok: false, error: "unauthenticated" }, 401);
    if (own === "mismatch") return J({ ok: false, error: "forbidden" }, 403);

    // ── 쓰기 토큰 ──
    let token: string;
    if (mode === "emulator") token = "owner";
    else {
      const { clientEmail, privateKey } = renv.env as { clientEmail: string; privateKey: string };
      const at = await getAccessToken(clientEmail, privateKey, Date.now());
      if (!at.ok) return J({ ok: false, error: "dependency_unavailable" }, 503);
      token = at.token;
    }

    return await runPurchase(target, token, uid, entry.itemKey, entry.price, operationId, cid);
  } catch {
    return J({ ok: false, error: "internal_error", cid }, 500);
  }
};

/** 구매 트랜잭션 — 잔액 차감과 아이템 부여가 하나로. 부분 반영 없음. */
async function runPurchase(
  target: FirestoreTarget, token: string, uid: string,
  itemKey: string, price: number, operationId: string, cid: string,
): Promise<Response> {
  const userRel = `users/${uid}`;
  const opRel = `users/${uid}/purchases/${operationId}`;
  const nowIso = new Date().toISOString();
  const today = todayKST(new Date());

  for (let attempt = 0; attempt < 3; attempt++) {
    let tx: string;
    try { tx = await beginTransaction(target, token); }
    catch (e: any) { if (e?.status === 403) return J({ ok: false, error: "internal_error", detail: "firestore_permission" }, 500); continue; }
    try {
      const got = await batchGet(target, token, tx, [userRel, opRel]);
      const user = got[userRel];
      const op = got[opRel];
      if (!user.exists) { await rollback(target, token, tx); return J({ ok: false, error: "user_not_found" }, 404); }

      // 멱등: 같은 아이템 재구매 요청 → 저장된 결과 반환(추가 차감 없음)
      if (op.exists) {
        await rollback(target, token, tx);
        const of = op.fields as Record<string, any>;
        return J({ ok: true, duplicate: true, itemKey, charged: 0, balance: Number(of?.resultingBalance) || 0 });
      }

      const u = user.fields as Record<string, any>;
      const balance = typeof u.cottonCandy === "number" && u.cottonCandy >= 0 ? Math.floor(u.cottonCandy) : 0;
      const ownedRaw = Array.isArray(u.ownedItems) ? (u.ownedItems as unknown[]) : [];
      const owned = ownedRaw.filter((x): x is string => typeof x === "string");

      // 이미 보유 → 과금 없이 성공 처리(원장만 남겨 재요청을 멱등화)
      const alreadyOwned = owned.includes(itemKey);

      // ⭐ 프리미엄은 **서버 문서**로만 판정한다(localStorage 위조 차단).
      const isPremium = u.isPremium === true;
      const charge = alreadyOwned || isPremium ? 0 : price;

      if (!alreadyOwned && !isPremium && balance < price) {
        await rollback(target, token, tx);
        return J({ ok: false, error: "insufficient_balance", balance, price }, 422);
      }
      if (!alreadyOwned && owned.length >= MAX_OWNED_ITEMS) {
        await rollback(target, token, tx);
        return J({ ok: false, error: "owned_items_limit" }, 422);
      }

      const nextOwned = alreadyOwned ? owned : [...owned, itemKey];
      const nextBalance = balance - charge;

      await commit(target, token, tx, [
        { rel: opRel, requireNotExists: true,
          fields: { uid, itemKey, price, charged: charge, premiumGrant: isPremium && !alreadyOwned,
                    alreadyOwned, resultingBalance: nextBalance, purchaseDate: today,
                    createdAt: nowIso, schemaVersion: 1 } },
        { rel: userRel, updateMask: ["cottonCandy", "ownedItems"],
          fields: { cottonCandy: nextBalance, ownedItems: nextOwned } },
      ]);
      return J({ ok: true, duplicate: false, itemKey, charged: charge, balance: nextBalance, premiumGrant: isPremium && !alreadyOwned });
    } catch (e: any) {
      await rollback(target, token, tx);
      if (e?.code === "firestore_forbidden") return J({ ok: false, error: "internal_error", detail: "firestore_permission" }, 500);
      if (e?.code === "commit_conflict") { await waitBeforeRetry(attempt); continue; } // 동시 요청 → 다음 루프서 duplicate
      return J({ ok: false, error: "internal_error", cid }, 500);
    }
  }
  return J({ ok: false, error: "retryable_conflict", cid }, 409);
}

export const onRequest: any = async (context: any) => {
  if (context.request.method === "POST") return onRequestPost(context);
  if (context.request.method === "OPTIONS")
    return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization" } });
  return J({ ok: false, error: "method_not_allowed" }, 405);
};
