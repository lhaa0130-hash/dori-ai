// 🤖 AI 자동화 세트(파이프라인) — 여러 AI + 액션을 하나의 흐름으로 엮는다.
// 각 단계의 모델은 modelMatrix(비용 최적화)를 참조 → 단일 소스, 매달 매트릭스만 갱신.
// 소비자는 "세트"를 고르고 자료만 주면, 1번→2번→검토→최종→전송까지 자동 진행.
//
// ⚠️ 실행 연동 현황: 이 파일은 "설정(레시피)"이다. 실제 실행에는 아래가 필요:
//   - research 단계의 웹검색(Tavily 등)
//   - 이미지/영상 입력 분석(vision 모델)
//   - 전송(deliver): 이메일(메일 API) / 카카오('나에게 보내기' OAuth)
//   데스크톱(PC)은 웹검색·로컬AI·전송이 이미 있어 유리, 웹은 단계적으로 붙임.

import { pickForFeature, type ModelPick } from './modelMatrix';

export type StepKind =
  | 'input'      // 사용자 입력 수집
  | 'vision'     // 전달받은 이미지/영상 분석
  | 'research'   // 자료 조사(기존+웹)
  | 'generate'   // 본문 생성
  | 'review'     // 검토·교정
  | 'finalize'   // 최종본 정리
  | 'media'      // 이미지/영상/음성 생성
  | 'deliver';   // 전송(액션, 모델 불필요)

export type DeliverChannel = 'email' | 'kakao' | 'download' | 'approval' | 'telegram';

export interface AutoStep {
  kind: StepKind;
  title: string;
  feature?: string;          // modelMatrix 기능 id → 모델 자동 결정 (deliver/input은 없음)
  instruction?: string;      // 이 단계 AI의 역할 지시
  uses?: string[];           // 입력 소스(사용자자료 / 이전단계 결과 등)
  deliver?: DeliverChannel;  // kind==='deliver'일 때 채널
}

export interface AutomationSet {
  id: string;
  name: string;
  icon: string;
  desc: string;
  userInputs: string[];      // 사용자가 제공할 것
  steps: AutoStep[];
}

