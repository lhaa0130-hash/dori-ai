// 05-06K — 실제 브라우저 DOM 클릭 기반 reward E2E.
//  스택: Firebase Auth/Firestore 에뮬레이터(emulators:exec 가 감쌈) + wrangler pages dev(out/ 서빙 + functions)
//        + Chrome(CDP, 테스트 전용 프로필).
//  실행: npm run test:reward:ui   (내부적으로 emulators:exec → 이 스크립트)
//  ⚠️ 사전조건: NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true 로 빌드된 out/ (npm run build:emu).
//  ⚠️ 정리: 내가 spawn 한 PID 트리만 종료. 광범위 taskkill 금지. 테스트 전용 프로필/임시 디렉터리만 삭제.
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync, symlinkSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import http from "node:http";
import net from "node:net";

const PROJECT = "demo-illo-myworld";
const FS_HOST = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";
const AUTH_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";
const WEB_PORT = Number(process.env.UI_E2E_PORT || 3097);   // next dev (에뮬레이터 seam 활성)
const API_PORT = Number(process.env.UI_E2E_API || 8791);    // wrangler pages dev (실제 Pages Function)
const CDP_PORT = Number(process.env.UI_E2E_CDP || 9355);
const BASE = `http://127.0.0.1:${WEB_PORT}`;
const API_BASE = `http://127.0.0.1:${API_PORT}`;
const REPO = path.resolve(fileURLToPath(new URL("../../", import.meta.url)));
// 실행마다 고유 디렉터리 — 이전 실행의 정션이 잠겨 있어도 EPERM 으로 죽지 않는다.
const TMP = path.join(REPO, `.ui-e2e-tmp-${process.pid}`);
const PROFILE = path.join(TMP, "chrome-profile");

