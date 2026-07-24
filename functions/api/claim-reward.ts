// Cloudflare Pages Function — POST /api/claim-reward (04-18)
// 신뢰 서버 출석 보상 게이트: 클라이언트는 rewardType 만 보낸다. 금액·날짜·uid 는 서버가 결정.
//  인증: 사용자 ID 토큰(소유권은 Firestore로 실검증). 환경 정책: production=인증 사용자 허용 /
//        preview·불명=REWARD_TEST_UIDS allowlist 강제(fail-closed)
//  쓰기: 서비스 계정 OAuth → Firestore REST 트랜잭션(멱등·원자·legacy 인식).
// ⚠️ Secret(개인키·토큰)·전체 users 문서·stack 을 응답/로그에 노출하지 않는다. Production 은 Secret 부재로 fail-closed.

import {
  sanitizeRewardRequest, todayKST, claimIdFor, computeAttendanceReward, levelTierFromExp, parseAllowlist,
} from "../_shared/rewardPolicy";
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
    const clean = sanitizeRewardRequest(body);
    if (!clean.ok) return J({ ok: false, error: "invalid_request", detail: clean.error }, 400);

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

// POST 외 메서드 → 405
export const onRequest: any = async (context: any) => {
  if (context.request.method === "POST") return onRequestPost(context);
  if (context.request.method === "OPTIONS")
    return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization" } });
  return J({ ok: false, error: "method_not_allowed" }, 405);
};
