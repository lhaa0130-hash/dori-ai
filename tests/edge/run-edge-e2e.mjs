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

const children = []; // 시작한 wrangler PID 만 추적(정리 대상 한정)
let tmpReady = false;
function ensureTmp() {
  if (tmpReady) return;
  // wrangler.toml(Workers 용) 간섭을 피하려 격리 tmp 에서 functions 정션으로 pages dev 실행.
  rmSync(TMP, { recursive: true, force: true });
  mkdirSync(path.join(TMP, "public"), { recursive: true });
  writeFileSync(path.join(TMP, "public", "index.html"), "<!doctype html><title>edge-e2e</title>ok");
  if (!existsSync(path.join(TMP, "functions"))) symlinkSync(path.join(REPO, "functions"), path.join(TMP, "functions"), "junction");
  tmpReady = true;
}
// 롤아웃/추가 바인딩을 받아 pages dev 인스턴스를 띄운다.
function startWrangler(port, extraBindings = {}) {
  ensureTmp();
  const bindings = {
    REWARD_ENV: "emulator", FIREBASE_PROJECT_ID: PROJECT,
    FIRESTORE_EMULATOR_HOST: FS_HOST, FIREBASE_AUTH_EMULATOR_HOST: AUTH_HOST,
    ...extraBindings,
  };
  const args = ["wrangler", "pages", "dev", "public", "--port", String(port), "--ip", "127.0.0.1", "--compatibility-date=2024-05-18"];
  for (const [k, v] of Object.entries(bindings)) { args.push("--binding", `${k}=${v}`); }
  const child = spawn("npx", ["--no-install", ...args], { cwd: TMP, stdio: ["ignore", "pipe", "pipe"], shell: process.platform === "win32" });
  child.stdout.on("data", (d) => process.env.EDGE_DEBUG && process.stdout.write(`[wr:${port}] ${d}`));
  child.stderr.on("data", (d) => process.env.EDGE_DEBUG && process.stdout.write(`[wr:${port}!] ${d}`));
  children.push(child);
  return child;
}
async function waitForPort(port, timeoutMs = 90000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try { const r = await fetch(`http://127.0.0.1:${port}/api/claim-reward`, { method: "OPTIONS" }); if (r.status === 204) return true; } catch { /* not up */ }
    await sleep(1500);
  }
  return false;
}

