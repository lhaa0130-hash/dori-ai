// 마켓 데이터 — 제품군(카테고리) 분류
// 상품 목록은 data/market-products.json 에서 로드 (n8n 마켓 워크플로우가 자동 추가)
import productsJson from "@/data/market-products.json";

export type MarketSource = "amazon" | "coupang" | "ali";

export interface MarketCategory {
  key: string;
  label: string;
  emoji: string;
  desc: string;
}

export interface MarketProduct {
  id: string;
  name: string;
  category: string;      // MarketCategory.key
  source: MarketSource;
  query: string;         // 플랫폼 검색어
  url?: string;          // 지정 시 query 대신 직접 링크 사용
  emoji?: string;        // 카드 비주얼 (없으면 카테고리 이모지)
  priceHint?: string;    // 예: "₩₩", "10만원대"
  summary: string;       // 한 줄 설명
  hot?: boolean;
  weekly?: boolean;      // '이주의 상품' 상단 노출
}

// ── 제품군 카테고리 ───────────────────────────────────────
export const MARKET_CATEGORIES: MarketCategory[] = [
  { key: "appliance", label: "가전",        emoji: "🔌", desc: "생활을 바꾸는 똑똑한 가전제품" },
  { key: "furniture", label: "가구",        emoji: "🛋️", desc: "공간을 채우는 가구·인테리어" },
  { key: "digital",   label: "디지털·IT",   emoji: "💻", desc: "노트북·주변기기·스마트기기" },
  { key: "kitchen",   label: "주방",        emoji: "🍳", desc: "요리가 즐거워지는 주방용품" },
  { key: "living",    label: "생활·리빙",   emoji: "🧺", desc: "매일 쓰는 생활용품" },
  { key: "beauty",    label: "뷰티·헬스",   emoji: "💄", desc: "뷰티·건강·웰니스" },
  { key: "fashion",   label: "패션",        emoji: "👕", desc: "데일리 패션·잡화" },
  { key: "kids",      label: "키즈·완구",   emoji: "🧸", desc: "아이를 위한 장난감·용품" },
  { key: "sports",    label: "스포츠·레저", emoji: "🏕️", desc: "운동·캠핑·아웃도어" },
  { key: "pet",       label: "반려동물",    emoji: "🐶", desc: "반려동물 사료·용품" },
];

export const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  MARKET_CATEGORIES.map((c) => [c.key, c.label])
);
export const CATEGORY_EMOJI: Record<string, string> = Object.fromEntries(
  MARKET_CATEGORIES.map((c) => [c.key, c.emoji])
);

// ── 플랫폼 표시 정보 ───────────────────────────────────────
export const SOURCE_META: Record<MarketSource, { label: string; cta: string; cls: string }> = {
  amazon:  { label: "Amazon", cta: "아마존에서 보기", cls: "bg-[#232F3E] text-[#FF9900]" },
  coupang: { label: "쿠팡",   cta: "쿠팡에서 보기",   cls: "bg-[#E94B4B] text-white" },
  ali:     { label: "알리",   cta: "알리에서 보기",   cls: "bg-[#FF4747] text-white" },
};

// 어필리에이트 태그(아마존은 기존 태그 사용, 쿠팡/알리는 추후 파트너 링크로 교체)
const AMAZON_TAG = "illo00-20";

export function buildMarketUrl(p: MarketProduct): string {
  if (p.url) return p.url;
  const q = encodeURIComponent(p.query);
  switch (p.source) {
    case "amazon":  return `https://www.amazon.com/s?k=${q}&tag=${AMAZON_TAG}`;
    case "coupang": return `https://www.coupang.com/np/search?q=${q}`;
    case "ali":     return `https://www.aliexpress.com/wholesale?SearchText=${q}`;
  }
}

// ── 상품 목록 ──────────────────────────────────────────────
// data/market-products.json 에서 로드 (n8n 마켓 워크플로우가 리뷰 발행 시 자동 추가)
export const MARKET_PRODUCTS: MarketProduct[] = productsJson as unknown as MarketProduct[];

export function countByCategory(catKey: string): number {
  return MARKET_PRODUCTS.filter((p) => p.category === catKey).length;
}

// '이주의 상품' (weekly 플래그가 켜진 상품)
export function getWeeklyPicks(): MarketProduct[] {
  return MARKET_PRODUCTS.filter((p) => p.weekly);
}
