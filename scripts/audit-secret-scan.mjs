// 비밀정보·seam 스캔 (감사 전용).
// ⚠️ 어떤 경우에도 매칭된 **값**을 출력하지 않는다. 파일 경로·패턴 이름·개수만 출력한다.
// 사용: node scripts/audit-secret-scan.mjs [경로...]
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();
const targets = process.argv.slice(2);
const SKIP = new Set(["node_modules", ".git", ".claude", "coverage"]);

// 패턴은 "이름"만 보고하고 매치 문자열은 절대 출력하지 않는다.
const PATTERNS = [
  ["github_pat", /\b(ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{50,})\b/],
  ["openai_key", /\bsk-(proj-)?[A-Za-z0-9_-]{30,}\b/],
  ["google_api_key", /\bAIza[0-9A-Za-z_-]{30,}\b/],
  ["fal_key", /\bfal-[A-Za-z0-9_-]{20,}\b/],
  ["telegram_token", /\b\d{8,12}:[A-Za-z0-9_-]{30,}\b/],
  ["private_key_marker", /-----BEGIN (RSA |EC )?PRIVATE KEY-----/],
  ["service_account_json", /"type"\s*:\s*"service_account"/],
  ["gcp_client_email", /[A-Za-z0-9._-]+@[a-z0-9-]+\.iam\.gserviceaccount\.com/],
  ["authorization_header_literal", /Authorization"?\s*:\s*"(Bearer|Basic)\s+[A-Za-z0-9._-]{20,}/],
  ["aws_key", /\bAKIA[0-9A-Z]{16}\b/],
  ["slack_token", /\bxox[baprs]-[A-Za-z0-9-]{10,}/],
];

// 배포 산출물에 있으면 안 되는 seam
const SEAMS = [
  ["emulator_connect", /connect(Firestore|Auth|Functions)Emulator|9099|8080\b/],
  ["demo_project", /\bdemo-[a-z0-9-]{3,}\b/],
  ["localhost_endpoint", /https?:\/\/(localhost|127\.0\.0\.1)[:/]/],
  ["test_signin_seam", /__TEST_SIGN_IN__|signInWithCustomToken\s*\(|REWARD_TEST_UIDS/],
  ["admin_allowlist", /REWARD_ADMIN_UIDS|ARTICLE_ADMIN_UIDS/],
  ["internal_fs_path", /[A-Z]:\\\\?(Users|01\.)|\/home\/[a-z]+\//],
  ["source_map_ref", /\/\/# sourceMappingURL=/],
];

function walk(d, out) {
  let ents;
  try { ents = readdirSync(d, { withFileTypes: true }); } catch { return out; }
  for (const e of ents) {
    if (SKIP.has(e.name)) continue;
    const p = join(d, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

function scan(label, roots, patterns) {
  const files = [];
  for (const r of roots) {
    const abs = join(ROOT, r);
    try { statSync(abs); } catch { console.log(`  (${r} 없음 — 건너뜀)`); continue; }
    walk(abs, files);
  }
  const counts = {};
  const hitFiles = {};
  let scanned = 0;
  for (const f of files) {
    let src;
    try {
      if (statSync(f).size > 12 * 1024 * 1024) continue;
      src = readFileSync(f, "latin1");
    } catch { continue; }
    scanned++;
    for (const [name, re] of patterns) {
      if (re.test(src)) {
        counts[name] = (counts[name] || 0) + 1;
        (hitFiles[name] ??= new Set()).add(relative(ROOT, f).split(sep).join("/"));
      }
    }
  }
  console.log(`\n### ${label} — 파일 ${scanned}개 스캔`);
  let total = 0;
  for (const [name] of patterns) {
    const c = counts[name] || 0;
    total += c;
    const mark = c === 0 ? "✅" : "⚠️";
    console.log(`  ${mark} ${name.padEnd(28)} ${c}개 파일`);
    if (c > 0) {
      const list = [...hitFiles[name]].slice(0, 6);
      for (const f of list) console.log(`        · ${f}`);
      if (hitFiles[name].size > 6) console.log(`        · … 외 ${hitFiles[name].size - 6}개`);
    }
  }
  return total;
}

const roots = targets.length ? targets : ["lib", "app", "components", "contexts", "functions", "scripts", "tests"];
const a = scan("비밀정보 패턴", roots, PATTERNS);
const b = scan("배포 seam 패턴", roots, SEAMS);
console.log(`\n합계: 비밀 ${a} · seam ${b}`);
