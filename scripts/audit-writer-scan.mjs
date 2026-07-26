// 재화·소유권 writer 전수 스캔 (감사 전용, 값 미출력)
// 사용: node scripts/audit-writer-scan.mjs [--detail]
import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();
const SKIP = new Set(["node_modules", ".git", ".next", "out", "public", ".claude", "coverage"]);
const FIELDS = [
  "cottonCandy", "cottonCandyTotal", "ownedItems", "isPremium", "premiumUntil",
  "purchasedItems", "inventory", "unlockedItems", "membership", "candyDailyTotal",
];
// Firestore 쓰기 API 신호
const WRITE_API = /\b(increment|setDoc|updateDoc|addDoc|writeBatch|runTransaction|arrayUnion|arrayRemove|deleteField)\s*\(/;
// localStorage 쓰기 신호(로컬 캐시 조작)
const LOCAL_WRITE = /localStorage\.setItem/;

const files = [];
(function walk(d) {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(ts|tsx|mjs|js|rules)$/.test(e.name)) files.push(p);
  }
})(ROOT);

const hits = [];
for (const f of files) {
  const rel = relative(ROOT, f).split(sep).join("/");
  const lines = readFileSync(f, "utf8").split(/\r?\n/);
  lines.forEach((ln, i) => {
    if (!FIELDS.some((x) => ln.includes(x))) return;
    const t = ln.trim();
    hits.push({
      rel, n: i + 1, txt: t.slice(0, 140),
      fsWrite: WRITE_API.test(ln),
      lsWrite: LOCAL_WRITE.test(ln),
      comment: t.startsWith("//") || t.startsWith("*") || t.startsWith("/*"),
    });
  });
}

// 10종 분류
function classify(h) {
  if (h.comment) return "6. 문서·주석";
  if (h.rel === "firestore.rules") return "R. Rules 방어";
  if (h.rel.startsWith("functions/")) return "1. 서버 권위 writer";
  if (h.rel.startsWith("tests/")) return "4. 테스트 전용";
  if (h.rel.startsWith("docs/")) return "6. 문서·주석";
  if (h.rel.startsWith("scripts/")) return "9. scripts/도구";
  if (h.fsWrite) return "2. ★클라이언트 직접 Firestore writer";
  if (h.lsWrite) return "L. localStorage 캐시 writer";
  return "3. 읽기·표시 전용";
}

const by = {};
for (const h of hits) (by[classify(h)] ??= []).push(h);

console.log(`총 ${hits.length}줄 / ${new Set(hits.map((h) => h.rel)).size}개 파일`);
for (const k of Object.keys(by).sort()) {
  const g = by[k];
  const perFile = {};
  for (const h of g) perFile[h.rel] = (perFile[h.rel] || 0) + 1;
  console.log(`\n### ${k}  — ${g.length}줄 / ${Object.keys(perFile).length}파일`);
  for (const [f, c] of Object.entries(perFile).sort((a, b) => b[1] - a[1])) {
    console.log(`   ${String(c).padStart(3)}  ${f}`);
  }
}

const danger = by["2. ★클라이언트 직접 Firestore writer"] || [];
console.log(`\n=== ★ 클라이언트 직접 Firestore writer: ${danger.length}건 ===`);
for (const h of danger) console.log(`  ${h.rel}:${h.n}  ${h.txt}`);

if (process.argv.includes("--detail")) {
  console.log(`\n=== localStorage 캐시 writer 상세 ===`);
  for (const h of by["L. localStorage 캐시 writer"] || []) console.log(`  ${h.rel}:${h.n}  ${h.txt}`);
}

process.exit(danger.length === 0 ? 0 : 1);
