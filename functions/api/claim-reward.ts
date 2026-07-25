// Cloudflare Pages Function — POST /api/claim-reward (04-18)
// 신뢰 서버 출석 보상 게이트: 클라이언트는 rewardType 만 보낸다. 금액·날짜·uid 는 서버가 결정.
//  인증: 사용자 ID 토큰(소유권은 Firestore로 실검증). 환경 정책: production=인증 사용자 허용 /
//        preview·불명=REWARD_TEST_UIDS allowlist 강제(fail-closed)
//  쓰기: 서비스 계정 OAuth → Firestore REST 트랜잭션(멱등·원자·legacy 인식).
// ⚠️ Secret(개인키·토큰)·전체 users 문서·stack 을 응답/로그에 노출하지 않는다. Production 은 Secret 부재로 fail-closed.

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
  beginTransaction, batchGet, commit, rollback, verifyIdTokenOwnsUid,
} from "../_shared/firestoreRest";

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

const FIRESTORE_PROJECT_ID = "dori-ai-0130";

export const onRequestPost: any = async (context: any) => {
  const cid = Math.random().toString(36).slice(2, 8); // correlation id(비밀 아님)
  try {
    const { request, env } = context;

    // ── 필수 Secret 부재 시 fail-closed ──
    const clientEmail = String(env.FIREBASE_SA_CLIENT_EMAIL || "");
    const privateKey = String(env.FIREBASE_SA_PRIVATE_KEY || "");
    const allow = parseAllowlist(env.REWARD_TEST_UIDS);
    // 환경 정책: REWARD_ENV==="production" → allowlist 없이 인증 사용자 허용.
    //  그 외(preview·미설정·불명) → allowlist 강제. 환경 판별이 명확치 않으면 지급하지 않는다(fail-closed).
    const isProduction = String(env.REWARD_ENV || "").trim().toLowerCase() === "production";
    if (!clientEmail || !privateKey) return J({ ok: false, error: "dependency_unavailable" }, 503);
    // preview/불명 환경에서 allowlist 가 비어 있으면 전면 차단(=Production Secret 미설정 상태의 안전판)
    if (!isProduction && allow.size === 0) return J({ ok: false, error: "forbidden" }, 403);

    // ── 요청 파싱·정제 ──
    const raw = await request.text();
    if (raw.length > MAX_BODY) return J({ ok: false, error: "invalid_request" }, 400);
    let body: unknown;
    try { body = JSON.parse(raw); } catch { return J({ ok: false, error: "invalid_request" }, 400); }
    // rewardType 별 요청 정제. my_world_interaction 은 operationId 멱등 경로로 분기.
    const rewardType = (body as { rewardType?: unknown } | null)?.rewardType;
    let interaction: { operationId: string; kind: string } | null = null;
    let extended: { policy: ExtendedRewardPolicy; operationId: string; sourceId?: string } | null = null;
    if (rewardType === "my_world_interaction") {
      const ci = sanitizeInteractionRewardRequest(body);
      if (!ci.ok) return J({ ok: false, error: "invalid_request", detail: ci.error }, 400);
      interaction = { operationId: ci.operationId, kind: ci.kind };
    } else if (isExtendedRewardType(rewardType)) {
      // community_post·community_comment·mission_complete·minigame_play·game_activity
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
    // 값싼 클레임 검증(서명검증은 아래 Firestore 소유권검증이 대신함)
    if (decoded.aud !== FIRESTORE_PROJECT_ID) return J({ ok: false, error: "unauthenticated" }, 401);
    if (!decoded.iss.endsWith(FIRESTORE_PROJECT_ID)) return J({ ok: false, error: "unauthenticated" }, 401);
    if (!decoded.exp || decoded.exp * 1000 < Date.now()) return J({ ok: false, error: "unauthenticated" }, 401);

    const uid = decoded.uid;
    // ── allowlist(preview 전용, Firestore 접근 전). production 은 인증 사용자면 통과 ──
    if (!isProduction && !allow.has(uid)) return J({ ok: false, error: "forbidden" }, 403);

    // ── 토큰 소유권 실검증(Firestore가 토큰 검증) ──
    const own = await verifyIdTokenOwnsUid(idToken, uid);
    if (own === "invalid") return J({ ok: false, error: "unauthenticated" }, 401);
    if (own === "mismatch") return J({ ok: false, error: "forbidden" }, 403);

    // ── SA OAuth ──
    const at = await getAccessToken(clientEmail, privateKey, Date.now());
    if (!at.ok) return J({ ok: false, error: "dependency_unavailable" }, 503); // OAuth 실패(설정/네트워크) → 503
    const token = at.token;

    const today = todayKST(new Date());

    // ── my_world_interaction: operationId 멱등 EXP 보상(서버 권위) ──
    if (interaction) return await runInteractionReward(token, uid, today, interaction, cid);
    // ── 확장 타입(community/mission/minigame/activity): 타입별 독립 일일상한 + operationId 멱등 ──
    if (extended) return await runExtendedReward(token, uid, today, extended, cid);

    const claimId = claimIdFor("daily_attendance", today);
    const userRel = `users/${uid}`;
    const claimRel = `users/${uid}/rewardClaims/${claimId}`;

    // ── 트랜잭션(충돌 시 제한 재시도) ──
    let lastErr: any = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      let tx: string;
      try { tx = await beginTransaction(token); }
      catch (e: any) { lastErr = e; if (e?.status === 403) return J({ ok: false, error: "internal_error", detail: "firestore_permission" }, 500); continue; }

      try {
        const got = await batchGet(token, tx, [userRel, claimRel]);
        const user = got[userRel];
        const claim = got[claimRel];

        if (!user.exists) { await rollback(token, tx); return J({ ok: false, error: "user_not_found" }, 404); }
        if (claim.exists) {
          await rollback(token, tx);
          return J({ ok: true, status: "already_claimed", reward: { cottonCandy: 0, bonus: 0, exp: 0 }, rewardDate: today });
        }

        const u = user.fields as Record<string, any>;
        const comp = computeAttendanceReward(u.attendance as any, today);

        // legacy 인식: rewardClaims 없어도 기존 attendance 가 오늘이면 재지급 금지
        if (comp.alreadyToday) {
          await commit(token, tx, [{
            rel: claimRel, requireNotExists: true,
            fields: { uid, rewardType: "daily_attendance", rewardDate: today, status: "legacy_recognized", source: "legacy_recognized", cottonCandyAmount: 0, expAmount: 0, schemaVersion: 1, createdAt: new Date().toISOString() },
          }]);
          return J({ ok: true, status: "legacy_recognized", reward: { cottonCandy: 0, bonus: 0, exp: 0 }, rewardDate: today });
        }

        // 사용자 상태 검증 — 손상값 자동수정 없이 지급 중단
        const curCandy = typeof u.cottonCandy === "number" && Number.isFinite(u.cottonCandy) && u.cottonCandy >= 0 ? u.cottonCandy : null;
        if (curCandy === null) { await rollback(token, tx); return J({ ok: false, error: "invalid_user_state" }, 422); }
        const curTotal = typeof u.cottonCandyTotal === "number" && u.cottonCandyTotal >= 0 ? u.cottonCandyTotal : 0;
        const curExp = typeof u.doriExp === "number" && u.doriExp >= 0 ? u.doriExp : 0;
        const newExp = curExp + comp.xp;
        const { level, tier } = levelTierFromExp(newExp);

        await commit(token, tx, [
          { rel: claimRel, requireNotExists: true,
            fields: { uid, rewardType: "daily_attendance", rewardDate: today, status: "granted", source: "server_granted", cottonCandyAmount: comp.amount, expAmount: comp.xp, schemaVersion: 1, createdAt: new Date().toISOString() } },
          { rel: userRel, updateMask: ["cottonCandy", "cottonCandyTotal", "doriExp", "tier", "level", "attendance"],
            fields: { cottonCandy: curCandy + comp.amount, cottonCandyTotal: curTotal + comp.amount, doriExp: newExp, tier, level, attendance: comp.newAttendance } },
        ]);

        return J({ ok: true, status: "granted", reward: { cottonCandy: comp.amount, bonus: comp.bonus ? 200 : 0, exp: comp.xp }, rewardDate: today });
      } catch (e: any) {
        lastErr = e;
        await rollback(token, tx);
        if (e?.code === "firestore_forbidden") return J({ ok: false, error: "internal_error", detail: "firestore_permission" }, 500);
        if (e?.code === "commit_conflict") continue; // 재시도(동시요청이 이미 지급 → 다음 루프서 already_claimed)
        return J({ ok: false, error: "internal_error", cid }, 500);
      }
    }
    return J({ ok: false, error: "retryable_conflict", cid }, 409);
  } catch {
    return J({ ok: false, error: "internal_error", cid }, 500);
  }
};

