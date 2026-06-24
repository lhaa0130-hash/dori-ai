// 작성된 문항 JSON들을 병합 → 중복 검사 → lib/psychItems.ts 생성
const fs = require("fs");
const path = require("path");

const dir = __dirname;
const files = ["da.json", "sb.json", "sr.json", "sg.json", "audit.json", "ao.json"];
const merged = {};
for (const f of files) {
  const obj = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
  for (const k of Object.keys(obj)) merged[k] = obj[k];
}

const norm = (s) => s.replace(/[\s.,·!?'"“”()\-—~]/g, "").trim();

let problems = 0;
const seenGlobal = new Map();
const counts = {};
for (const [test, items] of Object.entries(merged)) {
  counts[test] = items.length;
  if (items.length < 40) { console.log(`⚠️  ${test}: only ${items.length} items (<40)`); problems++; }
  const seen = new Map();
  for (const it of items) {
    const n = norm(it.text);
    if (seen.has(n)) { console.log(`❌ DUP within ${test}: "${it.text}"  ↔  "${seen.get(n)}"`); problems++; }
    else seen.set(n, it.text);
    // cross-test exact-normalized duplicate
    if (seenGlobal.has(n)) {
      const prev = seenGlobal.get(n);
      if (prev.test !== test) console.log(`⚠️  cross-test identical: [${prev.test}] vs [${test}]: "${it.text}"`);
    } else seenGlobal.set(n, { test, text: it.text });
  }
}

console.log("\n=== counts ===");
console.log(JSON.stringify(counts));
console.log(`total items: ${Object.values(counts).reduce((a, b) => a + b, 0)}`);

// generate TS
const esc = (s) => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
let ts = `// 자동 생성(_itemgen/assemble.js) — 확장 검사 문항 풀. 직접 수정하지 말 것.\n`;
ts += `import type { ScoredItem } from "./psychTests";\n\n`;
ts += `export const ITEMS: Record<string, ScoredItem[]> = {\n`;
for (const [test, items] of Object.entries(merged)) {
  ts += `  "${test}": [\n`;
  for (const it of items) {
    ts += `    { text: "${esc(it.text)}"${it.reverse ? ", reverse: true" : ""} },\n`;
  }
  ts += `  ],\n`;
}
ts += `};\n`;

fs.writeFileSync(path.join(dir, "..", "lib", "psychItems.ts"), ts, "utf8");
console.log("\n" + (problems ? `⚠️  ${problems} problem(s) found` : "✅ no duplicates, all ≥40") + " — wrote lib/psychItems.ts");
