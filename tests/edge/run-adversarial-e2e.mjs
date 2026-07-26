// Phase 3 — HTTP 계약 적대적 테스트 (감사 전용, 로컬 Edge 만)
//  ⚠️ Production 에는 절대 요청하지 않는다. wrangler pages dev + Firebase 에뮬레이터에서만 실행한다.
//  실행: firebase emulators:exec --only auth,firestore --project demo-illo-myworld \
//          "node tests/edge/run-adversarial-e2e.mjs"
//
//  대상: /api/claim-reward · /api/purchase · /api/admin/grant
//  롤아웃 상태별로 wrangler 인스턴스를 나눠 띄운다(CANDY_ROLLOUT_MODE 는 인스턴스 기동 시 고정되므로).
import { spawn, execSync } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync, symlinkSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const PROJECT = "demo-illo-myworld";
const FS_HOST = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";
const AUTH_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";
const REPO = path.resolve(fileURLToPath(new URL("../../", import.meta.url)));
const TMP = path.join(REPO, ".adv-e2e-tmp");

// 인스턴스 정의 — 롤아웃/관리자 조합
const P = { ALL: 8790, MISSING: 8791, CANARY: 8792, OFF: 8793, ARTICLE_ONLY: 8794 };

const results = [];
let group = "";
const G = (g) => { group = g; console.log(`\n── ${g} ──`); };
const ok = (n, cond, d = "") => {
  results.push({ group, n, ok: !!cond });
  console.log(`${cond ? "PASS" : "FAIL"}  ${n}${d ? "  — " + d : ""}`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Firestore 에뮬레이터 REST (owner 우회) ──
const fsUrl = (p) => `http://${FS_HOST}/v1/projects/${PROJECT}/databases/(default)/documents/${p}`;
const OWNER = { Authorization: "Bearer owner", "Content-Type": "application/json" };
async function fsSet(rel, fields) {
  const r = await fetch(fsUrl(rel), { method: "PATCH", headers: OWNER, body: JSON.stringify({ fields }) });
  if (!r.ok) throw new Error(`fsSet ${rel} → ${r.status}`);
}
async function fsGet(rel) {
  const r = await fetch(fsUrl(rel), { headers: OWNER });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`fsGet ${rel} → ${r.status}`);
  return (await r.json()).fields || {};
}
const S = (v) => ({ stringValue: String(v) });
const I = (v) => ({ integerValue: String(v) });
const B = (v) => ({ booleanValue: !!v });
const A = (arr) => ({ arrayValue: { values: arr.map((x) => S(x)) } });
const num = (f) => (f?.integerValue != null ? Number(f.integerValue) : f?.doubleValue != null ? Number(f.doubleValue) : undefined);
const arr = (f) => (f?.arrayValue?.values || []).map((v) => v.stringValue);

async function makeUser(email) {
  const r = await fetch(`http://${AUTH_HOST}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "test1234", returnSecureToken: true }),
  });
  const j = await r.json();
  if (!j.idToken) throw new Error(`signUp failed`);
  return { uid: j.localId, idToken: j.idToken, email };
}

// ── 범용 요청기: raw body/헤더/메서드를 그대로 통과시킨다 ──
async function raw(port, route, { method = "POST", body, headers = {}, token } = {}) {
  const h = { ...headers };
  if (token !== undefined) h.Authorization = token === null ? "" : `Bearer ${token}`;
  if (!("Content-Type" in h) && !("content-type" in h) && body !== undefined && headers.__noCT !== true) {
    h["Content-Type"] = "application/json";
  }
  delete h.__noCT;
  let r;
  try {
    r = await fetch(`http://127.0.0.1:${port}${route}`, { method, headers: h, body });
  } catch (e) {
    return { status: 0, json: null, text: `fetch_error:${e.message}` };
  }
  const text = await r.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* non-json */ }
  return { status: r.status, json, text };
}
const jbody = (o) => JSON.stringify(o);

