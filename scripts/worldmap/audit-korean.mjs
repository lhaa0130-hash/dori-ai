// 195개국 한국어 표기 전수 감사 (지시서 07 §8).
//
//   npm run audit:worldmap:ko
//
// 실제 화면에 나가는 문장을 그대로 만들어서 검사한다. 데이터 필드만 훑으면
// "북한와" 처럼 조립 단계에서 생기는 오류를 놓친다.
//
// ⚠️ 이 스크립트는 사람 검토를 대신하지 않는다. FAIL 은 기계가 확신하는 것만,
//    애매한 것은 전부 REVIEW 로 올려 사람이 보게 한다.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const DATA = resolve(ROOT, "public/worldmap/countries.json");
const OUT = resolve(ROOT, "reports/worldmap-korean-audit.md");

const { countries } = JSON.parse(readFileSync(DATA, "utf8"));

// ⚠️ 조사 로직을 여기서 다시 구현하면 안 된다. 감사 스크립트가 제품과 다른 규칙으로
//    문장을 만들면, 멀쩡한 문장을 오류라고 하거나(오탐) 진짜 오류를 놓친다.
//    실제 화면이 쓰는 lib/worldmap/korean.ts 를 그대로 불러온다.
const { josa, joinWithJosa } = await import("../../lib/worldmap/korean.ts");

// ── 자동 FAIL 패턴 (§8) ────────────────────────────────────────
// 기계가 확실히 틀렸다고 말할 수 있는 것만 넣는다.
const FAIL_PATTERNS = [
  [/북한와/, "조사 오류 '북한와'"],
  [/인구은|인구이 /, "조사 오류 '인구은/인구이'"],
  [/GDP은|GDP이 /, "조사 오류 'GDP은/GDP이'"],
  [/면적은다|면적이가/, "조사 중복"],
  [/은\(는\)|이\(가\)|을\(를\)|과\(와\)/, "괄호 조사 표기"],
  [/undefined|null|NaN/, "미치환 값"],
  [/ {2,}/, "이중 공백"],
  [/,\./, "쉼표+마침표"],
  [/,\s*,/, "빈 항목"],
  [/\s+[.。]/, "마침표 앞 공백"],
];

/**
 * 이에요/예요 짝 검사.
 *   받침 있음 → 이에요 (서울이에요)   받침 없음 → 예요 (도쿄예요)
 * ⚠️ '이에요' 를 통째로 금지하면 안 된다. 받침 있는 말에는 그게 정답이다.
 */
function badYeyo(text) {
  for (const m of text.matchAll(/([가-힣])(이에요|예요)/g)) {
    const code = m[1].charCodeAt(0);
    // '이에요' 는 앞 글자가 '이' 로 끝나므로, 실제 어간의 받침은 그 앞 글자를 봐야 한다.
    if (m[2] === "예요" && (code - 0xac00) % 28 !== 0) return `받침 있는 말에 '예요' (${m[0]})`;
  }
  for (const m of text.matchAll(/([가-힣])이에요/g)) {
    const code = m[1].charCodeAt(0);
    if ((code - 0xac00) % 28 === 0) return `받침 없는 말에 '이에요' (${m[0]})`;
  }
  return null;
}

const isEnglish = (s) => typeof s === "string" && s.length > 0 && !/[가-힣]/.test(s) && /[A-Za-z]/.test(s);

// 한국어 화면에 영문 원문을 그대로 두는 것을 허용하는 사유 (§7).
// 목표는 정규식상 영문 0개가 아니라, 사유 없는 영문 0개다.
const ALLOW_ENGLISH = {
  "leader.ko": "공인 한국어 표기가 없는 현직 지도자 인명 — 임의 음역 금지",
  "capitalKo": "공인 한국어 표기를 찾지 못한 수도명",
  "subregionKo": "UN 지역 구분 명칭 — 공인 한국어 대응이 없음",
  "currencies[].ko": "공인 한국어 통화명이 없음",
  "languages[].ko": "공인 한국어 언어명이 없음",
  "religion.ko": "공인 한국어 표기가 없는 종교명",
};

// ── 화면 문장 재현 ────────────────────────────────────────────
const RANK_LABELS = [
  "인구", "국토 면적", "GDP", "1인당 GDP", "경제 성장률", "기대 수명",
  "인터넷 사용률", "도시 인구 비율", "출생률", "어린이 인구 비율",
  "숲 면적 비율", "재생에너지 비율", "1인당 이산화탄소", "인구밀도", "국경 맞댄 나라 수",
];

/** 실제 화면에 나가는 문장들을 국가별로 모은다. */
function sentencesFor(c, byIso) {
  const name = c.nameKo;
  const out = [];

  out.push(["표시명", name]);
  out.push(["breadcrumb", `${c.continentKo} · ${name}`]);

  // 어린이 설명 — childSummary.ts 와 같은 규칙
  const neighbours = (c.borderCountryIso3 ?? []).map((i) => byIso.get(i)?.nameKo).filter(Boolean);
  if (neighbours.length === 0) {
    out.push(["이웃", c.islandCountry ? `${name}${josa(name, "은는")} 섬나라예요.` : `${name}${josa(name, "은는")} 이웃 나라가 없어요.`]);
  } else {
    out.push(["이웃", `${joinWithJosa(neighbours, "과와")} 국경을 맞대고 있어요.`]);
  }
  if (c.landlocked) out.push(["내륙", `${name}${josa(name, "은는")} 바다가 없는 내륙국이에요.`]);

  if (c.capitalKo) out.push(["수도", `수도는 ${c.capitalKo}${josa(c.capitalKo, "이에요예요")}.`]);
  if (c.subregionKo) out.push(["지역", c.subregionKo]);
  if (c.leader?.ko) out.push(["지도자", `${c.leader.titleKo ?? ""} ${c.leader.ko}`.trim()]);
  for (const cur of c.currencies ?? []) out.push(["통화", cur.ko]);
  for (const l of c.languages ?? []) out.push(["언어", l.ko]);

  // 랭킹 15개 — 정상·결측 두 갈래 문장
  for (const label of RANK_LABELS) {
    out.push(["랭킹", `${name}${josa(name, "은는")} 전 세계에서 ${label}${josa(label, "이가")} 13번째예요.`]);
    out.push(["랭킹", `${label}${josa(label, "은는")} 자료가 없어 순위를 매기지 않았어요.`]);
  }
  return out;
}

