// Cloudflare Pages Function — POST /api/claim-reward (04-18 · 05-06H · 05-06I)
// 신뢰 서버 보상 게이트: 클라이언트는 rewardType(+operationId/sourceId) 만 보낸다. 금액·날짜·uid 는 서버가 결정.
//  인증: 사용자 ID 토큰(소유권은 Firestore/Auth 로 실검증). 환경 정책:
//        production → 인증 사용자 허용 / restricted(preview·불명) → REWARD_TEST_UIDS allowlist 강제 /
//        emulator(로컬 전용, fail-closed) → demo- 프로젝트 + loopback 만.
//  쓰기: production=SA OAuth, emulator=owner. Firestore REST 트랜잭션(멱등·원자·legacy 인식).
//  Community(community_post/comment): Firestore feed 소스 존재 + 작성자 UID 일치를 서버가 검증.
// ⚠️ Secret(개인키·토큰)·전체 users 문서·stack 을 응답/로그에 노출하지 않는다.
import {
  sanitizeRewardRequest, sanitizeInteractionRewardRequest, applyRewardOperation,
  todayKST, claimIdFor, computeAttendanceReward, levelTierFromExp, parseAllowlist,
} from "../_shared/rewardPolicy";
import {
  isExtendedRewardType, sanitizeExtendedRewardRequest, computeExtendedExp,
  type ExtendedRewardPolicy,
} from "../_shared/rewardTypes";
import { getAccessToken } from "../_shared/googleAuth";
import {
  beginTransaction, batchGet, commit, rollback, verifyIdTokenOwnsUid, type FirestoreTarget,
} from "../_shared/firestoreRest";
import { resolveRewardEnv } from "../_shared/rewardEnv";

const J = (o: any, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });

const MAX_BODY = 4096;

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

const PROD_PROJECT_ID = "dori-ai-0130";

// community 타입 sourceId → 검증할 Firestore feed 문서 rel. 형식 불량이면 null(=거부).
//  community_post: sourceId = feed 문서 id → feed/{id}
//  community_comment: sourceId = {postId}__{commentId} → feed/{postId}/comments/{commentId}
function communityFeedRel(rt: string, sourceId: string | undefined): string | null {
  if (!sourceId) return null;
  const ID = /^[A-Za-z0-9_-]{1,64}$/;
  if (rt === "community_post") return ID.test(sourceId) ? `feed/${sourceId}` : null;
  if (rt === "community_comment") {
    const parts = sourceId.split("__");
    if (parts.length !== 2) return null;
    const [postId, commentId] = parts;
    if (!ID.test(postId) || !ID.test(commentId)) return null;
    return `feed/${postId}/comments/${commentId}`;
  }
  return null;
}