export const AUTOMATIONS: AutomationSet[] = [
  {
    id: 'sns_pack',
    name: 'SNS 게시물 자동 제작',
    icon: '📱',
    desc: '이미지/영상을 주면 → 조사 → 글 작성 → 검토 → 최종본 → 카톡·이메일 전송까지 자동.',
    userInputs: ['이미지 또는 영상(필수)', '간단 메모·주제(선택)'],
    steps: [
      { kind: 'vision', title: '자료 분석', feature: 'vision',
        instruction: '전달받은 이미지/영상이 무엇인지, 무엇을 홍보할 수 있는지 핵심을 뽑아라.',
        uses: ['사용자 자료', '사용자 메모'] },
      { kind: 'research', title: '자료 조사', feature: 'research',
        instruction: '분석 결과를 바탕으로 관련 트렌드·해시태그·경쟁 게시물을 조사해 요점을 정리하라.',
        uses: ['1단계 결과'] },
      { kind: 'generate', title: 'SNS 글 작성', feature: 'sns',
        instruction: '조사 내용으로 플랫폼에 맞는 매력적인 SNS 게시물 초안을 작성하라(해시태그 포함).',
        uses: ['2단계 결과'] },
      { kind: 'review', title: '검토·교정', feature: 'review',
        instruction: '맞춤법·톤·사실관계·정책위반을 점검하고 더 나은 버전으로 수정하라. 무엇을 고쳤는지 한 줄 메모.',
        uses: ['3단계 결과'] },
      { kind: 'finalize', title: '최종본 정리', feature: 'sns',
        instruction: '검토 반영해 바로 게시 가능한 최종본으로 정리(본문 + 해시태그 + 추천 발행시간).',
        uses: ['4단계 결과'] },
      { kind: 'deliver', title: '전송', deliver: 'kakao',
        instruction: '최종본을 사용자 카카오(나에게 보내기) 또는 이메일로 전송.' },
    ],
  },
  {
    id: 'blog_pack',
    name: '블로그 글 자동 발행',
    icon: '✍️',
    desc: '주제만 주면 → 조사 → SEO 글 작성 → 검토 → 최종본 → 전송/발행.',
    userInputs: ['글 주제·키워드(필수)'],
    steps: [
      { kind: 'research', title: '주제 조사', feature: 'research', instruction: '주제 관련 최신 정보·키워드·경쟁글을 조사해 개요를 잡아라.', uses: ['사용자 주제'] },
      { kind: 'generate', title: '본문 작성', feature: 'blog', instruction: 'SEO 구조(제목·H2·마무리·해시태그)로 본문을 작성하라.', uses: ['1단계 결과'] },
      { kind: 'review', title: '검토·교정', feature: 'review', instruction: '가독성·정확성·SEO를 점검하고 다듬어라.', uses: ['2단계 결과'] },
      { kind: 'finalize', title: '최종본', feature: 'blog', instruction: '발행용 최종본으로 정리.', uses: ['3단계 결과'] },
      { kind: 'deliver', title: '전송', deliver: 'email', instruction: '최종본을 이메일로 전송(또는 사이트 초안 등록).' },
    ],
  },
  {
    id: 'product_pack',
    name: '상품 등록 자료 자동 제작',
    icon: '🛍️',
    desc: '상품 사진/정보를 주면 → 분석 → 상세설명 + 카피 → 검토 → 전송.',
    userInputs: ['상품 사진(선택)', '상품 정보(이름·특징·가격)'],
    steps: [
      { kind: 'vision', title: '상품 분석', feature: 'vision', instruction: '사진과 정보를 보고 강점·타깃을 정리.', uses: ['사용자 자료'] },
      { kind: 'generate', title: '상세설명 작성', feature: 'product', instruction: '구매전환형 상세설명을 작성.', uses: ['1단계 결과'] },
      { kind: 'generate', title: '광고 카피', feature: 'copy', instruction: '같은 상품의 광고 카피 5개를 작성.', uses: ['1단계 결과'] },
      { kind: 'review', title: '검토', feature: 'review', instruction: '과장·오류를 점검하고 다듬어라.', uses: ['2단계 결과', '3단계 결과'] },
      { kind: 'deliver', title: '전송', deliver: 'email', instruction: '상세설명+카피 묶음을 이메일로 전송.' },
    ],
  },
  {
    id: 'cs_reply',
    name: '고객 문의 자동 답변',
    icon: '🗨️',
    desc: '고객 문의를 주면 → 의도 파악 → 정중한 답변 → 검토 → 전송.',
    userInputs: ['고객 문의 내용(필수)'],
    steps: [
      { kind: 'generate', title: '답변 작성', feature: 'reply', instruction: '공감→해결→마무리 구조의 정중한 답변을 작성.', uses: ['사용자 문의'] },
      { kind: 'review', title: '검토', feature: 'review', instruction: '톤·정책·오해소지를 점검하고 다듬어라.', uses: ['1단계 결과'] },
      { kind: 'deliver', title: '전송', deliver: 'approval', instruction: '검토 후 사용자가 승인하면 발송(반자동).' },
    ],
  },
];

export const AUTOMATION_BY_ID: Record<string, AutomationSet> =
  Object.fromEntries(AUTOMATIONS.map((a) => [a.id, a]));

// ── 도구별 워크플로우(소비자 표시용) — 모델명 없이 "단계 흐름"만 ──
const STEP_ICON: Record<StepKind, string> = {
  input: '📥', vision: '🔍', research: '📚', generate: '✍️',
  review: '✅', finalize: '📑', media: '🎨', deliver: '📤',
};
const TOOL_TO_SET: Record<string, string> = {
  sns: 'sns_pack', blog: 'blog_pack', product: 'product_pack', reply: 'cs_reply',
};

