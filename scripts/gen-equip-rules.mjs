// 장착 소유권 Rules 블록 생성기 (결함 A 수정).
//
// ⚠️ Firestore Rules 에는 반복문이 없어 카탈로그를 그대로 읽을 수 없다. 그래서 필요한 최소 정보만
//    — 슬롯별 **무료 아이템 id 집합** 과 **유료 스티커 이모지 → itemKey 맵** — 을 생성해 박아 넣는다.
//    카탈로그가 바뀌면 Rules 도 재생성해야 하므로, 동기화는 tests/equip-rules-sync.test.ts 가 강제한다.
//
// 사용:
//   node scripts/gen-equip-rules.mjs           → 생성 블록을 stdout 으로 출력
//   node scripts/gen-equip-rules.mjs --check   → firestore.rules 안의 블록과 대조(불일치 시 exit 1)
//   node scripts/gen-equip-rules.mjs --write   → firestore.rules 의 블록을 교체
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { SHOP_ITEMS, FREE_STICKERS, itemKey } from "../lib/shopItems.ts";

export const BEGIN = "    // ===== BEGIN GENERATED equip-ownership (scripts/gen-equip-rules.mjs) =====";
export const END = "    // ===== END GENERATED equip-ownership =====";

/** 저장 값이 아이템 id 인 슬롯 — 이 5개만 Rules 로 소유 검증한다(설계 근거: docs/equipment-authority-decision.md). */
export const ID_SLOTS = ["bg", "frame", "nameEffect", "bannerEffect", "pet"];

const q = (s) => "'" + String(s).replace(/\\/g, "\\\\").replace(/'/g, "\\'") + "'";

export function buildRulesBlock() {
  const lines = [BEGIN];
  lines.push("    // 이 블록은 lib/shopItems.ts 에서 생성됩니다. 손으로 고치지 마세요.");
  lines.push("");

  // 1) 슬롯별 무료 아이템 id
  for (const slot of ID_SLOTS) {
    const free = SHOP_ITEMS.filter((i) => i.slot === slot && !(i.price > 0)).map((i) => i.id).sort();
    lines.push(`    function freeIds_${slot}() { return [${free.map(q).join(", ")}]; }`);
  }
  lines.push("");

  // 2) 무료 스티커 이모지
  lines.push(`    function freeStickerEmojis() { return [${FREE_STICKERS.map(q).join(", ")}]; }`);
  lines.push("");

  // 3) 유료 스티커 이모지 → itemKey (이모지는 카탈로그 전체에서 유일함이 테스트로 보장된다)
  const paidStickers = SHOP_ITEMS.filter((i) => i.slot === "sticker" && i.price > 0 && i.emoji)
    .filter((i) => !FREE_STICKERS.includes(i.emoji))
    .sort((a, b) => a.id.localeCompare(b.id));
  const pairs = paidStickers.map((i) => `${q(i.emoji)}: ${q(itemKey(i.slot, i.id))}`);
  lines.push("    // 유료 스티커 이모지 → 'sticker::id'. 무료 목록과 겹치는 이모지는 제외(사실상 무료).");
  lines.push("    function paidStickerKeys() { return {");
  for (let i = 0; i < pairs.length; i += 4) {
    lines.push("      " + pairs.slice(i, i + 4).join(", ") + (i + 4 < pairs.length ? "," : ""));
  }
  lines.push("    }; }");
  lines.push(END);
  return lines.join("\n");
}

// ⚠️ 경로에 공백이 있으면 URL.pathname 이 %20 으로 남는다 → fileURLToPath 로 변환해야 한다.
const RULES_PATH = fileURLToPath(new URL("../firestore.rules", import.meta.url));

export function extractBlock(src) {
  const b = src.indexOf(BEGIN);
  const e = src.indexOf(END);
  if (b === -1 || e === -1) return null;
  return src.slice(b, e + END.length);
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}` || process.argv[1].endsWith("gen-equip-rules.mjs")) {
  const mode = process.argv[2];
  const block = buildRulesBlock();
  if (mode === "--check") {
    const src = readFileSync(RULES_PATH, "utf8");
    const cur = extractBlock(src);
    if (cur === null) { console.error("firestore.rules 에 생성 블록이 없습니다."); process.exit(1); }
    const norm = (s) => s.replace(/\r\n/g, "\n").trimEnd();
    if (norm(cur) !== norm(block)) {
      console.error("❌ firestore.rules 의 생성 블록이 카탈로그와 다릅니다. `node scripts/gen-equip-rules.mjs --write` 를 실행하세요.");
      process.exit(1);
    }
    console.log("✅ 생성 블록이 카탈로그와 일치합니다.");
  } else if (mode === "--write") {
    const src = readFileSync(RULES_PATH, "utf8");
    const cur = extractBlock(src);
    if (cur === null) { console.error("firestore.rules 에 생성 블록이 없습니다."); process.exit(1); }
    writeFileSync(RULES_PATH, src.replace(cur, block));
    console.log("✅ firestore.rules 갱신됨");
  } else {
    console.log(block);
  }
}
