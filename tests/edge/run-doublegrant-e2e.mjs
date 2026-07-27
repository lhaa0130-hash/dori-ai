// 결함 B — 미니게임 이중 지급 계약 테스트 (로컬 Edge 전용).
//
// 배경: 구버전 live client 의 grantPlaytimeReward 는
//   ① addCottonCandy(+50) 를 Firestore 에 **직접** 쓰고   ② minigame_play 를 서버에 청구한다.
// 병합 전 서버는 minigame_play 에 재화를 주지 않아 합계 50 이었는데,
// 병합 후 서버가 50 을 더 주면서 **합계 100**(카나리 UID) 이 됐다.
//
// 수정: 재화를 스스로 쓰지 않는 클라만 `candyOwner: "server"` 를 보낸다.
//   표식 없음(=구버전) → 서버 재화 0 (EXP 는 그대로) → 합계 50, 기존 계약 유지
//   표식 있음(=신규)   → 서버 재화 50 → 합계 50, 클라 직접 쓰기 없음
//
// ⚠️ Production 요청 0건.
import { spawn, execSync } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync, symlinkSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const PROJECT = "demo-illo-myworld";
const FS_HOST = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";
const AUTH_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";
const REPO = path.resolve(fileURLToPath(new URL("../../", import.meta.url)));
const TMP = path.join(REPO, ".wrangler-tmp", "dg-" + process.pid);
const PORT = 8822;   // 다른 스위트와 겹치지 않는 대역

