// 일로 웹 기능 레지스트리 — EXE(데스크톱)의 features.ts에 대응.
// 커스터마이징의 핵심: 사용자는 enabled(켠 목록)에 있는 기능만 사이드바에서 본다.
// 나머지는 "기능 보관함"에서 꺼내 쓴다. (블로그·SNS는 기본 꺼짐 → 필요한 사람만 추가)

export type IlloGroup = '핵심' | 'AI 작업 도구' | 'PC 전용';

export interface IlloFeature {
  id: string;            // view id (core) 또는 ILLO_TOOL_BY_ID 키(tool)
  label: string;
  icon: string;
  group: IlloGroup;
  desc: string;
  kind: 'core' | 'tool' | 'pc'; // core=내장화면, tool=AI도구, pc=PC전용(안내만)
  core?: boolean;        // true면 끌 수 없음(항상 고정)
  defaultOn?: boolean;   // 처음 시작 시 켜져 있음
  badge?: 'new';
}

export const ILLO_GROUP_ORDER: IlloGroup[] = ['핵심', 'AI 작업 도구', 'PC 전용'];

export const ILLO_FEATURES: IlloFeature[] = [
  // ── 핵심 (끌 수 없음) ──
  { id: 'home', label: '홈', icon: '🏠', group: '핵심', desc: '오늘 할 일과 내 도구를 한눈에', kind: 'core', core: true },
  { id: 'assistant', label: '비서실', icon: '💬', group: '핵심', desc: 'AI 비서에게 무엇이든 물어보고 일을 시켜요', kind: 'core', core: true },
  { id: 'features', label: '기능 보관함', icon: '🧩', group: '핵심', desc: '필요한 기능만 꺼내서 내 메뉴에 추가', kind: 'core', core: true },
  { id: 'settings', label: '설정', icon: '⚙️', group: '핵심', desc: 'API 키 · 테마 · 계정', kind: 'core', core: true },

  // ── AI 작업 도구 (보관함에서 꺼내 씀) ──
  { id: 'docs', label: '문서 작성', icon: '📝', group: 'AI 작업 도구', desc: '보고서·제안서·공지 초안', kind: 'tool', defaultOn: true },
  { id: 'mail', label: '메일·메시지', icon: '✉️', group: 'AI 작업 도구', desc: '상황만 입력하면 메일/답장 작성', kind: 'tool', defaultOn: true },
  { id: 'summary', label: '문서 요약', icon: '📑', group: 'AI 작업 도구', desc: '긴 글·자료를 핵심만 요약', kind: 'tool', defaultOn: true },
  { id: 'copy', label: '광고 카피', icon: '🎯', group: 'AI 작업 도구', desc: '광고 문구·슬로건 생성', kind: 'tool', defaultOn: true },
  { id: 'product', label: '상품 상세', icon: '🛍️', group: 'AI 작업 도구', desc: '쇼핑몰 상품 상세설명', kind: 'tool', defaultOn: true },
  { id: 'reply', label: '리뷰·댓글 답변', icon: '🗨️', group: 'AI 작업 도구', desc: '고객 리뷰/문의에 정중한 답변', kind: 'tool', defaultOn: true },
  { id: 'translate', label: '번역·교정', icon: '🌐', group: 'AI 작업 도구', desc: '번역 + 문장 다듬기', kind: 'tool', defaultOn: true },
  { id: 'meeting', label: '회의록 요약', icon: '📋', group: 'AI 작업 도구', desc: '회의 내용을 핵심·할 일로', kind: 'tool', defaultOn: true },
  // 블로그·SNS는 기본 꺼짐 — 필요한 사람만 보관함에서 추가
  { id: 'blog', label: '블로그 글쓰기', icon: '✍️', group: 'AI 작업 도구', desc: '주제→SEO 블로그 글 초안', kind: 'tool' },
  { id: 'sns', label: 'SNS 게시물', icon: '📱', group: 'AI 작업 도구', desc: '인스타·페북·X 글 + 해시태그', kind: 'tool' },

  // ── PC 전용 (웹에선 안내만, 데스크톱에서 사용) ──
  { id: 'pc_office', label: 'AI 직원', icon: '🏢', group: 'PC 전용', desc: 'AI 직원을 채용하고 일을 맡기기', kind: 'pc' },
  { id: 'pc_studio', label: '스튜디오', icon: '🎨', group: 'PC 전용', desc: '이미지·영상 생성', kind: 'pc' },
  { id: 'pc_site', label: '사이트 배포', icon: '🌐', group: 'PC 전용', desc: '내 사이트 글 관리·배포', kind: 'pc' },
  { id: 'pc_automation', label: '자동화', icon: '⏰', group: 'PC 전용', desc: '정해진 시각에 팀 자동 실행', kind: 'pc' },
];

export const ILLO_FEATURE_BY_ID: Record<string, IlloFeature> =
  Object.fromEntries(ILLO_FEATURES.map((f) => [f.id, f]));

// 사이드바에 꺼낼 수 있는(=실제 동작) 기능만. PC 전용은 보관함에 정보로만 표시.
export const SELECTABLE_IDS = ILLO_FEATURES.filter((f) => f.kind !== 'pc').map((f) => f.id);

// 처음 시작 시 켜짐 (핵심 + defaultOn). 좋은 기본 순서로.
export const ILLO_DEFAULT_ENABLED: string[] = [
  'home', 'assistant',
  'docs', 'mail', 'summary', 'copy', 'product', 'reply', 'translate', 'meeting',
  'features', 'settings',
];

const LS_KEY = 'illo.web.enabledFeatures';

export function loadIlloEnabled(): string[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        const valid = arr.filter((id: string) => ILLO_FEATURE_BY_ID[id] && ILLO_FEATURE_BY_ID[id].kind !== 'pc');
        const coreIds = ILLO_FEATURES.filter((f) => f.core).map((f) => f.id);
        const missingCore = coreIds.filter((id) => !valid.includes(id));
        return [...missingCore, ...valid];
      }
    }
  } catch { /* */ }
  return ILLO_DEFAULT_ENABLED;
}

export function saveIlloEnabled(ids: string[]): void {
  try { localStorage.setItem(LS_KEY, JSON.stringify(ids)); } catch { /* */ }
}
