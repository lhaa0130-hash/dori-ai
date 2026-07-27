// Cloudflare Pages Function — POST /api/profile/title (05-09)
// 칭호(전시) 변경의 **유일한 권위 경로**.
//
// ⚠️ 이 endpoint 가 닫는 결함:
//   유료 칭호 39종(30~800 솜사탕)은 효과가 `text` 문자열 하나뿐이라, 프로필의 **자유 입력창**에
//   같은 글자를 치면 구매 결과와 바이트 단위로 동일한 문서·화면이 나왔다(= 구매 우회).
//   → 카탈로그 칭호(titleId)와 커스텀 칭호(customTitle)를 분리하고, 서버가 **소유**를 확인한
//     경우에만 catalog 모드로 저장한다. rarity·스타일은 저장하지 않고 카탈로그에서 조회한다.
//
// ⚠️ 왜 Rules 가 아니라 endpoint 인가(docs/title-authority-decision.md):
//   Rules 의 string.size() 는 **UTF-8 바이트**라 "24자" 계약을 표현할 수 없고(한글 8자=24바이트),
//   Unicode NFC 정규화·trim·멱등을 Rules 로 강제할 수 없다.
//
// 멱등: users/{uid}/titleOps/{operationId}. 원자: 원장과 문서 갱신이 한 트랜잭션.
// ⚠️ Secret·전체 문서·stack 을 응답/로그에 노출하지 않는다.
import { getAccessToken } from "../../_shared/googleAuth";
import {
  beginTransaction, batchGet, commit, rollback, verifyIdTokenOwnsUid, waitBeforeRetry, type FirestoreTarget,
} from "../../_shared/firestoreRest";
import { resolveRewardEnv } from "../../_shared/rewardEnv";
import {
  isTitleItemKey, titleCatalogText, normalizeCustomTitle, CUSTOM_TITLE_MAX,
} from "../../../lib/titleAuthority.ts";

const J = (o: any, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });

const MAX_BODY = 2048;
const PROD_PROJECT_ID = "dori-ai-0130";
const OP_RE = /^title_[A-Za-z0-9_-]{6,80}$/;

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

export type TitleIntent =
  | { mode: "catalog"; titleId: string; operationId: string }
  | { mode: "custom"; customTitle: string; operationId: string }
  | { mode: "none"; operationId: string };

/**
 * 요청 정제 — mode 별로 **필요한 필드만** 허용한다.
 * ⚠️ uid/email/ownedItems/premium/rarity/style/title 은 '있으면 거부'(권위값 주입 차단).
 */
export function sanitizeTitleRequest(body: unknown): { ok: true; intent: TitleIntent } | { ok: false; error: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { ok: false, error: "invalid_request" };
  const b = body as Record<string, unknown>;

  const forbidden = ["uid", "email", "ownedItems", "isPremium", "premium", "rarity", "tone", "style",
    "title", "titleMode", "cottonCandy", "price", "amount"];
  for (const k of forbidden) if (k in b) return { ok: false, error: "forbidden_field:" + k };

  const allowed = new Set(["mode", "titleId", "customTitle", "operationId", "idToken"]);
  for (const k of Object.keys(b)) if (!allowed.has(k)) return { ok: false, error: "unexpected_field:" + k };

  if (typeof b.operationId !== "string" || !OP_RE.test(b.operationId)) return { ok: false, error: "invalid_operation_id" };
  const operationId = b.operationId;

  if (b.mode === "catalog") {
    if ("customTitle" in b) return { ok: false, error: "unexpected_field:customTitle" };
    if (!isTitleItemKey(b.titleId)) return { ok: false, error: "unknown_title_item" };
    return { ok: true, intent: { mode: "catalog", titleId: b.titleId as string, operationId } };
  }
  if (b.mode === "custom") {
    if ("titleId" in b) return { ok: false, error: "unexpected_field:titleId" };
    if (typeof b.customTitle !== "string") return { ok: false, error: "invalid_custom_title" };
    // ⚠️ 원문 길이도 막는다 — 정규화로 줄어들 수 있지만, 과도한 입력 자체를 받지 않는다.
    if ([...b.customTitle].length > CUSTOM_TITLE_MAX * 4) return { ok: false, error: "invalid_custom_title" };
    const norm = normalizeCustomTitle(b.customTitle);
    if (!norm) return { ok: false, error: "empty_custom_title" };
    return { ok: true, intent: { mode: "custom", customTitle: norm, operationId } };
  }
  if (b.mode === "none") {
    if ("titleId" in b || "customTitle" in b) return { ok: false, error: "unexpected_field:mode_none" };
    return { ok: true, intent: { mode: "none", operationId } };
  }
  return { ok: false, error: "invalid_mode" };
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

    if (mode === "production") {
      const { clientEmail, privateKey } = renv.env as { clientEmail: string; privateKey: string };
      if (!clientEmail || !privateKey) return J({ ok: false, error: "dependency_unavailable" }, 503);
    }

    const raw = await request.text();
    if (raw.length > MAX_BODY) return J({ ok: false, error: "invalid_request" }, 400);
    let body: unknown;
    try { body = JSON.parse(raw); } catch { return J({ ok: false, error: "invalid_request" }, 400); }
    const clean = sanitizeTitleRequest(body);
    if (!clean.ok) return J({ ok: false, error: "invalid_request", detail: clean.error }, 400);

    // ── 인증 ──
    const m = String(request.headers.get("Authorization") || "").match(/^Bearer\s+(.+)$/);
    if (!m) return J({ ok: false, error: "unauthenticated" }, 401);
    const idToken = m[1].trim();
    const decoded = uidFromToken(idToken);
    if (!decoded) return J({ ok: false, error: "unauthenticated" }, 401);
    if (decoded.aud !== expectedProject) return J({ ok: false, error: "unauthenticated" }, 401);
    if (!decoded.iss.endsWith(expectedProject)) return J({ ok: false, error: "unauthenticated" }, 401);
    if (!decoded.exp || decoded.exp * 1000 < Date.now()) return J({ ok: false, error: "unauthenticated" }, 401);
    const uid = decoded.uid;   // ⚠️ 대상은 언제나 토큰의 uid. 요청 body 로 지정할 수 없다.

    const own = await verifyIdTokenOwnsUid(target, idToken, uid);
    if (own === "invalid") return J({ ok: false, error: "unauthenticated" }, 401);
    if (own === "mismatch") return J({ ok: false, error: "forbidden" }, 403);

    let token: string;
    if (mode === "emulator") token = "owner";
    else {
      const { clientEmail, privateKey } = renv.env as { clientEmail: string; privateKey: string };
      const at = await getAccessToken(clientEmail, privateKey, Date.now());
      if (!at.ok) return J({ ok: false, error: "dependency_unavailable" }, 503);
      token = at.token;
    }

    return await runTitleChange(target, token, uid, clean.intent, cid);
  } catch {
    return J({ ok: false, error: "internal_error", cid }, 500);
  }
};