export const onRequestPost: any = async (context: any) => {
  const cid = Math.random().toString(36).slice(2, 8); // correlation id(비밀 아님)
  try {
    const { request, env } = context;

    // ── 실행 환경 해석(fail-closed). emulator 는 로컬 안전장치 통과 시에만. ──
    const renv = resolveRewardEnv(env);
    if (!renv.ok) return J({ ok: false, error: renv.error.startsWith("emulator") || renv.error.includes("misconfigured") ? "dependency_unavailable" : "forbidden" }, renv.status);
    const mode = renv.env.mode;
    const target: FirestoreTarget = renv.env.target;
    const expectedProject = mode === "emulator" ? (renv.env as { projectId: string }).projectId : PROD_PROJECT_ID;
    const allow = parseAllowlist(env.REWARD_TEST_UIDS);

    // production/restricted 는 SA Secret 필요. restricted 는 allowlist 도 필요.
    if (mode !== "emulator") {
      const { clientEmail, privateKey } = renv.env as { clientEmail: string; privateKey: string };
      if (!clientEmail || !privateKey) return J({ ok: false, error: "dependency_unavailable" }, 503);
      if (mode === "restricted" && allow.size === 0) return J({ ok: false, error: "forbidden" }, 403);
    }

    // ── 요청 파싱·정제 ──
    const raw = await request.text();
    if (raw.length > MAX_BODY) return J({ ok: false, error: "invalid_request" }, 400);
    let body: unknown;
    try { body = JSON.parse(raw); } catch { return J({ ok: false, error: "invalid_request" }, 400); }
    const rewardType = (body as { rewardType?: unknown } | null)?.rewardType;
    let interaction: { operationId: string; kind: string } | null = null;
    let extended: { policy: ExtendedRewardPolicy; operationId: string; sourceId?: string } | null = null;
    if (rewardType === "my_world_interaction") {
      const ci = sanitizeInteractionRewardRequest(body);
      if (!ci.ok) return J({ ok: false, error: "invalid_request", detail: ci.error }, 400);
      interaction = { operationId: ci.operationId, kind: ci.kind };
    } else if (isExtendedRewardType(rewardType)) {
      const ce = sanitizeExtendedRewardRequest(body);
      if (!ce.ok) return J({ ok: false, error: "invalid_request", detail: ce.error }, 400);
      extended = { policy: ce.policy, operationId: ce.operationId, sourceId: ce.sourceId };
    } else {
      const clean = sanitizeRewardRequest(body);
      if (!clean.ok) return J({ ok: false, error: "invalid_request", detail: clean.error }, 400);
    }

    // ── 인증: Authorization: Bearer <ID token> ──
    const authz = String(request.headers.get("Authorization") || "");
    const m = authz.match(/^Bearer\s+(.+)$/);
    if (!m) return J({ ok: false, error: "unauthenticated" }, 401);
    const idToken = m[1].trim();
    const decoded = uidFromToken(idToken);
    if (!decoded) return J({ ok: false, error: "unauthenticated" }, 401);
    // 값싼 클레임 검증(서명검증은 아래 Firestore/Auth 소유권검증이 대신함). 프로젝트는 환경별.
    if (decoded.aud !== expectedProject) return J({ ok: false, error: "unauthenticated" }, 401);
    if (!decoded.iss.endsWith(expectedProject)) return J({ ok: false, error: "unauthenticated" }, 401);
    if (!decoded.exp || decoded.exp * 1000 < Date.now()) return J({ ok: false, error: "unauthenticated" }, 401);

    const uid = decoded.uid;
    // ── allowlist(restricted 전용). production·emulator 는 인증 사용자면 통과 ──
    if (mode === "restricted" && !allow.has(uid)) return J({ ok: false, error: "forbidden" }, 403);

    // ── 토큰 소유권 실검증(Firestore/Auth 에뮬레이터가 토큰 검증) ──
    const own = await verifyIdTokenOwnsUid(target, idToken, uid);
    if (own === "invalid") return J({ ok: false, error: "unauthenticated" }, 401);
    if (own === "mismatch") return J({ ok: false, error: "forbidden" }, 403);

    // ── 쓰기 토큰: production=SA OAuth, emulator=owner ──
    let token: string;
    if (mode === "emulator") {
      token = "owner"; // Firestore 에뮬레이터 관리자 우회(운영에서는 절대 불가 — 대상이 https 운영이면 여기 오지 않음)
    } else {
      const { clientEmail, privateKey } = renv.env as { clientEmail: string; privateKey: string };
      const at = await getAccessToken(clientEmail, privateKey, Date.now());
      if (!at.ok) return J({ ok: false, error: "dependency_unavailable" }, 503);
      token = at.token;
    }

    const today = todayKST(new Date());

    if (interaction) return await runInteractionReward(target, token, uid, today, interaction, cid);
    if (extended) return await runExtendedReward(target, token, uid, today, extended, cid);

    const claimId = claimIdFor("daily_attendance", today);
    const userRel = `users/${uid}`;
    const claimRel = `users/${uid}/rewardClaims/${claimId}`;

    let lastErr: any = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      let tx: string;
      try { tx = await beginTransaction(target, token); }
      catch (e: any) { lastErr = e; if (e?.status === 403) return J({ ok: false, error: "internal_error", detail: "firestore_permission" }, 500); continue; }

      try {
        const got = await batchGet(target, token, tx, [userRel, claimRel]);
        const user = got[userRel];
        const claim = got[claimRel];

        if (!user.exists) { await rollback(target, token, tx); return J({ ok: false, error: "user_not_found" }, 404); }
        if (claim.exists) {
          await rollback(target, token, tx);
          return J({ ok: true, status: "already_claimed", reward: { cottonCandy: 0, bonus: 0, exp: 0 }, rewardDate: today });
        }

        const u = user.fields as Record<string, any>;
        const comp = computeAttendanceReward(u.attendance as any, today);

        if (comp.alreadyToday) {
          await commit(target, token, tx, [{
            rel: claimRel, requireNotExists: true,
            fields: { uid, rewardType: "daily_attendance", rewardDate: today, status: "legacy_recognized", source: "legacy_recognized", cottonCandyAmount: 0, expAmount: 0, schemaVersion: 1, createdAt: new Date().toISOString() },
          }]);
          return J({ ok: true, status: "legacy_recognized", reward: { cottonCandy: 0, bonus: 0, exp: 0 }, rewardDate: today });
        }

        const curCandy = typeof u.cottonCandy === "number" && Number.isFinite(u.cottonCandy) && u.cottonCandy >= 0 ? u.cottonCandy : null;
        if (curCandy === null) { await rollback(target, token, tx); return J({ ok: false, error: "invalid_user_state" }, 422); }
        const curTotal = typeof u.cottonCandyTotal === "number" && u.cottonCandyTotal >= 0 ? u.cottonCandyTotal : 0;
        const curExp = typeof u.doriExp === "number" && u.doriExp >= 0 ? u.doriExp : 0;
        const newExp = curExp + comp.xp;
        const { level, tier } = levelTierFromExp(newExp);

        await commit(target, token, tx, [
          { rel: claimRel, requireNotExists: true,
            fields: { uid, rewardType: "daily_attendance", rewardDate: today, status: "granted", source: "server_granted", cottonCandyAmount: comp.amount, expAmount: comp.xp, schemaVersion: 1, createdAt: new Date().toISOString() } },
          { rel: userRel, updateMask: ["cottonCandy", "cottonCandyTotal", "doriExp", "tier", "level", "attendance"],
            fields: { cottonCandy: curCandy + comp.amount, cottonCandyTotal: curTotal + comp.amount, doriExp: newExp, tier, level, attendance: comp.newAttendance } },
        ]);

        return J({ ok: true, status: "granted", reward: { cottonCandy: comp.amount, bonus: comp.bonus ? 200 : 0, exp: comp.xp }, rewardDate: today });
      } catch (e: any) {
        lastErr = e;
        await rollback(target, token, tx);
        if (e?.code === "firestore_forbidden") return J({ ok: false, error: "internal_error", detail: "firestore_permission" }, 500);
        if (e?.code === "commit_conflict") continue;
        return J({ ok: false, error: "internal_error", cid }, 500);
      }
    }
    return J({ ok: false, error: "retryable_conflict", cid }, 409);
  } catch {
    return J({ ok: false, error: "internal_error", cid }, 500);
  }
};