async function main() {
  startWrangler(PORT, { REWARD_ROLLOUT_MODE: "all" }); // 기본 인스턴스 = 전체 롤아웃
  const up = await waitForPort(PORT);
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
  // ⚠️ 05-07B: sourceId 의 날짜는 서버 오늘과 일치해야 한다(과거 날짜 하드코딩 금지).
  const svrToday = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
  const ms = await claim({ rewardType: "mission_complete", operationId: `mission_attendance_${svrToday}`, missionId: `attendance_${svrToday}` }, u.idToken);
  ok("mission_complete 지급 = 10 (BOUNDED)", ms.status === 200 && ms.json?.awardedExp === 10, `award=${ms.json?.awardedExp}`);
  const mg = await claim({ rewardType: "minigame_play", operationId: `minigame_playtime_${svrToday}`, gameId: `playtime_${svrToday}` }, u.idToken);
  ok("minigame_play 지급 = 5 (BOUNDED)", mg.status === 200 && mg.json?.awardedExp === 5, `award=${mg.json?.awardedExp}`);

  // ── 동시 10회 같은 operationId → 정확히 1회 지급 ──
  const u2 = await makeUser("edge-conc@test.dev");
  await fsSet(`users/${u2.uid}`, { doriExp: I(100), cottonCandy: I(0), tier: I(1), level: I(1) });
  const conc = await Promise.all(Array.from({ length: 10 }, () => claim({ rewardType: "my_world_interaction", operationId: "mwi_conc_00000001", kind: "pet" }, u2.idToken)));
  // 불변식 검증(멱등): 스톰 이후 doriExp 는 base+정확히 1회 award 만 오른다(이중 지급 없음).
  //  일부는 3회 재시도 소진 후 409(retryable)로 응답할 수 있으나, 원장은 requireNotExists 로 1건만 생성된다.
  const concLedger = await fsGet(`users/${u2.uid}/rewardOperations/mwi_conc_00000001`);
  const concUser = await fsGet(`users/${u2.uid}`);
  // requireNotExists 로 원장은 최대 1건 → 지급 횟수 0 또는 1. doriExp 는 정확히 base + 원장award.
  //  (에뮬레이터 고부하 시 10건 모두 3회 재시도 소진→409 로 0건 지급 가능. 그래도 이중지급은 불가.)
  const ledgerAward = concLedger ? num(concLedger.awardedExp) : 0;
  const badStatuses = conc.filter((r) => !(r.status === 200 || r.status === 409)).length;
  ok("동시 10회 같은 op → 이중 지급 없음(원장≤1건, doriExp=base+원장award)", num(concUser.doriExp) === 100 + ledgerAward && badStatuses === 0,
    `doriExp=${num(concUser.doriExp)} ledgerAward=${ledgerAward} bad=${badStatuses}`);

  // ── Firestore 결과: 서버 base 기준 증가 + 원장 1건 + counter ──
  const uDoc = await fsGet(`users/${u.uid}`);
  ok("서버 doriExp 가 base(0) 기준으로만 증가", num(uDoc.doriExp) > 0 && num(uDoc.doriExp) < 100, `doriExp=${num(uDoc.doriExp)}`);
  const ledger = await fsGet(`users/${u.uid}/rewardOperations/post_${postId}`);
  ok("community_post 원장 정확히 기록(awardedExp=15)", ledger && num(ledger.awardedExp) === 15);
  ok("타입별 카운터 rewardTypeExp_community_post 반영", num(uDoc.rewardTypeExp_community_post) === 15, `cnt=${num(uDoc.rewardTypeExp_community_post)}`);

  // ── localStorage 조작이 서버에 무효(서버 base 만 사용) ──
  const inj = await claim({ rewardType: "my_world_interaction", operationId: "mwi_inj_final", kind: "pet", currentExp: 999999, finalExp: 999999 }, u.idToken);
  ok("body 의 currentExp/finalExp 주입 무시(sanitize 400)", inj.status === 400);

  // ── 05-07: 재화(솜사탕)·구매·관리자 지급 서버 권위 ──
  await candySection();
  await purchaseSection();
  await adminGrantSection();
  // ── 05-07B: 적대적 감사에서 발견한 우회 경로 차단 확인 ──
  await hardeningSection();
  await candyGateSection();
  await adminFailClosedSection();

  // ── Client → Edge → Emulator: 실제 lib/rewardClient 코드로 구동(오프라인 큐·flush·조작무효·계정격리) ──
  await clientEdgeSection();

  // ── Rollout mode: canary 게이트(별도 wrangler 인스턴스, REWARD_ROLLOUT_MODE=canary + allowlist) ──
  await canarySection();

  finish();
}

