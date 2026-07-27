// Production 칭호 현황 **읽기 전용** 집계 (감사 도구).
//
// ⚠️ 절대 규칙
//   · 읽기만 한다. set/update/delete/batch 를 호출하지 않는다.
//   · UID·email·닉네임·칭호 **실제 문자열**을 출력하지 않는다. 개수만 출력한다.
//   · 개별 문서 원문을 출력하지 않는다.
//   · 결과를 임시파일에 남기지 않는다(표준출력만).
//   · 필요한 필드만 select() 로 가져와 전송량을 줄인다.
//
// 사용: node scripts/audit-title-shape.mjs
//   SA_KEY 환경변수로 서비스 계정 경로를 지정할 수 있다(기본: 기존 백업 도구와 동일 경로).
import { createRequire } from "node:module";
import { existsSync } from "node:fs";

const require = createRequire("file:///D:/01.%20illo.im/n8n-work/");
const KEY_PATH = process.env.SA_KEY || "D:/01. illo.im/_keys/dori-ai-0130-admin.json";

if (!existsSync(KEY_PATH)) {
  console.log("UNAVAILABLE — 서비스 계정 키를 찾을 수 없습니다(탐색하지 않음).");
  process.exit(2);
}

// ⚠️ firebase-admin v14 는 모듈 API 다(`admin.credential` 네임스페이스 없음).
let initializeApp, cert, deleteApp, getFirestore;
try {
  ({ initializeApp, cert, deleteApp } = require("firebase-admin/app"));
  ({ getFirestore } = require("firebase-admin/firestore"));
} catch {
  console.log("UNAVAILABLE — firebase-admin 모듈을 찾을 수 없습니다.");
  process.exit(2);
}

const { SHOP_ITEMS, itemKey } = await import("../lib/shopItems.ts");
const TITLES = SHOP_ITEMS.filter((i) => i.slot === "title");
/** 상점 칭호의 표시 문자열 → itemKey. ko/en 표기 둘 다 본다. */
const TEXT_TO_KEY = new Map();
for (const t of TITLES) {
  if (t.text) TEXT_TO_KEY.set(t.text, itemKey(t.slot, t.id));
  if (t.textEn) TEXT_TO_KEY.set(t.textEn, itemKey(t.slot, t.id));
}

const app = initializeApp({ credential: cert(require(KEY_PATH)) }, "title-audit");
const db = getFirestore(app);

const c = {
  scanOk: false,
  total: 0,
  titleNonEmpty: 0,
  matchesCatalog: 0,
  matchesAndOwned: 0,
  matchesNotOwned: 0,
  customNotCatalog: 0,
  titleWrongType: 0,
  titleOver24: 0,
  ownedItemsWrongType: 0,
  hasNewTitleFields: 0,
  ownedTitleItems: 0,          // ownedItems 에 title:: 을 하나라도 가진 문서
  titleEmptyString: 0,
  titleWhitespaceOnly: 0,
};

try {
  // 필요한 필드만. 문서 원문은 어디에도 보관하지 않는다.
  const snap = await db.collection("users")
    .select("title", "ownedItems", "titleMode", "titleId", "customTitle")
    .get();
  c.scanOk = true;
  c.total = snap.size;

  for (const doc of snap.docs) {
    const d = doc.data();

    const owned = d.ownedItems;
    const ownedOk = Array.isArray(owned) && owned.every((x) => typeof x === "string");
    if (owned !== undefined && !ownedOk) c.ownedItemsWrongType++;
    const ownedSet = ownedOk ? new Set(owned) : new Set();
    if ([...ownedSet].some((k) => typeof k === "string" && k.startsWith("title::"))) c.ownedTitleItems++;

    if (d.titleMode !== undefined || d.titleId !== undefined || d.customTitle !== undefined) c.hasNewTitleFields++;

    const t = d.title;
    if (t === undefined || t === null) continue;
    if (typeof t !== "string") { c.titleWrongType++; continue; }
    if (t === "") { c.titleEmptyString++; continue; }
    if (t.trim() === "") { c.titleWhitespaceOnly++; continue; }

    c.titleNonEmpty++;
    if ([...t].length > 24) c.titleOver24++;

    const key = TEXT_TO_KEY.get(t);
    if (key) {
      c.matchesCatalog++;
      if (ownedSet.has(key)) c.matchesAndOwned++; else c.matchesNotOwned++;
    } else {
      c.customNotCatalog++;
    }
  }
} catch (e) {
  console.log(`SCAN FAILED — ${String(e?.code || e?.message || e).slice(0, 80)}`);
  console.log("  (개수 0 이 아니라 '조회 실패' 입니다)");
  await deleteApp(app);
  process.exit(1);
}

await deleteApp(app);

console.log("=== Production 칭호 현황 (aggregate only, 쓰기 0건) ===");
console.log(`  조회 성공                                  : ${c.scanOk ? "예" : "아니오"}`);
console.log(`  1. 전체 users 문서 수                       : ${c.total}`);
console.log(`  2. legacy title 이 비어 있지 않은 문서       : ${c.titleNonEmpty}`);
console.log(`  3. 상점 title 문자열과 정확히 일치           : ${c.matchesCatalog}`);
console.log(`  4.   └ 해당 title:: 을 실제 보유             : ${c.matchesAndOwned}`);
console.log(`  5.   └ 일치하지만 미보유(복제 추정)          : ${c.matchesNotOwned}`);
console.log(`  6. 상점과 불일치하는 커스텀 title            : ${c.customNotCatalog}`);
console.log(`  7. title 타입이 문자열이 아닌 손상 문서       : ${c.titleWrongType}`);
console.log(`  8. title 길이 24자 초과 문서                 : ${c.titleOver24}`);
console.log(`  9. ownedItems 타입이 잘못된 문서             : ${c.ownedItemsWrongType}`);
console.log(` 10. 신규 title 필드가 이미 있는 문서          : ${c.hasNewTitleFields}`);
console.log(`  (참고) ownedItems 에 title 상품 보유 문서     : ${c.ownedTitleItems}`);
console.log(`  (참고) title 이 빈 문자열                    : ${c.titleEmptyString}`);
console.log(`  (참고) title 이 공백만                       : ${c.titleWhitespaceOnly}`);
console.log(`  대조에 사용한 상점 칭호 문자열 수            : ${TEXT_TO_KEY.size} (ko+en)`);
console.log("=== 쓰기 호출 0건 (이 스크립트는 set/update/delete 를 호출하지 않는다) ===");
