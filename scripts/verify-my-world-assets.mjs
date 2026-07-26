#!/usr/bin/env node
// My World 이미지 자산 검증 — 네트워크·비밀값에 의존하지 않는 독립 도구.
//
// 검사 항목
//   1. manifest 경로의 파일 존재 여부
//   2. 실제 픽셀 크기 == 요구 원본 해상도 (PNG·WebP 헤더 직접 파싱, 외부 패키지 없음)
//   3. 투명 배경이 필요한 자산의 알파 채널 유무
//   4. 중복 파일명(같은 경로가 두 번 정의됐는지)
//   5. 사용되지 않는 자산(public 에 있으나 manifest 에 없는 파일)
//   6. 용량 예산 초과
//   7. **readiness 플래그 fail-safe** — 자산이 없는데 플래그가 켜져 있으면 실패
//
// 사용법
//   node scripts/verify-my-world-assets.mjs            # 요약
//   node scripts/verify-my-world-assets.mjs --mvp      # MVP 자산만
//   node scripts/verify-my-world-assets.mjs --json     # 기계 판독 출력
// 종료 코드: 0 = 통과(자산 없음도 "아직 없음" 으로 통과), 1 = 계약 위반
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const PUBLIC = join(ROOT, "public");

// ── manifest 를 TS 소스에서 직접 읽지 않고, 같은 규칙을 여기서 재구성한다 ──
//    (Node 로 .ts 를 로드하려면 별도 로더가 필요하고, 이 도구는 의존성 0 을 유지한다)
//    registry 의 실제 값은 정규식으로 뽑아 "manifest 와 registry 가 어긋나는" 상황도 잡는다.
function readSource(rel) {
  return readFileSync(join(ROOT, rel), "utf8");
}

