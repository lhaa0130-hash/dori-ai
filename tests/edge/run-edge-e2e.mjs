// 05-06I — 실제 Cloudflare Pages Function HTTP E2E (Firebase Auth/Firestore Emulator 연동).
//  handler core 직접 호출이 아니라, wrangler pages dev 가 띄운 실제 /api/claim-reward 를 HTTP 로 때린다.
//  실행: firebase emulators:exec --only auth,firestore --project demo-illo-myworld "node tests/edge/run-edge-e2e.mjs"
//  (FIRESTORE_EMULATOR_HOST / FIREBASE_AUTH_EMULATOR_HOST 는 emulators:exec 가 주입)
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync, symlinkSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const PROJECT = "demo-illo-myworld";
const FS_HOST = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";
const AUTH_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";
const PORT = 8788;
const BASE = `http://127.0.0.1:${PORT}`;
const REPO = path.resolve(fileURLToPath(new URL("../../", import.meta.url)));
const TMP = path.join(REPO, ".edge-e2e-tmp");

const results = [];
const ok = (n, cond, d = "") => { results.push({ n, ok: !!cond }); console.log(`${cond ? "PASS" : "FAIL"}  ${n}${d ? "  — " + d : ""}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Firestore emulator REST (owner = admin 우회) ──
const fsUrl = (p) => `http://${FS_HOST}/v1/projects/${PROJECT}/databases/(default)/documents/${p}`;
const OWNER = { Authorization: "Bearer owner", "Content-Type": "application/json" };
async function fsSet(pathRel, fields) {
  const r = await fetch(fsUrl(pathRel), { method: "PATCH", headers: OWNER, body: JSON.stringify({ fields }) });
  if (!r.ok) throw new Error(`fsSet ${pathRel} → ${r.status} ${await r.text()}`);
}
async function fsGet(pathRel) {
  const r = await fetch(fsUrl(pathRel), { headers: OWNER });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`fsGet ${pathRel} → ${r.status}`);
  return (await r.json()).fields || {};
}
const S = (v) => ({ stringValue: String(v) });
const I = (v) => ({ integerValue: String(v) });
const num = (f) => (f?.integerValue != null ? Number(f.integerValue) : f?.doubleValue != null ? Number(f.doubleValue) : undefined);

// ── Auth emulator: 사용자 생성 + idToken ──
async function makeUser(email) {
  const r = await fetch(`http://${AUTH_HOST}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "test1234", returnSecureToken: true }),
  });
  const j = await r.json();
  if (!j.idToken) throw new Error(`signUp failed: ${JSON.stringify(j)}`);
  return { uid: j.localId, idToken: j.idToken, email };
}

// ── 엔드포인트 호출 ──
async function claim(body, idToken, extraHeaders = {}, method = "POST") {
  const headers = { "Content-Type": "application/json", ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}), ...extraHeaders };
  const r = await fetch(`${BASE}/api/claim-reward`, { method, headers, body: body === undefined ? undefined : (typeof body === "string" ? body : JSON.stringify(body)) });
  let json = null; try { json = await r.json(); } catch { /* non-json */ }
  return { status: r.status, json };
}

let wrangler;
function startWrangler() {
  // wrangler.toml(Workers 용) 간섭을 피하려 격리 tmp 에서 functions 정션으로 pages dev 실행.
  rmSync(TMP, { recursive: true, force: true });
  mkdirSync(path.join(TMP, "public"), { recursive: true });
  writeFileSync(path.join(TMP, "public", "index.html"), "<!doctype html><title>edge-e2e</title>ok");
  if (!existsSync(path.join(TMP, "functions"))) symlinkSync(path.join(REPO, "functions"), path.join(TMP, "functions"), "junction");
  const args = [
    "wrangler", "pages", "dev", "public", "--port", String(PORT), "--ip", "127.0.0.1",
    "--compatibility-date=2024-05-18",
    "--binding", "REWARD_ENV=emulator",
    "--binding", `FIREBASE_PROJECT_ID=${PROJECT}`,
    "--binding", `FIRESTORE_EMULATOR_HOST=${FS_HOST}`,
    "--binding", `FIREBASE_AUTH_EMULATOR_HOST=${AUTH_HOST}`,
  ];
  // 로컬 설치본(node_modules/.bin) 사용 — 네트워크 fetch 없이.
  wrangler = spawn("npx", ["--no-install", ...args], { cwd: TMP, stdio: ["ignore", "pipe", "pipe"], shell: process.platform === "win32" });
  wrangler.stdout.on("data", (d) => process.env.EDGE_DEBUG && process.stdout.write(`[wr] ${d}`));
  wrangler.stderr.on("data", (d) => process.env.EDGE_DEBUG && process.stdout.write(`[wr!] ${d}`));
}
async function waitForWrangler(timeoutMs = 90000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try { const r = await fetch(`${BASE}/api/claim-reward`, { method: "OPTIONS" }); if (r.status === 204) return true; } catch { /* not up */ }
    await sleep(1500);
  }
  return false;
}

async function main() {
  startWrangler();
  const up = await waitForWrangler();
  if (!up) { ok("wrangler pages dev 기동", false, "타임아웃"); return finish(); }
  ok("wrangler pages dev 기동 + OPTIONS 204(CORS)", true);

  // ── HTTP 계층 ──
  ok("GET → 405", (await claim(undefined, null, {}, "GET")).status === 405);
  // 유효한 body 로(=인증 단계까지 도달) 토큰 결함만 검증.
  ok("토큰 없음 → 401", (await claim({ rewardType: "my_world_interaction", operationId: "mwi_notoken0001", kind: "pet" }, null)).status === 401);
  ok("malformed 토큰 → 401", (await claim({ rewardType: "my_world_interaction", operationId: "mwi_badtoken0001", kind: "pet" }, "not.a.jwt")).status === 401);

  const u = await makeUser("edge-a@test.dev");
  const b = await makeUser("edge-b@test.dev");
  await fsSet(`users/${u.uid}`, { doriExp: I(0), cottonCandy: I(0), tier: I(1), level: I(1) });
  await fsSet(`users/${b.uid}`, { doriExp: I(0), cottonCandy: I(0), tier: I(1), level: I(1) });

  ok("malformed JSON → 400", (await claim("{bad json", u.idToken)).status === 400);
  ok("oversized body → 400", (await claim({ rewardType: "my_world_interaction", operationId: "mwi_x", pad: "z".repeat(5000) }, u.idToken)).status === 400);
  ok("unknown reward type → 400", (await claim({ rewardType: "free_money", operationId: "x_1" }, u.idToken)).status === 400);

  // ── 권한/주입 거부(서버가 금액·uid 소유) ──
  ok("amount 주입 → 400", (await claim({ rewardType: "my_world_interaction", operationId: "mwi_inj1", amount: 9999 }, u.idToken)).status === 400);
  ok("uid/exp 주입 → 400", (await claim({ rewardType: "minigame_play", operationId: "minigame_g1", gameId: "g1", exp: 9, uid: b.uid }, u.idToken)).status === 400);

  // ── My World interaction happy path + 멱등 ──
  const mw1 = await claim({ rewardType: "my_world_interaction", operationId: "mwi_edge_pet_1", kind: "pet" }, u.idToken);
  ok("my_world_interaction 지급", mw1.status === 200 && mw1.json?.awardedExp > 0 && mw1.json?.doriExp > 0, `award=${mw1.json?.awardedExp} exp=${mw1.json?.doriExp}`);
  const mw2 = await claim({ rewardType: "my_world_interaction", operationId: "mwi_edge_pet_1", kind: "pet" }, u.idToken);
  ok("같은 operationId 재전송 → duplicate(재지급 없음)", mw2.status === 200 && mw2.json?.duplicate === true && mw2.json?.doriExp === mw1.json?.doriExp);

  // ── Community: feed 소스 소유권 검증 ──
  const postId = "edgepost1";
  await fsSet(`feed/${postId}`, { uid: S(u.uid), text: S("hello"), status: S("published") });
  const cp = await claim({ rewardType: "community_post", operationId: `post_${postId}`, sourceId: postId }, u.idToken);
  ok("community_post(소유 feed) 지급 = 15", cp.status === 200 && cp.json?.awardedExp === 15, `status=${cp.status} award=${cp.json?.awardedExp} err=${cp.json?.error}`);
  const cpDup = await claim({ rewardType: "community_post", operationId: `post_${postId}`, sourceId: postId }, u.idToken);
  ok("community_post 같은 source 재청구 → duplicate", cpDup.json?.duplicate === true);
  // 존재하지 않는 source
  const cpMissing = await claim({ rewardType: "community_post", operationId: "post_ghost1", sourceId: "ghost1" }, u.idToken);
  ok("community_post 없는 source → 404 source_not_found", cpMissing.status === 404 && cpMissing.json?.error === "source_not_found", `status=${cpMissing.status} err=${cpMissing.json?.error}`);
  // 타인 소유 source (b 가 만든 글을 u 가 청구)
  const bPost = "edgepostB";
  await fsSet(`feed/${bPost}`, { uid: S(b.uid), text: S("bs"), status: S("published") });
  const cpOther = await claim({ rewardType: "community_post", operationId: `post_${bPost}`, sourceId: bPost }, u.idToken);
  ok("community_post 타인 source → 403 source_not_owned", cpOther.status === 403 && cpOther.json?.error === "source_not_owned", `status=${cpOther.status} err=${cpOther.json?.error}`);

  // ── Community comment: {postId}__{commentId} ──
  const cId = "cmt1";
  await fsSet(`feed/${postId}/comments/${cId}`, { uid: S(u.uid), text: S("nice") });
  const cc = await claim({ rewardType: "community_comment", operationId: `comment_${postId}__${cId}`, sourceId: `${postId}__${cId}` }, u.idToken);
  ok("community_comment(소유 feed 댓글) 지급 = 5", cc.status === 200 && cc.json?.awardedExp === 5, `status=${cc.status} award=${cc.json?.awardedExp} err=${cc.json?.error}`);

  // ── Attendance / mission / minigame ──
  const att = await claim({ rewardType: "daily_attendance" }, u.idToken);
  ok("daily_attendance 지급(granted)", att.status === 200 && att.json?.ok === true, `status=${att.status} st=${att.json?.status}`);
  const attDup = await claim({ rewardType: "daily_attendance" }, u.idToken);
  ok("daily_attendance 재청구 → already_claimed(하루 1회)", attDup.json?.status === "already_claimed" || attDup.json?.status === "legacy_recognized");
  const ms = await claim({ rewardType: "mission_complete", operationId: "mission_checkin_2026-07-25", missionId: "checkin_2026-07-25" }, u.idToken);
  ok("mission_complete 지급 = 10 (BOUNDED)", ms.status === 200 && ms.json?.awardedExp === 10, `award=${ms.json?.awardedExp}`);
  const mg = await claim({ rewardType: "minigame_play", operationId: "minigame_playtime_2026-07-25", gameId: "playtime_2026-07-25" }, u.idToken);
  ok("minigame_play 지급 = 5 (BOUNDED)", mg.status === 200 && mg.json?.awardedExp === 5, `award=${mg.json?.awardedExp}`);

  // ── 동시 10회 같은 operationId → 정확히 1회 지급 ──
  const u2 = await makeUser("edge-conc@test.dev");
  await fsSet(`users/${u2.uid}`, { doriExp: I(100), cottonCandy: I(0), tier: I(1), level: I(1) });
  const conc = await Promise.all(Array.from({ length: 10 }, () => claim({ rewardType: "my_world_interaction", operationId: "mwi_conc_00000001", kind: "pet" }, u2.idToken)));
  // 불변식 검증(멱등): 스톰 이후 doriExp 는 base+정확히 1회 award 만 오른다(이중 지급 없음).
  //  일부는 3회 재시도 소진 후 409(retryable)로 응답할 수 있으나, 원장은 requireNotExists 로 1건만 생성된다.
  const concLedger = await fsGet(`users/${u2.uid}/rewardOperations/mwi_conc_00000001`);
  const concUser = await fsGet(`users/${u2.uid}`);
  const grantedOnce = concLedger && num(concUser.doriExp) === 100 + num(concLedger.awardedExp);
  const badStatuses = conc.filter((r) => !(r.status === 200 || r.status === 409)).length;
  ok("동시 10회 같은 op → 이중 지급 없음(원장 1건, doriExp=base+1회, 나머지는 duplicate/409)", grantedOnce && badStatuses === 0,
    `doriExp=${num(concUser.doriExp)} award=${num(concLedger?.awardedExp)} bad=${badStatuses}`);

  // ── Firestore 결과: 서버 base 기준 증가 + 원장 1건 + counter ──
  const uDoc = await fsGet(`users/${u.uid}`);
  ok("서버 doriExp 가 base(0) 기준으로만 증가", num(uDoc.doriExp) > 0 && num(uDoc.doriExp) < 100, `doriExp=${num(uDoc.doriExp)}`);
  const ledger = await fsGet(`users/${u.uid}/rewardOperations/post_${postId}`);
  ok("community_post 원장 정확히 기록(awardedExp=15)", ledger && num(ledger.awardedExp) === 15);
  ok("타입별 카운터 rewardTypeExp_community_post 반영", num(uDoc.rewardTypeExp_community_post) === 15, `cnt=${num(uDoc.rewardTypeExp_community_post)}`);

  // ── localStorage 조작이 서버에 무효(서버 base 만 사용) ──
  const inj = await claim({ rewardType: "my_world_interaction", operationId: "mwi_inj_final", kind: "pet", currentExp: 999999, finalExp: 999999 }, u.idToken);
  ok("body 의 currentExp/finalExp 주입 무시(sanitize 400)", inj.status === 400);

  // ── Client → Edge → Emulator: 실제 lib/rewardClient 코드로 구동(오프라인 큐·flush·조작무효·계정격리) ──
  await clientEdgeSection();

  finish();
}

// 실제 클라이언트 보상 코드(claimReward/flushRewardOutbox/createFetchTransport/deriveOperationId)를
// 로컬 wrangler 엔드포인트 + 에뮬레이터에 붙여 오프라인 아웃박스 왕복까지 검증한다.
async function clientEdgeSection() {
  let rc, identity, outbox;
  try {
    rc = await import("@/lib/rewardClient");
    identity = await import("@/lib/myWorld/identity");
    outbox = await import("@/lib/myWorld/rewardOutbox");
  } catch (e) {
    ok("client→edge: lib/rewardClient 로드(alias 로더 필요)", false, String(e).slice(0, 120));
    return;
  }
  const cu = await makeUser("edge-client@test.dev");
  await fsSet(`users/${cu.uid}`, { doriExp: I(50), cottonCandy: I(0), tier: I(1), level: I(1) });
  const store = (() => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; })();
  let curUser = { uid: cu.uid, email: cu.email };
  const deps = (online) => ({
    identity: identity.resolveMyWorldIdentity({ authStatus: "authenticated", firebaseUid: curUser.uid }),
    currentUser: curUser,
    getIdToken: async () => cu.idToken,
    transport: rc.createFetchTransport(`${BASE}/api/claim-reward`),
    storage: store, online, now: Date.now(), onApplied: () => {},
  });
  const dExp = async () => num((await fsGet(`users/${cu.uid}`)).doriExp);

  // C1 온라인 청구 → applied + 서버 반영
  const c1 = await rc.claimReward(deps(true), { rewardType: "my_world_interaction", operationId: rc.deriveOperationId("clientedge0001"), kind: "pet" });
  ok("client→edge: 온라인 청구 → applied", c1.status === "applied", `status=${c1.status}`);
  const after1 = await dExp();
  ok("client→edge: 서버 doriExp 가 base(50)+정책만큼만 증가", after1 > 50 && after1 < 60, `doriExp=${after1}`);

  // C2 오프라인 청구 → outbox 적재(서버 미반영)
  const c2 = await rc.claimReward(deps(false), { rewardType: "my_world_interaction", operationId: rc.deriveOperationId("clientedge0002"), kind: "pet" });
  const queued = outbox.readOutbox(store, cu.uid).some((i) => i.operationId === "mwi_clientedge0002");
  ok("client→edge: 오프라인 청구 → outbox 적재(status queued)", c2.status === "queued" && queued);
  ok("client→edge: 오프라인 동안 서버 미반영", (await dExp()) === after1);

  // C3 online 복귀 flush → 정확히 1회 지급, 재flush 이중지급 없음
  await rc.flushRewardOutbox(deps(true));
  const after3 = await dExp();
  ok("client→edge: online flush → 큐 항목 서버 반영", after3 > after1, `doriExp=${after3}`);
  await rc.flushRewardOutbox(deps(true));
  ok("client→edge: 재flush 이중 지급 없음(멱등)", (await dExp()) === after3);
  ok("client→edge: flush 후 outbox 비워짐", outbox.readOutbox(store, cu.uid).length === 0);

  // C4 localStorage 조작 → 서버 무효(클라가 exp 를 안 보냄)
  store.setItem(`dori_game_profile_${cu.email}`, JSON.stringify({ doriExp: 999999, cottonCandy: 0, tier: 1, level: 1 }));
  const before4 = await dExp();
  await rc.claimReward(deps(true), { rewardType: "my_world_interaction", operationId: rc.deriveOperationId("clientedge0004"), kind: "pet" });
  const after4 = await dExp();
  ok("client→edge: 캐시 조작(999999) 무효 — 서버는 base 기준 소폭 증가만", after4 > before4 && after4 < before4 + 20, `${before4}→${after4}`);

  // C5 계정 전환 격리: A 오프라인 적재 후 currentUser=B 로 전환 → flush 가 A 큐를 B 로 보내지 않음
  const other = await makeUser("edge-client-b@test.dev");
  await fsSet(`users/${other.uid}`, { doriExp: I(0), cottonCandy: I(0), tier: I(1), level: I(1) });
  await rc.claimReward(deps(false), { rewardType: "my_world_interaction", operationId: rc.deriveOperationId("clientedge0005"), kind: "pet" });
  curUser = { uid: other.uid, email: other.email }; // 계정 전환
  await rc.flushRewardOutbox(deps(true));
  const bExp = num((await fsGet(`users/${other.uid}`)).doriExp);
  ok("client→edge: 계정 전환 후 A 큐가 B 로 지급되지 않음(격리)", bExp === 0, `B.doriExp=${bExp}`);
}

function finish() {
  // Windows: wrangler 의 자식(workerd/esbuild)까지 트리 종료해야 포트·정션이 풀린다.
  try {
    if (wrangler?.pid) {
      if (process.platform === "win32") spawn("taskkill", ["/pid", String(wrangler.pid), "/T", "/F"], { stdio: "ignore" });
      else wrangler.kill("SIGKILL");
    }
  } catch { /* noop */ }
  try { rmSync(TMP, { recursive: true, force: true }); } catch { /* noop */ }
  const passed = results.filter((r) => r.ok).length;
  console.log(`\n${passed}/${results.length} edge E2E checks passed`);
  setTimeout(() => process.exit(passed === results.length ? 0 : 1), 500);
}

main().catch((e) => { console.error("E2E harness error:", e); finish(); });
