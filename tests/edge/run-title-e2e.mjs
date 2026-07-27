// POST /api/profile/title 계약 E2E (로컬 Edge 전용, 05-09).
// ⚠️ Production 요청 0건.
import { spawn, execSync } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync, symlinkSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const PROJECT = "demo-illo-myworld";
const FS_HOST = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";
const AUTH_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";
const REPO = path.resolve(fileURLToPath(new URL("../../", import.meta.url)));
const TMP = path.join(REPO, ".wrangler-tmp", "title-" + process.pid);
const PORT = 8823;

const results = [];
let group = "";
const G = (g) => { group = g; console.log(`\n── ${g} ──`); };
const ok = (n, c, d = "") => { results.push({ group, n, ok: !!c }); console.log(`${c ? "PASS" : "FAIL"}  ${n}${d ? "  — " + d : ""}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const fsUrl = (p) => `http://${FS_HOST}/v1/projects/${PROJECT}/databases/(default)/documents/${p}`;
const OWNER = { Authorization: "Bearer owner", "Content-Type": "application/json" };
const I = (v) => ({ integerValue: String(v) });
const S = (v) => ({ stringValue: String(v) });
async function fsSet(rel, fields) { await fetch(fsUrl(rel), { method: "PATCH", headers: OWNER, body: JSON.stringify({ fields }) }); }
async function fsPatch(rel, fields) {
  const mask = Object.keys(fields).map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join("&");
  await fetch(`${fsUrl(rel)}?${mask}`, { method: "PATCH", headers: OWNER, body: JSON.stringify({ fields }) });
}
async function fsGet(rel) { const r = await fetch(fsUrl(rel), { headers: OWNER }); return r.ok ? (await r.json()).fields || {} : null; }
async function fsList(rel) { const r = await fetch(fsUrl(rel) + "?pageSize=100", { headers: OWNER }); if (!r.ok) return []; return ((await r.json()).documents || []); }

let seq = 0;
async function seedUser(ownedKeys = []) {
  const r = await fetch(`http://${AUTH_HOST}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: `ti-${Date.now()}-${seq++}@t.dev`, password: "test1234", returnSecureToken: true }),
  });
  const j = await r.json();
  const fields = { uid: S(j.localId), name: S("t"), doriExp: I(0), cottonCandy: I(0), tier: I(1), level: I(1) };
  if (ownedKeys.length) fields.ownedItems = { arrayValue: { values: ownedKeys.map((k) => S(k)) } };
  await fsSet(`users/${j.localId}`, fields);
  return { uid: j.localId, idToken: j.idToken };
}
async function call(body, token, method = "POST") {
  try {
    const r = await fetch(`http://127.0.0.1:${PORT}/api/profile/title`, {
      method,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : (typeof body === "string" ? body : JSON.stringify(body)),
    });
    const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch { /* noop */ }
    return { status: r.status, json: j, text: t };
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
    try { if ((await fetch(`http://127.0.0.1:${PORT}/api/profile/title`, { method: "OPTIONS" })).status === 204) return true; } catch { /* noop */ }
    await sleep(1500);
  }
  return false;
}

let TITLES, itemKeyFn, PAID, PAID2, OTHER;
const op = (s) => `title_${s}`;