// ── 05-07 헬퍼: /api/purchase, /api/admin/grant ──
async function post(pathname, body, idToken, method = "POST") {
  const headers = { "Content-Type": "application/json", ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}) };
  const r = await fetch(`${BASE}${pathname}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  let json = null; try { json = await r.json(); } catch { /* non-json */ }
  return { status: r.status, json };
}

// 05-07B 적대적 검증 — 1차 구현에서 실제로 뚫렸던 경로를 실 HTTP 로 재현·차단 확인.
async function hardeningSection() {
  const u = await makeUser("edge-harden@test.dev");
  await fsSet(`users/${u.uid}`, { doriExp: I(0), cottonCandy: I(0), cottonCandyTotal: I(0), tier: I(1), level: I(1) });
  const today = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);

  // ⭐ 날짜 조작으로 '1일 1회'를 우회하던 경로
  const future = await claim({ rewardType: "mission_complete", operationId: "mission_write_post_2099-01-01", sourceId: "write_post_2099-01-01" }, u.idToken);
  ok("⭐ 미래 날짜 sourceId 로 미션 재청구 → 400 invalid_source_date",
    future.status === 400 && future.json?.error === "invalid_source_date", `status=${future.status} err=${future.json?.error}`);
  const past = await claim({ rewardType: "mission_complete", operationId: "mission_write_post_2020-01-01", sourceId: "write_post_2020-01-01" }, u.idToken);
  ok("⭐ 과거 날짜 sourceId 도 거부", past.status === 400, `status=${past.status}`);
  const nodate = await claim({ rewardType: "minigame_play", operationId: "minigame_playtime", sourceId: "playtime" }, u.idToken);
  ok("⭐ 날짜 없는 playtime sourceId 도 거부", nodate.status === 400, `status=${nodate.status}`);
  ok("날짜 조작 시도 후에도 잔액 0", num((await fsGet(`users/${u.uid}`)).cottonCandy) === undefined || num((await fsGet(`users/${u.uid}`)).cottonCandy) === 0);

  // ⭐ allowlist 밖 미션/업적 id → 400 (원장 쓰레기도 안 생김)
  const badMission = await claim({ rewardType: "mission_complete", operationId: `mission_hack_${today}`, sourceId: `hack_${today}` }, u.idToken);
  ok("⭐ 알 수 없는 missionId → 400 unknown_source", badMission.status === 400 && badMission.json?.error === "unknown_source", `err=${badMission.json?.error}`);
  const badAch = await claim({ rewardType: "achievement_claim", operationId: "ach_fake_one", sourceId: "fake_one" }, u.idToken);
  ok("⭐ 알 수 없는 achievementId → 400", badAch.status === 400, `status=${badAch.status}`);
  ok("거부된 요청은 원장을 남기지 않는다", (await fsGet(`users/${u.uid}/rewardOperations/mission_hack_${today}`)) === null);

  // ⭐ lv_010 / lv_10 중복 수령
  const lvZero = await claim({ rewardType: "level_reward", operationId: "lv_010", sourceId: "010" }, u.idToken);
  ok("⭐ 앞자리 0 레벨(lv_010)은 거부 — 같은 마일스톤 중복 수령 차단", lvZero.status === 400, `status=${lvZero.status}`);

  // ⭐ 전역 일일 상한: 미션을 전부 받은 뒤 상한 초과분은 0
  const missions = ["attendance", "read_trend", "write_post", "write_comment", "play_minigame", "quiz_correct"];
  let granted = 0;
  for (const m of missions) {
    const r = await claim({ rewardType: "mission_complete", operationId: `mission_${m}_${today}`, sourceId: `${m}_${today}` }, u.idToken);
    if (r.status === 200) granted += Number(r.json?.awardedCandy) || 0;
  }
  const afterMissions = await fsGet(`users/${u.uid}`);
  ok("미션 전량 수령은 정상 동작(정상 사용자가 상한에 안 걸림)", granted === 280 && num(afterMissions.cottonCandy) === 280, `granted=${granted} candy=${num(afterMissions.cottonCandy)}`);
  ok("전역 일일 집계가 서버 날짜로 기록", afterMissions.candyDailyDate?.stringValue === today && num(afterMissions.candyDailyTotal) === 280);

  // 전역 상한(600)까지 채운 뒤 초과 지급 0 — 업적으로 채운다.
  for (const a of ["streak_30", "level_10", "quiz_master", "game_king", "popular", "comment_king"]) {
    await claim({ rewardType: "achievement_claim", operationId: `ach_${a}`, sourceId: a }, u.idToken);
  }
  const capped = await fsGet(`users/${u.uid}`);
  ok("⭐ 전역 일일 상한 600 을 넘지 않는다", num(capped.candyDailyTotal) <= 600 && num(capped.cottonCandy) <= 600,
    `total=${num(capped.candyDailyTotal)} candy=${num(capped.cottonCandy)}`);

  // 클라이언트가 집계 필드를 실어 보내면 400
  const forgeCounter = await claim({ rewardType: "mission_complete", operationId: `mission_read_trend_${today}`, sourceId: `read_trend_${today}`, candyDailyTotal: 0 }, u.idToken);
  ok("전역 집계 필드 주입은 400", forgeCounter.status === 400, `status=${forgeCounter.status}`);
}

// 재화 게이트(CANDY_ROLLOUT_MODE) 분리 — 별도 wrangler 인스턴스로 실제 HTTP 검증.
async function candyGateSection() {
  const GPORT = 8792;
  const u = await makeUser("edge-candygate@test.dev");
  await fsSet(`users/${u.uid}`, { doriExp: I(0), cottonCandy: I(0), cottonCandyTotal: I(0), tier: I(1), level: I(1) });
  const today = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
  // REWARD_ROLLOUT_MODE=all 이지만 CANDY_ROLLOUT_MODE=off → EXP 는 지급, 재화는 0 이어야 한다.
  startWrangler(GPORT, { REWARD_ROLLOUT_MODE: "all", CANDY_ROLLOUT_MODE: "off" });
  const up = await waitForPort(GPORT);
  if (!up) { ok("candy gate wrangler 기동", false, "타임아웃"); return; }

  const r = await fetch(`http://127.0.0.1:${GPORT}/api/claim-reward`, {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${u.idToken}` },
    body: JSON.stringify({ rewardType: "mission_complete", operationId: `mission_write_post_${today}`, sourceId: `write_post_${today}` }),
  });
  const j = await r.json().catch(() => null);
  ok("⭐ CANDY_ROLLOUT_MODE=off → EXP 는 지급되고 재화만 0", r.status === 200 && j?.awardedExp === 10 && j?.awardedCandy === 0,
    `status=${r.status} exp=${j?.awardedExp} candy=${j?.awardedCandy}`);
  const doc = await fsGet(`users/${u.uid}`);
  ok("off 상태에서 서버 잔액이 오르지 않는다", (num(doc.cottonCandy) || 0) === 0, `candy=${num(doc.cottonCandy)}`);
  ok("off 상태에서도 EXP 는 정상(기존 기능 무영향)", num(doc.doriExp) === 10, `exp=${num(doc.doriExp)}`);

  // ⚠️ 게이트 범위 계약: 출석 솜사탕은 기존 운영 동작이라 게이트 대상이 아니다(off 여도 지급).
  //   이 테스트가 그 계약을 고정한다 — 실수로 게이트에 묶으면 기존 사용자 기능 회귀다.
  const att = await fetch(`http://127.0.0.1:${GPORT}/api/claim-reward`, {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${u.idToken}` },
    body: JSON.stringify({ rewardType: "daily_attendance" }),
  });
  const aj = await att.json().catch(() => null);
  ok("⭐ 게이트 off 여도 출석 솜사탕은 계속 지급(기존 동작 보존)",
    att.status === 200 && aj?.status === "granted" && aj?.reward?.cottonCandy > 0,
    `status=${att.status} st=${aj?.status} candy=${aj?.reward?.cottonCandy}`);

  // 구매는 게이트가 닫히면 전면 거부
  const { SHOP_ITEMS, itemKey } = await import("../../lib/shopItems.ts");
  const paid = SHOP_ITEMS.find((i) => i.price > 0);
  const pr = await fetch(`http://127.0.0.1:${GPORT}/api/purchase`, {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${u.idToken}` },
    body: JSON.stringify({ itemKey: itemKey(paid.slot, paid.id) }),
  });
  const pj = await pr.json().catch(() => null);
  ok("⭐ 게이트 off 면 구매는 403 candy_rollout_disabled", pr.status === 403 && pj?.error === "candy_rollout_disabled", `status=${pr.status} err=${pj?.error}`);
}