const children = [];
const results = [];
const ok = (n, c, d = "") => { results.push({ n, ok: !!c }); console.log(`${c ? "PASS" : "FAIL"}  ${n}${d ? "  — " + d : ""}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Firestore emulator REST(owner) ──
const fsUrl = (p) => `http://${FS_HOST}/v1/projects/${PROJECT}/databases/(default)/documents/${p}`;
const OWNER = { Authorization: "Bearer owner", "Content-Type": "application/json" };
const S = (v) => ({ stringValue: String(v) });
const I = (v) => ({ integerValue: String(v) });
const num = (f) => (f?.integerValue != null ? Number(f.integerValue) : f?.doubleValue != null ? Number(f.doubleValue) : undefined);
async function fsSet(rel, fields) { const r = await fetch(fsUrl(rel), { method: "PATCH", headers: OWNER, body: JSON.stringify({ fields }) }); if (!r.ok) throw new Error(`fsSet ${rel} ${r.status}`); }
async function fsGet(rel) { const r = await fetch(fsUrl(rel), { headers: OWNER }); if (r.status === 404) return null; if (!r.ok) throw new Error(`fsGet ${rel} ${r.status}`); return (await r.json()).fields || {}; }
async function fsList(rel) { const r = await fetch(fsUrl(rel), { headers: OWNER }); if (!r.ok) return []; const j = await r.json(); return j.documents || []; }

async function makeUser(email) {
  const r = await fetch(`http://${AUTH_HOST}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "test1234", returnSecureToken: true }),
  });
  const j = await r.json();
  if (!j.idToken) throw new Error("signUp failed");
  return { uid: j.localId, email, password: "test1234" };
}

// ── 포트 선점 검사 ──
const portFree = (port) => new Promise((res) => {
  const s = net.createServer();
  s.once("error", () => res(false));
  s.once("listening", () => s.close(() => res(true)));
  s.listen(port, "127.0.0.1");
});

// ⚠️ 왜 next dev 인가:
//   lib/firebase.ts 의 USE_EMULATOR 는 `NODE_ENV !== "production"` 을 요구한다. next build 는 항상
//   NODE_ENV=production 이라 프로덕션 번들에는 에뮬레이터/로그인 seam 이 아예 포함되지 않는다
//   (out/ 에 connectAuthEmulator·9099·__illoTestSignIn 문자열 0건 — 프로덕션 안전 속성).
//   따라서 UI E2E 는 dev 서버로 앱을 띄우고, /api/* 만 실제 wrangler(Pages Function)로 프록시한다.
//   → 브라우저에서 실행되는 reward 클라이언트 코드와 엣지 핸들러는 모두 '실물'이다.
function startWrangler() {
  try { rmSync(TMP, { recursive: true, force: true }); } catch { /* 잠긴 잔존물은 무시(고유 디렉터리라 충돌 없음) */ }
  mkdirSync(path.join(TMP, "public"), { recursive: true });
  writeFileSync(path.join(TMP, "public", "index.html"), "<!doctype html>api-only");
  if (!existsSync(path.join(TMP, "functions"))) symlinkSync(path.join(REPO, "functions"), path.join(TMP, "functions"), "junction");
  const args = ["wrangler", "pages", "dev", "public", "--port", String(API_PORT), "--ip", "127.0.0.1", "--compatibility-date=2024-05-18",
    "--binding", "REWARD_ENV=emulator", "--binding", `FIREBASE_PROJECT_ID=${PROJECT}`,
    "--binding", `FIRESTORE_EMULATOR_HOST=${FS_HOST}`, "--binding", `FIREBASE_AUTH_EMULATOR_HOST=${AUTH_HOST}`,
    "--binding", "REWARD_ROLLOUT_MODE=all"];
  const c = spawn("npx", ["--no-install", ...args], { cwd: TMP, stdio: ["ignore", "pipe", "pipe"], shell: process.platform === "win32" });
  c.stdout.on("data", (d) => process.env.UI_DEBUG && process.stdout.write(`[wr] ${d}`));
  c.stderr.on("data", (d) => process.env.UI_DEBUG && process.stdout.write(`[wr!] ${d}`));
  children.push(c);
}
const ENV_LOCAL = path.join(REPO, ".env.local");
let wroteEnvLocal = false;
function startNextDev() {
  // NEXT_PUBLIC_* 는 빌드/기동 시점에 인라인된다. Windows shell 경유 spawn 에서 env 전달이 불안정해
  //  .env.local(‼️ .gitignore 의 .env* 로 제외됨)을 임시로 쓰고 finally 에서 지운다.
  if (!existsSync(ENV_LOCAL)) {
    // ⚠️ 브라우저 앱의 Firestore 프로젝트를 에뮬레이터 대상(demo-illo-myworld)과 일치시킨다.
    //   기본값(dori-ai-0130)이면 앱의 client SDK 쓰기가 '다른 프로젝트 네임스페이스'에 저장돼
    //   엣지 함수(demo-illo-myworld)가 그 source 를 찾지 못한다(community 보상 404의 원인).
    writeFileSync(ENV_LOCAL, [
      "NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true",
      "NEXT_PUBLIC_FIREBASE_EMULATOR_HOST=127.0.0.1",
      `NEXT_PUBLIC_FIREBASE_PROJECT_ID=${PROJECT}`,
      `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${PROJECT}.firebaseapp.com`,
      "",
    ].join("\n"));
    wroteEnvLocal = true;
  }
  const env = { ...process.env, NEXT_PUBLIC_USE_FIREBASE_EMULATOR: "true", NEXT_PUBLIC_FIREBASE_EMULATOR_HOST: "127.0.0.1", NODE_ENV: "development", PORT: String(WEB_PORT) };
  const c = spawn("npx", ["--no-install", "next", "dev", "-p", String(WEB_PORT)], { cwd: REPO, env, stdio: ["ignore", "pipe", "pipe"], shell: process.platform === "win32" });
  c.stdout.on("data", (d) => process.env.UI_DEBUG && process.stdout.write(`[next] ${d}`));
  c.stderr.on("data", (d) => process.env.UI_DEBUG && process.stdout.write(`[next!] ${d}`));
  children.push(c);
}
async function waitReady(timeoutMs = 180000) {
  const start = Date.now();
  let apiUp = false, webUp = false;
  while (Date.now() - start < timeoutMs) {
    if (!apiUp) { try { const r = await fetch(`${API_BASE}/api/claim-reward`, { method: "OPTIONS" }); apiUp = r.status === 204; } catch { /* */ } }
    // next dev 는 최초 요청 때 라우트를 컴파일한다 → 여기서 미리 warm 시켜 브라우저 단계의 대기를 없앤다.
    if (!webUp) { try { const r = await fetch(`${BASE}/my-world`); webUp = r.status === 200; } catch { /* */ } }
    if (apiUp && webUp) { try { await fetch(`${BASE}/my-world`); } catch { /* warm */ } return true; }
    await sleep(2000);
  }
  return false;
}

// ── CDP ──
const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
let ws, msgId = 0; const pending = new Map(); const consoleErrors = []; const claimCalls = [];
const getJSON = (p) => new Promise((res, rej) => { http.get({ host: "127.0.0.1", port: CDP_PORT, path: p }, (r) => { let d = ""; r.on("data", (c) => (d += c)); r.on("end", () => res(JSON.parse(d))); }).on("error", rej); });
const send = (m, p = {}) => new Promise((res) => { const i = ++msgId; pending.set(i, res); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
const evaljs = async (expr) => (await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true }))?.result?.value;

function startChrome() {
  mkdirSync(PROFILE, { recursive: true });
  const c = spawn(CHROME, [`--remote-debugging-port=${CDP_PORT}`, "--headless=new", "--disable-gpu", "--no-first-run",
    "--no-default-browser-check", "--disable-extensions", `--user-data-dir=${PROFILE}`, "about:blank"], { stdio: "ignore" });
  children.push(c);
}
async function attachCdp(timeoutMs = 40000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const page = (await getJSON("/json")).find((t) => t.type === "page");
      if (page?.webSocketDebuggerUrl) {
        ws = new WebSocket(page.webSocketDebuggerUrl);
        await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
        ws.onmessage = (ev) => {
          const m = JSON.parse(ev.data);
          if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); return; }
          if (m.method === "Runtime.exceptionThrown") consoleErrors.push(String(m.params?.exceptionDetails?.exception?.description || "").slice(0, 160));
          if (m.method === "Runtime.consoleAPICalled" && m.params?.type === "error") consoleErrors.push(String(m.params.args?.[0]?.value || "").slice(0, 160));
          if (m.method === "Network.responseReceived" && String(m.params?.response?.url || "").includes("/api/claim-reward")) claimCalls.push({ status: m.params.response.status, at: Date.now() });
        };
        await send("Page.enable"); await send("Runtime.enable"); await send("Network.enable");
        // ⚠️ headless 기본 뷰포트는 모바일 폭이라 데스크톱 전용 UI(계정 메뉴 등)가 렌더되지 않는다.
        await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
        // 앱 코드보다 먼저 실행돼, 상대경로 /api/* 요청을 실제 wrangler(Pages Function)로 보낸다.
        //  (next dev 는 정적 export 앱이라 /api 라우트가 없다. 엣지 핸들러는 실물 그대로 사용.)
        const shim = "(function(){var of=window.fetch;var API=" + JSON.stringify(API_BASE) + ";"
          + "window.fetch=function(i,init){try{var u=(typeof i==='string')?i:((i&&i.url)||'');"
          + "if(u.indexOf('/api/')===0){return of(API+u,init);}}catch(e){}return of(i,init);};})();";
        await send("Page.addScriptToEvaluateOnNewDocument", { source: shim });
        return true;
      }
    } catch { /* retry */ }
    await sleep(1000);
  }
  return false;
}
async function goto(url, settleMs = 2500) { await send("Page.navigate", { url }); await sleep(settleMs); }
/** 조건이 참이 될 때까지 폴링(임의 sleep 금지). */
async function waitFor(fnExpr, { timeout = 15000, label = "condition" } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const v = await evaljs(fnExpr);
    if (v) return v;
    await sleep(400);
  }
  throw new Error(`waitFor timeout: ${label}`);
}
/** 텍스트로 버튼 찾아 실제 클릭(DOM 이벤트). */
const clickByText = (re) => evaljs(`(()=>{const b=[...document.querySelectorAll('button')].find(x=>/${re}/.test(x.textContent||''));if(!b)return 'notfound';b.scrollIntoView({block:'center'});b.click();return 'clicked';})()`);

async function main() {
  for (const [p, n] of [[WEB_PORT, "web(next dev)"], [API_PORT, "api(wrangler)"], [CDP_PORT, "cdp"]]) {
    if (!(await portFree(p))) { ok(`포트 ${n}:${p} 사용 가능`, false, "이미 점유됨"); return finish(); }
  }

  startWrangler();
  startNextDev();
  if (!(await waitReady())) { ok("next dev + wrangler 기동", false, "타임아웃"); return finish(); }
  ok("next dev(앱) + wrangler pages dev(/api/claim-reward) 기동", true);
  startChrome();
  if (!(await attachCdp())) { ok("Chrome CDP 연결", false); return finish(); }
  ok("Chrome(테스트 전용 프로필) CDP 연결", true);

  const u = await makeUser("ui-a@test.dev");
  await fsSet(`users/${u.uid}`, { doriExp: I(0), cottonCandy: I(0), tier: I(1), level: I(1), name: S("UI테스터") });

  // ── 로그인(dev 전용 seam, 에뮬레이터 dev 런타임에만 존재) ──
  //  next dev 는 첫 요청에서 라우트를 컴파일하므로, seam 이 뜰 때까지 navigate 를 재시도한다.
  let hasSeam = false;
  for (let attempt = 0; attempt < 3 && !hasSeam; attempt += 1) {
    await goto(`${BASE}/my-world`, 4000);
    hasSeam = (await waitFor(`typeof window.__illoTestSignIn === 'function'`, { timeout: 25000, label: "dev seam" }).catch(() => false)) === true;
  }
  ok("에뮬레이터 dev 런타임에 로그인 seam 존재", hasSeam === true);
  if (!hasSeam) { ok("로그인 seam 없이는 이후 시나리오 불가", false, "중단"); return finish(); }
  const signedUid = await evaljs(`window.__illoTestSignIn('${u.email}','${u.password}').then(c=>c.user.uid).catch(e=>'ERR:'+e.code)`);
  ok("Auth 에뮬레이터 사용자로 실제 로그인", signedUid === u.uid, `uid=${String(signedUid).slice(0, 12)}…`);

  // ── My World: 실제 캐릭터 상호작용 버튼 클릭 ──
  //  로그인 세션(IndexedDB persistence)이 새 문서에도 유지되므로 재진입 후 로그인 상태를 확인한다.
  await goto(`${BASE}/my-world`, 6000);
  await waitFor(`typeof window.__illoTestSignIn === 'function'`, { timeout: 20000, label: "seam after reload" }).catch(() => {});
  const loggedIn = await waitFor(
    `(async()=>{const m=await import('/_next/static/chunks/app/my-world/page.js').catch(()=>null);return true})()`,
    { timeout: 5000, label: "page ready" },
  ).catch(() => true);
  await waitFor(`!!document.querySelector('section[aria-labelledby=\\'interaction-heading\\']')`, { timeout: 25000, label: "interaction stage" }).catch(() => {});
  void loggedIn;
  const before = num((await fsGet(`users/${u.uid}`)).doriExp) ?? 0;
  const clicked = await clickByText("쓰다듬기");
  ok("My World '쓰다듬기' 버튼 실제 DOM 클릭", clicked === "clicked", `res=${clicked}`);
  let after = before;
  try {
    await (async () => { const s = Date.now(); while (Date.now() - s < 20000) { after = num((await fsGet(`users/${u.uid}`)).doriExp) ?? 0; if (after > before) return; await sleep(600); } })();
  } catch { /* */ }
  ok("클릭 → /api/claim-reward 호출 발생", claimCalls.length > 0, `calls=${claimCalls.length} statuses=${claimCalls.map((c) => c.status).join(",")}`);
  ok("서버 EXP 가 정책만큼만 증가", after > before && after - before <= 5, `${before}→${after}`);
  // hydrateGameData 는 비동기라 서버 값이 캐시에 반영될 때까지 폴링(임의 sleep 금지).
  const readCache = `(()=>{try{const k=Object.keys(localStorage).find(x=>x.startsWith('dori_game_profile_'));return k?JSON.parse(localStorage.getItem(k)).doriExp:null;}catch(e){return null}})()`;
  let uiExp = null;
  { const s = Date.now(); while (Date.now() - s < 15000) { uiExp = await evaljs(readCache); if (uiExp === after) break; await sleep(700); } }
  ok("UI 캐시가 서버 응답으로 동기화", uiExp === after, `cache=${uiExp} server=${after}`);

  // ── localStorage 조작 → 서버 무효 ──
  await evaljs(`(()=>{const k=Object.keys(localStorage).find(x=>x.startsWith('dori_game_profile_'));if(k){const v=JSON.parse(localStorage.getItem(k));v.doriExp=999999;localStorage.setItem(k,JSON.stringify(v));}return 1})()`);
  const beforeTamper = num((await fsGet(`users/${u.uid}`)).doriExp);
  await clickByText("인사하기");
  await sleep(3000);
  const afterTamper = num((await fsGet(`users/${u.uid}`)).doriExp);
  ok("localStorage EXP 999999 조작 후에도 서버는 base+정책만", afterTamper > beforeTamper && afterTamper - beforeTamper <= 5, `${beforeTamper}→${afterTamper}`);
  // 조작된 캐시는 서버 응답 반영(hydrate) 시 서버 값으로 교정돼야 한다.
  let restored = null;
  { const s = Date.now(); while (Date.now() - s < 15000) { restored = await evaljs(readCache); if (restored === afterTamper) break; await sleep(700); } }
  ok("조작된 캐시가 서버 값으로 복구", restored === afterTamper, `cache=${restored} server=${afterTamper}`);

  // ── 중복 방지: 같은 이벤트 재시도해도 이중지급 없음(원장 기준) ──
  const ops = await fsList(`users/${u.uid}/rewardOperations`);
  const opIds = ops.map((d) => String(d.name).split("/").pop());
  ok("원장에 중복 operationId 없음", new Set(opIds).size === opIds.length, `ops=${opIds.length}`);

  // ── 오프라인 → outbox → online flush(브라우저 컨텍스트) ──
  await send("Network.emulateNetworkConditions", { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
  const beforeOff = num((await fsGet(`users/${u.uid}`)).doriExp);
  await clickByText("쓰다듬기");
  await sleep(2500);
  const queued = await evaljs(`(()=>{const k=Object.keys(localStorage).find(x=>x.startsWith('myworld_reward_outbox_uid_'));try{return k?JSON.parse(localStorage.getItem(k)).length:0}catch(e){return -1}})()`);
  const duringOff = num((await fsGet(`users/${u.uid}`)).doriExp);
  ok("오프라인 클릭 → outbox 적재 + 서버 미반영", queued > 0 && duringOff === beforeOff, `queued=${queued} exp=${duringOff}`);
  await send("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  await evaljs(`window.dispatchEvent(new Event('online'))`);
  let flushed = duringOff;
  { const s = Date.now(); while (Date.now() - s < 20000) { flushed = num((await fsGet(`users/${u.uid}`)).doriExp); if (flushed > duringOff) break; await sleep(700); } }
  ok("online 복귀 → 큐가 정확히 한 번 지급", flushed > duringOff && flushed - duringOff <= 5, `${duringOff}→${flushed}`);
  const emptied = await evaljs(`(()=>{const k=Object.keys(localStorage).find(x=>x.startsWith('myworld_reward_outbox_uid_'));try{return k?JSON.parse(localStorage.getItem(k)).length:0}catch(e){return -1}})()`);
  ok("flush 후 outbox 비워짐", emptied === 0, `left=${emptied}`);

  // ── 계정 전환 격리: A 로그아웃 → B 로그인 시 A 큐가 B 로 가지 않음 ──
  const b = await makeUser("ui-b@test.dev");
  await fsSet(`users/${b.uid}`, { doriExp: I(0), cottonCandy: I(0), tier: I(1), level: I(1), name: S("B") });
  await evaljs(`(async()=>{const m=await import('/_next/static/chunks/main-app.js').catch(()=>null);return 1})()`);
  await evaljs(`window.__illoTestSignIn('${b.email}','${b.password}').then(c=>c.user.uid).catch(e=>'ERR')`);
  await sleep(2500);
  await evaljs(`window.dispatchEvent(new Event('online'))`);
  await sleep(3000);
  const bExp = num((await fsGet(`users/${b.uid}`)).doriExp) ?? 0;
  ok("계정 전환 후 A 큐가 B 에게 지급되지 않음", bExp === 0, `B.doriExp=${bExp}`);

  // ── console/네트워크 위생 ──
  const claimStatuses = claimCalls.map((c) => c.status);
  ok("claim 응답에 5xx 없음", claimStatuses.filter((s) => s >= 500).length === 0, `statuses=${claimStatuses.join(",")}`);
  // ── 나머지 화면 실제 DOM 클릭 시나리오(각각 독립 UID) ──
  await feedPostSection();
  await feedCommentSection();
  await attendanceSection();
  await missionSection();
  await minigameSection();

  // 오프라인 구간에서 의도적으로 발생하는 네트워크 오류와 빈 메시지는 제외.
  const realErrors = consoleErrors.filter((e) => e && e.trim() && !/favicon|ERR_INTERNET_DISCONNECTED|ERR_NETWORK|Failed to fetch|NetworkError|Could not produce class with ID/i.test(e));
  ok("페이지 console error 0(오프라인 구간 네트워크 오류 제외)", realErrors.length === 0, realErrors.slice(0, 2).join(" | "));

  finish();
}

/** 실패 시 안전한 진단 정보만 출력(본문·PII 없음). */
async function diagnose(tag) {
  const url = await evaljs(`location.pathname`);
  const code = await evaljs(`(()=>{const f=window.__illoLastSocialWriteFailure;return f?f.operation+':'+f.code+':'+f.kind:'(none)'})()`);
  const tids = await evaljs(`JSON.stringify([...document.querySelectorAll('[data-testid]')].map(e=>e.getAttribute('data-testid')).slice(0,15))`);
  const notice = await visibleNotice();
  console.log(`  [${tag}] route=${url} safe-error=${code} notice=${notice} testids=${tids}`);
}

// ── 공통 헬퍼 ──────────────────────────────────────────────────────────
/** 새 사용자 + users 문서 초기화 + 브라우저에서 로그인(시나리오 독립성). */
async function freshUser(tag) {
  const user = await makeUser(`ui-${tag}@test.dev`);
  await fsSet(`users/${user.uid}`, { doriExp: I(0), cottonCandy: I(0), tier: I(1), level: I(1), name: S(tag) });
  return user;
}
async function signInBrowser(user) {
  await waitFor(`typeof window.__illoTestSignIn === 'function'`, { timeout: 25000, label: "seam" });
  const uid = await evaljs(`window.__illoTestSignIn(${JSON.stringify(user.email)},${JSON.stringify(user.password)}).then(c=>c.user.uid).catch(e=>'ERR:'+e.code)`);
  return uid === user.uid;
}
const expOf = async (uid) => num((await fsGet(`users/${uid}`)).doriExp) ?? 0;
/** 서버 EXP 가 목표만큼 오를 때까지 폴링. */
async function waitExp(uid, from, timeout = 20000) {
  const s = Date.now();
  let v = from;
  while (Date.now() - s < timeout) { v = await expOf(uid); if (v > from) return v; await sleep(700); }
  return v;
}
/** 최근 claim 요청 개수 스냅샷(시나리오별 증가분 확인용). */
const claimCount = () => claimCalls.length;
/** 특정 rewardType 의 원장 문서를 찾는다. */
async function ledgerFor(uid, prefix) {
  const docs = await fsList(`users/${uid}/rewardOperations`);
  return docs.filter((d) => String(d.name).split("/").pop().startsWith(prefix));
}

/** 실제 키보드 입력 — 문자별 keyDown/char/keyUp 을 보내 React onChange 가 반드시 발화하게 한다.
 *  (DOM value 만 바꾸면 React 제어 상태는 그대로라 제출 시 빈 값으로 처리된다.) */
async function typeInto(selector, text) {
  const focused = await evaljs(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});if(!el)return false;el.scrollIntoView({block:'center'});el.focus();el.click();return document.activeElement===el})()`);
  if (!focused) return { ok: false, reason: "focus-failed" };
  for (const ch of text) {
    await send("Input.dispatchKeyEvent", { type: "keyDown", text: ch, unmodifiedText: ch, key: ch });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key: ch });
  }
  await sleep(700);
  const domLen = await evaljs(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});return el&&el.value?el.value.length:0})()`);
  // React 가 값을 실제로 소유하는지 확인: 리렌더 후에도 값이 남아 있어야 상태가 갱신된 것이다.
  await sleep(400);
  const stableLen = await evaljs(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});return el&&el.value?el.value.length:0})()`);
  return { ok: domLen > 0 && stableLen === domLen, domLen, stableLen };
}

