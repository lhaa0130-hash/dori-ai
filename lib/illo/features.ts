// 일로 웹 기능 레지스트리 (웹 전용 — exe/apk 없음).
// 핵심 원칙: 기능은 "완성(released)된 것"만 보인다. 나머지는 전부 숨김 →
// 워크플로우가 완성될 때마다 released: true 로 하나씩 공개한다.

export type IlloGroup = '핵심' | 'AI 자동화 도구';
export const ILLO_GROUP_ORDER: IlloGroup[] = ['핵심', 'AI 자동화 도구'];

export interface IlloFeature {
  id: string;
  label: string;
  icon: string;
  group: IlloGroup;
  desc: string;
  kind: 'core' | 'tool';
  core?: boolean;        // 끌 수 없음(항상 고정)
  defaultOn?: boolean;   // 처음부터 켜짐
  released?: boolean;    // ✅ true인 것만 화면에 노출 (완성된 기능)
  badge?: 'new';
}

// ── 핵심 (released) — 항상 이 순서로 최상단 고정: 홈 / 워크플로우 / 비서실 / 설정 ──
const CORE_FEATURES: IlloFeature[] = [
  { id: 'home',      label: '홈',          icon: '🏠', group: '핵심', desc: '오늘 할 일과 내 도구', kind: 'core', core: true, released: true },
  { id: 'builder',   label: '워크플로우',   icon: '🛠️', group: '핵심', desc: '나만의 AI 자동화를 직접 설계', kind: 'core', core: true, released: true },
  { id: 'catalog',   label: '가이드',      icon: '📖', group: '핵심', desc: '어떤 AI/API가 있고, 키는 어디서 받는지 안내', kind: 'core', core: true, released: true },
  { id: 'docs',      label: '자료함',      icon: '📁', group: '핵심', desc: 'HTML 문서 저장·보기 + 내 부서(폴더)', kind: 'core', core: true, released: true },
  { id: 'assistant', label: '일리',        icon: '🐿️', group: '핵심', desc: 'AI 비서 일리 — 무엇이든 묻고, API 조합도 안내받기', kind: 'core', core: true, released: true },
  // 이미지/영상 생성은 사이드바에서 제외(숨김) — 워크플로우 노드로 대체
  { id: 'image',     label: '이미지 생성',  icon: '🎨', group: '핵심', desc: '글로 설명하면 이미지 생성', kind: 'core', released: false },
  { id: 'video',     label: '영상 생성',    icon: '🎬', group: '핵심', desc: '글로 설명하면 짧은 영상 생성', kind: 'core', released: false },
  { id: 'settings',  label: '설정',        icon: '⚙️', group: '핵심', desc: '키 · 테마 · 계정', kind: 'core', core: true, released: true },
  // 보관함(아래 "기능 추가·관리" 버튼으로 진입) — 사이드바 기본 메뉴엔 안 넣음
  { id: 'features',  label: '기능 보관함', icon: '🧩', group: '핵심', desc: '완성된 기능을 메뉴에 추가', kind: 'core', released: true },
];

// 사이드바에서 핵심 메뉴가 항상 이 순서로 보이도록 고정.
export const CORE_SIDEBAR_ORDER = ['home', 'catalog', 'assistant', 'builder', 'docs', 'settings'];