/** 도구 id의 워크플로우 단계(아이콘+제목). 자동화 세트가 있으면 그 흐름, 없으면 단순 흐름. */
export function flowForTool(toolId: string): { icon: string; title: string }[] {
  return flowDetailForTool(toolId).map(({ icon, title }) => ({ icon, title }));
}

// 역할(kind) 한 줄 라벨 — 소비자용
const KIND_ROLE: Record<StepKind, string> = {
  input: '입력', vision: '분석 AI', research: '조사 AI', generate: '작성 AI',
  review: '검토 AI', finalize: '편집 AI', media: '제작 AI', deliver: '전송',
};
function shorten(s: string, n = 46): string {
  const t = (s || '').replace(/\s+/g, ' ').trim();
  if (t.length <= n) return t;
  const cut = t.slice(0, n);
  return cut.slice(0, Math.max(cut.lastIndexOf(' '), cut.lastIndexOf('.'), 20)).trim() + '…';
}

export interface FlowStepDetail { icon: string; title: string; role: string; detail: string; kind: StepKind; }

// 단계별 상세 설명(소비자용) — "그 AI가 실제로 어떻게 잘 하는지".
// 인덱스는 각 세트의 steps 순서와 일치.
const FLOW_DESC: Record<string, string[]> = {
  sns: [
    '올려주신 사진·영상을 살펴 무엇을 홍보할지, 분위기·색감·핵심 셀링포인트를 읽어내 다음 단계가 쓸 재료로 정리해요.',
    '지금 잘 먹히는 트렌드·인기 해시태그·경쟁 게시물을 조사해, 어떤 톤과 키워드가 반응이 좋은지 근거와 함께 추려요.',
    '플랫폼(인스타·X 등)에 맞춰 첫 줄에서 시선을 잡는 후킹 문구 + 본문 + 해시태그 초안을 써요. 행동을 유도하는 마무리까지.',
    '다른 AI가 교차로 검토해요 — 맞춤법·과장·사실오류·정책위반을 잡고, 더 자연스럽고 설득력 있게 고쳐요.',
    '바로 올릴 수 있게 본문·해시태그·추천 발행 시간대까지 깔끔히 정리해요.',
    '완성본을 카카오(나에게 보내기)나 이메일로 보내드려요. (전송은 곧 오픈)',
  ],
  blog: [
    '주제 관련 최신 정보·검색 키워드·상위 노출 경쟁글을 조사해, 검색에 잘 걸리는 글 구성(개요)을 먼저 잡아요.',
    '제목 후보 → 도입 → 소제목(H2) 3~5개 → 마무리 → 해시태그 구조로, 정보가 충실하고 읽기 쉬운 본문을 작성해요.',
    '가독성·정확성·SEO(키워드를 자연스럽게 배치)를 점검하고, 늘어지거나 약한 부분을 보강해 완성도를 높여요.',
    '오탈자·문체 통일까지 마쳐 바로 발행 가능한 최종본으로 정리해요.',
    '완성본을 이메일로 보내거나 사이트 초안으로 등록해요. (전송은 곧 오픈)',
  ],
  product: [
    '상품 사진과 정보를 보고 핵심 강점·타깃 고객·경쟁 대비 차별점을 정리해요.',
    '캐치프레이즈 → 핵심 이점 → 사용 시나리오 → 스펙 요약 → 구매를 부르는 마무리 순으로, 전환을 노린 상세설명을 써요.',
    '같은 상품으로 톤이 다른 광고 카피 5개를 만들어 골라 쓸 수 있게 해요.',
    '과장·표시광고 위반 소지·오류가 없는지 점검하고 신뢰감 있게 다듬어요.',
    '상세설명+카피 묶음을 이메일로 보내드려요. (전송은 곧 오픈)',
  ],
  reply: [
    '고객 문의의 의도와 감정을 먼저 읽고, 공감 → 해결/안내 → 따뜻한 마무리 구조로 정중한 답변을 써요.',
    '톤이 과하거나 부족하지 않은지, 정책·오해 소지가 없는지 점검하고 더 매끄럽게 다듬어요.',
    '검토가 끝나면 사장님이 한 번 확인·승인한 뒤 발송해요(반자동). (전송은 곧 오픈)',
  ],
};

