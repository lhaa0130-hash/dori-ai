// 감사 전용 프로브 — 동일 사용자 문서에 대한 동시 서로 다른 재화 작업의 성공률 계량.
// Phase 5 에서 "동시 요청이 전부 409" 를 관측했다. 그것이 (a) 설계상 안전한 거부인지
// (b) 백오프 없는 재시도로 인한 livelock 인지 구분한다.
// 실행: npm run probe:contention
import { spawn, execSync } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync, symlinkSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const PROJECT = "demo-illo-myworld";
const FS_HOST = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";
const AUTH_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";
const REPO = path.resolve(fileURLToPath(new URL("../../", import.meta.url)));
const TMP = path.join(REPO, ".wrangler-tmp", "probe-" + process.pid);
const PORT = 8821;   // 다른 스위트와 겹치지 않는 대역
// 신규 client 는 확장 타입 요청에 candyOwner:"server" 를 붙인다(05-09 이중지급 차단 계약).
// my_world_interaction·daily_attendance 정제기는 미지 필드를 거부하므로 확장 타입에만 붙인다.
const EXTENDED_TYPES = new Set(["community_post","community_comment","mission_complete","minigame_play","game_activity","achievement_claim","level_reward"]);
function withCandyOwner(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return body;
  if (!EXTENDED_TYPES.has(body.rewardType)) return body;
  if ("candyOwner" in body) return body;
  return { ...body, candyOwner: "server" };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const fsUrl = (p) => `http://${FS_HOST}/v1/projects/${PROJECT}/databases/(default)/documents/${p}`;
const OWNER = { Authorization: "Bearer owner", "Content-Type": "application/json" };
const I = (v) => ({ integerValue: String(v) });
const num = (f) => (f?.integerValue != null ? Number(f.integerValue) : undefined);
async function fsSet(rel, fields) { await fetch(fsUrl(rel), { method: "PATCH", headers: OWNER, body: JSON.stringify({ fields }) }); }
async function fsGet(rel) { const r = await fetch(fsUrl(rel), { headers: OWNER }); return r.ok ? (await r.json()).fields || {} : null; }
async function fsList(rel) { const r = await fetch(fsUrl(rel) + "?pageSize=300", { headers: OWNER }); if (!r.ok) return []; return ((await r.json()).documents || []); }

let seq = 0;
async function seedUser(candy) {
  const r = await fetch(`http://${AUTH_HOST}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: `probe-${Date.now()}-${seq++}@t.dev`, password: "test1234", returnSecureToken: true }),
  });
  const j = await r.json();
  await fsSet(`users/${j.localId}`, { doriExp: I(0), cottonCandy: I(candy), cottonCandyTotal: I(candy), tier: I(1), level: I(1) });
  return { uid: j.localId, idToken: j.idToken };
}
async function call(route, body, token) {
  try {
    const r = await fetch(`http://127.0.0.1:${PORT}${route}`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(withCandyOwner(body)),
    });
    const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch { /* noop */ }
    return { status: r.status, json: j };
  } catch (e) { return { status: 0, err: e.message }; }
}
function killPort(port) {
  try {
    if (process.platform === "win32") {
      const out = execSync(`netstat -ano -p tcp | findstr LISTENING | findstr :${port}`, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
      for (const pid of new Set(out.split(/\r?\n/).map((l) => l.trim().split(/\s+/).pop()).filter((p) => /^\d+$/.test(p) && p !== "0"))) {
        try { execSync(`taskkill /PID ${pid} /T /F`, { stdio: "ignore" }); } catch { /* noop */ }
      }
    }
  } catch { /* noop */ }
}
const children = [];
function start() {
  rmSync(TMP, { recursive: true, force: true });
  mkdirSync(path.join(TMP, "public"), { recursive: true });
  writeFileSync(path.join(TMP, "public", "index.html"), "ok");
  if (!existsSync(path.join(TMP, "functions"))) symlinkSync(path.join(REPO, "functions"), path.join(TMP, "functions"), "junction");
  const b = { REWARD_ENV: "emulator", FIREBASE_PROJECT_ID: PROJECT, FIRESTORE_EMULATOR_HOST: FS_HOST, FIREBASE_AUTH_EMULATOR_HOST: AUTH_HOST, REWARD_ROLLOUT_MODE: "all", CANDY_ROLLOUT_MODE: "all" };
  const args = ["wrangler", "pages", "dev", "public", "--port", String(PORT), "--ip", "127.0.0.1", "--compatibility-date=2024-05-18"];
  for (const [k, v] of Object.entries(b)) args.push("--binding", `${k}=${v}`);
  children.push(spawn("npx", ["--no-install", ...args], { cwd: TMP, stdio: "ignore", shell: process.platform === "win32" }));
}
async function waitPort() {
  const t0 = Date.now();
  while (Date.now() - t0 < 120000) {
    try { if ((await fetch(`http://127.0.0.1:${PORT}/api/claim-reward`, { method: "OPTIONS" })).status === 204) return true; } catch { /* noop */ }
    await sleep(1500);
  }
  return false;
}
function todayKST() { const k = new Date(Date.now() + 9 * 3600e3); return `${k.getUTCFullYear()}-${String(k.getUTCMonth() + 1).padStart(2, "0")}-${String(k.getUTCDate()).padStart(2, "0")}`; }
const T = todayKST();

// 서로 다른 재화 작업 3종(모두 같은 users 문서를 갱신한다)
const OPS = [
  ["mission", { rewardType: "mission_complete", operationId: `mission_write_post_${T}`, sourceId: `write_post_${T}` }],
  ["minigame", { rewardType: "minigame_play", operationId: `minigame_playtime_${T}`, sourceId: `playtime_${T}` }],
  ["achieve", { rewardType: "achievement_claim", operationId: "ach_first_visit", sourceId: "first_visit" }],
];

async function trial(concurrency, staggerMs) {
  const u = await seedUser(0);
  const picks = OPS.slice(0, concurrency);
  const rs = await Promise.all(picks.map(async ([, body], i) => {
    if (staggerMs) await sleep(i * staggerMs);
    return call("/api/claim-reward", body, u.idToken);
  }));
  const doc = await fsGet(`users/${u.uid}`);
  const ops = await fsList(`users/${u.uid}/rewardOperations`);
  const credited = ops.reduce((s, d) => s + (num(d.fields?.awardedCandy) || 0), 0);
  return {
    codes: rs.map((r) => r.status),
    ok200: rs.filter((r) => r.status === 200).length,
    c409: rs.filter((r) => r.status === 409).length,
    balance: num(doc?.cottonCandy) || 0,
    ledger: ops.length,
    credited,
    consistent: (num(doc?.cottonCandy) || 0) === credited,
  };
}

async function main() {
  killPort(PORT);
  start();
  if (!await waitPort()) { console.log("wrangler 기동 실패"); return done(1); }

  console.log("\n동시성 × 지연 → 성공/409/원장/정합  (같은 users 문서에 대한 서로 다른 작업)");
  console.log("─".repeat(78));
  const rows = [];
  for (const conc of [2, 3]) {
    for (const stagger of [0, 50, 150, 400]) {
      const runs = [];
      for (let i = 0; i < 3; i++) runs.push(await trial(conc, stagger));
      const avgOk = (runs.reduce((s, r) => s + r.ok200, 0) / runs.length).toFixed(1);
      const avg409 = (runs.reduce((s, r) => s + r.c409, 0) / runs.length).toFixed(1);
      const allConsistent = runs.every((r) => r.consistent);
      rows.push({ conc, stagger, avgOk, avg409, allConsistent });
      console.log(`  동시 ${conc}개 · 지연 ${String(stagger).padStart(3)}ms →  성공 ${avgOk}/${conc}   409 ${avg409}   원장↔잔액 정합 ${allConsistent ? "✅" : "❌"}   (3회 평균)`);
    }
  }
  console.log("─".repeat(78));
  const zero = rows.filter((r) => r.stagger === 0);
  const staggered = rows.filter((r) => r.stagger >= 400);
  console.log(`\n요약:`);
  console.log(`  · 지연 0ms  평균 성공률: ${(zero.reduce((s, r) => s + Number(r.avgOk) / r.conc, 0) / zero.length * 100).toFixed(0)}%`);
  console.log(`  · 지연 400ms 평균 성공률: ${(staggered.reduce((s, r) => s + Number(r.avgOk) / r.conc, 0) / staggered.length * 100).toFixed(0)}%`);
  console.log(`  · 원장↔잔액 정합: ${rows.every((r) => r.allConsistent) ? "전 조건 유지 ✅ (안전성은 깨지지 않는다)" : "❌ 불일치 발생"}`);
  done(0);
}
function done(code) {
  for (const c of children) { try { c.kill("SIGKILL"); } catch { /* noop */ } }
  killPort(PORT);
  try { rmSync(TMP, { recursive: true, force: true }); } catch { /* noop */ }
  process.exit(code);
}
main().catch((e) => { console.error("FATAL", e?.message || e); done(1); });