function parseCharacterIds() {
  const src = readSource("lib/myWorld/character/registry.ts");
  return [...src.matchAll(/\{\s*id:\s*"([a-z]+)"/g)].map((m) => m[1]);
}

function parseRoomItems() {
  const src = readSource("lib/myWorld/room/registry.ts");
  return [...src.matchAll(/def\(\{\s*id:\s*"([a-z-]+)"[^}]*?defaultWidth:\s*(\d+),\s*defaultHeight:\s*(\d+)/g)].map((m) => ({
    id: m[1],
    w: Number(m[2]),
    h: Number(m[3]),
  }));
}

function parseEmotionKeys() {
  const src = readSource("lib/myWorld/assets/manifest.ts");
  const m = /EMOTION_ASSET_KEYS = \[([^\]]+)\]/.exec(src);
  return m ? [...m[1].matchAll(/"([a-z]+)"/g)].map((x) => x[1]) : [];
}

function parseFlag(rel, name) {
  const src = readSource(rel);
  const m = new RegExp(`${name}\\s*=\\s*(true|false)`).exec(src);
  return m ? m[1] === "true" : null;
}

const CANVAS = { w: 532, h: 399 };
const MAX_SCALE = 1.8;
const round128 = (n) => Math.min(1024, Math.max(512, Math.ceil(n / 128) * 128));

function buildSpecs() {
  const specs = [];
  const chars = parseCharacterIds();
  const emotions = parseEmotionKeys();
  for (const id of chars) {
    const mvp = id === "dori";
    specs.push({ path: `/characters/${id}/portrait.webp`, w: 1024, h: 1024, transparent: true, mvp, budgetKb: 120, group: "character" });
    specs.push({ path: `/characters/${id}/avatar.webp`, w: 256, h: 256, transparent: true, mvp, budgetKb: 24, group: "character" });
    specs.push({ path: `/characters/${id}/thumbnail.webp`, w: 256, h: 256, transparent: true, mvp, budgetKb: 24, group: "character" });
    specs.push({ path: `/characters/${id}/idle.webp`, w: 1024, h: 1024, transparent: true, mvp: false, budgetKb: 120, group: "character" });
    for (const e of emotions) {
      specs.push({ path: `/characters/${id}/emotion-${e}.webp`, w: 1024, h: 1024, transparent: true, mvp, budgetKb: 120, group: "character" });
    }
  }
  for (const it of parseRoomItems()) {
    const dw = Math.round((it.w / 100) * CANVAS.w * MAX_SCALE);
    const dh = Math.round((it.h / 100) * CANVAS.h * MAX_SCALE);
    specs.push({ path: `/rooms/items/${it.id}/sprite.webp`, w: round128(dw * 2), h: round128(dh * 2), transparent: true, mvp: true, budgetKb: 90, group: "room-item" });
    specs.push({ path: `/rooms/items/${it.id}/thumbnail.webp`, w: 256, h: 256, transparent: true, mvp: true, budgetKb: 20, group: "room-item" });
  }
  specs.push({ path: "/rooms/backgrounds/basic/scene.webp", w: 1536, h: 1152, transparent: false, mvp: true, budgetKb: 180, group: "room-background" });
  specs.push({ path: "/my-world/empty-room.webp", w: 1024, h: 768, transparent: true, mvp: true, budgetKb: 80, group: "state" });
  specs.push({ path: "/my-world/empty-diary.webp", w: 512, h: 512, transparent: true, mvp: true, budgetKb: 50, group: "state" });
  specs.push({ path: "/my-world/guest-preview.webp", w: 1536, h: 1152, transparent: false, mvp: false, budgetKb: 180, group: "state" });
  specs.push({ path: "/my-world/fx-affinity.webp", w: 256, h: 256, transparent: true, mvp: false, budgetKb: 14, group: "state" });
  specs.push({ path: "/my-world/fx-exp.webp", w: 256, h: 256, transparent: true, mvp: false, budgetKb: 14, group: "state" });
  return specs;
}

// ── 이미지 헤더 파싱 (외부 패키지 없음) ──
function readImageMeta(file) {
  const buf = readFileSync(file);
  // PNG
  if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) {
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    const colorType = buf[25];
    return { format: "png", width, height, hasAlpha: colorType === 4 || colorType === 6 };
  }
  // WebP: RIFF....WEBP
  if (buf.length > 30 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    const fourcc = buf.toString("ascii", 12, 16);
    if (fourcc === "VP8X") {
      const flags = buf[20];
      const width = 1 + (buf.readUIntLE(24, 3) & 0xffffff);
      const height = 1 + (buf.readUIntLE(27, 3) & 0xffffff);
      return { format: "webp", width, height, hasAlpha: (flags & 0x10) !== 0 };
    }
    if (fourcc === "VP8L") {
      const b = buf.readUInt32LE(21);
      const width = (b & 0x3fff) + 1;
      const height = ((b >> 14) & 0x3fff) + 1;
      return { format: "webp", width, height, hasAlpha: ((b >> 28) & 1) === 1 };
    }
    if (fourcc === "VP8 ") {
      const width = buf.readUInt16LE(26) & 0x3fff;
      const height = buf.readUInt16LE(28) & 0x3fff;
      return { format: "webp", width, height, hasAlpha: false }; // lossy VP8 는 알파 없음
    }
  }
  return { format: "unknown", width: 0, height: 0, hasAlpha: false };
}

function walkPublic(sub) {
  const dir = join(PUBLIC, sub);
  if (!existsSync(dir)) return [];
  const out = [];
  (function rec(d) {
    for (const n of readdirSync(d)) {
      const p = join(d, n);
      const st = statSync(p);
      if (st.isDirectory()) rec(p);
      else if ([".webp", ".png"].includes(extname(n))) out.push("/" + p.slice(PUBLIC.length + 1).split("\\").join("/"));
    }
  })(dir);
  return out;
}

// ── 실행 ──
const mvpOnly = process.argv.includes("--mvp");
const asJson = process.argv.includes("--json");
const all = buildSpecs();
const specs = mvpOnly ? all.filter((s) => s.mvp) : all;

const errors = [];
const warnings = [];

// 4. 중복 경로
const seen = new Map();
for (const s of all) {
  if (seen.has(s.path)) errors.push(`중복 정의: ${s.path}`);
  seen.set(s.path, true);
}

