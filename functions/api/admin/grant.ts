// Cloudflare Pages Function — POST /api/admin/grant (05-07)
// 관리자 솜사탕/프리미엄 지급의 유일한 권위 경로.
//
// ⚠️ 이 엔드포인트가 닫는 P0:
//   예전 adminGrantCandy 는 실패 시 `notifications/{uid}/items` 에 candy_grant '예약'을 남기고,
//   대상 클라이언트의 applyPendingCandyGrants 가 그걸 읽어 **본인 문서**의 cottonCandy/isPremium 을
//   올렸다. 그런데 알림 생성 규칙은 `fromUid == auth.uid && fromUid != uid` 만 요구하므로,
//   임의의 사용자가 **다른 uid 의 알림함**에 amount 를 마음대로 적은 candy_grant 를 넣을 수 있었다.
//   계정 두 개만 있으면 A→B 로 무한 재화·프리미엄(=전 상점 무료)을 스스로 지급할 수 있었다.
//   (visits 폴백 경로는 이미 Rules 가 pendingCandy/pendingPremium 을 막고 있었다.)
//   → 예약·자기적용 통로를 전부 제거하고, 관리자 여부를 서버가 확인한 뒤 서버가 직접 지급한다.
//
// ── 권한 계약 (05-08C 최종) ────────────────────────────────────────────────
// 이 엔드포인트는 **타인의 재화를 임의로 늘릴 수 있는** 유일한 경로다.
// 관리자 인증·인가는 공통 모듈(_shared/adminAuth)의 verifyRewardAdmin 에 일임한다.
//   · 인증(공유): aud == dori-ai-0130, iss 확인, exp 확인 → Firestore 가 서명 실검증
//   · 인가(분리): **REWARD_ADMIN_UIDS 만** 사용. ARTICLE_ADMIN_UIDS 로는 절대 통과하지 않는다.
//
// ⚠️ **email 단독·보조 판정을 쓰지 않는다**(05-08C 에서 완전 제거).
//    Firebase 는 사용자가 스스로 email 을 바꿀 수 있고(updateEmail), 관리자 계정을 지우면
//    그 주소가 풀린다. "관리자 주소를 아는 것"이 권한 후보 조건이 되면 안 된다.
// ⚠️ **fail-closed**: REWARD_ADMIN_UIDS 가 없거나 비면(형식 위반 포함) 엔드포인트 전체가 503.
//    사용자 문서의 isPremium/role 같은 **일반 필드도 관리자 근거로 쓰지 않는다**
//    (Rules 로 잠겨 있더라도 권한 판정 근거로는 부적절 — 서버 환경변수가 유일한 신뢰 출처다).
//
// 후속: Firebase Custom Claims(admin:true)로 옮기면 env 관리 없이 더 강해진다.
//
// 멱등: users/{target}/grants/{operationId}. 원자: 지급과 원장 기록이 한 트랜잭션.
// ⚠️ Secret·전체 문서·stack 을 응답/로그에 노출하지 않는다.
import { getAccessToken } from "../../_shared/googleAuth";
import { beginTransaction, batchGet, commit, rollback, type FirestoreTarget } from "../../_shared/firestoreRest";
import { resolveRewardEnv } from "../../_shared/rewardEnv";
import { verifyRewardAdmin, decodeIdToken } from "../../_shared/adminAuth";

const J = (o: any, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });

const MAX_BODY = 2048;
const PROD_PROJECT_ID = "dori-ai-0130";
const MAX_GRANT = 1_000_000;                // 오타 폭주 방어

const UID_RE = /^[A-Za-z0-9_-]{6,128}$/;
const OP_RE = /^grant_[A-Za-z0-9_-]{6,80}$/;

// ⚠️ 토큰 디코딩·검증은 _shared/adminAuth 가 담당한다. 여기서 복제하지 않는다
//   (인증 로직이 복제되면 한 쪽만 약해져도 전체가 뚫린다).

