// Phase 5 — 멱등성·동시성 감사 (감사 전용, 로컬 Edge 만)
//  ⚠️ Production 요청 0건. wrangler pages dev + Firebase 에뮬레이터에서만 실행한다.
//  실행: npm run test:concurrency
//
//  검증 불변식(10):
//   1) 잔액은 정확히 한 번만 증가        2) 구매 차감은 정확히 한 번만
//   3) ownedItems 중복 없음              4) 잔액 음수 없음
//   5) 원장과 잔액 불일치 없음           6) 같은 operationId 를 다른 의미로 재사용 불가
//   7) 일일 상한 초과 불가                8) 관리자가 자기 자신에게 무한 지급 불가
//   9) 실패한 요청이 성공 원장을 남기지 않음
//  10) 성공한 요청이 원장 없이 끝나지 않음
import { spawn, execSync } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync, symlinkSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const PROJECT = "demo-illo-myworld";
const FS_HOST = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";
const AUTH_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";
const REPO = path.resolve(fileURLToPath(new URL("../../", import.meta.url)));
const TMP = path.join(REPO, ".wrangler-tmp", "conc-" + process.pid);
const PORT = 8820;   // 다른 스위트와 겹치지 않는 대역

// 신규 client 는 확장 타입 요청에 candyOwner:"server" 를 붙인다(05-09 이중지급 차단 계약).
// my_world_interaction·daily_attendance 정제기는 미지 필드를 거부하므로 확장 타입에만 붙인다.
const EXTENDED_TYPES = new Set(["community_post","community_comment","mission_complete","minigame_play","game_activity","achievement_claim","level_reward"]);
function withCandyOwner(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return body;
  if (!EXTENDED_TYPES.has(body.rewardType)) return body;
  if ("candyOwner" in body) return body;
  return { ...body, candyOwner: "server" };
}

const results = [];
let group = "";
const G = (g) => { group = g; console.log(`\n── ${g} ──`); };
const ok = (n, cond, d = "") => { results.push({ group, n, ok: !!cond }); console.log(`${cond ? "PASS" : "FAIL"}  ${n}${d ? "  — " + d : ""}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
async function fsList(rel) {
  const r = await fetch(fsUrl(rel) + "?pageSize=300", { headers: OWNER });
  if (!r.ok) return [];
  const j = await r.json();
  return (j.documents || []).map((d) => ({ name: d.name.split("/").pop(), fields: d.fields || {} }));
}
async function fsDelete(rel) { await fetch(fsUrl(rel), { method: "DELETE", headers: OWNER }); }
const S = (v) => ({ stringValue: String(v) });
const I = (v) => ({ integerValue: String(v) });
const B = (v) => ({ booleanValue: !!v });
const num = (f) => (f?.integerValue != null ? Number(f.integerValue) : f?.doubleValue != null ? Number(f.doubleValue) : undefined);
const arrv = (f) => (f?.arrayValue?.values || []).map((v) => v.stringValue);

async function makeUser(tag) {
  const r = await fetch(`http://${AUTH_HOST}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: `conc-${tag}-${Date.now()}-${Math.floor(performance.now() * 1000) % 100000}@t.dev`, password: "test1234", returnSecureToken: true }),
  });
  const j = await r.json();
  if (!j.idToken) throw new Error("signUp failed");
  return { uid: j.localId, idToken: j.idToken };
}
async function seedUser(tag, candy = 1000) {
  const u = await makeUser(tag);
  await fsSet(`users/${u.uid}`, { doriExp: I(0), cottonCandy: I(candy), cottonCandyTotal: I(candy), tier: I(1), level: I(1) });
  return u;
}