// ── 감사 실행 ─────────────────────────────────────────────────
const byIso = new Map(countries.map((c) => [c.iso3, c]));
const rows = [];
const allowed = [];
let pass = 0, review = 0, fail = 0;

for (const c of countries) {
  const problems = [];
  const notes = [];

  for (const [field, text] of sentencesFor(c, byIso)) {
    if (typeof text !== "string") continue;
    for (const [re, why] of FAIL_PATTERNS) {
      if (re.test(text)) problems.push(`${field}: ${why} — "${text}"`);
    }
    const y = badYeyo(text);
    if (y) problems.push(`${field}: ${y}`);
  }

  // 영문 잔존 (§7) — FAIL 이 아니라 REVIEW 로 올리고 사유를 남긴다.
  const enFields = [];
  if (isEnglish(c.capitalKo)) enFields.push(["capitalKo", c.capitalKo]);
  if (isEnglish(c.subregionKo)) enFields.push(["subregionKo", c.subregionKo]);
  if (isEnglish(c.leader?.ko)) enFields.push(["leader.ko", c.leader.ko]);
  if (isEnglish(c.religion?.ko)) enFields.push(["religion.ko", c.religion.ko]);
  for (const x of c.currencies ?? []) if (isEnglish(x.ko)) enFields.push(["currencies[].ko", x.ko]);
  for (const x of c.languages ?? []) if (isEnglish(x.ko)) enFields.push(["languages[].ko", x.ko]);

  for (const [field, value] of enFields) {
    const reason = ALLOW_ENGLISH[field];
    if (reason) { allowed.push({ iso3: c.iso3, name: c.nameKo, field, value, reason }); notes.push(`${field} 영문 허용`); }
    else problems.push(`${field}: 미승인 영문 원문 "${value}"`);
  }

  const status = problems.length ? "FAIL" : notes.length ? "REVIEW" : "PASS";
  if (status === "FAIL") fail++; else if (status === "REVIEW") review++; else pass++;

  const mark = (ok) => (ok ? "O" : "-");
  rows.push([
    c.iso3, c.nameKo,
    mark(true), mark((c.borderCountryIso3 ?? []).length > 0 || c.islandCountry),
    mark(!!c.capitalKo), mark(!!c.subregionKo), mark(!!c.leader?.ko),
    mark((c.currencies ?? []).length > 0), mark((c.timezones ?? []).length > 0),
    mark(c.population?.v != null),
    status,
    problems.length ? problems.join(" / ") : notes.join(", "),
  ]);
}

// ── 보고서 ────────────────────────────────────────────────────
const lines = [];
lines.push("# 나라콕 — 195개국 한국어 표기 전수 감사");
lines.push("");
lines.push(`생성: \`npm run audit:worldmap:ko\` · 대상 ${countries.length}개국`);
lines.push("");
lines.push("이 보고서는 데이터 필드가 아니라 **실제 화면에 나가는 문장**을 재현해 검사한다.");
lines.push("자동 검사 뒤 사람이 처음부터 끝까지 읽고 REVIEW 승인 여부를 남긴다.");
lines.push("");
lines.push("## 요약");
lines.push("");
lines.push(`- PASS: **${pass}**`);
lines.push(`- REVIEW: **${review}**`);
lines.push(`- FAIL: **${fail}**`);
lines.push(`- 영문 원문 허용: **${allowed.length}건**`);
lines.push("");

if (fail === 0) lines.push("> FAIL 0건. 조사·표기 자동 검사를 모두 통과했다.");
else lines.push(`> ⚠️ FAIL ${fail}건. 하나라도 남아 있으면 완료로 보고하지 않는다.`);
lines.push("");

lines.push("## 영문 원문 허용 사유 (§7)");
lines.push("");
lines.push("정규식상 영문을 0개로 만드는 것이 목표가 아니다. 공인 한국어 표기를 찾지 못한");
lines.push("고유명사는 **임의 음역하지 않고** 영문 원문을 남기며, 그 사유를 여기에 기록한다.");
lines.push("");
const byField = {};
for (const a of allowed) (byField[a.field] ??= []).push(a);
lines.push("| 필드 | 건수 | 허용 사유 |");
lines.push("| --- | --- | --- |");
for (const [field, list] of Object.entries(byField).sort((a, b) => b[1].length - a[1].length)) {
  lines.push(`| \`${field}\` | ${list.length} | ${ALLOW_ENGLISH[field]} |`);
}
lines.push("");

lines.push("## 국가별 상세");
lines.push("");
lines.push("| ISO3 | 국가명 | 설명 | 이웃 | 수도 | 지역 | 지도자 | 통화 | 시간대 | 랭킹 | 상태 | 비고 |");
lines.push("| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |");
for (const r of rows) lines.push(`| ${r.join(" | ")} |`);
lines.push("");

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, lines.join("\n"), "utf8");

console.log(`PASS ${pass} · REVIEW ${review} · FAIL ${fail} · 영문 허용 ${allowed.length}`);
console.log(`보고서: reports/worldmap-korean-audit.md`);
process.exit(fail > 0 ? 1 : 0);