/** 요청 정제 — targetUid / operationId / candy / isPremium 만. 그 외 필드는 거부. */
function sanitize(body: unknown):
  | { ok: true; targetUid: string; operationId: string; candy: number; premium: boolean | null }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { ok: false, error: "invalid_request" };
  const b = body as Record<string, unknown>;
  const allowed = new Set(["targetUid", "operationId", "candy", "isPremium"]);
  for (const k of Object.keys(b)) if (!allowed.has(k)) return { ok: false, error: "unexpected_field:" + k };
  if (typeof b.targetUid !== "string" || !UID_RE.test(b.targetUid)) return { ok: false, error: "invalid_target" };
  if (typeof b.operationId !== "string" || !OP_RE.test(b.operationId)) return { ok: false, error: "invalid_operation_id" };
  let candy = 0;
  if (b.candy !== undefined) {
    // ⚠️ 05-07B: 예전엔 Math.trunc 로 소수를 조용히 잘랐다(1.5 → 1 로 '성공'). 실수·오타를
    //   성공으로 처리하면 감사 원장과 실제 지급이 어긋난다 → 정수가 아니면 거부한다.
    if (typeof b.candy !== "number" || !Number.isInteger(b.candy)) return { ok: false, error: "invalid_candy" };
    candy = b.candy;
    if (candy === 0) return { ok: false, error: "invalid_candy" };            // 0 지급은 무의미
    if (Math.abs(candy) > MAX_GRANT) return { ok: false, error: "candy_out_of_range" };
  }
  let premium: boolean | null = null;
  if (b.isPremium !== undefined) {
    if (typeof b.isPremium !== "boolean") return { ok: false, error: "invalid_premium" };
    premium = b.isPremium;
  }
  if (candy === 0 && premium === null) return { ok: false, error: "nothing_to_grant" };
  return { ok: true, targetUid: b.targetUid, operationId: b.operationId, candy, premium };
}

export const onRequestPost: any = async (context: any) => {
  const cid = Math.random().toString(36).slice(2, 8);
  try {
    const { request, env } = context;

    const renv = resolveRewardEnv(env);
    if (!renv.ok) return J({ ok: false, error: renv.error }, renv.status);
    const mode = renv.env.mode;
    const target: FirestoreTarget = renv.env.target;

    const raw = await request.text();
    if (raw.length > MAX_BODY) return J({ ok: false, error: "invalid_request" }, 400);
    let body: unknown;
    try { body = JSON.parse(raw); } catch { return J({ ok: false, error: "invalid_request" }, 400); }
    const clean = sanitize(body);
    if (!clean.ok) return J({ ok: false, error: "invalid_request", detail: clean.error }, 400);

    // ── 인증·인가: 공통 모듈 일임 ──
    //   401 = 토큰 무효 / 403 = 로그인했으나 재화 관리자가 아님 / 503 = allowlist 미설정·검증 장애.
    //   ⚠️ REWARD_ADMIN_UIDS 만 본다. email 은 판정에 쓰지 않는다(05-08C).
    const m = String(request.headers.get("Authorization") || "").match(/^Bearer\s+(.+)$/);
    if (!m) return J({ ok: false, error: "unauthenticated" }, 401);
    const idToken = m[1].trim();

    const admin = await verifyRewardAdmin(idToken, env as unknown as Record<string, any>, target);
    if (!admin.ok) {
      const err = admin.status === 401 ? "unauthenticated"
        : admin.status === 403 ? "forbidden"
        : admin.reason;      // 503: reward_admin_not_configured / verify_unavailable
      return J({ ok: false, error: err }, admin.status);
    }

    // 감사 원장에 남길 관리자 UID — 위 검증을 통과한 토큰에서만 도출한다.
    const decoded = decodeIdToken(idToken)!;
    // 자기 자신에게 지급 금지(관리자라도 self-grant 는 감사 추적을 무력화한다).
    if (clean.targetUid === decoded.uid) return J({ ok: false, error: "self_grant_forbidden" }, 403);

    let token: string;
    if (mode === "emulator") token = "owner";
    else {
      const { clientEmail, privateKey } = renv.env as { clientEmail: string; privateKey: string };
      if (!clientEmail || !privateKey) return J({ ok: false, error: "dependency_unavailable" }, 503);
      const at = await getAccessToken(clientEmail, privateKey, Date.now());
      if (!at.ok) return J({ ok: false, error: "dependency_unavailable" }, 503);
      token = at.token;
    }

    return await runGrant(target, token, decoded.uid, clean.targetUid, clean.operationId, clean.candy, clean.premium, cid);
  } catch {
    return J({ ok: false, error: "internal_error", cid }, 500);
  }
};