// ── AI 자동화 도구 ── ★ 여러 AI를 단계로 엮어야 의미 있는 기능만 유지(단일 AI 도구는 제거).
// 정의 순서는 자유 — 아래에서 라벨 가나다순으로 자동 정렬되어 노출됨.
const TOOL_FEATURES: IlloFeature[] = [
  // 콘텐츠
  { id: 'blog',       label: '블로그 글쓰기',     icon: '✍️', group: 'AI 자동화 도구', desc: '주제만 주면 검색 잘 되는 블로그 글 + 대표 이미지까지', kind: 'tool', released: true },
  { id: 'sns',        label: 'SNS 게시물 쓰기',   icon: '📱', group: 'AI 자동화 도구', desc: '인스타·페북에 올릴 글을 트렌드 맞춰 작성', kind: 'tool', released: true },
  { id: 'product',    label: '상품 상세페이지',   icon: '🛍️', group: 'AI 자동화 도구', desc: '쇼핑몰 상품 설명·광고문구 + 상품 이미지까지', kind: 'tool', released: true },
  { id: 'newsletter', label: '이메일 소식지',     icon: '📧', group: 'AI 자동화 도구', desc: '고객에게 보낼 이메일(뉴스레터)을 제목부터 본문까지', kind: 'tool', released: true },
  { id: 'press',      label: '보도자료(언론용)',  icon: '📰', group: 'AI 자동화 도구', desc: '기자·언론에 보내는 공식 발표문을 격식 맞춰', kind: 'tool', released: true },
  { id: 'youtube',    label: '유튜브 올리기 준비', icon: '▶️', group: 'AI 자동화 도구', desc: '영상 대본 + 제목·설명·태그 + 썸네일 문구까지', kind: 'tool', released: true },
  { id: 'website',        label: '홈페이지 만들기',  icon: '🌐', group: 'AI 자동화 도구', desc: '사업 소개만 주면 구성·문구 + 대표 이미지', kind: 'tool', released: true },
  { id: 'website_manage', label: '홈페이지 관리하기', icon: '🧰', group: 'AI 자동화 도구', desc: '문제 진단 + 개선안·수정 문구', kind: 'tool', released: true },
  // 전략·리서치
  { id: 'marketing',  label: '마케팅 전략 짜기',  icon: '📊', group: 'AI 자동화 도구', desc: '뭘 어디에 어떻게 알릴지 + 4주 실행계획', kind: 'tool', released: true },
  { id: 'competitor', label: '경쟁가게 분석',     icon: '🔭', group: 'AI 자동화 도구', desc: '경쟁업체와 비교해 우리만의 차별점 찾기', kind: 'tool', released: true },
  { id: 'persona',    label: '내 고객 그려보기', icon: '👥', group: 'AI 자동화 도구', desc: '내 손님이 누구인지 한 사람처럼 구체적으로', kind: 'tool', released: true },
  { id: 'plan',       label: '사업계획서 쓰기',   icon: '📈', group: 'AI 자동화 도구', desc: '아이템만 주면 투자·정부지원용 계획서 초안', kind: 'tool', released: true },
  { id: 'pitch',      label: '투자 설득자료(IR)', icon: '🚀', group: 'AI 자동화 도구', desc: '투자자 앞에서 쓸 짧은 발표·설득 자료', kind: 'tool', released: true },
  { id: 'keyword',    label: '검색 키워드 찾기',  icon: '🔑', group: 'AI 자동화 도구', desc: '사람들이 많이 검색하는 키워드·제목·태그', kind: 'tool', released: true },
  // 고객
  { id: 'reply',      label: '리뷰·댓글 답변',     icon: '🗨️', group: 'AI 자동화 도구', desc: '고객 후기·문의에 다는 답글을 정중하게', kind: 'tool', released: true },
  { id: 'voc',        label: '고객 후기 분석',     icon: '🔍', group: 'AI 자동화 도구', desc: '여러 후기를 모아 칭찬·불만·개선점 정리', kind: 'tool', released: true },
  // 돈·재무
  { id: 'estimate',   label: '견적서 만들기',      icon: '🧾', group: 'AI 자동화 도구', desc: '항목·금액 표와 견적서 초안', kind: 'tool', released: true },
  { id: 'finance',    label: '간편 장부 분석',     icon: '📒', group: 'AI 자동화 도구', desc: '매출·지출 정리 + 아낄 곳 찾기', kind: 'tool', released: true },
  { id: 'dunning',    label: '결제 안내·독촉',     icon: '💳', group: 'AI 자동화 도구', desc: '미수금·결제 안내 메시지(단계별)', kind: 'tool', released: true },
  { id: 'pricing',    label: '가격 정하기',        icon: '💰', group: 'AI 자동화 도구', desc: '경쟁가 참고 적정 가격·요금제 제안', kind: 'tool', released: true },
];