const results = [];
let group = "";
const G = (g) => { group = g; console.log(`\n── ${g} ──`); };
const ok = (n, cond, d = "") => { results.push({ group, n, ok: !!cond }); console.log(`${cond ? "PASS" : "FAIL"}  ${n}${d ? "  — " + d : ""}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const fsUrl = (p) => `http://${FS_HOST}/v1/projects/${PROJECT}/databases/(default)/documents/${p}`;
const OWNER = { Authorization: "Bearer owner", "Content-Type": "application/json" };
const I = (v) => ({ integerValue: String(v) });
const num = (f) => (f?.integerValue != null ? Number(f.integerValue) : f?.doubleValue != null ? Number(f.doubleValue) : undefined);
/** ⚠️ updateMask 없는 PATCH 는 문서를 **통째로 교체**한다. 일부 필드만 바꾸려면 fsPatch 를 쓸 것. */
async function fsSet(rel, fields) { await fetch(fsUrl(rel), { method: "PATCH", headers: OWNER, body: JSON.stringify({ fields }) }); }
/** 지정한 필드만 갱신(나머지 보존). */
async function fsPatch(rel, fields) {
  const mask = Object.keys(fields).map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join("&");
  await fetch(`${fsUrl(rel)}?${mask}`, { method: "PATCH", headers: OWNER, body: JSON.stringify({ fields }) });
}
async function fsGet(rel) { const r = await fetch(fsUrl(rel), { headers: OWNER }); return r.ok ? (await r.json()).fields || {} : null; }
async function fsList(rel) { const r = await fetch(fsUrl(rel) + "?pageSize=300", { headers: OWNER }); if (!r.ok) return []; return ((await r.json()).documents || []); }

let seq = 0;
async function seedUser(candy = 0) {
  const r = await fetch(`http://${AUTH_HOST}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: `dg-${Date.now()}-${seq++}@t.dev`, password: "test1234", returnSecureToken: true }),
  });
  const j = await r.json();
  await fsSet(`users/${j.localId}`, { doriExp: I(0), cottonCandy: I(candy), cottonCandyTotal: I(candy), tier: I(1), level: I(1) });
  return { uid: j.localId, idToken: j.idToken };
}
async function claim(body, token) {
  try {
    const r = await fetch(`http://127.0.0.1:${PORT}/api/claim-reward`, {
      method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    });
    const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch { /* noop */ }
    return { status: r.status, json: j };
  } catch (e) { return { status: 0, err: e.message }; }
}
function killPort(port) {
  try {
    if (process.platform !== "win32") return;
    const out = execSync(`netstat -ano -p tcp | findstr LISTENING | findstr :${port}`, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    for (const pid of new Set(out.split(/\r?\n/).map((l) => l.trim().split(/\s+/).pop()).filter((p) => /^\d+$/.test(p) && p !== "0"))) {
      try { execSync(`taskkill /PID ${pid} /T /F`, { stdio: "ignore" }); } catch { /* noop */ }
    }
  } catch { /* noop */ }
}
const children = [];
function start() {
  mkdirSync(path.join(TMP, "public"), { recursive: true });
  writeFileSync(path.join(TMP, "public", "index.html"), "ok");
  if (!existsSync(path.join(TMP, "functions"))) symlinkSync(path.join(REPO, "functions"), path.join(TMP, "functions"), "junction");
  const b = { REWARD_ENV: "emulator", FIREBASE_PROJECT_ID: PROJECT, FIRESTORE_EMULATOR_HOST: FS_HOST,
    FIREBASE_AUTH_EMULATOR_HOST: AUTH_HOST, REWARD_ROLLOUT_MODE: "all", CANDY_ROLLOUT_MODE: "all" };
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

// 구버전 client 가 보내는 형태 (candyOwner 없음)
const legacyPlay = () => ({ rewardType: "minigame_play", operationId: `minigame_playtime_${T}`, sourceId: `playtime_${T}` });
// 신규 client 가 보내는 형태 (candyOwner: "server")
const modernPlay = () => ({ ...legacyPlay(), candyOwner: "server" });
const modernMission = (id) => ({ rewardType: "mission_complete", operationId: `mission_${id}_${T}`, sourceId: `${id}_${T}`, candyOwner: "server" });
const legacyMission = (id) => ({ rewardType: "mission_complete", operationId: `mission_${id}_${T}`, sourceId: `${id}_${T}` });

/** 구버전 client 의 로컬 직접 쓰기(+50)를 에뮬레이터에 재현한다(구 Rules 아래에서는 통과했다). */
async function legacyLocalWrite(uid, amount) {
  const cur = await fsGet(`users/${uid}`);
  await fsPatch(`users/${uid}`, { cottonCandy: I((num(cur.cottonCandy) || 0) + amount) });
}

async function main() {
  killPort(PORT);
  start();
  if (!await waitPort()) { ok("wrangler 기동", false, "타임아웃"); return finish(); }
  ok("wrangler 기동", true);

  // ── 1. 핵심 계약 ────────────────────────────────────────────────────
  G("1. 구버전 / 신규 client 형태별 지급액");
  {
    const u = await seedUser(0);
    const r = await claim(legacyPlay(), u.idToken);
    ok("★구버전 형태(표식 없음) → 서버 재화 0", r.status === 200 && r.json?.awardedCandy === 0, `candy=${r.json?.awardedCandy}`);
    ok("구버전 형태에서도 EXP 는 정상 지급", r.json?.awardedExp > 0, `exp=${r.json?.awardedExp}`);
    await legacyLocalWrite(u.uid, 50);   // 구버전 client 의 로컬 +50
    const doc = await fsGet(`users/${u.uid}`);
    ok("★구버전 한 판 합계 = 50 (병합 전 계약 유지)", num(doc.cottonCandy) === 50, `got ${num(doc.cottonCandy)}`);
  }
  {
    const u = await seedUser(0);
    const r = await claim(modernPlay(), u.idToken);
    ok("★신규 형태(표식 있음) → 서버 재화 50", r.status === 200 && r.json?.awardedCandy === 50, `candy=${r.json?.awardedCandy}`);
    const doc = await fsGet(`users/${u.uid}`);
    ok("★신규 한 판 합계 = 50 (클라 직접 쓰기 없음)", num(doc.cottonCandy) === 50, `got ${num(doc.cottonCandy)}`);
  }

  // ── 2. 한 판 전체 시퀀스 (신규 client) ──────────────────────────────
  G("2. 신규 client 한 판 완료 전체 시퀀스");
  {
    const u = await seedUser(0);
    const a = await claim(modernPlay(), u.idToken);                 // ① 플레이타임 보상
    const b = await claim(modernMission("play_minigame"), u.idToken); // ② 일일 미션
    const doc = await fsGet(`users/${u.uid}`);
    ok("① minigame_play → 50", a.json?.awardedCandy === 50);
    ok("② mission play_minigame → 40", b.json?.awardedCandy === 40, `got ${b.json?.awardedCandy}`);
    ok("한 판 합계 = 90 candy", num(doc.cottonCandy) === 90, `got ${num(doc.cottonCandy)}`);
    ok("한 판 합계 = 15 exp", num(doc.doriExp) === 15, `got ${num(doc.doriExp)}`);
    const ops = await fsList(`users/${u.uid}/rewardOperations`);
    ok("원장 2건", ops.length === 2, `got ${ops.length}`);
  }

  // ── 3. 중복 방지 ────────────────────────────────────────────────────
  G("3. 재전송·연속 플레이·여러 탭");
  {
    const u = await seedUser(0);
    await claim(modernPlay(), u.idToken);
    const again = await claim(modernPlay(), u.idToken);
    ok("같은 판 결과 재전송 → duplicate, 추가 0", again.json?.duplicate === true && again.json?.awardedCandy === 0);
    const tabs = await Promise.all(Array.from({ length: 5 }, () => claim(modernPlay(), u.idToken)));
    ok("여러 탭 동시 재전송 → 추가 지급 0", tabs.every((r) => r.status === 200 && (r.json?.awardedCandy || 0) === 0));
    const doc = await fsGet(`users/${u.uid}`);
    ok("연속 두 판(같은 날) → 여전히 50", num(doc.cottonCandy) === 50, `got ${num(doc.cottonCandy)}`);
  }
  {
    const u = await seedUser(0);
    const both = await Promise.all([claim(modernPlay(), u.idToken), claim(modernMission("play_minigame"), u.idToken)]);
    ok("minigame_play·mission_complete 동시 발생 → 5xx 없음", both.every((r) => r.status < 500), both.map((r) => r.status).join(","));
    const doc = await fsGet(`users/${u.uid}`);
    ok("동시 발생해도 합계 90", num(doc.cottonCandy) === 90, `got ${num(doc.cottonCandy)}`);
  }
  {
    // 같은 sourceId 를 표식 유무로 두 번 → 두 번째는 duplicate(재지급 없음)
    const u = await seedUser(0);
    const a = await claim(legacyPlay(), u.idToken);     // 표식 없음 → 0
    const b = await claim(modernPlay(), u.idToken);     // 같은 operationId → duplicate
    ok("표식 없이 먼저 청구하면 그 판은 재화 0 으로 고정된다", a.json?.awardedCandy === 0 && b.json?.duplicate === true && b.json?.awardedCandy === 0,
      `a=${a.json?.awardedCandy} b.dup=${b.json?.duplicate}`);
    const doc = await fsGet(`users/${u.uid}`);
    ok("→ 합계 0 (구버전이 로컬 +50 을 쓰므로 최종 50)", num(doc.cottonCandy) === 0, `got ${num(doc.cottonCandy)}`);
  }

  // ── 4. 표식 검증 ────────────────────────────────────────────────────
  G("4. candyOwner 표식 자체의 계약");
  {
    const u = await seedUser(0);
    for (const [name, v] of [["빈 문자열", ""], ["client", "client"], ["숫자", 1], ["true", true], ["객체", { a: 1 }]]) {
      const r = await claim({ ...legacyPlay(), candyOwner: v }, u.idToken);
      ok(`candyOwner=${name} → 400`, r.status === 400 && r.json?.detail === "invalid_candy_owner", `got ${r.status}/${r.json?.detail}`);
    }
  }

  // ── 5. 다른 계약 무영향 ─────────────────────────────────────────────
  G("5. 출석·다른 미션 계약 무영향");
  {
    const u = await seedUser(0);
    await fsPatch(`users/${u.uid}`, { attendance: { mapValue: { fields: { lastChecked: { stringValue: "" }, streak: I(0), totalDays: I(0) } } } });
    const r = await claim({ rewardType: "daily_attendance" }, u.idToken);
    ok("★출석은 표식과 무관하게 솜사탕 지급(계약 불변)", r.status === 200 && r.json?.reward?.cottonCandy > 0, `got ${JSON.stringify(r.json?.reward)}`);
  }
  {
    const u = await seedUser(0);
    // 구버전 client 가 실제로 보내는 EXP 전용 미션 — 원래 재화 0 이라 변화 없음
    for (const id of ["postset", "commentset", "likeset"]) {
      const r = await claim(legacyMission(id), u.idToken);
      ok(`구버전 EXP 전용 미션(${id}) → 200, 재화 0 (변화 없음)`, r.status === 200 && r.json?.awardedCandy === 0 && r.json?.awardedExp > 0,
        `got ${r.status}/${r.json?.awardedCandy}/${r.json?.awardedExp}`);
    }
  }
  {
    const u = await seedUser(0);
    const r = await claim(modernMission("write_post"), u.idToken);
    ok("다른 미션(write_post)은 신규 형태에서 정상 지급", r.status === 200 && r.json?.awardedCandy === 80, `got ${r.json?.awardedCandy}`);
  }

  // ── 6. 상한·날짜 경계 ───────────────────────────────────────────────
  G("6. 일일 상한·날짜 경계");
  {
    const { DAILY_CANDY_TOTAL_CAP } = await import("../../functions/_shared/rewardTypes.ts");
    const u = await seedUser(0);
    await fsPatch(`users/${u.uid}`, { candyDailyDate: { stringValue: T }, candyDailyTotal: I(DAILY_CANDY_TOTAL_CAP - 20) });
    const r = await claim(modernPlay(), u.idToken);
    ok("상한 직전 → 남은 여유(20)만 지급", r.json?.awardedCandy === 20, `got ${r.json?.awardedCandy}`);
    const u2 = await seedUser(0);
    await fsPatch(`users/${u2.uid}`, { candyDailyDate: { stringValue: T }, candyDailyTotal: I(DAILY_CANDY_TOTAL_CAP) });
    const r2 = await claim(modernPlay(), u2.idToken);
    ok("상한 도달 → 0 지급(EXP 는 지급)", r2.json?.awardedCandy === 0 && r2.json?.awardedExp > 0);
  }
  {
    const u = await seedUser(0);
    const r = await claim({ rewardType: "minigame_play", operationId: "minigame_playtime_2026-01-01", sourceId: "playtime_2026-01-01", candyOwner: "server" }, u.idToken);
    ok("다른 날짜 sourceId → 400 invalid_source_date", r.status === 400 && r.json?.error === "invalid_source_date");
  }

  finish();
}

function finish() {
  for (const c of children) { try { c.kill("SIGKILL"); } catch { /* noop */ } }
  killPort(PORT);
  const pass = results.filter((r) => r.ok).length;
  const fail = results.filter((r) => !r.ok);
  console.log(`\n════════ 이중지급 계약 결과: ${pass}/${results.length} ════════`);
  for (const f of fail) console.log(`  · [${f.group}] ${f.n}`);
  try { rmSync(TMP, { recursive: true, force: true }); } catch { /* noop */ }
  process.exit(fail.length ? 1 : 0);
}
main().catch((e) => { console.error("FATAL", e?.message || e); finish(); });