/** 화면에 보이는 오류/안내 문구(본문 아님) — 실패 원인 파악용. */
const visibleNotice = () => evaljs(`(()=>{const els=[...document.querySelectorAll('[role="alert"],[role="status"]')].map(e=>(e.textContent||'').trim()).filter(Boolean);return els.slice(0,3).join(' | ')||'(none)'})()`);

// ── Feed 글 작성: 실제 작성 화면에서 textarea 입력 + '올리기' 클릭 ──
async function feedPostSection() {
  const u = await freshUser("feedpost");
  await goto(`${BASE}/feed`, 5000);
  if (!(await signInBrowser(u))) { ok("feed post: 로그인", false); return; }
  await goto(`${BASE}/feed`, 6000);
  const composer = await waitFor(`!!document.querySelector('[data-testid="feed-post-editor"]')`, { timeout: 25000, label: "composer" }).catch(() => false);
  ok("feed post: 실제 글쓰기 화면(textarea) 렌더", composer === true);
  if (!composer) return;

  const before = await expOf(u.uid);
  const c0 = claimCount();
  // React 제어 컴포넌트에 실제 입력 이벤트를 발생시킨다(값 직접 대입만으로는 state 가 안 바뀜).
  const typed = await typeInto('[data-testid="feed-post-editor"]', "UI E2E auto post");
  ok("feed post: 본문 실제 키보드 입력(React 상태 반영)", typed.ok === true, `dom=${typed.domLen} stable=${typed.stableLen}`);
  const clicked = await evaljs(`(()=>{const b=document.querySelector('[data-testid="feed-post-submit"]');if(!b)return 'notfound';if(b.disabled)return 'disabled';b.scrollIntoView({block:'center'});b.click();return 'clicked';})()`);
  ok("feed post: '올리기' 버튼 실제 클릭", clicked === "clicked", `res=${clicked}`);

  // 성공 시 handlePost 가 본문을 비운다 → 비었으면 addPost=true(저장 성공), 남아있으면 실패/조기반환.
  await sleep(2500);
  const editorAfter = await evaljs(`(()=>{const el=document.querySelector('[data-testid="feed-post-editor"]');return el?el.value.length:-1})()`);
  console.log(`  [feed-post] editor-len-after-submit=${editorAfter} (0=저장성공 경로, >0=실패/조기반환)`);

  // Firestore feed 문서 생성 확인
  let posts = [];
  { const s = Date.now(); while (Date.now() - s < 20000) { posts = await fsList("feed"); if (posts.some((d) => d.fields?.uid?.stringValue === u.uid)) break; await sleep(700); } }
  const mine = posts.find((d) => d.fields?.uid?.stringValue === u.uid);
  const postId = mine ? String(mine.name).split("/").pop() : null;
  ok("feed post: Firestore feed 문서 생성", !!postId, `postId=${postId}`);
  if (!postId) { await diagnose("feed-post"); return; }

  const after = await waitExp(u.uid, before);
  ok("feed post: /api/claim-reward 요청 발생", claimCount() > c0, `+${claimCount() - c0}건`);
  ok("feed post: 서버 EXP 가 정책값(15)만 증가", after - before === 15, `${before}→${after}`);
  const led = await ledgerFor(u.uid, "post_");
  ok("feed post: 원장 sourceId 가 실제 post ID", led.length === 1 && led[0].fields?.sourceId?.stringValue === postId,
    `ledger=${led.length} src=${led[0]?.fields?.sourceId?.stringValue}`);
  ok("feed post: rewardType=community_post", led[0]?.fields?.rewardType?.stringValue === "community_post");

  // 같은 source 재청구(직접 HTTP) → 중복 없음 / 다른 UID 가 청구 → 403
  const dup = await claimAs({ rewardType: "community_post", operationId: `post_${postId}`, sourceId: postId }, u);
  ok("feed post: 같은 source 재청구 → duplicate(추가 지급 없음)", dup.json?.duplicate === true && (await expOf(u.uid)) === after);
  const other = await freshUser("feedpost-other");
  const stolen = await claimAs({ rewardType: "community_post", operationId: `post_${postId}`, sourceId: postId }, other);
  ok("feed post: 다른 UID 가 남의 post 청구 → 403 source_not_owned", stolen.status === 403 && stolen.json?.error === "source_not_owned",
    `status=${stolen.status} err=${stolen.json?.error}`);
}

