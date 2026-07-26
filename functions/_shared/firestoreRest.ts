// Firestore REST — 값 인코딩/디코딩 + 트랜잭션(begin/batchGet/commit). (04-18)
// 데이터 프로젝트는 dori-ai-0130(=users/rewardClaims 가 실제로 있는 곳). SA 프로젝트와 무관.

export const FIRESTORE_PROJECT_ID = "dori-ai-0130";
// 엔드포인트 URL(:batchGet 등)에 쓰는 전체 https 주소.
export const FS_BASE = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents`;
// ⚠️ 요청 '본문' 안의 문서 이름은 호스트 없는 리소스 이름이어야 한다(batchGet documents[], commit update.name).
//    호스트(https://firestore.googleapis.com/v1/)를 붙이면 400 → 실환경에서만 드러난 버그(04-18).
export const DOC_NAME_PREFIX = `projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents`;

// ── Firestore 대상(프로젝트/URL) 설정 분리(05-06I) ─────────────────────────────
//  production 과 emulator 가 동일 코드 경로를 쓰되, 프로젝트 ID·REST base·document root·
//  emulator 여부만 이 target 으로 결정한다. 요청 body 의 resource name(documentRoot)과
//  URL(restBaseUrl)이 항상 같은 프로젝트를 가리키게 해 project 불일치를 원천 차단한다.
export interface FirestoreTarget {
  projectId: string;
  databaseId: string;
  restBaseUrl: string;   // https://.../v1/projects/{p}/databases/{db}/documents (또는 emulator http)
  documentRoot: string;  // projects/{p}/databases/{db}/documents (요청 body resource name 접두)
  emulator: boolean;
}

/** production 기본 대상(기존 상수 재사용 — 동작 불변). */
export function productionFirestoreTarget(): FirestoreTarget {
  return { projectId: FIRESTORE_PROJECT_ID, databaseId: "(default)", restBaseUrl: FS_BASE, documentRoot: DOC_NAME_PREFIX, emulator: false };
}

/** emulator 대상. host 는 loopback(127.0.0.1/localhost)만, projectId 는 demo- 접두만 허용(호출부에서 강제). */
export function emulatorFirestoreTarget(projectId: string, host: string): FirestoreTarget {
  const base = `http://${host}/v1/projects/${projectId}/databases/(default)/documents`;
  return { projectId, databaseId: "(default)", restBaseUrl: base, documentRoot: `projects/${projectId}/databases/(default)/documents`, emulator: true };
}

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

// target 기반 경로 헬퍼(호출부는 이걸 통해서만 URL/리소스 이름을 만든다).
export function docPathFor(t: FirestoreTarget, rel: string): string { return `${t.restBaseUrl}/${rel}`; }      // GET 엔드포인트용(전체 URL)
export function docNameFor(t: FirestoreTarget, rel: string): string { return `${t.documentRoot}/${rel}`; }    // 요청 본문용(리소스 이름)
// 하위호환(production 상수 기반) — 기존 호출 방식 유지용.
export function docPath(rel: string): string { return `${FS_BASE}/${rel}`; }
export function docName(rel: string): string { return `${DOC_NAME_PREFIX}/${rel}`; }

type H = Record<string, string>;
const authH = (token: string): H => ({ Authorization: `Bearer ${token}`, "Content-Type": "application/json" });

export async function beginTransaction(t: FirestoreTarget, token: string, fetchImpl: typeof fetch = fetch): Promise<string> {
  const r = await fetchImpl(`${t.restBaseUrl}:beginTransaction`, { method: "POST", headers: authH(token), body: "{}" });
  if (!r.ok) throw { code: "begin_tx_failed", status: r.status };
  const j = (await r.json()) as { transaction?: string };
  if (!j.transaction) throw { code: "begin_tx_no_id", status: 500 };
  return j.transaction;
}