// ── my_world_interaction 트랜잭션(멱등·원자·서버 권위) ──
async function runInteractionReward(
  target: FirestoreTarget, token: string, uid: string, today: string, intent: { operationId: string; kind: string }, cid: string,
): Promise<Response> {
  const userRel = `users/${uid}`;
  const opRel = `users/${uid}/rewardOperations/${intent.operationId}`;
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

      const u = user.fields as Record<string, any>;
      const serverExp = typeof u.doriExp === "number" && u.doriExp >= 0 ? Math.floor(u.doriExp) : 0;
      const dailyDate = typeof u.rewardDailyDate === "string" ? u.rewardDailyDate : "";
      const dailyExpEarned = dailyDate === today && typeof u.rewardDailyExp === "number" && u.rewardDailyExp >= 0 ? Math.floor(u.rewardDailyExp) : 0;

      const ledgerRecord = op.exists
        ? { awardedExp: Number((op.fields as any)?.awardedExp) || 0, resultingExp: Number((op.fields as any)?.resultingExp) || serverExp }
        : null;

      const r = applyRewardOperation({ operationId: intent.operationId, kind: intent.kind as any, serverExp, dailyExpEarned, ledgerRecord });

      if (r.alreadyProcessed) {
        await rollback(target, token, tx);
        return J({ ok: true, duplicate: true, awardedExp: r.awardedExp, doriExp: r.resultingExp, level: r.level, tier: r.tier });
      }

      await commit(target, token, tx, [
        { rel: opRel, requireNotExists: true,
          fields: { uid, rewardType: "my_world_interaction", kind: intent.kind, awardedExp: r.awardedExp, resultingExp: r.resultingExp, resultingLevel: r.level, resultingTier: r.tier, createdAt: nowIso, schemaVersion: 1 } },
        { rel: userRel, updateMask: ["doriExp", "level", "tier", "rewardDailyDate", "rewardDailyExp"],
          fields: { doriExp: r.resultingExp, level: r.level, tier: r.tier, rewardDailyDate: today, rewardDailyExp: r.newDailyExpEarned } },
      ]);
      return J({ ok: true, duplicate: false, awardedExp: r.awardedExp, doriExp: r.resultingExp, level: r.level, tier: r.tier });
    } catch (e: any) {
      await rollback(target, token, tx);
      if (e?.code === "firestore_forbidden") return J({ ok: false, error: "internal_error", detail: "firestore_permission" }, 500);
      if (e?.code === "commit_conflict") continue;
      return J({ ok: false, error: "internal_error", cid }, 500);
    }
  }
  return J({ ok: false, error: "retryable_conflict", cid }, 409);
}