// 관리자 지급 fail-closed — allowlist 미설정이면 엔드포인트 자체가 비활성.
async function adminFailClosedSection() {
  const APORT = 8793;
  const admin = await makeUser("lhaa0130+failclosed@gmail.com");
  const target = await makeUser("edge-fc-target@test.dev");
  await fsSet(`users/${target.uid}`, { cottonCandy: I(0), doriExp: I(0), tier: I(1), level: I(1) });
  // REWARD_ADMIN_UIDS 미설정 인스턴스
  startWrangler(APORT, { REWARD_ROLLOUT_MODE: "all", CANDY_ROLLOUT_MODE: "all" });
  const up = await waitForPort(APORT);
  if (!up) { ok("admin fail-closed wrangler 기동", false, "타임아웃"); return; }
  const r = await fetch(`http://127.0.0.1:${APORT}/api/admin/grant`, {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${admin.idToken}` },
    body: JSON.stringify({ targetUid: target.uid, candy: 1000, operationId: "grant_failclosed001" }),
  });
  const j = await r.json().catch(() => null);
  ok("⭐ REWARD_ADMIN_UIDS 미설정 → 503 admin_grant_disabled(fail-closed)",
    r.status === 503 && j?.error === "admin_grant_disabled", `status=${r.status} err=${j?.error}`);
  ok("fail-closed 상태에서 대상 잔액 불변", (num((await fsGet(`users/${target.uid}`)).cottonCandy) || 0) === 0);
}

// 재화 지급이 서버 소유인지 — 미션 금액표·일일 상한·멱등·레벨 검증.
async function candySection() {
  const u = await makeUser("edge-candy@test.dev");
  await fsSet(`users/${u.uid}`, { doriExp: I(0), cottonCandy: I(0), cottonCandyTotal: I(0), tier: I(1), level: I(1) });
  const today = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10); // KST

  // 미션: 서버 표(write_post=80)가 금액을 정한다. 클라이언트는 금액을 보내지 않는다.
  const m1 = await claim({ rewardType: "mission_complete", operationId: `mission_write_post_${today}`, sourceId: `write_post_${today}` }, u.idToken);
  ok("mission_complete 지급 시 서버 표 금액(80)이 적용", m1.status === 200 && m1.json?.awardedCandy === 80, `awarded=${m1.json?.awardedCandy}`);

  // 같은 미션 재청구 → 멱등(추가 지급 0)
  const m2 = await claim({ rewardType: "mission_complete", operationId: `mission_write_post_${today}`, sourceId: `write_post_${today}` }, u.idToken);
  const afterDup = await fsGet(`users/${u.uid}`);
  ok("같은 미션 재청구는 멱등(추가 지급 없음)", m2.status === 200 && m2.json?.duplicate === true && num(afterDup.cottonCandy) === 80,
    `dup=${m2.json?.duplicate} candy=${num(afterDup.cottonCandy)}`);

  // 표에 없는 미션 id → 05-07B 부터 아예 400 거부(원장 쓰레기도 안 남김)
  const m3 = await claim({ rewardType: "mission_complete", operationId: `mission_hack_${today}`, sourceId: `hack_${today}` }, u.idToken);
  ok("알 수 없는 미션 id 는 400 거부", m3.status === 400 && m3.json?.error === "unknown_source", `status=${m3.status} err=${m3.json?.error}`);

  // 클라이언트가 금액을 실어 보내면 400
  const m4 = await claim({ rewardType: "mission_complete", operationId: `mission_read_trend_${today}`, sourceId: `read_trend_${today}`, amount: 99999 }, u.idToken);
  ok("클라이언트 amount 주입은 400 으로 거부", m4.status === 400);

  // 레벨 보상: 서버가 users.doriExp 로 레벨을 재계산해 검증 → 미달이면 403
  const lv = await claim({ rewardType: "level_reward", operationId: "lv_50", sourceId: "50" }, u.idToken);
  ok("레벨 미달 상태의 level_reward 는 403 level_not_reached", lv.status === 403 && lv.json?.error === "level_not_reached", `status=${lv.status} err=${lv.json?.error}`);

  // 표에 없는 레벨 → 400
  const lvBad = await claim({ rewardType: "level_reward", operationId: "lv_7", sourceId: "7" }, u.idToken);
  ok("보상표에 없는 레벨은 400 거부", lvBad.status === 400, `status=${lvBad.status}`);

  // 업적: 서버 표 금액(first_post=50), 평생 1회
  const a1 = await claim({ rewardType: "achievement_claim", operationId: "ach_first_post", sourceId: "first_post" }, u.idToken);
  const a2 = await claim({ rewardType: "achievement_claim", operationId: "ach_first_post", sourceId: "first_post" }, u.idToken);
  const afterAch = await fsGet(`users/${u.uid}`);
  ok("업적 지급은 서버 표 금액 + 평생 1회", a1.json?.awardedCandy === 50 && a2.json?.duplicate === true && num(afterAch.cottonCandy) === 130,
    `a1=${a1.json?.awardedCandy} candy=${num(afterAch.cottonCandy)}`);

  // 알 수 없는 업적 id → 05-07B 부터 400 거부
  const a3 = await claim({ rewardType: "achievement_claim", operationId: "ach_fake", sourceId: "fake" }, u.idToken);
  ok("알 수 없는 업적 id 는 400 거부", a3.status === 400 && a3.json?.error === "unknown_source", `status=${a3.status}`);

  // 누적 획득량도 서버가 기록
  ok("cottonCandyTotal 이 서버에서 누적", num(afterAch.cottonCandyTotal) === 130, `total=${num(afterAch.cottonCandyTotal)}`);
}

// 구매: 가격·프리미엄·잔액 판정이 전부 서버.
async function purchaseSection() {
  const { SHOP_ITEMS, itemKey } = await import("../../lib/shopItems.ts");
  const paid = SHOP_ITEMS.find((i) => i.price > 0);
  const free = SHOP_ITEMS.find((i) => i.price === 0);
  const key = itemKey(paid.slot, paid.id);

  // 1) 잔액 부족 → 422
  const poor = await makeUser("edge-buy-poor@test.dev");
  await fsSet(`users/${poor.uid}`, { cottonCandy: I(0), cottonCandyTotal: I(0), doriExp: I(0), tier: I(1), level: I(1) });
  const r422 = await post("/api/purchase", { itemKey: key }, poor.idToken);
  ok("잔액 부족 구매는 422 insufficient_balance", r422.status === 422 && r422.json?.error === "insufficient_balance", `status=${r422.status}`);

  // 2) 정상 구매 → 서버 가격만큼 차감 + ownedItems 추가
  const rich = await makeUser("edge-buy-rich@test.dev");
  await fsSet(`users/${rich.uid}`, { cottonCandy: I(paid.price + 500), cottonCandyTotal: I(paid.price + 500), doriExp: I(0), tier: I(1), level: I(1) });
  const buy = await post("/api/purchase", { itemKey: key }, rich.idToken);
  const afterBuy = await fsGet(`users/${rich.uid}`);
  ok("정상 구매는 서버 가격만큼만 차감", buy.status === 200 && buy.json?.charged === paid.price && num(afterBuy.cottonCandy) === 500,
    `charged=${buy.json?.charged} balance=${num(afterBuy.cottonCandy)}`);
  ok("구매 후 ownedItems 에 아이템이 추가된다",
    (afterBuy.ownedItems?.arrayValue?.values || []).some((v) => v.stringValue === key));

  // 3) 재구매는 멱등(추가 차감 없음)
  const buy2 = await post("/api/purchase", { itemKey: key }, rich.idToken);
  const afterBuy2 = await fsGet(`users/${rich.uid}`);
  ok("같은 아이템 재구매는 멱등(이중 차감 없음)", buy2.json?.duplicate === true && num(afterBuy2.cottonCandy) === 500);

  // 4) 클라이언트가 price 를 보내면 400 (가격 위조 차단)
  const forge = await post("/api/purchase", { itemKey: key, price: 0 }, rich.idToken);
  ok("클라이언트 price 주입은 400 으로 거부", forge.status === 400, `status=${forge.status}`);

  // 5) 존재하지 않는/무료 아이템 → 400
  const unknown = await post("/api/purchase", { itemKey: "bg::__nope__" }, rich.idToken);
  ok("존재하지 않는 아이템은 400", unknown.status === 400);
  if (free) {
    const freeBuy = await post("/api/purchase", { itemKey: itemKey(free.slot, free.id) }, rich.idToken);
    ok("무료(기본 제공) 아이템은 구매 대상이 아니다", freeBuy.status === 400);
  }

  // 6) 비인증 → 401
  const anon = await post("/api/purchase", { itemKey: key }, null);
  ok("비인증 구매는 401", anon.status === 401);

  // 7) ⭐ 프리미엄은 서버 문서로만 판정 — 서버가 isPremium=true 면 무료
  const prem = await makeUser("edge-buy-premium@test.dev");
  await fsSet(`users/${prem.uid}`, { cottonCandy: I(10), cottonCandyTotal: I(10), doriExp: I(0), tier: I(1), level: I(1), isPremium: { booleanValue: true } });
  const premBuy = await post("/api/purchase", { itemKey: key }, prem.idToken);
  const afterPrem = await fsGet(`users/${prem.uid}`);
  ok("서버 문서 isPremium=true 면 무료 지급(잔액 불변)", premBuy.status === 200 && premBuy.json?.charged === 0 && num(afterPrem.cottonCandy) === 10,
    `charged=${premBuy.json?.charged} balance=${num(afterPrem.cottonCandy)}`);

  // 8) 클라이언트가 isPremium 을 주장해도 400(요청 자체 거부)
  const fakePrem = await post("/api/purchase", { itemKey: key, isPremium: true }, poor.idToken);
  ok("클라이언트 isPremium 주장은 400 으로 거부", fakePrem.status === 400);

  // 9) 메서드 가드
  const getRes = await post("/api/purchase", undefined, rich.idToken, "GET");
  ok("/api/purchase 는 POST 외 405", getRes.status === 405);
}

// 관리자 지급: 서버가 관리자 여부를 판정한다(비관리자는 403).
async function adminGrantSection() {
  const MPORT = 8794;
  const admin = await makeUser("lhaa0130@gmail.com");
  const notAdmin = await makeUser("edge-not-admin@test.dev");
  const target = await makeUser("edge-grant-target@test.dev");
  for (const u of [admin, notAdmin, target]) {
    await fsSet(`users/${u.uid}`, { cottonCandy: I(0), cottonCandyTotal: I(0), doriExp: I(0), tier: I(1), level: I(1) });
  }
  // ⚠️ 05-07B: 관리자 지급은 **서버 allowlist(REWARD_ADMIN_UIDS)** 가 있어야만 활성화된다.
  //   admin 의 email 이 맞아도 uid 가 목록에 없으면 거부된다(email 단독 판정 금지).
  startWrangler(MPORT, { REWARD_ROLLOUT_MODE: "all", CANDY_ROLLOUT_MODE: "all", REWARD_ADMIN_UIDS: admin.uid });
  const mup = await waitForPort(MPORT);
  if (!mup) { ok("admin grant wrangler 기동", false, "타임아웃"); return; }
  const post = async (pathname, body, idToken) => {
    const r = await fetch(`http://127.0.0.1:${MPORT}${pathname}`, {
      method: "POST", headers: { "Content-Type": "application/json", ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    let json = null; try { json = await r.json(); } catch { /* non-json */ }
    return { status: r.status, json };
  };

  // ⭐ allowlist 에 없는 UID 는 email 이 관리자여도 거부 — 별도 인스턴스로 확인
  const notListed = await makeUser("lhaa0130+notlisted@gmail.com");
  const nl = await post("/api/admin/grant", { targetUid: target.uid, candy: 100, operationId: "grant_notlisted0001" }, notListed.idToken);
  ok("⭐ allowlist 밖 UID 는 email 이 비슷해도 403", nl.status === 403, `status=${nl.status}`);

  // 비관리자 → 403
  const denied = await post("/api/admin/grant", { targetUid: target.uid, candy: 5000, operationId: "grant_notadmin000001" }, notAdmin.idToken);
  ok("비관리자의 지급 요청은 403", denied.status === 403, `status=${denied.status}`);
  ok("비관리자 거부 후 대상 잔액 불변", num((await fsGet(`users/${target.uid}`)).cottonCandy) === 0);

  // 비인증 → 401
  const anon = await post("/api/admin/grant", { targetUid: target.uid, candy: 100, operationId: "grant_anon00000001" }, null);
  ok("비인증 지급 요청은 401", anon.status === 401);

  // 관리자 → 지급 성공
  const granted = await post("/api/admin/grant", { targetUid: target.uid, candy: 300, operationId: "grant_ok0000000001" }, admin.idToken);
  const afterGrant = await fsGet(`users/${target.uid}`);
  ok("관리자 지급은 성공하고 서버가 반영", granted.status === 200 && num(afterGrant.cottonCandy) === 300, `status=${granted.status} candy=${num(afterGrant.cottonCandy)}`);

  // 같은 operationId 재요청 → 멱등
  const again = await post("/api/admin/grant", { targetUid: target.uid, candy: 300, operationId: "grant_ok0000000001" }, admin.idToken);
  ok("같은 operationId 재요청은 멱등(이중 지급 없음)", again.json?.duplicate === true && num((await fsGet(`users/${target.uid}`)).cottonCandy) === 300);

  // 회수(음수)는 0 미만으로 내려가지 않는다
  await post("/api/admin/grant", { targetUid: target.uid, candy: -100000, operationId: "grant_take000000001" }, admin.idToken);
  ok("회수 시 잔액이 음수가 되지 않는다", num((await fsGet(`users/${target.uid}`)).cottonCandy) === 0);

  // 상한 초과 금액은 400
  const tooBig = await post("/api/admin/grant", { targetUid: target.uid, candy: 99999999, operationId: "grant_big00000001" }, admin.idToken);
  ok("과대 금액은 400 으로 거부", tooBig.status === 400);

  // 프리미엄 설정도 서버만
  const prem = await post("/api/admin/grant", { targetUid: target.uid, isPremium: true, operationId: "grant_prem0000001" }, admin.idToken);
  ok("관리자만 프리미엄을 켤 수 있다", prem.status === 200 && (await fsGet(`users/${target.uid}`)).isPremium?.booleanValue === true);

  // ⭐ 같은 operationId 를 다른 금액으로 재사용 → 409(멱등 키 재활용 차단)
  const reuse = await post("/api/admin/grant", { targetUid: target.uid, candy: 77777, operationId: "grant_ok0000000001" }, admin.idToken);
  ok("⭐ 같은 operationId 를 다른 금액으로 재사용하면 409", reuse.status === 409 && reuse.json?.error === "operation_id_reused",
    `status=${reuse.status} err=${reuse.json?.error}`);

  // ⭐ 관리자 self-grant 금지(감사 추적 무력화 방지)
  await fsSet(`users/${admin.uid}`, { cottonCandy: I(0), doriExp: I(0), tier: I(1), level: I(1) });
  const self = await post("/api/admin/grant", { targetUid: admin.uid, candy: 999, operationId: "grant_self00000001" }, admin.idToken);
  ok("⭐ 관리자 self-grant 는 403", self.status === 403 && self.json?.error === "self_grant_forbidden", `status=${self.status} err=${self.json?.error}`);

  // 소수·NaN·문자열 금액 거부
  for (const bad of [{ candy: 1.5 }, { candy: "100" }, { candy: null }, { candy: 0 }]) {
    const r = await post("/api/admin/grant", { targetUid: target.uid, ...bad, operationId: "grant_badamt00001" }, admin.idToken);
    ok(`잘못된 금액 거부 ${JSON.stringify(bad)}`, r.status === 400, `status=${r.status}`);
  }
}

// canary 롤아웃: allowlist UID 만 지급, 나머지는 rollout_disabled(구분되는 code). 실제 HTTP 로 검증.
async function canarySection() {
  const CPORT = 8790;
  const allowed = await makeUser("edge-canary-in@test.dev");
  const denied = await makeUser("edge-canary-out@test.dev");
  await fsSet(`users/${allowed.uid}`, { doriExp: I(0), cottonCandy: I(0), tier: I(1), level: I(1) });
  await fsSet(`users/${denied.uid}`, { doriExp: I(0), cottonCandy: I(0), tier: I(1), level: I(1) });
  startWrangler(CPORT, { REWARD_ROLLOUT_MODE: "canary", REWARD_TEST_UIDS: allowed.uid });
  const cup = await waitForPort(CPORT);
  if (!cup) { ok("canary wrangler 기동", false, "타임아웃"); return; }
  const cclaim = async (body, idToken) => {
    const r = await fetch(`http://127.0.0.1:${CPORT}/api/claim-reward`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` }, body: JSON.stringify(body) });
    let j = null; try { j = await r.json(); } catch { /* */ } return { status: r.status, json: j };
  };
  const a = await cclaim({ rewardType: "my_world_interaction", operationId: "mwi_canary_allow01", kind: "pet" }, allowed.idToken);
  ok("canary: allowlist UID → 지급(200)", a.status === 200 && a.json?.awardedExp > 0, `status=${a.status}`);
  const d = await cclaim({ rewardType: "my_world_interaction", operationId: "mwi_canary_deny01", kind: "pet" }, denied.idToken);
  ok("canary: 비허용 UID → 403 rollout_disabled(정책거부와 구분)", d.status === 403 && d.json?.error === "rollout_disabled", `status=${d.status} err=${d.json?.error}`);
  // 비허용 사용자는 서버에 EXP 반영 없음
  ok("canary: 비허용 UID 는 서버 EXP 미반영", num((await fsGet(`users/${denied.uid}`)).doriExp) === 0);
  // all 모드에서도 보안 검증 유지: 기본 인스턴스(all)에서 unknown reward type → 400, 잘못된 토큰 → 401 (앞서 검증됨)
  ok("all 모드에서도 unknown reward type 거부 유지", (await claim({ rewardType: "free_money", operationId: "x1" }, allowed.idToken)).status === 400);
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
  // Windows: 내가 시작한 wrangler PID 트리(workerd/esbuild)만 종료. 광범위 kill 안 함.
  for (const c of children) {
    try {
      if (c?.pid) {
        if (process.platform === "win32") spawn("taskkill", ["/pid", String(c.pid), "/T", "/F"], { stdio: "ignore" });
        else c.kill("SIGKILL");
      }
    } catch { /* noop */ }
  }
  try { rmSync(TMP, { recursive: true, force: true }); } catch { /* noop */ }
  const passed = results.filter((r) => r.ok).length;
  console.log(`\n${passed}/${results.length} edge E2E checks passed`);
  setTimeout(() => process.exit(passed === results.length ? 0 : 1), 500);
}

main().catch((e) => { console.error("E2E harness error:", e); finish(); });