let present = 0;
const missing = [];
for (const s of specs) {
  const file = join(PUBLIC, s.path.replace(/^\//, ""));
  if (!existsSync(file)) { missing.push(s.path); continue; }
  present++;
  const meta = readImageMeta(file);
  if (meta.format === "unknown") { errors.push(`형식을 읽을 수 없음: ${s.path}`); continue; }
  if (meta.width !== s.w || meta.height !== s.h) {
    errors.push(`해상도 불일치: ${s.path} — 요구 ${s.w}x${s.h}, 실제 ${meta.width}x${meta.height}`);
  }
  if (s.transparent && !meta.hasAlpha) errors.push(`투명 배경 필요: ${s.path} (알파 채널 없음)`);
  if (!s.transparent && meta.hasAlpha) warnings.push(`불필요한 알파: ${s.path}`);
  const kb = Math.round(statSync(file).size / 1024);
  if (kb > s.budgetKb) warnings.push(`용량 예산 초과: ${s.path} — ${kb}KB > ${s.budgetKb}KB`);
}

// 5. 사용되지 않는 자산
const declared = new Set(all.map((s) => s.path));
const onDisk = [...walkPublic("characters"), ...walkPublic("rooms"), ...walkPublic("my-world")];
const orphans = onDisk.filter((p) => !declared.has(p));
for (const o of orphans) warnings.push(`manifest 에 없는 자산: ${o}`);

// 7. readiness 플래그 fail-safe
const charReady = parseFlag("lib/myWorld/character/utils.ts", "CHARACTER_ASSETS_READY");
const roomReady = parseFlag("lib/myWorld/room/constants.ts", "ROOM_ASSETS_READY");
const charMissing = all.filter((s) => s.group === "character" && s.mvp && missing.includes(s.path));
const roomMissing = all.filter((s) => (s.group === "room-item" || s.group === "room-background") && s.mvp && missing.includes(s.path));
if (charReady && charMissing.length > 0) {
  errors.push(`CHARACTER_ASSETS_READY=true 인데 MVP 캐릭터 자산 ${charMissing.length}개가 없다 — 켜기 전에 자산을 채워야 한다`);
}
if (roomReady && roomMissing.length > 0) {
  errors.push(`ROOM_ASSETS_READY=true 인데 MVP 방 자산 ${roomMissing.length}개가 없다 — 켜기 전에 자산을 채워야 한다`);
}

const summary = {
  declared: all.length,
  checked: specs.length,
  present,
  missing: missing.length,
  mvpTotal: all.filter((s) => s.mvp).length,
  mvpPresent: all.filter((s) => s.mvp && !missing.includes(s.path)).length,
  flags: { CHARACTER_ASSETS_READY: charReady, ROOM_ASSETS_READY: roomReady },
  errors,
  warnings,
};

if (asJson) {
  console.log(JSON.stringify({ ...summary, missingPaths: missing.slice(0, 40) }, null, 2));
} else {
  console.log(`[assets] 선언 ${summary.declared}개 (MVP ${summary.mvpTotal}) · 검사 ${summary.checked} · 존재 ${present} · 없음 ${missing.length}`);
  console.log(`[assets] 플래그 CHARACTER_ASSETS_READY=${charReady} ROOM_ASSETS_READY=${roomReady}`);
  if (missing.length > 0) {
    console.log(`[assets] 아직 없는 자산 ${missing.length}개 (플래그가 꺼져 있으므로 이모지 폴백이 쓰인다)`);
    for (const m of missing.slice(0, 8)) console.log(`    - ${m}`);
    if (missing.length > 8) console.log(`    … 외 ${missing.length - 8}개`);
  }
  for (const w of warnings.slice(0, 20)) console.log(`[warn]  ${w}`);
  for (const e of errors) console.error(`[error] ${e}`);
}

if (errors.length > 0) {
  console.error(`[assets] FAIL — 계약 위반 ${errors.length}건`);
  process.exit(1);
}
console.log(`[assets] PASS — 계약 위반 0건${warnings.length ? ` (경고 ${warnings.length}건)` : ""}`);
process.exit(0);