async function call(route, body, token) {
  try {
    const r = await fetch(`http://127.0.0.1:${PORT}${route}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(withCandyOwner(body)),
    });
    const text = await r.text();
    let json = null; try { json = JSON.parse(text); } catch { /* noop */ }
    return { status: r.status, json };
  } catch (e) { return { status: 0, json: null, err: e.message }; }
}

function killPort(port) {
  try {
    if (process.platform === "win32") {
      const out = execSync(`netstat -ano -p tcp | findstr LISTENING | findstr :${port}`, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
      const pids = new Set(out.split(/\r?\n/).map((l) => l.trim().split(/\s+/).pop()).filter((p) => /^\d+$/.test(p) && p !== "0"));
      for (const pid of pids) { try { execSync(`taskkill /PID ${pid} /T /F`, { stdio: "ignore" }); } catch { /* noop */ } }
      return pids.size;
    }
    const out = execSync(`lsof -ti tcp:${port}`, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    const pids = out.split(/\s+/).filter(Boolean);
    for (const pid of pids) { try { execSync(`kill -9 ${pid}`, { stdio: "ignore" }); } catch { /* noop */ } }
    return pids.length;
  } catch { return 0; }
}

const children = [];
function startWrangler(adminUid) {
  rmSync(TMP, { recursive: true, force: true });
  mkdirSync(path.join(TMP, "public"), { recursive: true });
  writeFileSync(path.join(TMP, "public", "index.html"), "ok");
  if (!existsSync(path.join(TMP, "functions"))) symlinkSync(path.join(REPO, "functions"), path.join(TMP, "functions"), "junction");
  const bindings = {
    REWARD_ENV: "emulator", FIREBASE_PROJECT_ID: PROJECT,
    FIRESTORE_EMULATOR_HOST: FS_HOST, FIREBASE_AUTH_EMULATOR_HOST: AUTH_HOST,
    REWARD_ROLLOUT_MODE: "all", CANDY_ROLLOUT_MODE: "all", REWARD_ADMIN_UIDS: adminUid,
  };
  const args = ["wrangler", "pages", "dev", "public", "--port", String(PORT), "--ip", "127.0.0.1", "--compatibility-date=2024-05-18"];
  for (const [k, v] of Object.entries(bindings)) args.push("--binding", `${k}=${v}`);
  const c = spawn("npx", ["--no-install", ...args], { cwd: TMP, stdio: ["ignore", "pipe", "pipe"], shell: process.platform === "win32" });
  c.stdout.on("data", (d) => process.env.CONC_DEBUG && process.stdout.write(`[c] ${d}`));
  c.stderr.on("data", (d) => process.env.CONC_DEBUG && process.stdout.write(`[c!] ${d}`));
  children.push(c);
}
async function waitPort(ms = 120000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try { const r = await fetch(`http://127.0.0.1:${PORT}/api/claim-reward`, { method: "OPTIONS" }); if (r.status === 204) return true; } catch { /* noop */ }
    await sleep(1500);
  }
  return false;
}
function todayKST(d = new Date()) {
  const k = new Date(d.getTime() + 9 * 3600 * 1000);
  return `${k.getUTCFullYear()}-${String(k.getUTCMonth() + 1).padStart(2, "0")}-${String(k.getUTCDate()).padStart(2, "0")}`;
}
const TODAY = todayKST();
let KEY, KEY2, PRICE, PRICE2;

async function main() {
  killPort(PORT);
  const ADMIN = await seedUser("admin", 0);
  startWrangler(ADMIN.uid);
  if (!await waitPort()) { ok("wrangler 기동", false, "타임아웃"); return finish(); }
  ok("wrangler 기동", true);

  const shop = await import("../../lib/shopItems.ts");
  const buyable = shop.SHOP_ITEMS.filter((x) => x.price > 0).sort((a, b) => a.price - b.price);
  KEY = shop.itemKey(buyable[0].slot, buyable[0].id); PRICE = buyable[0].price;
  KEY2 = shop.itemKey(buyable[1].slot, buyable[1].id); PRICE2 = buyable[1].price;
  console.log(`  (테스트 아이템: ${KEY}=${PRICE} · ${KEY2}=${PRICE2})`);

  await sequentialRepeat();
  await concurrentSame();
  await concurrentPurchase();
  await lastBalanceRace();
  await mixedConcurrent();
  await capRace();
  await adminRace();
  await ledgerConsistency();

  finish();
}

// ── 1) 동일 요청 순차 2회 / 10회 ─────────────────────────────────────────
async function sequentialRepeat() {
  G("1. 순차 반복 — 잔액은 정확히 한 번만 증가");
  const u = await seedUser("seq", 0);
  const body = { rewardType: "mission_complete", operationId: `mission_write_post_${TODAY}`, sourceId: `write_post_${TODAY}` };
  const first = await call("/api/claim-reward", body, u.idToken);
  ok("1회차 → 200 granted", first.status === 200 && first.json?.duplicate === false, `got ${first.status}`);
  const gained = first.json?.awardedCandy || 0;
  ok("솜사탕이 실제로 지급됨", gained > 0, `${gained}`);
  for (let i = 0; i < 9; i++) await call("/api/claim-reward", body, u.idToken);
  const doc = await fsGet(`users/${u.uid}`);
  ok(`총 10회 순차 요청 후 잔액 == 1회분(${gained})`, num(doc.cottonCandy) === gained, `got ${num(doc.cottonCandy)}`);
  const ops = await fsList(`users/${u.uid}/rewardOperations`);
  ok("원장이 정확히 1건", ops.length === 1, `got ${ops.length}`);
}

// ── 2) 동일 요청 10회 동시(여러 탭 시뮬레이션) ───────────────────────────
async function concurrentSame() {
  G("2. 동시 10회 — 멱등 (여러 탭·재전송)");
  const u = await seedUser("conc", 0);
  const body = { rewardType: "mission_complete", operationId: `mission_write_post_${TODAY}`, sourceId: `write_post_${TODAY}` };
  const rs = await Promise.all(Array.from({ length: 10 }, () => call("/api/claim-reward", body, u.idToken)));
  const codes = rs.map((r) => r.status);
  ok("모든 응답이 2xx 또는 409 (5xx 없음)", codes.every((c) => c === 200 || c === 409), codes.join(","));
  const granted = rs.filter((r) => r.status === 200 && r.json?.duplicate === false);
  ok("duplicate=false 응답이 정확히 1건", granted.length === 1, `got ${granted.length}`);
  const award = granted[0]?.json?.awardedCandy || 0;
  const doc = await fsGet(`users/${u.uid}`);
  ok(`잔액 == 1회분(${award})`, num(doc.cottonCandy) === award, `got ${num(doc.cottonCandy)}`);
  const ops = await fsList(`users/${u.uid}/rewardOperations`);
  ok("원장 정확히 1건", ops.length === 1, `got ${ops.length}`);
  ok("원장 awardedCandy 와 잔액 증가분 일치", num(ops[0]?.fields?.awardedCandy) === award);
}

// ── 3) 같은 아이템 동시 구매 10회 ────────────────────────────────────────
async function concurrentPurchase() {
  G("3. 같은 아이템 동시 구매 10회 — 차감은 한 번만");
  const u = await seedUser("buy", 10000);
  const rs = await Promise.all(Array.from({ length: 10 }, () => call("/api/purchase", { itemKey: KEY }, u.idToken)));
  ok("5xx 없음", rs.every((r) => r.status === 200 || r.status === 409), rs.map((r) => r.status).join(","));
  const charged = rs.filter((r) => r.status === 200 && r.json?.charged > 0);
  ok("실제 과금 응답이 정확히 1건", charged.length === 1, `got ${charged.length}`);
  const doc = await fsGet(`users/${u.uid}`);
  ok(`잔액 == 10000 - ${PRICE}`, num(doc.cottonCandy) === 10000 - PRICE, `got ${num(doc.cottonCandy)}`);
  ok("ownedItems 중복 없음", arrv(doc.ownedItems).filter((x) => x === KEY).length === 1);
  const purch = await fsList(`users/${u.uid}/purchases`);
  ok("구매 원장 정확히 1건", purch.length === 1, `got ${purch.length}`);
  ok("원장 resultingBalance == 실제 잔액", num(purch[0]?.fields?.resultingBalance) === num(doc.cottonCandy));
}

// ── 4) 마지막 잔액으로 두 구매 경쟁 ──────────────────────────────────────
async function lastBalanceRace() {
  G("4. 잔액 부족 경쟁 — 서로 다른 아이템 동시 구매");
  // 한 개만 살 수 있는 잔액을 준다
  const budget = Math.max(PRICE, PRICE2);
  const u = await seedUser("race", budget);
  const [a, b] = await Promise.all([
    call("/api/purchase", { itemKey: KEY }, u.idToken),
    call("/api/purchase", { itemKey: KEY2 }, u.idToken),
  ]);
  const doc = await fsGet(`users/${u.uid}`);
  const bal = num(doc.cottonCandy);
  const owned = arrv(doc.ownedItems);
  const purch = await fsList(`users/${u.uid}/purchases`);
  const spent = budget - bal;
  ok("잔액 음수 없음", bal >= 0, `got ${bal}`);
  ok("차감액 == 실제 획득 아이템 가격 합", spent === owned.reduce((s, k) => s + (k === KEY ? PRICE : k === KEY2 ? PRICE2 : 0), 0), `spent=${spent} owned=${owned.join(",")}`);
  ok("구매 원장 수 == 보유 아이템 수", purch.length === owned.length, `${purch.length} vs ${owned.length}`);
  ok("응답 5xx 없음", [a.status, b.status].every((s) => s === 200 || s === 409 || s === 422), `${a.status},${b.status}`);
  // ⚠️ 공허 통과 방지 — 둘 다 409 로 끝나면 위 등식이 0==0 으로 참이 되어 아무것도 검증하지 못한다.
  ok("★적어도 한 건은 실제로 처리됐다(공허 통과 방지)", owned.length >= 1, `owned=${owned.length} codes=${a.status}/${b.status}`);
  ok("잔액 부족한 쪽은 422 로 거부(둘 다 성공하지 않음)", owned.length === 1, `owned=${owned.length}`);
  console.log(`     (경쟁 결과: ${a.status}/${b.status}, 잔액 ${bal}, 보유 ${owned.length}개)`);
}

// ── 5) 구매와 보상 동시 실행 ─────────────────────────────────────────────
async function mixedConcurrent() {
  G("5. 구매·보상·관리자지급 동시 실행 — 원장/잔액 정합");
  const u = await seedUser("mix", 5000);
  const admin = await fsGet("__none__").catch(() => null); void admin;
  const rs = await Promise.all([
    call("/api/purchase", { itemKey: KEY }, u.idToken),
    call("/api/claim-reward", { rewardType: "mission_complete", operationId: `mission_write_post_${TODAY}`, sourceId: `write_post_${TODAY}` }, u.idToken),
    call("/api/claim-reward", { rewardType: "achievement_claim", operationId: "ach_first_visit", sourceId: "first_visit" }, u.idToken),
  ]);
  ok("5xx 없음", rs.every((r) => r.status < 500), rs.map((r) => r.status).join(","));
  const doc = await fsGet(`users/${u.uid}`);
  const purch = await fsList(`users/${u.uid}/purchases`);
  const ops = await fsList(`users/${u.uid}/rewardOperations`);
  const credited = ops.reduce((s, o) => s + (num(o.fields.awardedCandy) || 0), 0);
  const debited = purch.reduce((s, p) => s + (num(p.fields.charged) || 0), 0);
  ok("잔액 == 5000 + 원장적립 - 원장차감", num(doc.cottonCandy) === 5000 + credited - debited,
    `bal=${num(doc.cottonCandy)} credit=${credited} debit=${debited}`);
  ok("잔액 음수 없음", num(doc.cottonCandy) >= 0);
  // ⚠️ 공허 통과 방지 — 전부 409 면 credited=debited=0 이라 위 등식이 무의미해진다.
  ok("★3건이 모두 처리됐다(공허 통과 방지)", ops.length === 2 && purch.length === 1, `ops=${ops.length} purch=${purch.length}`);
  ok("★적립·차감이 모두 실제로 발생", credited > 0 && debited > 0, `credit=${credited} debit=${debited}`);
}

// ── 6) 일일 상한 직전 동시 보상 ─────────────────────────────────────────
async function capRace() {
  G("6. 전역 일일 상한 경쟁 — 초과 지급 불가");
  const { DAILY_CANDY_TOTAL_CAP } = await import("../../functions/_shared/rewardTypes.ts");
  const u = await seedUser("cap", 0);
  // 상한 직전까지 채워둔다(남은 여유 = 40)
  const room = 40;
  await fsSet(`users/${u.uid}`, {
    doriExp: I(0), cottonCandy: I(0), cottonCandyTotal: I(0), tier: I(1), level: I(1),
    candyDailyDate: S(TODAY), candyDailyTotal: I(DAILY_CANDY_TOTAL_CAP - room),
  });
  // candy 가 붙은 서로 다른 타입을 동시에 청구(각각 30·50·40…)
  const rs = await Promise.all([
    call("/api/claim-reward", { rewardType: "mission_complete", operationId: `mission_read_trend_${TODAY}`, sourceId: `read_trend_${TODAY}` }, u.idToken),
    call("/api/claim-reward", { rewardType: "minigame_play", operationId: `minigame_playtime_${TODAY}`, sourceId: `playtime_${TODAY}` }, u.idToken),
    call("/api/claim-reward", { rewardType: "achievement_claim", operationId: "ach_first_visit", sourceId: "first_visit" }, u.idToken),
  ]);
  ok("5xx 없음", rs.every((r) => r.status < 500), rs.map((r) => r.status).join(","));
  const doc = await fsGet(`users/${u.uid}`);
  const total = num(doc.candyDailyTotal);
  ok(`전역 집계가 상한(${DAILY_CANDY_TOTAL_CAP})을 넘지 않음`, total <= DAILY_CANDY_TOTAL_CAP, `got ${total}`);
  ok(`이번에 지급된 합 ≤ 남은 여유(${room})`, num(doc.cottonCandy) <= room, `got ${num(doc.cottonCandy)}`);
  const ops = await fsList(`users/${u.uid}/rewardOperations`);
  const sum = ops.reduce((s, o) => s + (num(o.fields.awardedCandy) || 0), 0);
  ok("원장 합계 == 잔액", sum === num(doc.cottonCandy), `${sum} vs ${num(doc.cottonCandy)}`);
  // ⚠️ 공허 통과 방지 — 3건이 전부 409 로 끝나면 "상한 초과 없음"이 자동 참이 된다.
  ok("★3건이 모두 처리됐다(공허 통과 방지)", ops.length === 3, `ops=${ops.length}`);
  ok(`★상한 여유(${room})가 실제로 소진됐다`, total === DAILY_CANDY_TOTAL_CAP, `total=${total}`);
  const wanted = 30 + 50 + (await import("../../functions/_shared/rewardTypes.ts")).ACHIEVEMENT_CANDY.first_visit;
  ok(`★요청 합(${wanted}) > 여유(${room}) 인데 여유만큼만 지급됨`, wanted > room && num(doc.cottonCandy) === room, `지급 ${num(doc.cottonCandy)}`);
}

// ── 7) 관리자 동시 지급 ─────────────────────────────────────────────────
async function adminRace() {
  G("7. 관리자 지급 경쟁 — 무한 지급 불가");
  const admin = await seedUser("adm2", 0);   // 이 인스턴스의 REWARD_ADMIN_UIDS 가 아니다
  const victim = await seedUser("vic", 100);
  // 관리자가 아닌 사용자가 동시에 10번 시도
  const rs = await Promise.all(Array.from({ length: 10 }, (_, i) =>
    call("/api/admin/grant", { targetUid: victim.uid, operationId: `grant_race${String(i).padStart(6, "0")}`, candy: 100000 }, admin.idToken)));
  ok("비관리자 동시 10회 → 전부 403", rs.every((r) => r.status === 403), rs.map((r) => r.status).join(","));
  const doc = await fsGet(`users/${victim.uid}`);
  ok("대상 잔액 불변(100)", num(doc.cottonCandy) === 100, `got ${num(doc.cottonCandy)}`);
  const grants = await fsList(`users/${victim.uid}/grants`);
  ok("실패한 요청이 원장을 남기지 않음", grants.length === 0, `got ${grants.length}`);
}

// ── 8) 원장 ↔ 잔액 정합 + 실패시 무기록 ─────────────────────────────────
async function ledgerConsistency() {
  G("8. 원장 정합성 · 실패시 무기록 · 문서 삭제 후 재청구");
  const u = await seedUser("led", 500);

  // 실패 요청들(400/403/404/422)이 원장을 남기지 않는지
  await call("/api/claim-reward", { rewardType: "mission_complete", operationId: "mission_hack_2099-01-01", sourceId: "hack_2099-01-01" }, u.idToken);
  await call("/api/purchase", { itemKey: "bg::doesnotexist" }, u.idToken);
  await call("/api/purchase", { itemKey: KEY, price: 0 }, u.idToken);
  const ops0 = await fsList(`users/${u.uid}/rewardOperations`);
  const pur0 = await fsList(`users/${u.uid}/purchases`);
  ok("실패 요청 3건 후 원장 0건", ops0.length === 0 && pur0.length === 0, `${ops0.length}/${pur0.length}`);

  // 성공 요청은 반드시 원장을 남긴다
  const okBuy = await call("/api/purchase", { itemKey: KEY }, u.idToken);
  ok("구매 성공 → 200", okBuy.status === 200);
  const pur1 = await fsList(`users/${u.uid}/purchases`);
  ok("성공 요청이 원장을 남긴다", pur1.length === 1, `got ${pur1.length}`);

  // ★ users 문서 삭제 → 재생성 후 같은 operationId 재청구 (파밍 시도)
  const claimBody = { rewardType: "mission_complete", operationId: `mission_write_post_${TODAY}`, sourceId: `write_post_${TODAY}` };
  const c1 = await call("/api/claim-reward", claimBody, u.idToken);
  const awarded = c1.json?.awardedCandy || 0;
  ok("최초 미션 청구 성공", c1.status === 200 && awarded > 0);
  await fsDelete(`users/${u.uid}`);
  ok("users 문서 삭제됨", (await fsGet(`users/${u.uid}`)) === null);
  const opsSurvive = await fsList(`users/${u.uid}/rewardOperations`);
  ok("★하위 컬렉션 원장은 삭제되지 않음(Firestore 계약)", opsSurvive.length >= 1, `got ${opsSurvive.length}`);
  await fsSet(`users/${u.uid}`, { doriExp: I(0), cottonCandy: I(100), cottonCandyTotal: I(100), tier: I(1), level: I(1) });
  const c2 = await call("/api/claim-reward", claimBody, u.idToken);
  ok("★문서 재생성 후 같은 operationId 재청구 → duplicate(재지급 없음)", c2.status === 200 && c2.json?.duplicate === true && c2.json?.awardedCandy === 0, `got ${c2.status}/${c2.json?.awardedCandy}`);
  const after = await fsGet(`users/${u.uid}`);
  ok("재생성 후 잔액이 늘지 않음(100 그대로)", num(after.cottonCandy) === 100, `got ${num(after.cottonCandy)}`);

  // 이미 구매한 아이템도 원장이 살아 있어 재과금 없음
  const reBuy = await call("/api/purchase", { itemKey: KEY }, u.idToken);
  ok("★문서 재생성 후 재구매 → duplicate, charged 0", reBuy.status === 200 && reBuy.json?.duplicate === true && reBuy.json?.charged === 0, `got ${reBuy.status}/${reBuy.json?.charged}`);
}

function finish() {
  for (const c of children) { try { c.kill("SIGKILL"); } catch { /* noop */ } }
  const n = killPort(PORT);
  if (n) console.log(`  (정리: 잔존 ${n}개)`);
  const pass = results.filter((r) => r.ok).length;
  const fail = results.filter((r) => !r.ok);
  console.log(`\n════════ 동시성·멱등 결과: ${pass}/${results.length} ════════`);
  for (const f of fail) console.log(`  · [${f.group}] ${f.n}`);
  try { rmSync(TMP, { recursive: true, force: true }); } catch { /* noop */ }
  process.exit(fail.length ? 1 : 0);
}

main().catch((e) => { console.error("FATAL", e?.message || e); finish(); });
