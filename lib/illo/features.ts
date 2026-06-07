// 일로 웹 기능 레지스트리 (웹 전용 — exe/apk 없음).
// 핵심 원칙: 기능은 "완성(released)된 것"만 보인다. 나머지는 전부 숨김 →
// 워크플로우가 완성될 때마다 released: true 로 하나씩 공개한다.

export type IlloGroup = '핵심' | 'AI 작업 도구';
export const ILLO_GROUP_ORDER: IlloGroup[] = ['핵심', 'AI 작업 도구'];

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

export const ILLO_FEATURES: IlloFeature[] = [
  // ── 핵심 (released) ──
  { id: 'home',      label: '홈',          icon: '🏠', group: '핵심', desc: '오늘 할 일과 내 도구', kind: 'core', core: true, released: true },
  { id: 'assistant', label: '비서실',      icon: '💬', group: '핵심', desc: 'AI 비서에게 무엇이든', kind: 'core', core: true, released: true },
  { id: 'features',  label: '기능 보관함', icon: '🧩', group: '핵심', desc: '완성된 기능을 메뉴에 추가', kind: 'core', core: true, released: true },
  { id: 'settings',  label: '설정',        icon: '⚙️', group: '핵심', desc: '키 · 테마 · 계정', kind: 'core', core: true, released: true },

  // ── AI 작업 도구 ── (released: true = 공개, false = 완성 전 숨김)
  // ✅ 1차 공개: 비서실 + 글쓰기 도구 5개
  { id: 'blog',    label: '블로그 글쓰기', icon: '✍️', group: 'AI 작업 도구', desc: '주제→SEO 블로그 글', kind: 'tool', released: true, defaultOn: true },
  { id: 'sns',     label: 'SNS 게시물',   icon: '📱', group: 'AI 작업 도구', desc: '인스타·페북·X 글+해시태그', kind: 'tool', released: true, defaultOn: true },
  { id: 'copy',    label: '광고 카피',     icon: '🎯', group: 'AI 작업 도구', desc: '광고 문구·슬로건', kind: 'tool', released: true, defaultOn: true },
  { id: 'product', label: '상품 상세',     icon: '🛍️', group: 'AI 작업 도구', desc: '쇼핑몰 상세설명', kind: 'tool', released: true, defaultOn: true },
  { id: 'summary', label: '문서 요약',     icon: '📑', group: 'AI 작업 도구', desc: '긴 글을 핵심만', kind: 'tool', released: true, defaultOn: true },

  // ⏳ 완성 전 — 숨김 (released 없음). 완성되면 released: true 로 공개.
  { id: 'docs',      label: '문서 작성',    icon: '📝', group: 'AI 작업 도구', desc: '보고서·제안서', kind: 'tool' },
  { id: 'mail',      label: '메일·메시지',  icon: '✉️', group: 'AI 작업 도구', desc: '메일/답장 작성', kind: 'tool' },
  { id: 'translate', label: '번역·교정',    icon: '🌐', group: 'AI 작업 도구', desc: '번역+문장 다듬기', kind: 'tool' },
  { id: 'meeting',   label: '회의록 요약',  icon: '📋', group: 'AI 작업 도구', desc: '회의→핵심·할일', kind: 'tool' },
  { id: 'reply',     label: '리뷰·댓글 답변', icon: '🗨️', group: 'AI 작업 도구', desc: '고객 응대 답변', kind: 'tool' },
];

export const ILLO_FEATURE_BY_ID: Record<string, IlloFeature> =
  Object.fromEntries(ILLO_FEATURES.map((f) => [f.id, f]));

/** 공개된(released) 기능만 노출 대상. */
export function isReleased(id: string): boolean {
  return !!ILLO_FEATURE_BY_ID[id]?.released;
}

// 보관함에서 켜고 끌 수 있는 = 공개된 비핵심 기능
export const SELECTABLE_IDS = ILLO_FEATURES.filter((f) => f.released && !f.core).map((f) => f.id);

// 처음 시작 시 켜짐 (핵심 + defaultOn, 모두 released)
export const ILLO_DEFAULT_ENABLED: string[] = [
  'home', 'assistant',
  'blog', 'sns', 'copy', 'product', 'summary',
  'features', 'settings',
];

const LS_KEY = 'illo.web.enabledFeatures';

export function loadIlloEnabled(): string[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        // 공개(released)된 것만 유지 + 핵심 보충 (숨김 기능이 저장돼 있어도 제거)
        const valid = arr.filter((id: string) => isReleased(id));
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
