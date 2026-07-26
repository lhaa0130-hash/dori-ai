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
// ── 권한 계약 (05-07B 적대적 감사 후 강화) ──────────────────────────────────
// 이 엔드포인트는 **타인의 재화를 임의로 늘릴 수 있는** 유일한 경로다. 관리자 판정이 틀리면
// 재화 보안 전체가 무의미해지므로, 다음 3가지를 **전부** 통과해야만 지급한다(AND):
//   ① Firebase ID 토큰이 Firestore 실검증을 통과(서명·만료·uid 소유)
//   ② uid ∈ REWARD_ADMIN_UIDS (서버 환경변수 allowlist — 클라이언트가 절대 못 바꾼다)
//   ③ 토큰의 email 클레임 == ADMIN_EMAIL (심층 방어)
//
// ⚠️ **fail-closed**: REWARD_ADMIN_UIDS 가 없거나 비면 엔드포인트 전체를 비활성화한다(503).
//    email 클레임만으로 여는 것은 거부한다 —
//      · Firebase 는 사용자가 스스로 email 을 바꿀 수 있다(updateEmail). 현재는 관리자 주소가
//        선점돼 있어 막히지만, 관리자 계정을 지우거나 주소를 바꾸면 그 주소가 풀린다.
//      · email_verified 를 강제하지 않는 가입 경로에서는 미검증 주소로도 토큰이 발급된다.
//    즉 email 단독 판정은 "지금은 우연히 안전한" 계약이라 재화 권한의 단독 근거로 쓰지 않는다.
//    사용자 문서의 isPremium/role 같은 **일반 필드도 관리자 근거로 쓰지 않는다**(Rules 로 잠겨
//    있더라도 권한 판정 근거로는 부적절 — 서버 환경변수가 유일한 신뢰 출처다).
//
// 🔜 후속: Firebase Custom Claims(admin:true)로 옮기면 env 관리 없이 더 강해진다.
//
// 멱등: users/{target}/grants/{operationId}. 원자: 지급과 원장 기록이 한 트랜잭션.
// ⚠️ Secret·전체 문서·stack 을 응답/로그에 노출하지 않는다.
import { getAccessToken } from "../../_shared/googleAuth";
import { beginTransaction, batchGet, commit, rollback, verifyIdTokenOwnsUid, type FirestoreTarget } from "../../_shared/firestoreRest";
import { resolveRewardEnv } from "../../_shared/rewardEnv";
import { parseAllowlist } from "../../_shared/rewardPolicy";

const J = (o: any, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });

const ADMIN_EMAIL = "lhaa0130@gmail.com";   // functions/api/admin/article.ts 와 동일 기준
const MAX_BODY = 2048;
const PROD_PROJECT_ID = "dori-ai-0130";
const MAX_GRANT = 1_000_000;                // 오타 폭주 방어

const UID_RE = /^[A-Za-z0-9_-]{6,128}$/;
const OP_RE = /^grant_[A-Za-z0-9_-]{6,80}$/;

function decodeToken(idToken: string): { uid: string; email: string; aud: string; iss: string; exp: number } | null {
  try {
    const p = idToken.split(".");
    if (p.length !== 3) return null;
    const j = JSON.parse(decodeURIComponent(escape(atob(p[1].replace(/-/g, "+").replace(/_/g, "/")))));
    const uid = j.user_id || j.sub;
    if (!uid || typeof uid !== "string") return null;
    return { uid, email: String(j.email || ""), aud: String(j.aud || ""), iss: String(j.iss || ""), exp: Number(j.exp || 0) };
  } catch { return null; }
}

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
    const expectedProject = mode === "emulator" ? (renv.env as { projectId: string }).projectId : PROD_PROJECT_ID;

    // ⚠️ fail-closed: 서버 관리자 allowlist 가 없으면 엔드포인트 자체를 비활성화한다.
    //    (email 클레임만으로 여는 약한 계약을 허용하지 않는다 — 파일 상단 권한 계약 참고)
    const adminUids = parseAllowlist(env.REWARD_ADMIN_UIDS);
    if (adminUids.size === 0) return J({ ok: false, error: "admin_grant_disabled" }, 503);

    const raw = await request.text();
    if (raw.length > MAX_BODY) return J({ ok: false, error: "invalid_request" }, 400);
    let body: unknown;
    try { body = JSON.parse(raw); } catch { return J({ ok: false, error: "invalid_request" }, 400); }
    const clean = sanitize(body);
    if (!clean.ok) return J({ ok: false, error: "invalid_request", detail: clean.error }, 400);

    // ── 인증 ──
    const m = String(request.headers.get("Authorization") || "").match(/^Bearer\s+(.+)$/);
    if (!m) return J({ ok: false, error: "unauthenticated" }, 401);
    const idToken = m[1].trim();
    const decoded = decodeToken(idToken);
    if (!decoded) return J({ ok: false, error: "unauthenticated" }, 401);
    if (decoded.aud !== expectedProject) return J({ ok: false, error: "unauthenticated" }, 401);
    if (!decoded.iss.endsWith(expectedProject)) return J({ ok: false, error: "unauthenticated" }, 401);
    if (!decoded.exp || decoded.exp * 1000 < Date.now()) return J({ ok: false, error: "unauthenticated" }, 401);

    // 토큰 서명·유효성 실검증(Firestore 가 거부하면 invalid). 이게 통과해야 클레임을 신뢰한다.
    const own = await verifyIdTokenOwnsUid(target, idToken, decoded.uid);
    if (own !== "ok") return J({ ok: false, error: "unauthenticated" }, 401);

    // ── 권한: 서버 allowlist(필수) AND 관리자 email(심층 방어) ──
    //    allowlist 미설정 = 엔드포인트 비활성. email 만으로는 절대 열지 않는다.
    if (!adminUids.has(decoded.uid)) return J({ ok: false, error: "forbidden" }, 403);
    if (decoded.email.trim().toLowerCase() !== ADMIN_EMAIL.toLowerCase()) return J({ ok: false, error: "forbidden" }, 403);
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
