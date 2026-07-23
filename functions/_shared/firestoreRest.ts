// Firestore REST — 값 인코딩/디코딩 + 트랜잭션(begin/batchGet/commit). (04-18)
// 데이터 프로젝트는 dori-ai-0130(=users/rewardClaims 가 실제로 있는 곳). SA 프로젝트와 무관.

export const FIRESTORE_PROJECT_ID = "dori-ai-0130";
// 엔드포인트 URL(:batchGet 등)에 쓰는 전체 https 주소.
export const FS_BASE = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents`;
// ⚠️ 요청 '본문' 안의 문서 이름은 호스트 없는 리소스 이름이어야 한다(batchGet documents[], commit update.name).
//    호스트(https://firestore.googleapis.com/v1/)를 붙이면 400 → 실환경에서만 드러난 버그(04-18).
export const DOC_NAME_PREFIX = `projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents`;

// ── 값 인코딩(JS → Firestore REST Value) ──
export function encodeValue(v: unknown): any {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === "boolean") return { booleanValue: v };
  if (typeof v === "number") {
    return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  }
  if (typeof v === "string") return { stringValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(encodeValue) } };
  if (typeof v === "object") return { mapValue: { fields: encodeFields(v as Record<string, unknown>) } };
  return { nullValue: null };
}
export function encodeFields(obj: Record<string, unknown>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, val] of Object.entries(obj)) {
    if (val === undefined) continue; // undefined 직렬화 금지
    out[k] = encodeValue(val);
  }
  return out;
}
// ── 값 디코딩(Firestore REST Value → JS) ──
export function decodeValue(v: any): unknown {
  if (v == null) return null;
  if ("nullValue" in v) return null;
  if ("booleanValue" in v) return v.booleanValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("stringValue" in v) return v.stringValue;
  if ("timestampValue" in v) return v.timestampValue; // ISO 문자열 그대로
  if ("arrayValue" in v) return (v.arrayValue.values || []).map(decodeValue);
  if ("mapValue" in v) return decodeFields(v.mapValue.fields || {});
  return null;
}
export function decodeFields(fields: Record<string, any>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, val] of Object.entries(fields || {})) out[k] = decodeValue(val);
  return out;
}

export function docPath(rel: string): string { return `${FS_BASE}/${rel}`; }      // GET 엔드포인트용(전체 URL)
export function docName(rel: string): string { return `${DOC_NAME_PREFIX}/${rel}`; } // 요청 본문용(리소스 이름)

type H = Record<string, string>;
const authH = (token: string): H => ({ Authorization: `Bearer ${token}`, "Content-Type": "application/json" });

export async function beginTransaction(token: string, fetchImpl: typeof fetch = fetch): Promise<string> {
  const r = await fetchImpl(`${FS_BASE}:beginTransaction`, { method: "POST", headers: authH(token), body: "{}" });
  if (!r.ok) throw { code: "begin_tx_failed", status: r.status };
  const j = (await r.json()) as { transaction?: string };
  if (!j.transaction) throw { code: "begin_tx_no_id", status: 500 };
  return j.transaction;
}

/** batchGet — 여러 문서를 트랜잭션 컨텍스트로 읽는다. 반환: rel path → {exists, fields}. */
export async function batchGet(
  token: string, transaction: string, relPaths: string[], fetchImpl: typeof fetch = fetch
): Promise<Record<string, { exists: boolean; fields: Record<string, unknown> }>> {
  const r = await fetchImpl(`${FS_BASE}:batchGet`, {
    method: "POST", headers: authH(token),
    body: JSON.stringify({ documents: relPaths.map(docName), transaction }),
  });
  if (!r.ok) throw { code: "batchget_failed", status: r.status };
  const arr = (await r.json()) as any[];
  const out: Record<string, { exists: boolean; fields: Record<string, unknown> }> = {};
  for (const rel of relPaths) {
    const full = docName(rel);
    const hit = arr.find((d) => (d.found && d.found.name === full) || (d.missing === full));
    if (hit && hit.found) out[rel] = { exists: true, fields: decodeFields(hit.found.fields || {}) };
    else out[rel] = { exists: false, fields: {} };
  }
  return out;
}

export interface CommitWrite {
  rel: string;
  fields: Record<string, unknown>;
  updateMask?: string[];              // 지정 시 해당 필드만 갱신(부분 업데이트)
  requireNotExists?: boolean;         // 멱등: 문서가 없을 때만(claim 생성)
}

/** commit — 여러 write 를 원자적으로. requireNotExists 전제 실패 시 409 로 던진다. */
export async function commit(
  token: string, transaction: string, writes: CommitWrite[], fetchImpl: typeof fetch = fetch
): Promise<void> {
  const body = {
    transaction,
    writes: writes.map((w) => {
      const write: any = { update: { name: docName(w.rel), fields: encodeFields(w.fields) } };
      if (w.updateMask) write.updateMask = { fieldPaths: w.updateMask };
      if (w.requireNotExists) write.currentDocument = { exists: false };
      return write;
    }),
  };
  const r = await fetchImpl(`${FS_BASE}:commit`, { method: "POST", headers: authH(token), body: JSON.stringify(body) });
  if (r.ok) return;
  // 전제조건 실패(이미 claim 존재) 또는 트랜잭션 충돌
  if (r.status === 409 || r.status === 412) throw { code: "commit_conflict", status: r.status };
  if (r.status === 403) throw { code: "firestore_forbidden", status: 403 };
  throw { code: "commit_failed", status: r.status };
}

export async function rollback(token: string, transaction: string, fetchImpl: typeof fetch = fetch): Promise<void> {
  try { await fetchImpl(`${FS_BASE}:rollback`, { method: "POST", headers: authH(token), body: JSON.stringify({ transaction }) }); } catch { /* best effort */ }
}

/** 사용자 토큰으로 소유권 검증 — GET userPrivate/{uid}. 200/404=유효+본인, 403=uid불일치, 401=무효. */
export async function verifyIdTokenOwnsUid(idToken: string, uid: string, fetchImpl: typeof fetch = fetch): Promise<"ok" | "mismatch" | "invalid"> {
  const r = await fetchImpl(docPath(`userPrivate/${uid}`), { headers: { Authorization: `Bearer ${idToken}` } });
  if (r.status === 200 || r.status === 404) return "ok";
  if (r.status === 403) return "mismatch";
  return "invalid";
}