async function runGrant(
  target: FirestoreTarget, token: string, adminUid: string, targetUid: string,
  operationId: string, candy: number, premium: boolean | null, cid: string,
): Promise<Response> {
  const userRel = `users/${targetUid}`;
  const opRel = `users/${targetUid}/grants/${operationId}`;
  const nowIso = new Date().toISOString();

  for (let attempt = 0; attempt < 3; attempt++) {
    let tx: string;
    try { tx = await beginTransaction(target, token); }
    catch (e: any) { if (e?.status === 403) return J({ ok: false, error: "internal_error", detail: "firestore_permission" }, 500); continue; }
    try {
      const got = await batchGet(target, token, tx, [userRel, opRel]);
      const user = got[userRel];
      const op = got[opRel];
      if (!user.exists) { await rollback(target, token, tx); return J({ ok: false, error: "user_not_found" }, 404); }
      if (op.exists) {
        await rollback(target, token, tx);
        const of = op.fields as Record<string, any>;
        // ⚠️ 같은 operationId 를 **다른 금액·다른 프리미엄 값**으로 재사용하면 거부한다.
        //   (멱등 키를 재활용해 조용히 다른 지급을 밀어넣는 것을 막는다. 대상 UID 는 경로에 포함돼
        //    있으므로 대상이 다르면 애초에 다른 문서다.)
        const sameCandy = (Number(of?.requestedCandy) || 0) === candy;
        const samePremium = (of?.isPremium === undefined ? null : of.isPremium === true) === premium;
        if (!sameCandy || !samePremium) return J({ ok: false, error: "operation_id_reused" }, 409);
        return J({ ok: true, duplicate: true, balance: Number(of?.resultingBalance) || 0 });
      }

      const u = user.fields as Record<string, any>;
      const balance = typeof u.cottonCandy === "number" && u.cottonCandy >= 0 ? Math.floor(u.cottonCandy) : 0;
      const total = typeof u.cottonCandyTotal === "number" && u.cottonCandyTotal >= 0 ? Math.floor(u.cottonCandyTotal) : 0;
      const nextBalance = Math.max(0, balance + candy);   // 음수 잔액 금지
      const applied = nextBalance - balance;              // 실제 반영된 증감

      const mask: string[] = [];
      const fields: Record<string, any> = {};
      if (applied !== 0) {
        mask.push("cottonCandy"); fields.cottonCandy = nextBalance;
        if (applied > 0) { mask.push("cottonCandyTotal"); fields.cottonCandyTotal = total + applied; }
      }
      if (premium !== null) { mask.push("isPremium"); fields.isPremium = premium; }
      if (mask.length === 0) { await rollback(target, token, tx); return J({ ok: false, error: "nothing_to_grant" }, 400); }

      await commit(target, token, tx, [
        { rel: opRel, requireNotExists: true,
          fields: { adminUid, targetUid, requestedCandy: candy, appliedCandy: applied,
                    ...(premium !== null ? { isPremium: premium } : {}),
                    resultingBalance: nextBalance, createdAt: nowIso, schemaVersion: 1 } },
        { rel: userRel, updateMask: mask, fields },
      ]);
      return J({ ok: true, duplicate: false, appliedCandy: applied, balance: nextBalance, ...(premium !== null ? { isPremium: premium } : {}) });
    } catch (e: any) {
      await rollback(target, token, tx);
      if (e?.code === "firestore_forbidden") return J({ ok: false, error: "internal_error", detail: "firestore_permission" }, 500);
      if (e?.code === "commit_conflict") continue;
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