async function main() {
  killPort(PORT);
  start();
  if (!await waitPort()) { ok("wrangler 기동", false, "타임아웃"); return finish(); }
  ok("wrangler 기동 + OPTIONS 204", true);

  const shop = await import("../../lib/shopItems.ts");
  itemKeyFn = shop.itemKey;
  TITLES = shop.SHOP_ITEMS.filter((i) => i.slot === "title");
  PAID = TITLES[0]; PAID2 = TITLES[1];
  OTHER = shop.SHOP_ITEMS.find((i) => i.slot === "bg" && i.price > 0);
  const K = (i) => itemKeyFn(i.slot, i.id);

  // ── HTTP 계층 ───────────────────────────────────────────────────────
  G("1. HTTP 계층");
  for (const m of ["GET", "PUT", "PATCH", "DELETE", "HEAD"]) {
    ok(`${m} → 405`, (await call(undefined, null, m)).status === 405);
  }
  for (const [n, b] of [["빈 body", ""], ["잘못된 JSON", "{bad"], ["배열", "[]"], ["문자열", '"x"'], ["null", "null"], ["숫자", "1"]]) {
    const r = await call(b, null);
    ok(`${n} → 400`, r.status === 400, `got ${r.status}`);
  }
  const big = await call({ mode: "custom", customTitle: "x".repeat(5000), operationId: op("big0001") }, null);
  ok("과대 body → 400", big.status === 400);

  // ── 인증 ────────────────────────────────────────────────────────────
  G("2. 인증");
  const good = { mode: "none", operationId: op("auth0001") };
  ok("토큰 없음 → 401", (await call(good, null)).status === 401);
  ok("JWT 아님 → 401", (await call(good, "not.a.jwt")).status === 401);
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const fake = (over = {}) => `${b64({ alg: "none" })}.${b64({ user_id: "fake-uid-0001", aud: PROJECT, iss: `https://securetoken.google.com/${PROJECT}`, exp: Math.floor(Date.now() / 1000) + 600, ...over })}.s`;
  ok("만료 토큰 → 401", (await call(good, fake({ exp: Math.floor(Date.now() / 1000) - 10 }))).status === 401);
  ok("잘못된 aud → 401", (await call(good, fake({ aud: "other" }))).status === 401);
  ok("잘못된 iss → 401", (await call(good, fake({ iss: "https://evil/x" }))).status === 401);
  ok("서명 없는 위조 토큰 → 2xx 아님", (await call(good, fake())).status !== 200);

  // ── 필드 계약 ───────────────────────────────────────────────────────
  G("3. 필드 계약");
  const u = await seedUser();
  for (const [n, extra] of [
    ["uid 주입", { uid: "x" }], ["email 주입", { email: "a@b.c" }], ["ownedItems 주입", { ownedItems: ["title::x"] }],
    ["isPremium 주입", { isPremium: true }], ["rarity 주입", { rarity: "legend" }], ["style 주입", { style: "x" }],
    ["title 주입", { title: "x" }], ["titleMode 주입", { titleMode: "catalog" }],
  ]) {
    const r = await call({ mode: "none", operationId: op("fld0001"), ...extra }, u.idToken);
    ok(`${n} → 400 forbidden_field`, r.status === 400 && String(r.json?.detail || "").startsWith("forbidden_field:"), `got ${r.status}/${r.json?.detail}`);
  }
  ok("예상 밖 필드 → 400", (await call({ mode: "none", operationId: op("fld0002"), note: 1 }, u.idToken)).json?.detail?.startsWith("unexpected_field:"));
  ok("operationId 형식 위반 → 400", (await call({ mode: "none", operationId: "nope" }, u.idToken)).json?.detail === "invalid_operation_id");
  ok("잘못된 mode → 400", (await call({ mode: "admin", operationId: op("md000001") }, u.idToken)).json?.detail === "invalid_mode");
  ok("catalog 인데 customTitle 동봉 → 400", (await call({ mode: "catalog", titleId: K(PAID), customTitle: "x", operationId: op("md000002") }, u.idToken)).status === 400);
  ok("custom 인데 titleId 동봉 → 400", (await call({ mode: "custom", customTitle: "x", titleId: K(PAID), operationId: op("md000003") }, u.idToken)).status === 400);
  ok("none 인데 값 동봉 → 400", (await call({ mode: "none", titleId: K(PAID), operationId: op("md000004") }, u.idToken)).status === 400);

  // ── catalog 소유 검증 ───────────────────────────────────────────────
  G("4. catalog 소유 검증");
  ok("★미소유 titleId → 403 title_not_owned",
    (await call({ mode: "catalog", titleId: K(PAID), operationId: op("cat00001") }, u.idToken)).json?.error === "title_not_owned");
  ok("존재하지 않는 titleId → 400 unknown_title_item",
    (await call({ mode: "catalog", titleId: "title::nope", operationId: op("cat00002") }, u.idToken)).json?.detail === "unknown_title_item");
  ok("다른 카테고리 itemKey → 400",
    (await call({ mode: "catalog", titleId: itemKeyFn(OTHER.slot, OTHER.id), operationId: op("cat00003") }, u.idToken)).json?.detail === "unknown_title_item");

  const owner = await seedUser([K(PAID)]);
  const okCat = await call({ mode: "catalog", titleId: K(PAID), operationId: op("cat00010") }, owner.idToken);
  ok("★보유한 titleId → 200", okCat.status === 200 && okCat.json?.ok === true, `got ${okCat.status}/${okCat.json?.error}`);
  {
    const d = await fsGet(`users/${owner.uid}`);
    ok("titleMode=catalog 저장", d.titleMode?.stringValue === "catalog");
    ok("titleId 저장", d.titleId?.stringValue === K(PAID));
    ok("★legacy title 이 **서버 카탈로그 문자열**로 동기화", d.title?.stringValue === PAID.text, `got ${d.title?.stringValue}`);
    ok("customTitle 은 비워진다", d.customTitle?.stringValue === "");
  }
  ok("보유하지 않은 다른 titleId 는 여전히 403",
    (await call({ mode: "catalog", titleId: K(PAID2), operationId: op("cat00011") }, owner.idToken)).json?.error === "title_not_owned");

  // ── custom 정규화 ───────────────────────────────────────────────────
  G("5. custom 정규화");
  const c1 = await call({ mode: "custom", customTitle: "  내 칭호  ", operationId: op("cus00001") }, u.idToken);
  ok("앞뒤 공백 제거되어 저장", c1.status === 200 && c1.json?.title === "내 칭호", `got "${c1.json?.title}"`);
  ok("빈 문자열 → 400", (await call({ mode: "custom", customTitle: "", operationId: op("cus00002") }, u.idToken)).status === 400);
  ok("공백만 → 400", (await call({ mode: "custom", customTitle: "   ", operationId: op("cus00003") }, u.idToken)).json?.detail === "empty_custom_title");
  const long = await call({ mode: "custom", customTitle: "가".repeat(24), operationId: op("cus00004") }, u.idToken);
  ok("한글 24자 → 200 (바이트가 아니라 코드포인트 기준)", long.status === 200 && [...(long.json?.title || "")].length === 24, `len=${[...(long.json?.title || "")].length}`);
  const over = await call({ mode: "custom", customTitle: "가".repeat(40), operationId: op("cus00005") }, u.idToken);
  ok("40자 → 24자로 절단", over.status === 200 && [...(over.json?.title || "")].length === 24);
  const ctrl = await call({ mode: "custom", customTitle: "a\u0000b​c‮d", operationId: op("cus00006") }, u.idToken);
  ok("제어문자·zero-width·bidi 제거", ctrl.status === 200 && ctrl.json?.title === "abcd", `got "${ctrl.json?.title}"`);
  ok("숫자 customTitle → 400", (await call({ mode: "custom", customTitle: 123, operationId: op("cus00007") }, u.idToken)).status === 400);

  G("6. ★유료 문구를 custom 으로 저장해도 catalog 로 승격되지 않는다");
  {
    const v = await seedUser();
    const r = await call({ mode: "custom", customTitle: PAID.text, operationId: op("dup00001") }, v.idToken);
    ok("동일 문구 custom 저장은 허용된다(제품 결정)", r.status === 200);
    const d = await fsGet(`users/${v.uid}`);
    ok("★titleMode 는 custom 으로 남는다", d.titleMode?.stringValue === "custom", `got ${d.titleMode?.stringValue}`);
    ok("★titleId 는 비어 있다(rarity 근거 없음)", d.titleId?.stringValue === "");
    const { resolveProfileTitle } = await import("../../lib/titleAuthority.ts");
    const res = resolveProfileTitle({ titleMode: "custom", customTitle: PAID.text, ownedItems: [] });
    ok("★resolver 가 rarity 를 주지 않는다", res.rarity === null && res.isVerifiedCatalog === false);
  }

  // ── none / 멱등 / 동시성 ────────────────────────────────────────────
  G("7. none · 멱등 · 동시성");
  {
    const v = await seedUser([K(PAID)]);
    await call({ mode: "catalog", titleId: K(PAID), operationId: op("non00001") }, v.idToken);
    const r = await call({ mode: "none", operationId: op("non00002") }, v.idToken);
    ok("none → 200, 전부 비워짐", r.status === 200);
    const d = await fsGet(`users/${v.uid}`);
    ok("none 후 title/titleId/customTitle 모두 빈 문자열",
      d.title?.stringValue === "" && d.titleId?.stringValue === "" && d.customTitle?.stringValue === "");
  }
  {
    const v = await seedUser();
    const body = { mode: "custom", customTitle: "멱등 칭호", operationId: op("idm00001") };
    const a = await call(body, v.idToken);
    const b = await call(body, v.idToken);
    ok("같은 operationId 재요청 → duplicate", a.json?.duplicate === false && b.json?.duplicate === true);
    const ops = await fsList(`users/${v.uid}/titleOps`);
    ok("원장 1건", ops.length === 1, `got ${ops.length}`);
    const many = await Promise.all(Array.from({ length: 5 }, () => call(body, v.idToken)));
    ok("동시 5회 → 5xx 없음", many.every((x) => x.status < 500), many.map((x) => x.status).join(","));
    ok("동시 후에도 원장 1건", (await fsList(`users/${v.uid}/titleOps`)).length === 1);
  }
  {
    const v = await seedUser();
    const r = await Promise.all([
      call({ mode: "custom", customTitle: "A", operationId: op("cnc00001") }, v.idToken),
      call({ mode: "custom", customTitle: "B", operationId: op("cnc00002") }, v.idToken),
    ]);
    ok("서로 다른 operationId 동시 → 5xx 없음", r.every((x) => x.status < 500), r.map((x) => x.status).join(","));
    const d = await fsGet(`users/${v.uid}`);
    ok("최종 값이 둘 중 하나로 확정", ["A", "B"].includes(d.title?.stringValue), `got ${d.title?.stringValue}`);
  }

  // ── legacy 사용자 ───────────────────────────────────────────────────
  G("8. legacy 문서");
  {
    const v = await seedUser([K(PAID)]);
    await fsPatch(`users/${v.uid}`, { title: S(PAID.text) });   // 신규 필드 없이 legacy 만
    const { resolveProfileTitle } = await import("../../lib/titleAuthority.ts");
    const before = resolveProfileTitle({ title: PAID.text, ownedItems: [K(PAID)] });
    ok("legacy + 소유 → catalog 로 해석(정상 구매자 유지)", before.isVerifiedCatalog === true && before.rarity === PAID.rarity);
    const r = await call({ mode: "catalog", titleId: K(PAID), operationId: op("lgc00001") }, v.idToken);
    ok("legacy 사용자가 저장하면 신규 스키마로 자연 전환", r.status === 200);
    const d = await fsGet(`users/${v.uid}`);
    ok("전환 후 titleMode=catalog", d.titleMode?.stringValue === "catalog");
  }
  {
    const v = await seedUser();
    await fsPatch(`users/${v.uid}`, { title: S(PAID.text) });   // 미소유 복제 상태
    const { resolveProfileTitle } = await import("../../lib/titleAuthority.ts");
    const res = resolveProfileTitle({ title: PAID.text, ownedItems: [] });
    ok("★legacy 복제 문자열은 rarity 를 얻지 못한다", res.rarity === null && res.isVerifiedCatalog === false);
    ok("표시는 유지된다(기존 값을 지우지 않는다)", res.text.length > 0);
  }

  // ── 사용자 문서 없음 / 유출 ─────────────────────────────────────────
  G("9. 예외·유출");
  {
    const r = await fetch(`http://${AUTH_HOST}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: `ghost-${Date.now()}@t.dev`, password: "test1234", returnSecureToken: true }),
    });
    const g = await r.json();
    ok("사용자 문서 없음 → 404", (await call({ mode: "none", operationId: op("gho00001") }, g.idToken)).status === 404);
  }
  {
    const probes = [
      await call("{bad", null),
      await call({ mode: "none", operationId: op("lk000001") }, null),
      await call({ mode: "catalog", titleId: "title::nope", operationId: op("lk000002") }, u.idToken),
    ];
    const BAD = [/at\s+\w+\s+\(.*:\d+:\d+\)/, /[A-Z]:\\\\?Users/, /AIza[0-9A-Za-z_-]{20,}/, /iam\.gserviceaccount\.com/, /eyJ[A-Za-z0-9_-]{20,}\./];
    ok("오류 응답에 stack·경로·키·토큰 유출 0", probes.every((p) => !BAD.some((re) => re.test(p.text || ""))));
    ok("오류 응답이 512바이트 미만", probes.every((p) => (p.text || "").length < 512));
  }

  finish();
}

function finish() {
  for (const c of children) { try { c.kill("SIGKILL"); } catch { /* noop */ } }
  killPort(PORT);
  const pass = results.filter((r) => r.ok).length;
  const fail = results.filter((r) => !r.ok);
  console.log(`\n════════ 칭호 endpoint 결과: ${pass}/${results.length} ════════`);
  for (const f of fail) console.log(`  · [${f.group}] ${f.n}`);
  try { rmSync(TMP, { recursive: true, force: true }); } catch { /* noop */ }
  process.exit(fail.length ? 1 : 0);
}
main().catch((e) => { console.error("FATAL", e?.message || e); finish(); });