async function runTitleChange(
  target: FirestoreTarget, token: string, uid: string, intent: TitleIntent, cid: string,
): Promise<Response> {
  const userRel = `users/${uid}`;
  const opRel = `users/${uid}/titleOps/${intent.operationId}`;
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

      // 멱등: 같은 operationId 재요청 → 저장된 결과 반환(추가 변경 없음)
      if (op.exists) {
        await rollback(target, token, tx);
        const of = op.fields as Record<string, any>;
        return J({ ok: true, duplicate: true, mode: String(of?.mode || ""), title: String(of?.title || "") });
      }

      const u = user.fields as Record<string, any>;

      let titleMode = intent.mode;
      let titleId = "";
      let customTitle = "";
      let display = "";

      if (intent.mode === "catalog") {
        // ⚠️ **읽은 문서**의 ownedItems 만 신뢰한다. 요청 body 의 ownedItems 는 애초에 거부했고,
        //    Rules 도 ownedItems 를 잠가 두었다(두 방어가 서로를 전제하지 않는다).
        const ownedRaw = Array.isArray(u.ownedItems) ? (u.ownedItems as unknown[]) : [];
        const owned = new Set(ownedRaw.filter((x): x is string => typeof x === "string"));
        if (!owned.has(intent.titleId)) {
          await rollback(target, token, tx);
          return J({ ok: false, error: "title_not_owned" }, 403);
        }
        titleId = intent.titleId;
        display = titleCatalogText(intent.titleId);      // 표시 문자열은 **서버 카탈로그**에서만 온다
      } else if (intent.mode === "custom") {
        customTitle = intent.customTitle;                // 이미 정규화·절단된 값
        display = customTitle;
      }
      // none 이면 전부 빈 값 → 표시 없음

      await commit(target, token, tx, [
        { rel: opRel, requireNotExists: true,
          fields: { uid, mode: titleMode, titleId, customTitle, title: display, createdAt: nowIso, schemaVersion: 1 } },
        { rel: userRel, updateMask: ["titleMode", "titleId", "customTitle", "title"],
          // legacy `title` 은 **구버전 client 표시 호환용**으로만 동기화한다. 권한 근거가 아니다.
          fields: { titleMode, titleId, customTitle, title: display } },
      ]);
      return J({ ok: true, duplicate: false, mode: titleMode, titleId, customTitle, title: display });
    } catch (e: any) {
      await rollback(target, token, tx);
      if (e?.code === "firestore_forbidden") return J({ ok: false, error: "internal_error", detail: "firestore_permission" }, 500);
      if (e?.code === "commit_conflict") { await waitBeforeRetry(attempt); continue; }
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