/** batchGet — 여러 문서를 트랜잭션 컨텍스트로 읽는다. 반환: rel path → {exists, fields}. */
export async function batchGet(
  t: FirestoreTarget, token: string, transaction: string, relPaths: string[], fetchImpl: typeof fetch = fetch
): Promise<Record<string, { exists: boolean; fields: Record<string, unknown> }>> {
  const r = await fetchImpl(`${t.restBaseUrl}:batchGet`, {
    method: "POST", headers: authH(token),
    body: JSON.stringify({ documents: relPaths.map((rel) => docNameFor(t, rel)), transaction }),
  });
  if (!r.ok) throw { code: "batchget_failed", status: r.status };
  const arr = (await r.json()) as any[];
  const out: Record<string, { exists: boolean; fields: Record<string, unknown> }> = {};
  for (const rel of relPaths) {
    const full = docNameFor(t, rel);
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
  t: FirestoreTarget, token: string, transaction: string, writes: CommitWrite[], fetchImpl: typeof fetch = fetch
): Promise<void> {
  const body = {
    transaction,
    writes: writes.map((w) => {
      const write: any = { update: { name: docNameFor(t, w.rel), fields: encodeFields(w.fields) } };
      if (w.updateMask) write.updateMask = { fieldPaths: w.updateMask };
      if (w.requireNotExists) write.currentDocument = { exists: false };
      return write;
    }),
  };
  const r = await fetchImpl(`${t.restBaseUrl}:commit`, { method: "POST", headers: authH(token), body: JSON.stringify(body) });
  if (r.ok) return;
  // 전제조건 실패(이미 claim 존재) 또는 트랜잭션 충돌
  if (r.status === 409 || r.status === 412) throw { code: "commit_conflict", status: r.status };
  if (r.status === 403) throw { code: "firestore_forbidden", status: 403 };
  throw { code: "commit_failed", status: r.status };
}

export async function rollback(t: FirestoreTarget, token: string, transaction: string, fetchImpl: typeof fetch = fetch): Promise<void> {
  try { await fetchImpl(`${t.restBaseUrl}:rollback`, { method: "POST", headers: authH(token), body: JSON.stringify({ transaction }) }); } catch { /* best effort */ }
}

/** 사용자 토큰으로 소유권 검증 — GET userPrivate/{uid}. 200/404=유효+본인, 403=uid불일치, 401=무효. */
export async function verifyIdTokenOwnsUid(t: FirestoreTarget, idToken: string, uid: string, fetchImpl: typeof fetch = fetch): Promise<"ok" | "mismatch" | "invalid"> {
  const r = await fetchImpl(docPathFor(t, `userPrivate/${uid}`), { headers: { Authorization: `Bearer ${idToken}` } });
  if (r.status === 200 || r.status === 404) return "ok";
  if (r.status === 403) return "mismatch";
  return "invalid";
}

/**
 * 트랜잭션 충돌 재시도 대기 (05-09 감사 P2).
 *
 * ⚠️ 왜 필요한가 — 기존 재시도 루프는 `commit_conflict` 를 만나면 **즉시** 다음 시도를 했다.
 *   같은 users 문서를 동시에 갱신하는 요청들이 매번 같은 타이밍에 재시도해 서로를 밀어내고,
 *   3회를 모두 소진해 **양쪽 다 409** 로 끝났다(감사 계량: 동시 3건 중 성공 1.0건).
 *   데이터는 안전했지만(원장↔잔액 정합 유지) 정당한 작업이 함께 실패했다.
 *
 * 지수 백오프 + 지터로 재시도 시점을 흩는다. attempt 는 0부터.
 *   attempt 0 → 0~40ms, 1 → 40~120ms, 2 → 120~280ms
 * ⚠️ 상한을 300ms 로 둔다 — Cloudflare Pages Function 의 응답 지연 예산을 넘기지 않기 위해서다.
 */
export function conflictBackoffMs(attempt: number, rand: number = Math.random()): number {
  const base = Math.min(40 * Math.pow(2, attempt), 160);
  return Math.round(base * (0.5 + rand));   // 지터 0.5x~1.5x
}

/** 충돌 재시도 전 대기. 테스트에서 sleep 을 주입할 수 있다. */
export async function waitBeforeRetry(
  attempt: number, sleep: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms)),
): Promise<void> {
  await sleep(conflictBackoffMs(attempt));
}
