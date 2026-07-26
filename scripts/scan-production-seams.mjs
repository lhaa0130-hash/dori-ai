#!/usr/bin/env node
// production 산출물에 테스트 seam·에뮬레이터 연결·임시 스텁이 섞여 들어갔는지 검사한다.
//
// 왜 필요한가: 상태를 재현하려고 소스에 seam 을 넣으면 그대로 배포된다.
// 이 스캐너는 **빌드 산출물(out/)과 소스 양쪽**을 훑어 금지 토큰을 찾는다.
// 네트워크·비밀값에 의존하지 않는다.
//
// 사용법:  node scripts/scan-production-seams.mjs [--out-only]
// 종료 코드: 0 = 통과, 1 = 위반 발견
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";

// Windows 경로에는 공백이 %20 으로 인코딩되므로 URL.pathname 을 그대로 쓰면 안 된다.
const ROOT = fileURLToPath(new URL("..", import.meta.url));

/**
 * 어디에도 있으면 안 되는 토큰. **실제 식별자만** 넣는다 —
 * SDK 가 export 하는 함수 이름은 호출되지 않아도 벤더 청크 문자열로 남으므로
 * 그것만으로는 seam 이 아니다(오탐이 생기면 스캐너를 아무도 신뢰하지 않는다).
 */
const FORBIDDEN = [
  { re: /__illoTest/, why: "전역 테스트 훅이 남았다" },
  { re: /TEMP-VISUAL-STUB/, why: "캡처용 임시 스텁이 되돌려지지 않았다" },
  { re: /NEXT_PUBLIC_USE_FIREBASE_EMULATOR\s*[:=]\s*["']?true/, why: "에뮬레이터 강제 활성화가 남았다" },
  { re: /demo-illo-myworld/, why: "테스트 전용 Firebase 프로젝트 id 가 남았다" },
  { re: /localhost:(9099|8080)/, why: "에뮬레이터 호스트가 하드코딩됐다" },
  { re: /127\.0\.0\.1:(9099|8080)/, why: "에뮬레이터 호스트가 하드코딩됐다" },
  { re: /mock(Credential|Token|IdToken)/i, why: "mock 자격증명이 남았다" },
  { re: /[?&](mwTest|testState|illoTest)=/, why: "URL 로 상태를 강제하는 seam 이 남았다" },
];

/**
 * 에뮬레이터 **연결 호출**은 검토된 한 곳(lib/firebase.ts)만 허용한다.
 *  · 그 파일의 seam 은 `process.env.NODE_ENV !== "production"` 을 인라인 비교해
 *    production 빌드에서 블록째 제거된다(실측: out/ 에 `__illoTestSignIn` 0건).
 *  · 다른 곳에서 새로 연결하면 그 게이트가 없을 수 있으므로 실패시킨다.
 */
const EMULATOR_CALL = { re: /connect(Auth|Firestore)Emulator\s*\(/, why: "검토되지 않은 에뮬레이터 연결 호출" };

/**
 * 검토된 예외 — 파일 하나만, 이유를 남긴다.
 *  · `lib/firebase.ts` 는 인증 경계 파일이며 보안 트랙이 소유한다(이 작업에서 수정하지 않는다).
 *    dev 전용 로그인 seam(`__illoTestSignIn`)이 있으나 `process.env.NODE_ENV !== "production"` 을
 *    **인라인 비교**해 production 빌드에서 블록째 제거된다.
 *    그 보장은 out/ 스캔이 직접 확인한다(out/ 에는 예외를 적용하지 않는다).
 */
const SOURCE_ALLOWLIST = [
  {
    endsWith: ["lib\\firebase.ts", "lib/firebase.ts"],
    tokens: ["__illoTest", "connect(Auth|Firestore)Emulator"],
  },
];

/** 벤더 청크는 SDK 가 함수를 **정의**하기만 해도 매치된다 — 실제 연결은 호스트가 있어야 성립한다. */
const EMULATOR_HOST_HINT = /(localhost|127\.0\.0\.1):(9099|8080)/;

const TEXT_EXT = new Set([".js", ".mjs", ".cjs", ".ts", ".tsx", ".html", ".json", ".css", ".map"]);
const SKIP_DIR = new Set(["node_modules", ".git", ".next", "_자산검토"]);

function walk(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    if (SKIP_DIR.has(name)) continue;
    const p = join(dir, name);
    let st;
    try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) walk(p, acc);
    else if (TEXT_EXT.has(extname(name))) acc.push(p);
  }
  return acc;
}

function scan(files, rules, label) {
  const hits = [];
  for (const f of files) {
    let text;
    try { text = readFileSync(f, "utf8"); } catch { continue; }
    // out/ 에는 예외를 적용하지 않는다 — 배포 산출물은 무조건 깨끗해야 한다.
    const allow = label === "src" ? SOURCE_ALLOWLIST.find((a) => a.endsWith.some((e) => f.endsWith(e))) : undefined;
    const active = rules.filter((r) => !allow?.tokens.some((t) => r.re.source.includes(t)));
    for (const rule of active) {
      // 에뮬레이터 연결은 호스트가 함께 있어야 실제 연결이다(벤더 청크의 함수 정의 오탐 제거).
      if (rule === EMULATOR_CALL && !EMULATOR_HOST_HINT.test(text)) continue;
      const m = rule.re.exec(text);
      if (m) {
        const line = text.slice(0, m.index).split("\n").length;
        hits.push({ file: f.replace(ROOT, ""), line, token: m[0].slice(0, 60), why: rule.why, label });
      }
    }
  }
  return hits;
}

const outOnly = process.argv.includes("--out-only");
const rules = [...FORBIDDEN, EMULATOR_CALL];

// out/ 은 이 저장소에서 커밋되는 배포 산출물이다 — 여기 seam 이 있으면 곧 배포된다.
const outFiles = walk(join(ROOT, "out"));
let hits = scan(outFiles, rules, "out/");

let srcCount = 0;
if (!outOnly) {
  const srcFiles = ["app", "components", "contexts", "hooks", "lib"].flatMap((d) => walk(join(ROOT, d)));
  srcCount = srcFiles.length;
  hits = hits.concat(scan(srcFiles, rules, "src"));
}

console.log(`[seam-scan] out/ ${outFiles.length}개${outOnly ? "" : ` + 소스 ${srcCount}개`} 검사`);
if (hits.length === 0) {
  console.log("[seam-scan] PASS — 금지 토큰 0건");
  process.exit(0);
}
console.error(`[seam-scan] FAIL — ${hits.length}건`);
for (const h of hits) console.error(`  ${h.label} ${h.file}:${h.line}  "${h.token}"  ← ${h.why}`);
process.exit(1);