// ── 사용자가 추가할 수 있는 "단계 팔레트" ──
export const STEP_PALETTE: FlowStepDetail[] = [
  { kind: 'input',    icon: '🚀', title: '시작하기',     role: '시작', detail: '이름을 붙이고 시작 지시(프롬프트)를 적으면, 그 내용이 연결된 다음 노드들로 흘러가 업무가 진행돼요.' },
  { kind: 'research', icon: '📚', title: '자료 조사',   role: '조사 AI', detail: '관련 정보·트렌드·근거를 웹에서 조사해 정리해요.' },
  { kind: 'vision',   icon: '🔍', title: '자료 분석',   role: '분석 AI', detail: '올린 이미지/영상/자료를 분석해 핵심을 뽑아요.' },
  { kind: 'generate', icon: '✍️', title: 'AI 작성',     role: '작성 AI', detail: '내용을 글로 작성해요.' },
  { kind: 'review',   icon: '✅', title: '검토·교정',   role: '검토 AI', detail: '다른 AI가 교차로 검토하고 다듬어요.' },
  { kind: 'media',    icon: '🎨', title: '이미지 생성', role: '제작 AI', detail: '글·주제에 어울리는 이미지를 자동 생성해요. (곧 오픈)' },
  { kind: 'media',    icon: '🎬', title: '영상 생성',   role: '제작 AI', detail: '짧은 홍보 영상을 자동 생성해요. (곧 오픈)' },
  { kind: 'media',    icon: '🎙️', title: '음성 더빙',   role: '제작 AI', detail: '텍스트를 자연스러운 음성으로 변환해요. (곧 오픈)' },
  { kind: 'finalize', icon: '📑', title: '최종본 정리', role: '편집 AI', detail: '바로 쓸 수 있게 최종본으로 정리해요.' },
  { kind: 'deliver',  icon: '📤', title: '전송(이메일/카카오/텔레그램)', role: '전송', detail: '완성본을 이메일·카카오·텔레그램으로 보내요.' },
];

// ── 도구별 사용자 커스텀 워크플로우 저장 (localStorage) ──
const FLOW_LS = (id: string) => 'illo.web.flow.' + id;
export function loadCustomFlow(toolId: string): FlowStepDetail[] | null {
  try {
    const r = localStorage.getItem(FLOW_LS(toolId));
    if (r) { const a = JSON.parse(r); if (Array.isArray(a) && a.length) return a as FlowStepDetail[]; }
  } catch { /* */ }
  return null;
}
export function saveCustomFlow(toolId: string, steps: FlowStepDetail[]): void {
  try { localStorage.setItem(FLOW_LS(toolId), JSON.stringify(steps)); } catch { /* */ }
}
export function clearCustomFlow(toolId: string): void {
  try { localStorage.removeItem(FLOW_LS(toolId)); } catch { /* */ }
}
export function hasCustomFlow(toolId: string): boolean {
  try { return !!localStorage.getItem(FLOW_LS(toolId)); } catch { return false; }
}

// ── 16개 패키지별 멀티AI 워크플로우(기본값) — "어떤 AI들이 어떻게 엮이는지" ──
const st = (kind: StepKind, title: string, detail: string): FlowStepDetail =>
  ({ icon: STEP_ICON[kind], title, role: KIND_ROLE[kind], detail, kind });