/** 사용자 토큰으로 엔드포인트 직접 호출(중복·소유권 검증용). */
async function claimAs(body, user) {
  const r = await fetch(`http://${AUTH_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: user.email, password: user.password, returnSecureToken: true }),
  });
  const { idToken } = await r.json();
  const res = await fetch(`${API_BASE}/api/claim-reward`, {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
    body: JSON.stringify(body),
  });
  let json = null; try { json = await res.json(); } catch { /* */ }
  return { status: res.status, json };
}

// ── Feed 댓글: 실제 피드에서 댓글 열기 → 입력 → '등록' 클릭 ──
async function feedCommentSection() {
  const u = await freshUser("feedcmt");
  // 댓글 달 대상 글을 미리 준비(내 글) — 댓글 작성 자체가 이 시나리오의 UI 대상.
  const postId = "uicmtpost1";
  await fsSet(`feed/${postId}`, { uid: S(u.uid), name: S("feedcmt"), text: S("댓글 대상 글"), status: S("published"), visibility: S("public"), likeCount: I(0), commentCount: I(0), createdAt: { timestampValue: new Date().toISOString() } });
  await goto(`${BASE}/feed`, 5000);
  if (!(await signInBrowser(u))) { ok("feed comment: 로그인", false); return; }
  await goto(`${BASE}/feed`, 7000);

  const opened = await evaljs(`(()=>{const b=[...document.querySelectorAll('button')].find(x=>/댓글\\s*\\d+/.test(x.textContent||''));if(!b)return 'notfound';b.scrollIntoView({block:'center'});b.click();return 'clicked';})()`);
  ok("feed comment: 댓글 영역 열기 클릭", opened === "clicked", `res=${opened}`);
  const inputReady = await waitFor(`!!document.querySelector('[data-testid="feed-comment-input"]')`, { timeout: 15000, label: "comment input" }).catch(() => false);
  ok("feed comment: 실제 댓글 입력창 렌더", inputReady === true);
  if (!inputReady) return;

  const before = await expOf(u.uid);
  const c0 = claimCount();
  const typedC = await typeInto('[data-testid="feed-comment-input"]', "UI E2E auto comment");
  ok("feed comment: 댓글 실제 키보드 입력(React 상태 반영)", typedC.ok === true, `dom=${typedC.domLen} stable=${typedC.stableLen}`);
  const clicked = await evaljs(`(()=>{const b=document.querySelector('[data-testid="feed-comment-submit"]');if(!b)return 'notfound';if(b.disabled)return 'disabled';b.scrollIntoView({block:'center'});b.click();return 'clicked';})()`);
  ok("feed comment: '등록' 버튼 실제 클릭", clicked === "clicked", `res=${clicked}`);

  let comments = [];
  { const s = Date.now(); while (Date.now() - s < 20000) { comments = await fsList(`feed/${postId}/comments`); if (comments.length) break; await sleep(700); } }
  const commentId = comments.length ? String(comments[0].name).split("/").pop() : null;
  ok("feed comment: Firestore 댓글 문서 생성", !!commentId, `id=${commentId}`);
  if (!commentId) { await diagnose("feed-comment"); return; }

  const after = await waitExp(u.uid, before);
  ok("feed comment: /api/claim-reward 요청 발생", claimCount() > c0, `+${claimCount() - c0}건`);
  ok("feed comment: 서버 EXP 가 정책값(5)만 증가", after - before === 5, `${before}→${after}`);
  const led = await ledgerFor(u.uid, "comment_");
  ok("feed comment: 원장 sourceId = {postId}__{commentId}", led[0]?.fields?.sourceId?.stringValue === `${postId}__${commentId}`,
    `src=${led[0]?.fields?.sourceId?.stringValue}`);
  const dup = await claimAs({ rewardType: "community_comment", operationId: `comment_${postId}__${commentId}`, sourceId: `${postId}__${commentId}` }, u);
  ok("feed comment: 같은 댓글 재청구 → duplicate", dup.json?.duplicate === true && (await expOf(u.uid)) === after);
  const other = await freshUser("feedcmt-other");
  const stolen = await claimAs({ rewardType: "community_comment", operationId: `comment_${postId}__${commentId}`, sourceId: `${postId}__${commentId}` }, other);
  ok("feed comment: 타인 댓글 청구 → 403 source_not_owned", stolen.status === 403 && stolen.json?.error === "source_not_owned", `status=${stolen.status}`);

  // reload 후 UI 와 서버 상태 일치
  await goto(`${BASE}/feed`, 6000);
  const readCacheC = `(()=>{try{const k=Object.keys(localStorage).find(x=>x.startsWith('dori_game_profile_'));return k?JSON.parse(localStorage.getItem(k)).doriExp:null}catch(e){return null}})()`;
  let cacheExp = null;
  { const s0 = Date.now(); while (Date.now() - s0 < 20000) { cacheExp = await evaljs(readCacheC); if (cacheExp === after) break; await sleep(800); } }
  ok("feed comment: reload 후 UI 캐시 == 서버 EXP", cacheExp === after, `cache=${cacheExp} server=${after}`);
}

// ── 출석: /my 대시보드에서 '출석 체크' 받기 버튼 클릭 ──
async function attendanceSection() {
  const u = await freshUser("attend");
  await goto(`${BASE}/profile`, 5000);
  if (!(await signInBrowser(u))) { ok("attendance: 로그인", false); return; }
  await goto(`${BASE}/profile`, 8000);
  await evaljs(`(()=>{const b=document.querySelector('[data-testid="profile-activity-tab"]');if(b){b.scrollIntoView({block:'center'});b.click();}return !!b})()`);
  await sleep(2500);
  const found = await waitFor(`!!document.querySelector('[data-testid="mission-action-attendance"]')`, { timeout: 30000, label: "attendance button" }).catch(() => false);
  ok("attendance: 대시보드에 출석 미션 렌더", found === true);
  if (!found) { await diagnose("attendance"); return; }

  const before = await expOf(u.uid);
  const c0 = claimCount();
  // '출석 체크' 행 안의 받기 버튼만 클릭(다른 미션 버튼과 혼동 방지).
  const clicked = await evaljs(`(()=>{const b=document.querySelector('[data-testid="mission-action-attendance"]');if(!b)return 'notfound';b.scrollIntoView({block:'center'});b.click();return 'clicked';})()`);
  ok("attendance: 출석 버튼 실제 클릭", clicked === "clicked", `res=${clicked}`);

  const after = await waitExp(u.uid, before);
  ok("attendance: /api/claim-reward(daily_attendance) 요청 발생", claimCount() > c0, `+${claimCount() - c0}건`);
  ok("attendance: 서버 기준 지급됨(EXP 증가)", after > before, `${before}→${after}`);
  const claims = await fsList(`users/${u.uid}/rewardClaims`);
  ok("attendance: rewardClaims 원장 1건(서버 날짜 기준)", claims.length === 1, `claims=${claims.length}`);

  // 재클릭 + reload → 중복 없음
  await evaljs(`(()=>{const b=document.querySelector('[data-testid="mission-action-attendance"]');if(b)b.click();return 1})()`);
  await sleep(3000);
  await goto(`${BASE}/profile`, 7000);
  await evaljs(`(()=>{const b=document.querySelector('[data-testid="profile-activity-tab"]');if(b){b.scrollIntoView({block:'center'});b.click();}return !!b})()`);
  await sleep(2500);
  await sleep(2000);
  ok("attendance: 재클릭·reload 해도 중복 지급 없음", (await expOf(u.uid)) === after && (await fsList(`users/${u.uid}/rewardClaims`)).length === 1,
    `exp=${await expOf(u.uid)} claims=${(await fsList(`users/${u.uid}/rewardClaims`)).length}`);
  // 직접 재청구도 already_claimed
  const again = await claimAs({ rewardType: "daily_attendance" }, u);
  ok("attendance: 같은 날 재청구 → already_claimed", again.json?.status === "already_claimed" || again.json?.status === "legacy_recognized", `st=${again.json?.status}`);
}

// ── 미션: 계정 메뉴의 '로그인 출석체크' 미션 완료 버튼 클릭 ──
async function missionSection() {
  const u = await freshUser("mission");
  await goto(`${BASE}/`, 5000);
  if (!(await signInBrowser(u))) { ok("mission: 로그인", false); return; }
  await goto(`${BASE}/`, 6000);
  // alert() 가 뜨면 CDP 평가가 멈추므로 미리 무력화한다(UI 클릭 자체는 그대로 수행).
  await evaljs(`window.alert=function(){};1`);

  const before = await expOf(u.uid);
  const c0 = claimCount();
  // 계정 메뉴 열기 → 미션 목록의 '출석체크' 완료 버튼 클릭
  const opened = await evaljs(`(()=>{const b=document.querySelector('[data-testid="account-menu"]');if(!b)return 'notfound';b.scrollIntoView({block:'center'});b.click();return 'clicked';})()`);
  await sleep(2000);
  // 미션 목록의 첫 '수행하기' = 로그인 출석체크 미션(mission.id===1)
  const clicked = await evaljs(`(()=>{const b=[...document.querySelectorAll('button')].find(x=>/수행하기/.test(x.textContent||''));if(!b)return 'notfound';b.scrollIntoView({block:'center'});b.click();return 'clicked';})()`);
  ok("mission: 계정 메뉴 미션 UI 접근", opened === "clicked", `menu=${opened}`);
  ok("mission: 미션 완료 버튼 실제 클릭", clicked === "clicked", `res=${clicked}`);
  if (clicked !== "clicked") { await diagnose("mission"); return; }

  const after = await waitExp(u.uid, before);
  ok("mission: /api/claim-reward(mission_complete) 요청 발생", claimCount() > c0, `+${claimCount() - c0}건`);
  ok("mission: 서버 고정 EXP(10) 지급", after - before === 10, `${before}→${after}`);
  const led = await ledgerFor(u.uid, "mission_");
  ok("mission: 원장에 실제 missionId 기록", led.length === 1 && /checkin_/.test(led[0].fields?.sourceId?.stringValue || ""),
    `src=${led[0]?.fields?.sourceId?.stringValue}`);
  const dup = await claimAs({ rewardType: "mission_complete", operationId: led[0]?.fields ? `mission_${led[0].fields.sourceId.stringValue}` : "mission_x", sourceId: led[0]?.fields?.sourceId?.stringValue || "x" }, u);
  ok("mission: 같은 mission 재청구 → duplicate(재지급 없음)", dup.json?.duplicate === true && (await expOf(u.uid)) === after);
}

// ── 미니게임: EmbeddedGame 의 실제 통합 계약(게임 iframe → postMessage {score})으로 보상 트리거 ──
//   ⚠️ 게임 본체는 Unity/iframe 이라 실제 플레이 자동화가 불가능하다. 대신 프로덕션에서 게임이
//      실제로 쓰는 window message 이벤트를 그대로 발생시켜 페이지의 리스너를 구동한다(직접 함수호출 아님).
async function minigameSection() {
  const GAMES = ["boss", "cute2048", "gem"];
  for (const game of GAMES) {
    const u = await freshUser(`mg-${game}`);
    await goto(`${BASE}/minigame/${game}`, 6000);
    if (!(await signInBrowser(u))) { ok(`minigame(${game}): 로그인`, false); continue; }
    await goto(`${BASE}/minigame/${game}`, 8000);
    const mounted = await waitFor(`!!document.querySelector('iframe')`, { timeout: 25000, label: `${game} iframe` }).catch(() => false);
    ok(`minigame(${game}): 실제 게임 화면(iframe) 렌더`, mounted === true);
    if (!mounted) continue;

    const before = await expOf(u.uid);
    const c0 = claimCount();
    // 게임 종료 이벤트(프로덕션 계약과 동일한 postMessage). score 를 크게 조작해도 서버 보상은 고정이어야 한다.
    await evaljs(`window.postMessage({type:'dori-game',event:'gameover',score:999999},window.location.origin);1`);
    const after = await waitExp(u.uid, before);
    ok(`minigame(${game}): 게임 종료 이벤트 → claim 요청 발생`, claimCount() > c0, `+${claimCount() - c0}건`);
    ok(`minigame(${game}): 서버 고정 EXP(5) — score 999999 조작 무효`, after - before === 5, `${before}→${after}`);
    const led = await ledgerFor(u.uid, "minigame_");
    ok(`minigame(${game}): 원장 1건(playtime 소스)`, led.length === 1, `ledger=${led.length} src=${led[0]?.fields?.sourceId?.stringValue}`);
    // 같은 play 재전송 → 중복 없음(클라 일일 게이트 + 서버 멱등)
    await evaljs(`window.postMessage({type:'dori-game',event:'gameover',score:12345},window.location.origin);1`);
    await sleep(3000);
    ok(`minigame(${game}): 같은 날 재플레이 → 중복 지급 없음(daily cap)`, (await expOf(u.uid)) === after, `exp=${await expOf(u.uid)}`);
  }
}

function finish() {
  for (const c of children) {
    try { if (c?.pid) { if (process.platform === "win32") spawn("taskkill", ["/pid", String(c.pid), "/T", "/F"], { stdio: "ignore" }); else c.kill("SIGKILL"); } } catch { /* noop */ }
  }
  try { ws?.close(); } catch { /* noop */ }
  setTimeout(() => {
    try { rmSync(TMP, { recursive: true, force: true }); } catch { /* noop */ }
    if (wroteEnvLocal) { try { rmSync(ENV_LOCAL, { force: true }); } catch { /* noop */ } } // 내가 만든 것만 삭제
    const passed = results.filter((r) => r.ok).length;
    console.log(`\n${passed}/${results.length} UI E2E checks passed`);
    process.exit(passed === results.length ? 0 : 1);
  }, 1200);
}

main().catch((e) => { console.error("UI E2E harness error:", e?.message || e); finish(); });