// ── 포트 점유 프로세스 강제 정리 ────────────────────────────────────────────
// ⚠️ Windows 에서 spawn(shell:true) 로 띄운 npx→wrangler→workerd 트리는 child.kill() 로
//    죽지 않는다(셸만 죽고 손자 workerd 가 살아남아 포트를 계속 점유한다).
//    그러면 **다음 실행이 이전 인스턴스의 바인딩(옛 UID allowlist)에 붙어** 관리자·카나리
//    테스트가 정상 코드인데도 403 으로 실패한다. 반드시 포트 기준으로 정리한다.
function killPort(port) {
  try {
    if (process.platform === "win32") {
      const out = execSync(`netstat -ano -p tcp | findstr LISTENING | findstr :${port}`, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
      const pids = new Set(out.split(/\r?\n/).map((l) => l.trim().split(/\s+/).pop()).filter((p) => /^\d+$/.test(p) && p !== "0"));
      for (const pid of pids) { try { execSync(`taskkill /PID ${pid} /T /F`, { stdio: "ignore" }); } catch { /* 이미 종료 */ } }
      return pids.size;
    }
    const out = execSync(`lsof -ti tcp:${port}`, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    const pids = out.split(/\s+/).filter(Boolean);
    for (const pid of pids) { try { execSync(`kill -9 ${pid}`, { stdio: "ignore" }); } catch { /* noop */ } }
    return pids.length;
  } catch { return 0; }
}
function killAllPorts(label) {
  let n = 0;
  for (const port of Object.values(P)) n += killPort(port);
  if (n) console.log(`  (${label}: 잔존 프로세스 ${n}개 정리)`);
}

// ── wrangler 기동 ──
const children = [];
function ensureTmp() {
  if (existsSync(path.join(TMP, "functions"))) return;
  rmSync(TMP, { recursive: true, force: true });
  mkdirSync(path.join(TMP, "public"), { recursive: true });
  writeFileSync(path.join(TMP, "public", "index.html"), "<!doctype html><title>adv</title>ok");
  symlinkSync(path.join(REPO, "functions"), path.join(TMP, "functions"), "junction");
}
function startWrangler(port, extra = {}) {
  ensureTmp();
  const bindings = {
    REWARD_ENV: "emulator", FIREBASE_PROJECT_ID: PROJECT,
    FIRESTORE_EMULATOR_HOST: FS_HOST, FIREBASE_AUTH_EMULATOR_HOST: AUTH_HOST,
    REWARD_ROLLOUT_MODE: "all",
    ...extra,
  };
  const args = ["wrangler", "pages", "dev", "public", "--port", String(port), "--ip", "127.0.0.1", "--compatibility-date=2024-05-18"];
  for (const [k, v] of Object.entries(bindings)) args.push("--binding", `${k}=${v}`);
  const c = spawn("npx", ["--no-install", ...args], { cwd: TMP, stdio: ["ignore", "pipe", "pipe"], shell: process.platform === "win32" });
  c.stdout.on("data", (d) => process.env.ADV_DEBUG && process.stdout.write(`[${port}] ${d}`));
  c.stderr.on("data", (d) => process.env.ADV_DEBUG && process.stdout.write(`[${port}!] ${d}`));
  children.push(c);
}
async function waitPort(port, ms = 120000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try { const r = await fetch(`http://127.0.0.1:${port}/api/claim-reward`, { method: "OPTIONS" }); if (r.status === 204) return true; } catch { /* down */ }
    await sleep(1500);
  }
  return false;
}

// KST 오늘 (서버 계약과 동일)
function todayKST(d = new Date()) {
  const k = new Date(d.getTime() + 9 * 3600 * 1000);
  return `${k.getUTCFullYear()}-${String(k.getUTCMonth() + 1).padStart(2, "0")}-${String(k.getUTCDate()).padStart(2, "0")}`;
}
// 형식만 갖춘 가짜 토큰(서명 없음) — 클레임 검증 단계 테스트용
function fakeToken({ uid = "fake-uid-000001", aud = PROJECT, iss = `https://securetoken.google.com/${PROJECT}`, expDelta = 600, extra = {} } = {}) {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${b64({ alg: "none" })}.${b64({ user_id: uid, aud, iss, exp: Math.floor(Date.now() / 1000) + expDelta, ...extra })}.sig`;
}

const TODAY = todayKST();

async function main() {
  killAllPorts("기동 전");   // 이전 실행의 유령 인스턴스에 붙는 것을 원천 차단

  // ── 사용자 먼저 만든다(바인딩에 UID 가 필요하므로 wrangler 보다 앞서야 한다) ──
  const U = await makeUser(`adv-user-${Date.now()}@t.dev`);       // 일반 사용자
  const V = await makeUser(`adv-victim-${Date.now()}@t.dev`);     // 지급 대상
  const AD = await makeUser(`adv-admin-${Date.now()}@t.dev`);     // 재화 관리자
  const AR = await makeUser(`adv-article-${Date.now()}@t.dev`);   // 기사 관리자
  const CN = await makeUser(`adv-canary-${Date.now()}@t.dev`);    // 카나리 대상

  for (const x of [U, V, AD, AR, CN]) {
    await fsSet(`users/${x.uid}`, { doriExp: I(0), cottonCandy: I(1000), cottonCandyTotal: I(1000), tier: I(1), level: I(1) });
  }

  startWrangler(P.ALL, { CANDY_ROLLOUT_MODE: "all", REWARD_ADMIN_UIDS: AD.uid, ARTICLE_ADMIN_UIDS: AR.uid });
  startWrangler(P.MISSING, {});                                                   // CANDY_ROLLOUT_MODE 미설정
  startWrangler(P.CANARY, { CANDY_ROLLOUT_MODE: "canary", REWARD_TEST_UIDS: CN.uid });
  startWrangler(P.OFF, { CANDY_ROLLOUT_MODE: "off" });
  startWrangler(P.ARTICLE_ONLY, { CANDY_ROLLOUT_MODE: "all", ARTICLE_ADMIN_UIDS: AD.uid }); // REWARD 미설정

  for (const [k, port] of Object.entries(P)) {
    const up = await waitPort(port);
    if (!up) { ok(`wrangler[${k}:${port}] 기동`, false, "타임아웃"); return finish(); }
  }
  ok("wrangler 5개 인스턴스 기동 (all/missing/canary/off/article-only)", true);

  await httpCommon(U);
  await claimAdversarial(U, V);
  await purchaseAdversarial(U, V);
  await adminAdversarial(U, V, AD, AR);
  await rolloutMatrix(U, CN);
  await leakCheck(U, AD);

  finish();
}

// ═══════════════ 1. 공통 HTTP 계층 ═══════════════
async function httpCommon(U) {
  G("1. 공통 HTTP 계층 (3개 endpoint × 메서드/본문/헤더)");
  const routes = ["/api/claim-reward", "/api/purchase", "/api/admin/grant"];

  for (const route of routes) {
    const short = route.replace("/api/", "");
    // 메서드
    ok(`${short}: OPTIONS → 204`, (await raw(P.ALL, route, { method: "OPTIONS" })).status === 204);
    for (const m of ["GET", "PUT", "PATCH", "DELETE", "HEAD"]) {
      const r = await raw(P.ALL, route, { method: m });
      ok(`${short}: ${m} → 405`, r.status === 405, `got ${r.status}`);
    }
    // 본문 변형 (인증 전 단계에서 400 이어야 하고, 절대 5xx 가 아니어야 한다)
    const bodies = [
      ["빈 body", ""],
      ["잘못된 JSON", "{not json"],
      ["배열 body", "[]"],
      ["문자열 body", '"hello"'],
      ["null body", "null"],
      ["숫자 body", "123"],
      ["boolean body", "true"],
      ["중첩 객체", jbody({ rewardType: { a: { b: { c: 1 } } }, itemKey: { x: 1 }, targetUid: { y: 1 } })],
      ["매우 긴 문자열", jbody({ rewardType: "z".repeat(9000) })],
      ["Unicode", jbody({ rewardType: "출석🎃‮ " })],
      ["제어문자", jbody({ rewardType: "ab" })],
      ["prototype key", '{"__proto__":{"price":0},"itemKey":"bg::x"}'],
      ["constructor key", jbody({ constructor: 1, rewardType: "daily_attendance" })],
      ["중복 JSON key", '{"rewardType":"daily_attendance","rewardType":"free_money"}'],
    ];
    for (const [name, body] of bodies) {
      const r = await raw(P.ALL, route, { body });
      ok(`${short}: ${name} → 4xx (5xx 금지)`, r.status >= 400 && r.status < 500, `got ${r.status}`);
    }
    // Content-Type 변형 — 서버는 CT 를 신뢰하지 않고 본문만 파싱해야 한다
    const r1 = await raw(P.ALL, route, { body: jbody({ rewardType: "daily_attendance" }), headers: { __noCT: true } });
    ok(`${short}: Content-Type 없음 → 4xx`, r1.status >= 400 && r1.status < 500, `got ${r1.status}`);
    const r2 = await raw(P.ALL, route, { body: jbody({ rewardType: "daily_attendance" }), headers: { "Content-Type": "text/plain" } });
    ok(`${short}: 잘못된 Content-Type → 4xx`, r2.status >= 400 && r2.status < 500, `got ${r2.status}`);
    // 과대 body
    const big = await raw(P.ALL, route, { body: jbody({ rewardType: "daily_attendance", pad: "x".repeat(20000) }) });
    ok(`${short}: 과대 body → 400`, big.status === 400, `got ${big.status}`);
  }

  G("2. Authorization 헤더 변형");
  const good = jbody({ rewardType: "daily_attendance" });
  const goodBuy = jbody({ itemKey: await firstPurchasableKey() });
  const goodGrant = jbody({ targetUid: "someuid123456", operationId: "grant_advtest001", candy: 1 });
  const cases = [
    ["Authorization 없음", undefined],
    ["빈 Bearer", ""],
    ["Bearer 없이 토큰만", null],
  ];
  for (const [route, body] of [["/api/claim-reward", good], ["/api/purchase", goodBuy], ["/api/admin/grant", goodGrant]]) {
    const short = route.replace("/api/", "");
    ok(`${short}: 토큰 없음 → 401`, (await raw(P.ALL, route, { body })).status === 401);
    ok(`${short}: 빈 Bearer → 401`, (await raw(P.ALL, route, { body, headers: { Authorization: "Bearer " } })).status === 401);
    ok(`${short}: Bearer 접두사 없음 → 401`, (await raw(P.ALL, route, { body, headers: { Authorization: "abc.def.ghi" } })).status === 401);
    ok(`${short}: Basic 인증 → 401`, (await raw(P.ALL, route, { body, headers: { Authorization: "Basic dXNlcjpwYXNz" } })).status === 401);
    ok(`${short}: JWT 아님 → 401`, (await raw(P.ALL, route, { body, token: "not.a.jwt" })).status === 401);
    ok(`${short}: 만료 토큰 → 401`, (await raw(P.ALL, route, { body, token: fakeToken({ expDelta: -60 }) })).status === 401);
    ok(`${short}: 잘못된 aud → 401`, (await raw(P.ALL, route, { body, token: fakeToken({ aud: "other-project" }) })).status === 401);
    ok(`${short}: 잘못된 iss → 401`, (await raw(P.ALL, route, { body, token: fakeToken({ iss: "https://evil.example/x" }) })).status === 401);
    ok(`${short}: 다른 Firebase project → 401`, (await raw(P.ALL, route, { body, token: fakeToken({ aud: "dori-ai-0130", iss: "https://securetoken.google.com/dori-ai-0130" }) })).status === 401);
    // 서명 없는 위조 토큰(클레임은 정상) → Firestore 실검증에서 걸려야 한다
    const forged = await raw(P.ALL, route, { body, token: fakeToken({ uid: "forged-uid-0001" }) });
    ok(`${short}: 클레임만 맞춘 위조 토큰 → 401/403/503 (2xx 금지)`, forged.status !== 200, `got ${forged.status}`);
  }
  void cases;
}

let _purchasableKey = null;
async function firstPurchasableKey() {
  if (_purchasableKey) return _purchasableKey;
  const m = await import("../../lib/shopItems.ts");
  const it = m.SHOP_ITEMS.filter((x) => x.price > 0).sort((a, b) => a.price - b.price)[0];
  _purchasableKey = m.itemKey(it.slot, it.id);
  return _purchasableKey;
}

// ═══════════════ 3. /api/claim-reward 적대적 ═══════════════
async function claimAdversarial(U, V) {
  G("3. /api/claim-reward — 주입·source·멱등");
  const t = U.idToken;
  const post = (b) => raw(P.ALL, "/api/claim-reward", { body: jbody(b), token: t });

  // 권위값 주입
  for (const [name, extra] of [
    ["amount 주입", { amount: 99999 }],
    ["exp 주입", { exp: 99999 }],
    ["candy 주입", { candy: 99999 }],
    ["cottonCandy 주입", { cottonCandy: 99999 }],
    ["uid 주입", { uid: V.uid }],
    ["email 주입", { email: "admin@x.dev" }],
    ["rewardDate 주입", { rewardDate: "2099-01-01" }],
  ]) {
    const r = await post({ rewardType: "mission_complete", operationId: `mission_write_post_${TODAY}`, sourceId: `write_post_${TODAY}`, ...extra });
    ok(`${name} → 400`, r.status === 400, `got ${r.status} ${r.json?.detail || ""}`);
  }

  // rewardType / sourceId
  ok("unknown rewardType → 400", (await post({ rewardType: "free_money", operationId: "x_123456" })).status === 400);
  ok("operationId 없음 → 400", (await post({ rewardType: "mission_complete", sourceId: `write_post_${TODAY}` })).status === 400);
  ok("sourceId 없음 → 400", (await post({ rewardType: "mission_complete", operationId: `mission_write_post_${TODAY}` })).status === 400);

  const unknownSrc = await post({ rewardType: "mission_complete", operationId: `mission_hack_${TODAY}`, sourceId: `hack_${TODAY}` });
  ok("allowlist 밖 missionId → 400 unknown_source", unknownSrc.status === 400 && unknownSrc.json?.error === "unknown_source", `got ${unknownSrc.status}/${unknownSrc.json?.error}`);

  const unkAch = await post({ rewardType: "achievement_claim", operationId: "ach_notreal01", sourceId: "notreal" });
  ok("allowlist 밖 achievementId → 400", unkAch.status === 400, `got ${unkAch.status}`);

  // 날짜 조작
  const future = await post({ rewardType: "mission_complete", operationId: "mission_write_post_2099-01-01", sourceId: "write_post_2099-01-01" });
  ok("미래 날짜 sourceId → 400 invalid_source_date", future.status === 400 && future.json?.error === "invalid_source_date", `got ${future.json?.error}`);
  const past = await post({ rewardType: "mission_complete", operationId: "mission_write_post_2020-01-01", sourceId: "write_post_2020-01-01" });
  ok("과거 날짜 sourceId → 400 invalid_source_date", past.status === 400 && past.json?.error === "invalid_source_date");
  const badDate = await post({ rewardType: "mission_complete", operationId: "mission_write_post_2026-02-30", sourceId: "write_post_2026-02-30" });
  ok("존재하지 않는 날짜(2026-02-30) → 400", badDate.status === 400);
  const urlEnc = await post({ rewardType: "mission_complete", operationId: `mission_write_post_${TODAY}`, sourceId: `write%5Fpost_${TODAY}` });
  ok("URL 인코딩(%5F) sourceId → 400", urlEnc.status === 400, `got ${urlEnc.status}`);
  const slash = await post({ rewardType: "mission_complete", operationId: "mission_..%2Fx", sourceId: "../x" });
  ok("경로 이스케이프 sourceId → 400", slash.status === 400);

  // 대소문자·유사문자 우회
  const upper = await post({ rewardType: "mission_complete", operationId: `mission_WRITE_POST_${TODAY}`, sourceId: `WRITE_POST_${TODAY}` });
  ok("대문자 missionId → 400 (allowlist 우회 불가)", upper.status === 400, `got ${upper.status}`);
  const spaced = await post({ rewardType: "mission_complete", operationId: `mission_x_${TODAY}`, sourceId: ` write_post_${TODAY}` });
  ok("공백 padding sourceId → 400", spaced.status === 400);
  const homo = await post({ rewardType: "mission_complete", operationId: `mission_h_${TODAY}`, sourceId: `wrіte_post_${TODAY}` }); // 키릴 і
  ok("Unicode 유사문자 sourceId → 400", homo.status === 400);

  // level 범위
  for (const [name, src] of [["lv_0", "0"], ["lv_010(앞자리 0)", "010"], ["lv_9999", "9999"], ["lv_-1", "-1"], ["lv_1e3", "1e3"]]) {
    const r = await post({ rewardType: "level_reward", operationId: `lv_${src.replace(/[^A-Za-z0-9_-]/g, "")}_x`, sourceId: src });
    ok(`level_reward ${name} → 4xx`, r.status >= 400 && r.status < 500, `got ${r.status}`);
  }

  // 멱등 계약
  const opId = `mission_write_post_${TODAY}`;
  const a1 = await post({ rewardType: "mission_complete", operationId: opId, sourceId: `write_post_${TODAY}` });
  ok("정상 미션 청구 → 200", a1.status === 200 && a1.json?.ok === true, `got ${a1.status}`);
  const before = a1.json?.cottonCandy;
  const a2 = await post({ rewardType: "mission_complete", operationId: opId, sourceId: `write_post_${TODAY}` });
  ok("같은 operationId 재사용 → duplicate, 추가지급 0", a2.status === 200 && a2.json?.duplicate === true && a2.json?.awardedCandy === 0);
  // ★ operationId 는 sourceId 에서 **파생**돼야 한다(isValidExtendedOperationId).
  //   → "같은 source 를 다른 operationId 로" / "다른 source 를 같은 operationId 로" 는
  //     멱등 계층에 도달하기도 전에 형식 검증에서 잘린다. 더 강한 계약이다.
  const a3 = await post({ rewardType: "mission_complete", operationId: `mission_write_post_alt_${TODAY}`, sourceId: `write_post_${TODAY}` });
  ok("★같은 source, 다른 operationId → 400 invalid_operation_id", a3.status === 400 && a3.json?.detail === "invalid_operation_id", `got ${a3.status}/${a3.json?.detail}`);
  const a4 = await post({ rewardType: "mission_complete", operationId: opId, sourceId: `write_comment_${TODAY}` });
  ok("★다른 source, 같은 operationId → 400 invalid_operation_id", a4.status === 400 && a4.json?.detail === "invalid_operation_id", `got ${a4.status}/${a4.json?.detail}`);
  const a5 = await post({ rewardType: "minigame_play", operationId: opId, sourceId: `playtime_${TODAY}` });
  ok("★다른 rewardType, 같은 operationId → 400 invalid_operation_id", a5.status === 400 && a5.json?.detail === "invalid_operation_id", `got ${a5.status}/${a5.json?.detail}`);
  void before;

  // community 소유권 (operationId = post_{sourceId} / comment_{postId__commentId})
  const cp = await post({ rewardType: "community_post", operationId: "post_notexistpost", sourceId: "notexistpost" });
  ok("존재하지 않는 feed source → 404 source_not_found", cp.status === 404 && cp.json?.error === "source_not_found", `got ${cp.status}/${cp.json?.error}`);
  await fsSet("feed/advOtherPost1", { uid: S(V.uid), text: S("x") });
  const cp2 = await post({ rewardType: "community_post", operationId: "post_advOtherPost1", sourceId: "advOtherPost1" });
  ok("★타인 소유 feed → 403 source_not_owned", cp2.status === 403 && cp2.json?.error === "source_not_owned", `got ${cp2.status}/${cp2.json?.error}`);
  await fsSet("feed/advMinePost1", { uid: S(U.uid), text: S("x") });
  const cp3 = await post({ rewardType: "community_post", operationId: "post_advMinePost1", sourceId: "advMinePost1" });
  ok("본인 소유 feed → 200", cp3.status === 200 && cp3.json?.ok === true, `got ${cp3.status}`);
  const cc = await post({ rewardType: "community_comment", operationId: "comment_advMinePost1__nope", sourceId: "advMinePost1__nope" });
  ok("존재하지 않는 댓글 source → 404", cc.status === 404, `got ${cc.status}`);

  // 업적: allowlist 안/밖
  const ach = await post({ rewardType: "achievement_claim", operationId: "ach_first_visit", sourceId: "first_visit" });
  ok("정상 업적(first_visit) → 200", ach.status === 200 && ach.json?.ok === true, `got ${ach.status}`);
  const ach2 = await post({ rewardType: "achievement_claim", operationId: "ach_first_visit", sourceId: "first_visit" });
  ok("업적 재청구 → duplicate, 추가지급 0", ach2.status === 200 && ach2.json?.duplicate === true && ach2.json?.awardedCandy === 0);
}

// ═══════════════ 4. /api/purchase 적대적 ═══════════════
async function purchaseAdversarial(U, V) {
  G("4. /api/purchase — 가격·프리미엄·소유권·멱등");
  const key = await firstPurchasableKey();
  const post = (b, tok = U.idToken, port = P.ALL) => raw(port, "/api/purchase", { body: jbody(b), token: tok });

  for (const [name, extra] of [
    ["price 주입", { price: 0 }],
    ["price 음수", { price: -100 }],
    ["amount 주입", { amount: 0 }],
    ["balance 주입", { balance: 999999 }],
    ["cottonCandy 주입", { cottonCandy: 999999 }],
    ["uid 주입", { uid: V.uid }],
    ["email 주입", { email: "x@y.z" }],
    ["isPremium 주입", { isPremium: true }],
    ["ownedItems 주입", { ownedItems: ["bg::x"] }],
    ["quantity 주입", { quantity: 99 }],
  ]) {
    const r = await post({ itemKey: key, ...extra });
    ok(`${name} → 400 forbidden_field`, r.status === 400 && String(r.json?.detail || "").startsWith("forbidden_field:"), `got ${r.status}/${r.json?.detail}`);
  }
  const unexp = await post({ itemKey: key, note: "hi" });
  ok("예상 밖 필드 → 400 unexpected_field", unexp.status === 400 && String(unexp.json?.detail || "").startsWith("unexpected_field:"));

  ok("unknown itemKey → 400", (await post({ itemKey: "bg::nonexistent_zzz" })).status === 400);
  ok("itemKey 형식 위반 → 400", (await post({ itemKey: "../../etc/passwd" })).status === 400);
  ok("itemKey 숫자 → 400", (await post({ itemKey: 12345 })).status === 400);
  ok("itemKey 배열 → 400", (await post({ itemKey: ["bg::x"] })).status === 400);
  ok("itemKey 없음 → 400", (await post({})).status === 400);

  // price 0 아이템은 구매 불가 계약
  const m = await import("../../lib/shopItems.ts");
  const free = m.SHOP_ITEMS.find((x) => !x.price || x.price === 0);
  if (free) {
    const r = await post({ itemKey: m.itemKey(free.slot, free.id) });
    ok("가격 0 아이템 → 400 item_not_purchasable", r.status === 400 && r.json?.detail === "item_not_purchasable", `got ${r.json?.detail}`);
  } else ok("가격 0 아이템 없음(카탈로그 확인)", true);

  // 정상 구매 → 잔액 차감 검증
  await fsSet(`users/${U.uid}`, { cottonCandy: I(1000) });
  const p1 = await post({ itemKey: key });
  ok("정상 구매 → 200 + 차감", p1.status === 200 && p1.json?.ok === true && p1.json?.charged > 0, `got ${p1.status}`);
  const after = await fsGet(`users/${U.uid}`);
  ok("Firestore 잔액이 응답과 일치", num(after.cottonCandy) === p1.json?.balance, `${num(after.cottonCandy)} vs ${p1.json?.balance}`);
  ok("ownedItems 에 정확히 1번 추가", arr(after.ownedItems).filter((x) => x === key).length === 1);

  // 멱등
  const p2 = await post({ itemKey: key });
  ok("같은 아이템 재구매 → duplicate, charged 0", p2.status === 200 && p2.json?.duplicate === true && p2.json?.charged === 0);
  const after2 = await fsGet(`users/${U.uid}`);
  ok("재구매 후 잔액 불변", num(after2.cottonCandy) === num(after.cottonCandy));
  ok("재구매 후 ownedItems 중복 없음", arr(after2.ownedItems).filter((x) => x === key).length === 1);

  // 잔액 부족
  const poor = await makeUser(`adv-poor-${Date.now()}@t.dev`);
  await fsSet(`users/${poor.uid}`, { doriExp: I(0), cottonCandy: I(1), tier: I(1), level: I(1) });
  const r422 = await post({ itemKey: key }, poor.idToken);
  ok("잔액 부족 → 422 insufficient_balance", r422.status === 422 && r422.json?.error === "insufficient_balance", `got ${r422.status}`);
  const poorAfter = await fsGet(`users/${poor.uid}`);
  ok("잔액 부족 시 아무 변화 없음", num(poorAfter.cottonCandy) === 1 && arr(poorAfter.ownedItems).length === 0);
  ok("잔액 부족 시 원장 미생성", (await fsGet(`users/${poor.uid}/purchases/buy_${key.replace("::", "__")}`)) === null);

  // 프리미엄은 서버 문서만
  const prem = await makeUser(`adv-prem-${Date.now()}@t.dev`);
  await fsSet(`users/${prem.uid}`, { doriExp: I(0), cottonCandy: I(0), tier: I(1), level: I(1), isPremium: B(true) });
  const pr = await post({ itemKey: key }, prem.idToken);
  ok("서버 프리미엄 → 잔액 0 이어도 무료 획득", pr.status === 200 && pr.json?.charged === 0 && pr.json?.premiumGrant === true, `got ${pr.status}/${pr.json?.charged}`);
  const noPrem = await makeUser(`adv-noprem-${Date.now()}@t.dev`);
  await fsSet(`users/${noPrem.uid}`, { doriExp: I(0), cottonCandy: I(0), tier: I(1), level: I(1), isPremium: S("true") }); // 문자열 위조
  const npr = await post({ itemKey: key }, noPrem.idToken);
  ok('isPremium 이 문자열 "true" → 프리미엄 아님(422)', npr.status === 422, `got ${npr.status}`);

  // 사용자 문서 없음
  const ghost = await makeUser(`adv-ghost-${Date.now()}@t.dev`);
  const gr = await post({ itemKey: key }, ghost.idToken);
  ok("사용자 문서 없음 → 404 user_not_found", gr.status === 404, `got ${gr.status}`);
}

// ═══════════════ 5. /api/admin/grant 적대적 ═══════════════
async function adminAdversarial(U, V, AD, AR) {
  G("5. /api/admin/grant — 인가·금액·멱등");
  const post = (b, tok, port = P.ALL) => raw(port, "/api/admin/grant", { body: jbody(b), token: tok });
  const opN = (s) => `grant_adv${s}`;

  // 인가
  const norm = await post({ targetUid: V.uid, operationId: opN("norm01"), candy: 100 }, U.idToken);
  ok("일반 로그인 사용자 → 403 forbidden", norm.status === 403, `got ${norm.status}`);
  const art = await post({ targetUid: V.uid, operationId: opN("art001"), candy: 100 }, AR.idToken);
  ok("★기사 관리자 → 403 (교차 권한 차단)", art.status === 403, `got ${art.status}`);
  const artOnlyEnv = await post({ targetUid: V.uid, operationId: opN("aoe001"), candy: 100 }, AD.idToken, P.ARTICLE_ONLY);
  ok("★REWARD_ADMIN_UIDS 미설정(ARTICLE만) → 503", artOnlyEnv.status === 503 && artOnlyEnv.json?.error === "reward_admin_not_configured", `got ${artOnlyEnv.status}/${artOnlyEnv.json?.error}`);
  const self = await post({ targetUid: AD.uid, operationId: opN("self01"), candy: 100 }, AD.idToken);
  ok("관리자 self-grant → 403 self_grant_forbidden", self.status === 403 && self.json?.error === "self_grant_forbidden", `got ${self.json?.error}`);

  // 권한 위조 시도
  const roleBody = await post({ targetUid: V.uid, operationId: opN("role01"), candy: 100, role: "admin" }, U.idToken);
  ok("body 에 role:admin 위조 → 400 unexpected_field", roleBody.status === 400, `got ${roleBody.status}`);
  await fsSet(`users/${U.uid}`, { role: S("admin"), isAdmin: B(true) });
  const docRole = await post({ targetUid: V.uid, operationId: opN("docrl1"), candy: 100 }, U.idToken);
  ok("★사용자 문서 role/isAdmin 위조 → 여전히 403", docRole.status === 403, `got ${docRole.status}`);

  // 금액 검증
  for (const [name, candy, expect] of [
    ["candy 0", 0, 400], ["candy 소수 1.5", 1.5, 400], ["candy 문자열", "100", 400],
    ["candy 과도(1e9)", 1e9, 400], ["candy NaN 표현", null, 400],
  ]) {
    const r = await post({ targetUid: V.uid, operationId: opN(`amt${String(name).length}${Math.abs(Number(candy) || 0)}`.slice(0, 20)), candy }, AD.idToken);
    ok(`${name} → ${expect}`, r.status === expect, `got ${r.status}/${r.json?.detail}`);
  }
  const nothing = await post({ targetUid: V.uid, operationId: opN("noth01") }, AD.idToken);
  ok("candy·isPremium 둘 다 없음 → 400 nothing_to_grant", nothing.status === 400 && nothing.json?.detail === "nothing_to_grant");
  const badOp = await post({ targetUid: V.uid, operationId: "notgrantprefix", candy: 10 }, AD.idToken);
  ok("operationId 접두사 위반 → 400", badOp.status === 400);
  const badTarget = await post({ targetUid: "x", operationId: opN("badtg1"), candy: 10 }, AD.idToken);
  ok("targetUid 형식 위반 → 400 invalid_target", badTarget.status === 400 && badTarget.json?.detail === "invalid_target");
  const emailTarget = await post({ targetUid: "victim@example.com", operationId: opN("emtg01"), candy: 10 }, AD.idToken);
  ok("targetUid 에 email → 400", emailTarget.status === 400);
  const ghostTarget = await post({ targetUid: "nonexistentuid1234", operationId: opN("ghost1"), candy: 10 }, AD.idToken);
  ok("존재하지 않는 대상 → 404 user_not_found", ghostTarget.status === 404, `got ${ghostTarget.status}`);

  // 정상 지급 + 멱등
  await fsSet(`users/${V.uid}`, { cottonCandy: I(500), cottonCandyTotal: I(500) });
  const op = opN("ok0001");
  const g1 = await post({ targetUid: V.uid, operationId: op, candy: 250 }, AD.idToken);
  ok("정상 지급 → 200 +250", g1.status === 200 && g1.json?.appliedCandy === 250 && g1.json?.balance === 750, `got ${JSON.stringify(g1.json)}`);
  const g2 = await post({ targetUid: V.uid, operationId: op, candy: 250 }, AD.idToken);
  ok("같은 operationId·같은 금액 → duplicate(추가지급 없음)", g2.status === 200 && g2.json?.duplicate === true);
  const g3 = await post({ targetUid: V.uid, operationId: op, candy: 999 }, AD.idToken);
  ok("★같은 operationId·다른 금액 → 409 operation_id_reused", g3.status === 409 && g3.json?.error === "operation_id_reused", `got ${g3.status}`);
  const vAfter = await fsGet(`users/${V.uid}`);
  ok("재사용 시도 후 잔액 불변(750)", num(vAfter.cottonCandy) === 750, `got ${num(vAfter.cottonCandy)}`);

  // 음수 지급(회수) — 음수 잔액 금지
  const gm = await post({ targetUid: V.uid, operationId: opN("neg001"), candy: -100000 }, AD.idToken);
  ok("과도한 음수 회수 → 잔액 0 (음수 금지)", gm.status === 200 && gm.json?.balance === 0, `got ${JSON.stringify(gm.json)}`);

  // 프리미엄 토글
  const gp = await post({ targetUid: V.uid, operationId: opN("prem01"), isPremium: true }, AD.idToken);
  ok("프리미엄 부여 → 200", gp.status === 200 && gp.json?.isPremium === true, `got ${gp.status}`);
  const gpOff = await post({ targetUid: V.uid, operationId: opN("prem02"), isPremium: false }, AD.idToken);
  ok("프리미엄 해제 → 200", gpOff.status === 200 && gpOff.json?.isPremium === false);
  const gpBad = await post({ targetUid: V.uid, operationId: opN("prem03"), isPremium: "true" }, AD.idToken);
  ok("isPremium 문자열 → 400", gpBad.status === 400);

  // 대상 사용자가 스스로 지급 못 함
  const selfGrant = await post({ targetUid: V.uid, operationId: opN("vself1"), candy: 9999 }, V.idToken);
  ok("대상 본인이 자기에게 지급 → 403", selfGrant.status === 403, `got ${selfGrant.status}`);
}

// ═══════════════ 6. Rollout 상태 기계 ═══════════════
async function rolloutMatrix(U, CN) {
  G("6. CANDY_ROLLOUT_MODE 상태 기계");
  const key = await firstPurchasableKey();
  const buy = (tok, port) => raw(port, "/api/purchase", { body: jbody({ itemKey: key }), token: tok });
  // operationId 는 sourceId 파생이라 인스턴스마다 **사용자를 나눠** 멱등 충돌을 피한다.
  const mission = (tok, port) => raw(port, "/api/claim-reward", { body: jbody({ rewardType: "mission_complete", operationId: `mission_read_trend_${TODAY}`, sourceId: `read_trend_${TODAY}` }), token: tok });
  const attend = (tok, port) => raw(port, "/api/claim-reward", { body: jbody({ rewardType: "daily_attendance" }), token: tok });
  const freshUser = async (tag) => {
    const x = await makeUser(`adv-${tag}-${Date.now()}@t.dev`);
    await fsSet(`users/${x.uid}`, { doriExp: I(0), cottonCandy: I(1000), cottonCandyTotal: I(1000), tier: I(1), level: I(1) });
    return x;
  };

  // MISSING — 에뮬레이터 모드는 기본값 all 이 계약이다(로컬 테스트가 매번 막히면 안 되므로).
  //  ⚠️ **production 모드의 fail-closed(503 candy_rollout_mode_invalid)는 Edge 로 재현 불가**:
  //     purchase 는 candy 게이트보다 먼저 SA 자격 검사(503 dependency_unavailable)에 걸린다.
  //     → 그 계약은 tests/candy-hardening.test.ts 의 단위 테스트가 고정한다(여기서 링크만 유지).
  const bm = await buy((await freshUser("miss1")).idToken, P.MISSING);
  ok("missing(emulator): 구매 → 200 (기본값 all 계약)", bm.status === 200, `got ${bm.status}/${bm.json?.error}`);
  const mm = await mission((await freshUser("miss2")).idToken, P.MISSING);
  ok("missing(emulator): 미션 → candy 지급 + EXP 지급", mm.status === 200 && mm.json?.awardedCandy > 0 && mm.json?.awardedExp > 0, `got ${mm.status}/${mm.json?.awardedCandy}/${mm.json?.awardedExp}`);

  // OFF
  const bo = await buy((await freshUser("off1")).idToken, P.OFF);
  ok("off: 구매 → 403 candy_rollout_disabled", bo.status === 403 && bo.json?.error === "candy_rollout_disabled", `got ${bo.status}/${bo.json?.error}`);
  const mo = await mission((await freshUser("off2")).idToken, P.OFF);
  ok("★off: 미션 → awardedCandy 0 이지만 EXP 는 지급(EXP 독립)", mo.status === 200 && mo.json?.awardedCandy === 0 && mo.json?.awardedExp > 0, `got ${mo.status}/${mo.json?.awardedCandy}/${mo.json?.awardedExp}`);

  // ★ 출석은 게이트 밖 — off 에서도 솜사탕이 나와야 한다
  const offUser = await makeUser(`adv-off-${Date.now()}@t.dev`);
  await fsSet(`users/${offUser.uid}`, { doriExp: I(0), cottonCandy: I(0), tier: I(1), level: I(1), attendance: { mapValue: { fields: { lastChecked: S(""), streak: I(0), totalDays: I(0) } } } });
  const ao = await attend(offUser.idToken, P.OFF);
  ok("★off: 출석 솜사탕은 계속 지급(게이트 제외 계약)", ao.status === 200 && ao.json?.reward?.cottonCandy > 0, `got ${ao.status}/${JSON.stringify(ao.json?.reward)}`);

  // CANARY
  const bc = await buy((await freshUser("can1")).idToken, P.CANARY);
  ok("canary: 목록 밖 UID 구매 → 403 candy_rollout_disabled", bc.status === 403 && bc.json?.error === "candy_rollout_disabled", `got ${bc.status}/${bc.json?.error}`);
  const mc = await mission((await freshUser("can2")).idToken, P.CANARY);
  ok("canary: 목록 밖 UID 미션 → candy 0 (EXP 는 지급)", mc.status === 200 && mc.json?.awardedCandy === 0 && mc.json?.awardedExp > 0, `got ${mc.status}/${mc.json?.awardedCandy}`);
  await fsSet(`users/${CN.uid}`, { cottonCandy: I(5000) });
  const bcn = await buy(CN.idToken, P.CANARY);
  ok("★canary: 목록 안 UID 구매 → 200", bcn.status === 200 && bcn.json?.ok === true, `got ${bcn.status}/${bcn.json?.error}`);
  const mcn = await mission(CN.idToken, P.CANARY);
  ok("★canary: 목록 안 UID 미션 → candy 지급", mcn.status === 200 && mcn.json?.awardedCandy > 0, `got ${mcn.status}/${mcn.json?.awardedCandy}`);

  // EXP 롤아웃과의 독립성 — off 인스턴스도 REWARD_ROLLOUT_MODE=all 이다
  ok("★EXP 롤아웃(all)이 재화 게이트를 열지 못한다", mo.json?.awardedCandy === 0 && mo.json?.awardedExp > 0);
  // canary 인스턴스에서 REWARD_TEST_UIDS 는 EXP·재화 게이트에 공유된다 — 목록 밖도 EXP 는 받는다
  ok("canary 재화 게이트가 EXP 를 막지 않는다", mc.json?.awardedExp > 0);
}

// ═══════════════ 7. 응답 유출 검사 ═══════════════
async function leakCheck(U, AD) {
  G("7. 응답 유출(스택·credential·내부경로·Firebase 원문)");
  const probes = [
    ["claim 400", await raw(P.ALL, "/api/claim-reward", { body: "{bad", token: U.idToken })],
    ["claim 401", await raw(P.ALL, "/api/claim-reward", { body: jbody({ rewardType: "daily_attendance" }) })],
    ["purchase 400", await raw(P.ALL, "/api/purchase", { body: jbody({ itemKey: "zz::zz", price: 0 }), token: U.idToken })],
    ["purchase 403", await raw(P.CANARY, "/api/purchase", { body: jbody({ itemKey: await firstPurchasableKey() }), token: U.idToken })],
    ["grant 403", await raw(P.ALL, "/api/admin/grant", { body: jbody({ targetUid: "someuid123456", operationId: "grant_leak01", candy: 1 }), token: U.idToken })],
    ["grant 503", await raw(P.ARTICLE_ONLY, "/api/admin/grant", { body: jbody({ targetUid: "someuid123456", operationId: "grant_leak02", candy: 1 }), token: AD.idToken })],
    ["purchase 503", await raw(P.MISSING, "/api/purchase", { body: jbody({ itemKey: await firstPurchasableKey() }), token: U.idToken })],
  ];
  const BAD = [
    [/at\s+\w+\s+\(.*:\d+:\d+\)/, "stack trace"],
    [/[A-Z]:\\\\?Users|\/home\/[a-z]+\//, "내부 경로"],
    [/AIza[0-9A-Za-z_-]{20,}/, "API 키"],
    [/-----BEGIN/, "private key"],
    [/eyJ[A-Za-z0-9_-]{20,}\./, "ID 토큰"],
    [/iam\.gserviceaccount\.com/, "서비스 계정"],
    [/googleapis\.com\/v1\/projects/, "Firestore 원문 URL"],
    [/@[a-z0-9.-]+\.(dev|com|net)/i, "email"],
    [/FIRESTORE_EMULATOR_HOST|REWARD_ADMIN_UIDS|REWARD_TEST_UIDS/, "환경변수명"],
  ];
  for (const [name, r] of probes) {
    const t = r.text || "";
    const leaks = BAD.filter(([re]) => re.test(t)).map(([, l]) => l);
    ok(`${name}: 응답 유출 0 (len=${t.length})`, leaks.length === 0, leaks.join(","));
  }
  // 응답 크기 상한 — 문서 전문이 새지 않는지
  ok("모든 오류 응답이 512바이트 미만", probes.every(([, r]) => (r.text || "").length < 512));
}

function finish() {
  for (const c of children) { try { c.kill("SIGKILL"); } catch { /* noop */ } }
  killAllPorts("종료 시");   // 손자 workerd 까지 확실히 회수
  const pass = results.filter((r) => r.ok).length;
  const fail = results.filter((r) => !r.ok);
  console.log(`\n════════ 적대적 Edge 결과: ${pass}/${results.length} ════════`);
  if (fail.length) {
    console.log("실패:");
    for (const f of fail) console.log(`  · [${f.group}] ${f.n}`);
  }
  try { rmSync(TMP, { recursive: true, force: true }); } catch { /* noop */ }
  process.exit(fail.length ? 1 : 0);
}

main().catch((e) => { console.error("FATAL", e?.message || e); finish(); });