export const PACKAGE_FLOWS: Record<string, FlowStepDetail[]> = {
  // 콘텐츠
  blog: [
    st('research', '자료·키워드 조사', '주제 관련 최신 정보·검색 키워드·상위 경쟁글을 조사해 글 개요를 잡아요.'),
    st('generate', '본문 작성', '제목·도입·소제목(H2)·마무리 구조로 SEO에 맞는 본문을 작성해요.'),
    st('review', '교차 검토', '다른 AI가 가독성·정확성·SEO·오탈자를 점검하고 보강해요.'),
    st('media', '대표 이미지 프롬프트', '글에 어울리는 대표 이미지 생성 프롬프트를 만들어요. (이미지 AI 연동 예정)'),
    st('finalize', '패키지 완성', '제목·본문·메타·해시태그·이미지·홍보문구를 한 묶음으로 정리해요.'),
  ],
  sns: [
    st('research', '트렌드·해시태그 조사', '지금 잘 먹히는 트렌드·인기 해시태그·반응 좋은 톤을 조사해요.'),
    st('generate', '게시물 작성', '첫 줄 후킹 + 본문 + 대안 버전을 플랫폼에 맞게 작성해요.'),
    st('review', '교차 검토', '과장·오류·정책위반을 잡고 더 자연스럽게 다듬어요.'),
    st('media', '이미지 프롬프트', '게시물에 어울리는 대표 이미지 프롬프트를 만들어요. (이미지 AI 연동 예정)'),
    st('finalize', '패키지 완성', '본문·해시태그·이미지·추천 발행시간을 묶어요.'),
  ],
  product: [
    st('vision', '상품 분석', '상품 정보·사진에서 핵심 강점·타깃·차별점을 읽어내요.'),
    st('generate', '상세·카피 작성', '구매전환형 상세설명 + 광고 카피 5개 + 예상 Q&A를 작성해요.'),
    st('review', '표시광고 검토', '과장·표시광고 위반 소지·오류를 점검하고 신뢰감 있게 다듬어요.'),
    st('media', '상품 이미지 프롬프트', '상품 컷 이미지 생성 프롬프트를 만들어요. (이미지 AI 연동 예정)'),
    st('finalize', '패키지 완성', '상세설명·카피·이미지·Q&A를 한 묶음으로 정리해요.'),
  ],
  newsletter: [
    st('research', '소식 큐레이션', '넣을 소식·팁을 정리하고 독자가 좋아할 순서로 큐레이션해요.'),
    st('generate', '본문 작성', '열어보고 싶은 제목 + 미리보기 + 본문 + CTA를 작성해요.'),
    st('review', '교차 검토', '톤·분량·CTA가 적절한지 점검하고 다듬어요.'),
    st('finalize', '발송 패키지', '제목 후보·미리보기·본문·CTA를 발송 직전 묶음으로 정리해요.'),
  ],
  press: [
    st('research', '사실 조사', '소식의 사실관계·수치·맥락을 확인해 신뢰도 높은 재료를 모아요.'),
    st('generate', '격식 작성', '헤드라인·부제·리드문단(육하원칙)·본문·인용문을 격식체로 작성해요.'),
    st('review', '과장·오류 검토', '과장 표현·사실오류·표기를 점검해 배포 가능한 수준으로 다듬어요.'),
    st('finalize', '배포 패키지', '본문·인용·회사소개·배포처 제안까지 한 묶음으로 정리해요.'),
  ],
  youtube: [
    st('research', '주제 조사', '주제 관련 인기 영상·키워드·후킹 포인트를 조사해요.'),
    st('generate', '대본·메타 작성', '대본 + 제목 후보 + 설명문 + 태그 + 챕터를 작성해요.'),
    st('review', '교차 검토', '흐름·후킹·SEO를 점검하고 보강해요.'),
    st('media', '썸네일 프롬프트', '썸네일 문구와 썸네일 이미지 프롬프트를 만들어요. (이미지 AI 연동 예정)'),
    st('finalize', '패키지 완성', '대본·제목·설명·태그·챕터·썸네일·고정댓글을 묶어요.'),
  ],
  // 전략·리서치
  marketing: [
    st('research', '시장·트렌드 리서치', '업종·타깃·경쟁 환경과 잘 먹히는 채널·전술을 조사해요.'),
    st('generate', '전략 수립', '최고급 추론 AI가 타깃·채널 전술·4주 플랜·KPI를 설계해요.'),
    st('review', '실행성 검토', '예산·실행 가능성·우선순위를 점검하고 다듬어요.'),
    st('review', '비판적 재검토', '관점이 다른 AI가 약점·리스크·놓친 기회를 한 번 더 파고들어 보강해요.'),
    st('finalize', '실행 패키지', '전술·4주 플랜·KPI·당장 할 일 3가지로 정리해요.'),
  ],
  competitor: [
    st('research', '경쟁사 조사', '경쟁사 가격·메뉴·마케팅·강약점 정보를 수집해요.'),
    st('generate', '비교·차별화 분석', '비교표를 만들고 우리만의 차별화 포인트를 도출해요.'),
    st('review', '검토', '근거 없는 추측을 가정으로 표시하고 균형 있게 다듬어요.'),
    st('finalize', '분석 패키지', '비교표·강약점·차별화·실행안으로 정리해요.'),
  ],
  persona: [
    st('research', '시장 리서치', '타깃 고객의 인구통계·행동·고민·채널을 조사해요.'),
    st('generate', '페르소나 종합', '대표 페르소나 2~3명과 각자에게 꽂힐 메시지를 만들어요.'),
    st('review', '검토', '현실성·구체성을 점검하고 보강해요.'),
    st('finalize', '페르소나 패키지', '페르소나·메시지·채널·콘텐츠 아이디어로 정리해요.'),
  ],
  plan: [
    st('research', '시장 조사', '시장 규모·타깃·경쟁을 조사해 근거를 모아요.'),
    st('generate', '전략·재무 작성', '최고급 추론 AI가 문제·솔루션·BM·실행 로드맵·간단 재무 추정을 작성해요.'),
    st('review', '교차 검토', '논리·수치·실행 가능성을 점검하고 다듬어요.'),
    st('review', '비판적 재검토', '심사위원 관점의 다른 AI가 허점·과장·리스크를 한 번 더 파고들어요.'),
    st('finalize', '계획 패키지', '전 섹션을 사업계획서 묶음으로 정리해요.'),
  ],
  pitch: [
    st('research', '시장·경쟁 조사', '시장 규모·경쟁·트랙션 근거를 모아요.'),
    st('generate', 'IR 스토리 작성', '최고급 추론 AI가 피치·IR 한 장·슬라이드 흐름을 설계해요.'),
    st('review', '검토', '투자자 관점에서 약한 논리·빈틈을 점검해요.'),
    st('review', '투자자 비판 검토', 'VC 관점의 다른 AI가 날카로운 반론·예상 Q&A를 던져 보강해요.'),
    st('finalize', '피치 패키지', '피치·IR요약·슬라이드 흐름·예상 Q&A로 정리해요.'),
  ],
  keyword: [
    st('research', '검색 트렌드 조사', '검색량·구매의도·경쟁도 관점에서 키워드를 조사해요.'),
    st('generate', '키워드·메타 설계', '대표·롱테일·질문형 키워드와 제목태그·메타를 설계해요.'),
    st('review', '검토', '키워드 적합성·중복을 점검하고 다듬어요.'),
    st('finalize', 'SEO 패키지', '키워드 표·메타·콘텐츠 주제 제안으로 정리해요.'),
  ],
  // 미디어
  imgprompt: [
    st('generate', '프롬프트 설계', '의도를 분석해 주제·스타일·구도·조명·색감을 담은 프롬프트를 설계해요.'),
    st('review', '품질 점검', '모호한 표현을 구체화하고 네거티브 프롬프트를 보강해요.'),
    st('media', '이미지 생성', '전문 이미지 AI(fal.ai 등)가 실제 이미지를 생성해요. (연동 예정)'),
    st('finalize', '결과 패키지', '프롬프트·네거티브·비율·대안까지 묶어요.'),
  ],
  vidprompt: [
    st('generate', '콘티·프롬프트 설계', '장면별 콘티와 카메라 무빙·분위기를 담은 영상 프롬프트를 설계해요.'),
    st('review', '연출 점검', '흐름·길이·연출을 점검하고 다듬어요.'),
    st('media', '영상 생성', '전문 영상 AI(fal.ai 등)가 실제 영상을 생성해요. (연동 예정)'),
    st('finalize', '결과 패키지', '콘티·프롬프트·길이·음악/자막 제안을 묶어요.'),
  ],
  // 고객
  reply: [
    st('vision', '문의 의도 분석', '고객 글의 의도와 감정을 먼저 읽어요.'),
    st('generate', '답변 작성', '공감→해결→마무리 구조로 짧은/자세한 답변을 작성해요.'),
    st('review', '톤·정책 검토', '톤·정책·오해 소지를 점검하고 다듬어요.'),
    st('deliver', '승인 후 발송', '사장님이 확인·승인하면 발송해요(반자동). (전송 연동 예정)'),
  ],
  voc: [
    st('research', '리뷰 수집·분류', '여러 리뷰를 칭찬/불만/주제별로 분류해요.'),
    st('generate', '인사이트 종합', '빈도·감정·우선순위를 분석해 실행안을 도출해요.'),
    st('review', '검토', '대표 문구 인용이 적절한지 점검하고 다듬어요.'),
    st('finalize', 'VOC 패키지', '칭찬·불만·우선순위·실행안·대표문구로 정리해요.'),
  ],
};