// ── my_world_interaction 트랜잭션(멱등·원자·서버 권위) ──
//   ⚠️ EDGE RUNTIME E2E: NOT VERIFIED — 로컬 wrangler 부재로 실제 엣지 실행은 미검증.
//   서버 결정: awardedExp(정책 xp표+일일40상한) / resultingExp(서버 doriExp 기준) / level·tier.
//   멱등: rewardOperations/{operationId} 존재 시 저장된 결과 반환(재지급 없음).
//   일일 카운터: 사용자 문서 평면 필드 rewardDailyDate/rewardDailyExp(서버만 갱신).
async function runInteractionReward(
  token: string, uid: string, today: string, intent: { operationId: string; kind: string }, cid: string,
): Promise<Response> {
  const userRel = `users/${uid}`;
  const opRel = `users/${uid}/rewardOperations/${intent.operationId}`;
  const nowIso = new Date().toISOString();

  for (let attempt = 0; attempt < 3; attempt++) {
    let tx: string;
    try { tx = await beginTransaction(token); }
    catch (e: any) { if (e?.status === 403) return J({ ok: false, error: "internal_error", detail: "firestore_permission" }, 500); continue; }
    try {
      const got = await batchGet(token, tx, [userRel, opRel]);
      const user = got[userRel];
      const op = got[opRel];
      if (!user.exists) { await rollback(token, tx); return J({ ok: false, error: "user_not_found" }, 404); }

      const u = user.fields as Record<string, any>;
      const serverExp = typeof u.doriExp === "number" && u.doriExp >= 0 ? Math.floor(u.doriExp) : 0;
      const dailyDate = typeof u.rewardDailyDate === "string" ? u.rewardDailyDate : "";
      const dailyExpEarned = dailyDate === today && typeof u.rewardDailyExp === "number" && u.rewardDailyExp >= 0 ? Math.floor(u.rewardDailyExp) : 0;

      const ledgerRecord = op.exists
        ? { awardedExp: Number((op.fields as any)?.awardedExp) || 0, resultingExp: Number((op.fields as any)?.resultingExp) || serverExp }
        : null;

      const r = applyRewardOperation({ operationId: intent.operationId, kind: intent.kind as any, serverExp, dailyExpEarned, ledgerRecord });

      if (r.alreadyProcessed) {
        await rollback(token, tx);
        return J({ ok: true, duplicate: true, awardedExp: r.awardedExp, doriExp: r.resultingExp, level: r.level, tier: r.tier });
      }

      await commit(token, tx, [
        { rel: opRel, requireNotExists: true,
          fields: { uid, rewardType: "my_world_interaction", kind: intent.kind, awardedExp: r.awardedExp, resultingExp: r.resultingExp, resultingLevel: r.level, resultingTier: r.tier, createdAt: nowIso, schemaVersion: 1 } },
        { rel: userRel, updateMask: ["doriExp", "level", "tier", "rewardDailyDate", "rewardDailyExp"],
          fields: { doriExp: r.resultingExp, level: r.level, tier: r.tier, rewardDailyDate: today, rewardDailyExp: r.newDailyExpEarned } },
      ]);
      return J({ ok: true, duplicate: false, awardedExp: r.awardedExp, doriExp: r.resultingExp, level: r.level, tier: r.tier });
    } catch (e: any) {
      await rollback(token, tx);
      if (e?.code === "firestore_forbidden") return J({ ok: false, error: "internal_error", detail: "firestore_permission" }, 500);
      if (e?.code === "commit_conflict") continue; // 동시요청 → 다음 루프서 duplicate 반환
      return J({ ok: false, error: "internal_error", cid }, 500);
    }
  }
  return J({ ok: false, error: "retryable_conflict", cid }, 409);
}

