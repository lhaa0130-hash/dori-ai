// 소스에 섞인 원시 제어 바이트를 JS 이스케이프 시퀀스 텍스트로 치환한다(감사 도구).
//
// ⚠️ 왜 필요한가 — 원시 NUL(0x00)이 소스에 들어가면 git 이 그 파일을 **binary 로 취급**해
//    diff·코드리뷰·grep 이 전부 무력화된다. 적대적 테스트에서 "제어문자 본문"을 검사하려다
//    실수로 원시 바이트를 넣기 쉬우므로, 이스케이프 시퀀스 텍스트로 바꿔 소스를 텍스트로 유지한다.
//    문자열 리터럴 안에서 "\u0000" 과 실제 NUL 은 런타임 의미가 같으니 테스트 의도는 보존된다.
//
// ⚠️ 이 파일 자체는 제어문자를 **문자 코드로만** 다룬다(정규식 리터럴에 원시 바이트를 두지 않는다).
// 사용: node scripts/audit-escape-control-chars.mjs <파일...>
import { readFileSync, writeFileSync } from "node:fs";

/** 소스에 있어서는 안 되는 제어 코드: TAB(9)·LF(10)·CR(13) 을 제외한 0x00–0x1F */
function isBadControl(code) {
  if (code === 9 || code === 10 || code === 13) return false;
  return code < 0x20;
}

export function escapeControls(src) {
  let out = "";
  let n = 0;
  for (let i = 0; i < src.length; i++) {
    const code = src.charCodeAt(i);
    if (isBadControl(code)) {
      out += "\\u" + code.toString(16).padStart(4, "0");
      n++;
    } else {
      out += src[i];
    }
  }
  return { out, n };
}

export function countControls(src) {
  let n = 0;
  for (let i = 0; i < src.length; i++) if (isBadControl(src.charCodeAt(i))) n++;
  return n;
}

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("사용: node scripts/audit-escape-control-chars.mjs <파일...>");
  process.exit(2);
}

let total = 0;
for (const f of files) {
  // latin1 로 읽고 쓰면 바이트가 그대로 보존된다(UTF-8 한글도 안전하게 왕복).
  const before = readFileSync(f, "latin1");
  const { out, n } = escapeControls(before);
  if (n === 0) { console.log(`  ${f}: 원시 제어문자 0개 (변경 없음)`); continue; }
  writeFileSync(f, out, "latin1");
  const left = countControls(readFileSync(f, "latin1"));
  console.log(`  ${f}: ${n}개 치환 → 잔존 ${left}개`);
  total += n;
}
console.log(`  합계 ${total}개 치환`);