/** 도구 id의 "상세" 워크플로우(기본값) — 각 단계가 무슨 일을 어떻게 하는지 설명 포함. */
export function flowDetailForTool(toolId: string): FlowStepDetail[] {
  if (PACKAGE_FLOWS[toolId]) return PACKAGE_FLOWS[toolId];
  const setId = TOOL_TO_SET[toolId];
  if (setId && AUTOMATION_BY_ID[setId]) {
    const descs = FLOW_DESC[toolId] || [];
    return AUTOMATION_BY_ID[setId].steps.map((s, i) => ({
      icon: STEP_ICON[s.kind] || '•',
      title: s.title,
      role: KIND_ROLE[s.kind] || '',
      detail: descs[i] || (s.kind === 'deliver' ? '완성본을 카카오/이메일로 전송해요' : shorten(s.instruction || '', 70)),
      kind: s.kind,
    }));
  }
  // 단순 도구 기본 흐름 (블로그·SNS 등 세트가 없는 도구)
  return [
    { icon: '📥', title: '내용 입력', role: '입력', detail: '무엇을 만들지 주제·자료와 옵션(말투·길이·플랫폼 등)을 골라 입력해요.', kind: 'input' },
    { icon: '✍️', title: 'AI 작성', role: '작성 AI', detail: '이 작업에 가장 잘 맞는 AI가 입력 내용과 옵션을 반영해, 바로 쓸 수 있는 초안을 작성해요.', kind: 'generate' },
    { icon: '✅', title: '자가 점검', role: '검토', detail: '작성한 AI가 스스로 다시 읽으며 빠진 내용·어색한 표현·오류를 찾아 보강해요.', kind: 'review' },
    { icon: '📋', title: '복사·사용', role: '결과', detail: '완성된 결과를 복사해 바로 쓰거나, 옵션을 바꿔 다시 생성할 수 있어요.', kind: 'finalize' },
  ];
}

/** 단계에 배정된 모델 정보(소비자엔 비공개, 관리자/디버그용). */
export function stepModel(step: AutoStep): ModelPick | null {
  return step.feature ? pickForFeature(step.feature) : null;
}
