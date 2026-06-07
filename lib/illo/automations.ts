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

export type DeliverChannel = 'email' | 'kakao' | 'download' | 'approval';

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

/** 단계에 배정된 모델 정보(소비자엔 비공개, 관리자/디버그용). */
export function stepModel(step: AutoStep): ModelPick | null {
  return step.feature ? pickForFeature(step.feature) : null;
}
