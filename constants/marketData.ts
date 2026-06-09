// 마켓 데이터 — 제품군(카테고리)별 어필리에이트 상품
// 인사이트(트렌드/가이드/…)처럼 카테고리로 구분해 노출합니다.
// 링크는 각 플랫폼의 검색/상품 URL(어필리에이트 태그 포함)로, 추후 봇/수동으로 확장 가능.

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

// ── 상품 목록 (확장 가능한 스타터 카탈로그) ────────────────
export const MARKET_PRODUCTS: MarketProduct[] = [
  // 가전
  { id: "ap-airpurifier", name: "공기청정기",       category: "appliance", source: "coupang", query: "공기청정기",         emoji: "🌬️", priceHint: "10만원대", summary: "미세먼지 걱정 끝, 실내 공기 관리 필수템", hot: true },
  { id: "ap-robotvac",    name: "로봇청소기",       category: "appliance", source: "amazon",  query: "robot vacuum cleaner", emoji: "🤖", priceHint: "30만원대~", summary: "청소는 맡기고 시간을 버세요" },
  { id: "ap-airfryer",    name: "에어프라이어",     category: "appliance", source: "coupang", query: "에어프라이어",       emoji: "🍟", priceHint: "5~10만원", summary: "기름 없이 바삭하게, 1인가구 필수" },
  { id: "ap-dehumid",     name: "제습기",           category: "appliance", source: "ali",     query: "dehumidifier",        emoji: "💧", priceHint: "가성비", summary: "장마철 눅눅함 잡는 제습 가전" },

  // 가구
  { id: "fn-deskchair",   name: "인체공학 의자",    category: "furniture", source: "coupang", query: "인체공학 의자",      emoji: "🪑", priceHint: "10만원대", summary: "오래 앉아도 편한 허리 받침 설계", hot: true },
  { id: "fn-standdesk",   name: "전동 스탠딩 책상", category: "furniture", source: "amazon",  query: "standing desk electric", emoji: "🖥️", priceHint: "20만원대~", summary: "앉았다 섰다, 건강한 작업 환경" },
  { id: "fn-shelf",       name: "수납 선반",        category: "furniture", source: "ali",     query: "storage shelf rack",  emoji: "🗄️", priceHint: "가성비", summary: "공간 활용도를 높이는 모듈 선반" },

  // 디지털·IT
  { id: "dg-laptop",      name: "AI 노트북",        category: "digital",   source: "amazon",  query: "AI laptop RTX",       emoji: "💻", priceHint: "고성능", summary: "온디바이스 AI까지 돌리는 워크스테이션", hot: true },
  { id: "dg-monitor",     name: "4K 모니터",        category: "digital",   source: "coupang", query: "4K 모니터",          emoji: "🖥️", priceHint: "20만원대", summary: "선명한 작업·콘텐츠 감상용 디스플레이" },
  { id: "dg-mouse",       name: "무선 마우스",      category: "digital",   source: "ali",     query: "wireless mouse ergonomic", emoji: "🖱️", priceHint: "가성비", summary: "손목 편한 정숙 무선 마우스" },
  { id: "dg-ssd",         name: "외장 SSD",         category: "digital",   source: "amazon",  query: "portable SSD 1TB",    emoji: "💾", priceHint: "10만원 이하", summary: "빠르고 가벼운 휴대용 저장장치" },

  // 주방
  { id: "kt-blender",     name: "초고속 블렌더",    category: "kitchen",   source: "coupang", query: "고속 블렌더",        emoji: "🥤", priceHint: "5~15만원", summary: "스무디·이유식까지 한 번에" },
  { id: "kt-coffee",      name: "캡슐 커피머신",    category: "kitchen",   source: "amazon",  query: "capsule coffee machine", emoji: "☕", priceHint: "10만원대", summary: "집에서 즐기는 카페 한 잔" },
  { id: "kt-knife",       name: "주방칼 세트",      category: "kitchen",   source: "ali",     query: "kitchen knife set",   emoji: "🔪", priceHint: "가성비", summary: "요리의 기본, 잘 드는 칼 세트" },

  // 생활·리빙
  { id: "lv-humid",       name: "가습기",           category: "living",    source: "coupang", query: "가습기",             emoji: "💨", priceHint: "5만원 이하", summary: "건조한 실내를 촉촉하게" },
  { id: "lv-organizer",   name: "수납 정리함",      category: "living",    source: "ali",     query: "storage organizer box", emoji: "📦", priceHint: "가성비", summary: "어수선한 공간을 깔끔하게" },
  { id: "lv-lamp",        name: "무드 조명",        category: "living",    source: "amazon",  query: "smart mood lamp",     emoji: "💡", priceHint: "3만원대", summary: "분위기를 바꾸는 스마트 조명" },

  // 뷰티·헬스
  { id: "bt-massage",     name: "마사지건",         category: "beauty",    source: "coupang", query: "마사지건",           emoji: "💆", priceHint: "5~10만원", summary: "뭉친 근육을 풀어주는 홈케어", hot: true },
  { id: "bt-derma",       name: "LED 마스크",       category: "beauty",    source: "amazon",  query: "LED face mask",       emoji: "✨", priceHint: "10만원대", summary: "집에서 하는 피부 관리" },
  { id: "bt-scale",       name: "스마트 체중계",    category: "beauty",    source: "ali",     query: "smart body scale",    emoji: "⚖️", priceHint: "가성비", summary: "체성분까지 측정하는 건강 관리" },

  // 패션
  { id: "fa-backpack",    name: "백팩",             category: "fashion",   source: "amazon",  query: "laptop backpack",     emoji: "🎒", priceHint: "5만원대", summary: "노트북도 쏙, 데일리 백팩" },
  { id: "fa-sneaker",     name: "스니커즈",         category: "fashion",   source: "coupang", query: "스니커즈",           emoji: "👟", priceHint: "가성비", summary: "어디든 잘 어울리는 데일리 슈즈" },
  { id: "fa-watch",       name: "패션 시계",        category: "fashion",   source: "ali",     query: "minimalist watch",    emoji: "⌚", priceHint: "가성비", summary: "심플한 디자인의 데일리 워치" },

  // 키즈·완구
  { id: "kd-block",       name: "블록 완구",        category: "kids",      source: "coupang", query: "블록 장난감",        emoji: "🧱", priceHint: "3만원대", summary: "창의력 쑥쑥 조립 블록" },
  { id: "kd-book",        name: "유아 학습용품",    category: "kids",      source: "amazon",  query: "kids learning toys",  emoji: "📚", priceHint: "가성비", summary: "놀면서 배우는 교육 완구" },
  { id: "kd-puzzle",      name: "퍼즐",             category: "kids",      source: "ali",     query: "kids puzzle",         emoji: "🧩", priceHint: "가성비", summary: "집중력을 길러주는 퍼즐" },

  // 스포츠·레저
  { id: "sp-yoga",        name: "요가매트",         category: "sports",    source: "coupang", query: "요가매트",           emoji: "🧘", priceHint: "2만원대", summary: "홈트의 시작, 미끄럼 방지 매트" },
  { id: "sp-tent",        name: "캠핑 텐트",        category: "sports",    source: "amazon",  query: "camping tent",        emoji: "⛺", priceHint: "10만원대", summary: "주말 캠핑을 위한 설치 간편 텐트" },
  { id: "sp-bottle",      name: "보온 텀블러",      category: "sports",    source: "ali",     query: "insulated tumbler",   emoji: "🥤", priceHint: "가성비", summary: "온도 유지력 좋은 휴대 텀블러" },

  // 반려동물
  { id: "pt-feeder",      name: "자동 급식기",      category: "pet",       source: "coupang", query: "반려동물 자동 급식기", emoji: "🍽️", priceHint: "5만원대", summary: "외출해도 안심, 정시 급식" },
  { id: "pt-bed",         name: "펫 방석",          category: "pet",       source: "ali",     query: "pet bed cushion",     emoji: "🛏️", priceHint: "가성비", summary: "포근하게 쉬는 반려동물 방석" },
  { id: "pt-toy",         name: "반려동물 장난감",  category: "pet",       source: "amazon",  query: "pet toys interactive", emoji: "🦴", priceHint: "가성비", summary: "지루할 틈 없는 놀이 장난감" },
];
