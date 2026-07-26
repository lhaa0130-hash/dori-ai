#!/usr/bin/env node
// 배포 전 Firebase 공개 config 계약 검증 (값 미출력).
//
// 2026-07-26 로그인 전면 장애 재발 방지:
//   라이브가 폐기된 Web API 키를 싣고 배포돼 auth/api-key-expired 로 로그인이 전부 깨졌다.
//   이 스크립트는 build 산출물(out/)이 **Firebase 가 현재 매칭 중인 키**를 담고 있는지
//   배포 전에 확인한다. 키 값·길이·해시는 절대 출력하지 않는다.
//
// 사용: node scripts/verify-firebase-config.mjs [out 디렉터리]
// 종료코드: 0 정상 / 1 불일치·누락 / 2 확인 불가(Firebase CLI 미인증 등)
import { readFileSync, existsSync, readdirSync, statSync, mkdtempSync, rmSync } from "node:fs";
import { createHash } from "node:crypto";
import { execSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";

const OUT = process.argv[2] || "out";
const APP_ID = process.env.FIREBASE_WEB_APP_ID || "1:1023160315279:web:d4de24d8893c7463642ffa";
const PROJECT = process.env.FIREBASE_PROJECT_ID || "dori-ai-0130";
const KEY_RE = /AIza[0-9A-Za-z_-]{35}/g;

const fp = (k) => (k ? createHash("sha256").update(k).digest("hex") : null);
const fail = (m) => { console.error("❌ " + m); process.exit(1); };
const skip = (m) => { console.error("⚠️  " + m); process.exit(2); };

function collect(dir, out = new Set(), depth = 0) {
  if (depth > 12 || !existsSync(dir)) return out;
  for (const e of readdirSync(dir)) {
    const p = path.join(dir, e);
    let s; try { s = statSync(p); } catch { continue; }
    if (s.isDirectory()) collect(p, out, depth + 1);
    else if (/\.(js|html|json|txt)$/i.test(e) && s.size < 20 * 1024 * 1024) {
      let t; try { t = readFileSync(p, "utf8"); } catch { continue; }
      for (const m of t.match(KEY_RE) || []) out.add(m);
    }
  }
  return out;
}

if (!existsSync(OUT)) skip(`빌드 산출물이 없습니다: ${OUT} (먼저 npm run build)`);

// ① Firebase 가 현재 매칭 중인 Web App config 를 가져온다(임시파일 → 즉시 삭제).
const tmp = mkdtempSync(path.join(tmpdir(), "fbverify-"));
const cfgFile = path.join(tmp, "c.json");
let current = null, cfg = null;
try {
  execSync(`npx --yes firebase-tools@13 apps:sdkconfig WEB ${APP_ID} --project ${PROJECT} --out ${JSON.stringify(cfgFile)}`,
    { stdio: ["ignore", "pipe", "pipe"] });
  const raw = JSON.parse(readFileSync(cfgFile, "utf8"));
  cfg = raw.sdkConfig || raw;
  current = cfg.apiKey;
} catch {
  rmSync(tmp, { recursive: true, force: true });
  skip("Firebase SDK config 를 읽지 못했습니다(CLI 미인증?). 배포 전 수동 확인이 필요합니다.");
}
rmSync(tmp, { recursive: true, force: true });

// ② 식별자 계약
if (cfg.projectId !== PROJECT) fail(`projectId 불일치: 기대 ${PROJECT}`);
if (cfg.appId !== APP_ID) fail("appId 불일치");
if (!cfg.authDomain) fail("authDomain 없음");
if (!current) fail("Firebase Web App 에 apiKey 가 없습니다");

// ③ 빌드 산출물의 키가 현재 키와 같은가
const keys = [...collect(OUT)];
if (keys.length === 0) fail(`${OUT} 에서 Firebase Web API 키를 찾지 못했습니다(빌드 누락?)`);
const hasCurrent = keys.some((k) => fp(k) === fp(current));
const stale = keys.filter((k) => fp(k) !== fp(current));

console.log("Firebase config 계약 검증(값 미출력)");
console.log("  projectId / appId / authDomain :", "OK");
console.log("  산출물 내 키 종류 수           :", keys.length);
console.log("  현재 Web App 키 포함           :", hasCurrent ? "YES" : "NO");
console.log("  현재 키가 아닌 키 잔존         :", stale.length);

if (!hasCurrent) fail("빌드 산출물이 Firebase 현재 Web App 키를 담고 있지 않습니다. .env.local 의 NEXT_PUBLIC_FIREBASE_API_KEY 를 동기화하고 재빌드하세요.");
if (stale.length > 0) fail(`현재 키가 아닌 Firebase형 키가 ${stale.length}종 남아 있습니다(폐기 키 잔존 가능).`);

console.log("✅ 통과 — 배포해도 로그인이 깨지지 않습니다.");
