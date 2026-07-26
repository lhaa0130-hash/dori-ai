// 서버 소유 상점 카탈로그 (05-07)
// ⚠️ 가격·구매가능여부·아이템 종류는 **서버만** 결정한다. 클라이언트가 보낸 price/amount 는 거부한다.
//    카탈로그 단일 원본은 lib/shopItems.ts (순수 데이터, import 0개라 엣지에서 그대로 사용 가능).
//    클라이언트도 같은 파일을 쓰지만 그건 '표시용'이고, 결제 판정은 이 모듈만 신뢰한다.
import { SHOP_ITEMS, itemKey, type ItemSlot } from "../../lib/shopItems.ts";

export interface CatalogEntry {
  itemKey: string;   // "slot::id"
  slot: ItemSlot;
  id: string;
  price: number;     // 0 = 기본 제공(구매 대상 아님)
}

// itemKey → 가격. 모듈 로드 시 1회 구성.
const CATALOG: Map<string, CatalogEntry> = (() => {
  const m = new Map<string, CatalogEntry>();
  for (const it of SHOP_ITEMS) {
    const key = itemKey(it.slot, it.id);
    m.set(key, { itemKey: key, slot: it.slot, id: it.id, price: Math.max(0, Math.floor(Number(it.price) || 0)) });
  }
  return m;
})();

/** itemKey 형식 검증 — "slot::id", 안전 문자만. */
const ITEM_KEY_RE = /^[a-zA-Z]{1,20}::[A-Za-z0-9_-]{1,40}$/;
export function isValidItemKey(v: unknown): v is string {
  return typeof v === "string" && ITEM_KEY_RE.test(v);
}

/** 카탈로그 조회. 없는 itemKey 는 null(=거부). */
export function getCatalogEntry(key: unknown): CatalogEntry | null {
  if (!isValidItemKey(key)) return null;
  return CATALOG.get(key) ?? null;
}

/** 구매 대상인가 — price 0 은 기본 제공이라 구매할 수 없다(무료 아이템 구매로 원장을 늘리지 않는다). */
export function isPurchasable(entry: CatalogEntry): boolean {
  return entry.price > 0;
}

export function catalogSize(): number { return CATALOG.size; }

/** 구매 operationId 규칙: buy_{slot}__{id}. 같은 아이템 재구매 시도는 자연히 같은 키가 되어 멱등. */
export function purchaseOperationId(entry: CatalogEntry): string {
  return "buy_" + entry.slot + "__" + entry.id;
}

/**
 * 구매 요청 정제 — 클라이언트가 보낼 수 있는 건 itemKey 뿐.
 * price·amount·balance·uid·email·reward·item 등 권위값은 '있으면 거부'.
 */
export function sanitizePurchaseRequest(
  body: unknown,
): { ok: true; entry: CatalogEntry; operationId: string } | { ok: false; error: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { ok: false, error: "invalid_request" };
  const b = body as Record<string, unknown>;
  const forbidden = ["price", "amount", "balance", "cottonCandy", "cottonCandyTotal", "uid", "email",
    "reward", "item", "ownedItems", "isPremium", "quantity"];
  for (const k of forbidden) if (k in b) return { ok: false, error: "forbidden_field:" + k };
  const allowed = new Set(["itemKey", "idToken"]);
  for (const k of Object.keys(b)) if (!allowed.has(k)) return { ok: false, error: "unexpected_field:" + k };

  const entry = getCatalogEntry(b.itemKey);
  if (!entry) return { ok: false, error: "unknown_item" };
  if (!isPurchasable(entry)) return { ok: false, error: "item_not_purchasable" };
  return { ok: true, entry, operationId: purchaseOperationId(entry) };
}