// ── 확장 타입 트랜잭션(멱등·원자·서버 권위, 타입별 독립 일일상한) ──
//   community_post/comment 는 Firestore feed 소스의 존재 + 작성자 UID 일치를 같은 트랜잭션에서 검증한다
//   (없는 source·타인 source 거부). mission/minigame/activity 는 BOUNDED CLIENT-ASSERTED(상한+멱등으로 방어).
async function runExtendedReward(
  target: FirestoreTarget, token: string, uid: string, today: string,
  intent: { policy: ExtendedRewardPolicy; operationId: string; sourceId?: string }, cid: string,
): Promise<Response> {
  const rt = intent.policy.rewardType;
  const userRel = `users/${uid}`;
  const opRel = `users/${uid}/rewardOperations/${intent.operationId}`;
  const dateField = `rewardTypeDate_${rt}`;
  const expField = `rewardTypeExp_${rt}`;
  const nowIso = new Date().toISOString();

  // community 타입: 검증할 feed 소스 문서 경로. 형식 불량이면 즉시 거부(무결한 sourceId 만 통과).
  const isCommunity = rt === "community_post" || rt === "community_comment";
  const feedRel = isCommunity ? communityFeedRel(rt, intent.sourceId) : null;
  if (isCommunity && !feedRel) return J({ ok: false, error: "invalid_source" }, 400);

  for (let attempt = 0; attempt < 3; attempt++) {
    let tx: string;
    try { tx = await beginTransaction(target, token); }
    catch (e: any) { if (e?.status === 403) return J({ ok: false, error: "internal_error", detail: "firestore_permission" }, 500); continue; }
    try {
      const reads = feedRel ? [userRel, opRel, feedRel] : [userRel, opRel];
      const got = await batchGet(target, token, tx, reads);
      const user = got[userRel];
      const op = got[opRel];
      if (!user.exists) { await rollback(target, token, tx); return J({ ok: false, error: "user_not_found" }, 404); }

      // 멱등: 이미 지급된 operationId → 저장된 결과 반환(재지급 없음). 소스 검증 전에 처리(중복은 항상 안전).
      if (op.exists) {
        await rollback(target, token, tx);
        const of = op.fields as Record<string, any>;
        return J({ ok: true, duplicate: true, rewardType: rt, awardedExp: Number(of?.awardedExp) || 0, doriExp: Number(of?.resultingExp) || 0, level: Number(of?.resultingLevel) || 0, tier: of?.resultingTier });
      }

      // ── Community 소유권 검증: feed 소스가 실제 존재 + 작성자 UID == 토큰 UID ──
      if (feedRel) {
        const src = got[feedRel];
        if (!src || !src.exists) { await rollback(target, token, tx); return J({ ok: false, error: "source_not_found" }, 404); }
        const srcUid = (src.fields as Record<string, any>)?.uid;
        if (srcUid !== uid) { await rollback(target, token, tx); return J({ ok: false, error: "source_not_owned" }, 403); }
      }

      const u = user.fields as Record<string, any>;
      const serverExp = typeof u.doriExp === "number" && u.doriExp >= 0 ? Math.floor(u.doriExp) : 0;
      const typeEarned = u[dateField] === today && typeof u[expField] === "number" && u[expField] >= 0 ? Math.floor(u[expField]) : 0;
      const award = computeExtendedExp(intent.policy, typeEarned);
      const resultingExp = serverExp + award;
      const { level, tier } = levelTierFromExp(resultingExp);
      const newTypeEarned = typeEarned + award;

      await commit(target, token, tx, [
        { rel: opRel, requireNotExists: true,
          fields: { uid, rewardType: rt, ...(intent.sourceId ? { sourceId: intent.sourceId } : {}), awardedExp: award, resultingExp, resultingLevel: level, resultingTier: tier, createdAt: nowIso, schemaVersion: 1 } },
        { rel: userRel, updateMask: ["doriExp", "level", "tier", dateField, expField],
          fields: { doriExp: resultingExp, level, tier, [dateField]: today, [expField]: newTypeEarned } },
      ]);
      return J({ ok: true, duplicate: false, rewardType: rt, awardedExp: award, doriExp: resultingExp, level, tier });
    } catch (e: any) {
      await rollback(target, token, tx);
      if (e?.code === "firestore_forbidden") return J({ ok: false, error: "internal_error", detail: "firestore_permission" }, 500);
      if (e?.code === "commit_conflict") continue;
      return J({ ok: false, error: "internal_error", cid }, 500);
    }
  }
  return J({ ok: false, error: "retryable_conflict", cid }, 409);
}

// POST 외 메서드 → 405
export const onRequest: any = async (context: any) => {
  if (context.request.method === "POST") return onRequestPost(context);
  if (context.request.method === "OPTIONS")
    return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization" } });
  return J({ ok: false, error: "method_not_allowed" }, 405);
};