// 도구는 라벨 가나다(한글) 순으로 정렬해 노출. 핵심은 고정 순서로 최상단.
const sortedTools = [...TOOL_FEATURES].sort((a, b) => a.label.localeCompare(b.label, 'ko'));
export const ILLO_FEATURES: IlloFeature[] = [...CORE_FEATURES, ...sortedTools];

// ── 초성(ㄱㄴㄷ) 그룹 헤더용 ──
const CHO = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
// 쌍자음은 기본 자음으로 묶음 (ㄲ→ㄱ 등)
const CHO_BASE: Record<string, string> = { 'ㄲ': 'ㄱ', 'ㄸ': 'ㄷ', 'ㅃ': 'ㅂ', 'ㅆ': 'ㅅ', 'ㅉ': 'ㅈ' };

/** 라벨의 첫 글자 초성(ㄱ/ㄴ/ㄷ…). 영문은 'A–Z', 숫자·기타는 '#'. */
export function initialConsonant(label: string): string {
  const ch = (label || '').trim().charAt(0);
  const code = ch.charCodeAt(0);
  if (code >= 0xac00 && code <= 0xd7a3) {
    const lead = CHO[Math.floor((code - 0xac00) / 588)];
    return CHO_BASE[lead] || lead;
  }
  if (/[A-Za-z]/.test(ch)) return 'A–Z';
  return '#';
}

/** 문자열 전체를 초성 문자열로 변환(초성 검색용). 한글 외 문자는 그대로. 예: '블로그'→'ㅂㄹㄱ' */
export function toInitials(text: string): string {
  let out = '';
  for (const ch of text || '') {
    const code = ch.charCodeAt(0);
    if (code >= 0xac00 && code <= 0xd7a3) out += CHO[Math.floor((code - 0xac00) / 588)];
    else out += ch;
  }
  return out;
}

export const ILLO_FEATURE_BY_ID: Record<string, IlloFeature> =
  Object.fromEntries(ILLO_FEATURES.map((f) => [f.id, f]));

/** 공개된(released) 기능만 노출 대상. */
export function isReleased(id: string): boolean {
  return !!ILLO_FEATURE_BY_ID[id]?.released;
}

// 보관함에서 켜고 끌 수 있는 = 공개된 비핵심 기능
export const SELECTABLE_IDS = ILLO_FEATURES.filter((f) => f.released && !f.core).map((f) => f.id);

// 처음 시작 시 사이드바 기본 메뉴 = 홈·워크플로우·비서실·설정. 나머지 도구는 보관함에서 추가.
export const ILLO_DEFAULT_ENABLED: string[] = ['home', 'builder', 'assistant', 'settings'];

const LS_KEY = 'illo.web.enabledFeatures';

export function loadIlloEnabled(): string[] {
  const coreIds = ILLO_FEATURES.filter((f) => f.core).map((f) => f.id);
  // 핵심은 항상 고정 순서(홈/워크플로우/비서실/설정)로 맨 앞에. 누락분은 뒤에 보충.
  const core = [...CORE_SIDEBAR_ORDER.filter((id) => coreIds.includes(id))];
  for (const id of coreIds) if (!core.includes(id)) core.push(id);

  let storedTools: string[] = [];
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        // 공개(released)된 비핵심 도구만, 저장된 순서대로 유지
        storedTools = arr.filter((id: string) => isReleased(id) && !coreIds.includes(id));
      }
    }
  } catch { /* */ }

  return [...core, ...storedTools];
}

export function saveIlloEnabled(ids: string[]): void {
  try { localStorage.setItem(LS_KEY, JSON.stringify(ids)); } catch { /* */ }
}
