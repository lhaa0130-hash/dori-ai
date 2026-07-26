#!/usr/bin/env node
// Firebase Web API 키 동기화 (값 미출력).
//
// Firebase 가 현재 Web App 에 매칭 중인 apiKey 를 읽어, 대상 폴더의 `.env.local` 의
// NEXT_PUBLIC_FIREBASE_API_KEY **한 항목만** 안전하게 추가/갱신한다.
//
// 왜 필요한가 — 2026-07-26 로그인 전면 장애:
//   `.env.local` 에 이 변수가 없어 소스의 하드코딩 기본값으로 빌드돼 왔는데, 키 교체 때 그 키가
//   폐기되며 auth/api-key-expired 로 로그인이 전부 깨졌다. 키가 다시 회전하면 이 스크립트로 맞춘다.
//
// ⚠️ Firebase Web API 키는 **공개 config** 다(클라이언트 번들에 노출되는 게 정상).
//    보안은 Firestore Rules·App Check 가 담당한다. 노출을 이유로 폐기하지 말 것.
//    그래도 로그·diff 오염을 막기 위해 이 스크립트는 값을 절대 출력하지 않는다.
//
// 사용: node scripts/sync-firebase-key.mjs [대상 폴더=.]
// 종료코드: 0 성공 / 1 대상 오류 / 2 Firebase config 조회 실패
import { readFileSync, writeFileSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { execSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";

const target = process.argv[2] || process.cwd();
if (!existsSync(target)) { console.error("대상 폴더가 없습니다:", target); process.exit(1); }

const APP_ID = process.env.FIREBASE_WEB_APP_ID || "1:1023160315279:web:d4de24d8893c7463642ffa";
const PROJECT = process.env.FIREBASE_PROJECT_ID || "dori-ai-0130";
const KEYNAME = "NEXT_PUBLIC_FIREBASE_API_KEY";

// ── Firebase 현재 SDK config → OS 임시파일 → 필요한 필드만 사용 → 즉시 삭제 ──
const tmp = mkdtempSync(path.join(tmpdir(), "fbsync-"));
const cfgFile = path.join(tmp, "c.json");
let apiKey = null;
try {
  execSync(`npx --yes firebase-tools@13 apps:sdkconfig WEB ${APP_ID} --project ${PROJECT} --out ${JSON.stringify(cfgFile)}`,
    { cwd: target, stdio: ["ignore", "pipe", "pipe"] });
  const raw = JSON.parse(readFileSync(cfgFile, "utf8"));
  apiKey = (raw.sdkConfig || raw).apiKey || null;
} catch (e) {
  console.error("Firebase SDK config 조회 실패:", String(e.message).split("\n")[0].slice(0, 100));
  console.error("  → firebase CLI 인증 상태를 확인하세요(firebase login).");
} finally {
  try { rmSync(tmp, { recursive: true, force: true }); } catch { /* noop */ }
}
if (!apiKey) process.exit(2);

const envPath = path.join(target, ".env.local");
let lines = existsSync(envPath) ? readFileSync(envPath, "utf8").split(/\r?\n/) : [];

let replaced = false;
lines = lines.map((l) => {
  if (new RegExp(`^\\s*${KEYNAME}\\s*=`).test(l)) { replaced = true; return `${KEYNAME}=${apiKey}`; }
  return l;
});
if (!replaced) {
  if (lines.length && lines[lines.length - 1] !== "") lines.push("");
  lines.push("# Firebase Web API key — 공개 config(클라이언트 번들에 포함되는 식별자).");
  lines.push("# 보안은 Firestore Rules·App Check 담당. 서버 비밀(SA·OpenAI 등)과 등급이 다르다.");
  lines.push(`${KEYNAME}=${apiKey}`);
  lines.push("");
}
writeFileSync(envPath, lines.join("\n"), "utf8");

console.log(replaced ? "기존 항목 갱신 완료" : "신규 항목 추가 완료");
console.log("대상:", envPath);
console.log("⚠️ 키 값은 출력하지 않았습니다. 다른 항목은 그대로 보존했습니다.");
console.log("다음: npm run build → node scripts/verify-firebase-config.mjs out");