// ── 확장 타입 트랜잭션(멱등·원자·서버 권위, 타입별 독립 일일상한) ──
//   서버 결정: awardedExp(정책 고정 xp + 타입별 일일상한) / resultingExp(서버 doriExp 기준) / level·tier.
//   멱등: rewardOperations/{operationId} 존재 시 저장된 결과 반환(재지급 없음).
//        source 필요 타입은 operationId={prefix}_{sourceId} 라 같은 글/댓글/미션/게임은 자연히 1회.
//   일일 카운터: 타입별 평면 필드 rewardTypeDate_{type}/rewardTypeExp_{type}(타입 간 간섭 없음, 롤오버 시 자기 필드만 리셋).
//   ⚠️ EDGE RUNTIME E2E: NOT VERIFIED — 로컬 wrangler 로 검증 예정.
async function runExtendedReward(
  token: string, uid: string, today: string,
  intent: { policy: ExtendedRewardPolicy; operationId: string; sourceId?: string }, cid: string,
): Promise<Response> {
  const rt = intent.policy.rewardType;
  const userRel = `users/${uid}`;
  const opRel = `users/${uid}/rewardOperations/${intent.operationId}`;
  const dateField = `rewardTypeDate_${rt}`;
  const expField = `rewardTypeExp_${rt}`;
  const nowIso = new Date().toISOString();

  for (let attempt = 0; attempt < 3; attempt++) {
    let tx: string;
    try { tx = await beginTransaction(token); }
    catch (e: any) { if (e?.status === 403) return J({ ok: false, error: "internal_error", detail: "firestore_permission" }, 500); continue; }
    try {
      const got = await batchGet(token, tx, [userRel, opRel]);
      const user = got[userRel];
      const op = got[opRel];
      if (!user.exists) { await rollback(token, tx); return J({ ok: false, error: "user_not_found" }, 404); }

      // 멱등: 이미 지급된 operationId → 저장된 결과 반환(재지급 없음)
      if (op.exists) {
        await rollback(token, tx);
        const of = op.fields as Record<string, any>;
        return J({ ok: true, duplicate: true, rewardType: rt, awardedExp: Number(of?.awardedExp) || 0, doriExp: Number(of?.resultingExp) || 0, level: Number(of?.resultingLevel) || 0, tier: of?.resultingTier });
      }

      const u = user.fields as Record<string, any>;
      const serverExp = typeof u.doriExp === "number" && u.doriExp >= 0 ? Math.floor(u.doriExp) : 0;
      // 타입별 독립 카운터: 이 타입의 날짜가 오늘일 때만 누적분을 인정(롤오버 시 0)
      const typeEarned = u[dateField] === today && typeof u[expField] === "number" && u[expField] >= 0 ? Math.floor(u[expField]) : 0;
      const award = computeExtendedExp(intent.policy, typeEarned);
      const resultingExp = serverExp + award;
      const { level, tier } = levelTierFromExp(resultingExp);
      const newTypeEarned = typeEarned + award;

      await commit(token, tx, [
        { rel: opRel, requireNotExists: true,
          fields: { uid, rewardType: rt, ...(intent.sourceId ? { sourceId: intent.sourceId } : {}), awardedExp: award, resultingExp, resultingLevel: level, resultingTier: tier, createdAt: nowIso, schemaVersion: 1 } },
        { rel: userRel, updateMask: ["doriExp", "level", "tier", dateField, expField],
          fields: { doriExp: resultingExp, level, tier, [dateField]: today, [expField]: newTypeEarned } },
      ]);
      return J({ ok: true, duplicate: false, rewardType: rt, awardedExp: award, doriExp: resultingExp, level, tier });
    } catch (e: any) {
      await rollback(token, tx);
      if (e?.code === "firestore_forbidden") return J({ ok: false, error: "internal_error", detail: "firestore_permission" }, 500);
      if (e?.code === "commit_conflict") continue; // 동시요청 → 다음 루프서 duplicate 반환
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
