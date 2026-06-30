// 완성된 워크플로우 템플릿 — 빈 캔버스에 노드를 하나씩 추가하기 전에,
// 바로 열어 쓰거나 수정해서 시작할 수 있는 "기성 플로우" 모음.
// 각 노드에는 기본 명령(instruction)이 들어 있어, 열자마자 동작 흐름이 탄탄하게 잡혀 있다.
// 템플릿을 열면 노드/링크 id를 새로 발급해 '내 워크플로우'의 새 사본으로 편집된다.

import type { UserFlow, FlowNode } from "@/lib/illo/flows";
import { newId } from "@/lib/illo/flows";
import type { StepKind } from "@/lib/illo/automations";

export type TemplateStep = {
  kind: StepKind;
  icon: string;
  title: string;
  role: string;
  detail: string;        // 노드에 보일 한 줄 설명(placeholder)
  instruction: string;   // 이 노드(AI)에 줄 기본 명령
};

export type FlowTemplate = {
  id: string;
  name: string;
  icon: string;
  desc: string;
  steps: TemplateStep[];
};

// 캔버스 노드 크기(명령 입력칸 포함) — page.client.tsx와 동일하게 유지.
const NODE_W = 192;
const NODE_H = 148;

const ICON: Record<StepKind, string> = {
  input: "📥", vision: "🔍", research: "📚", generate: "✍️",
  review: "✅", finalize: "📑", media: "🎨", deliver: "📤",
};
const ROLE: Record<StepKind, string> = {
  input: "입력", vision: "분석 AI", research: "조사 AI", generate: "작성 AI",
  review: "검토 AI", finalize: "편집 AI", media: "제작 AI", deliver: "전송",
};
// s(kind, title, detail, instruction, icon?)
const s = (kind: StepKind, title: string, detail: string, instruction: string, icon?: string): TemplateStep =>
  ({ kind, title, detail, instruction, icon: icon || ICON[kind], role: ROLE[kind] });

export const FLOW_TEMPLATES: FlowTemplate[] = [
  {
    id: "tpl_blog", name: "블로그 글 자동 발행", icon: "✍️",
    desc: "주제만 주면 조사→작성→검토→이미지→발행까지. 가장 많이 쓰는 기본형.",
    steps: [
      s("input", "주제 입력", "글 주제·키워드·말투·길이를 적어요", ""),
      s("research", "자료·키워드 조사", "최신 정보·키워드·경쟁글 조사", "주제와 관련된 최신 정보·검색 키워드·상위 노출 경쟁글을 조사해, 검색에 잘 걸리는 글의 개요(목차)를 잡아라."),
      s("generate", "본문 작성", "SEO 구조로 본문 작성", "조사 개요를 바탕으로 제목·도입·소제목(H2 3~5개)·마무리 구조의 SEO 블로그 본문을 충실히 작성하라."),
      s("review", "교차 검토", "정확성·가독성·SEO 점검", "맞춤법·사실 정확성·가독성·SEO를 점검하고 약한 부분을 보강하라. 무엇을 고쳤는지 한 줄로 남겨라."),
      s("media", "대표 이미지", "글에 어울리는 이미지", "본문 주제에 어울리는 대표 이미지 1장을 만들 상세 프롬프트를 작성하라.", "🎨"),
      s("finalize", "최종본 정리", "발행용 묶음 정리", "제목·본문·메타설명·해시태그·이미지를 바로 발행할 수 있는 하나의 묶음으로 정리하라."),
      s("deliver", "전송·발행", "메일/카톡/사이트로", "최종 묶음을 이메일·카카오로 보내거나 사이트 초안으로 등록하라."),
    ],
  },
  {
    id: "tpl_sns", name: "SNS 게시물 제작", icon: "📱",
    desc: "사진/영상을 주면 분석→트렌드 조사→글·해시태그→검토→전송.",
    steps: [
      s("input", "자료 입력", "홍보할 사진/영상·메모를 올려요", ""),
      s("vision", "자료 분석", "사진/영상 핵심 읽기", "올린 사진·영상에서 무엇을 홍보할지, 분위기·색감·핵심 셀링포인트를 읽어 다음 단계가 쓸 재료로 정리하라."),
      s("research", "트렌드·해시태그", "지금 잘 먹히는 톤 조사", "지금 반응 좋은 트렌드·인기 해시태그·경쟁 게시물을 조사해 효과적인 톤과 키워드를 근거와 함께 추려라."),
      s("generate", "게시물 작성", "후킹+본문+해시태그", "분석·조사를 바탕으로 첫 줄에서 시선을 잡는 후킹 + 본문 + 해시태그 초안을 플랫폼에 맞게 작성하라. 행동 유도 마무리 포함."),
      s("review", "교차 검토", "과장·정책위반 점검", "맞춤법·과장·사실오류·정책위반을 점검하고 더 자연스럽고 설득력 있게 다듬어라."),
      s("media", "이미지", "게시물용 대표 이미지", "게시물에 어울리는 대표 이미지를 만들 프롬프트를 작성하라.", "🎨"),
      s("finalize", "최종본 정리", "본문+해시태그+발행시간", "본문·해시태그·이미지·추천 발행 시간대를 바로 올릴 수 있게 정리하라."),
      s("deliver", "전송", "카톡/이메일로", "완성본을 카카오(나에게 보내기)·이메일로 보내라."),
    ],
  },
  {
    id: "tpl_product", name: "상품 등록 자료 제작", icon: "🛍️",
    desc: "상품 사진·정보를 주면 상세설명 + 광고 카피 5개까지 한 번에.",
    steps: [
      s("input", "상품 정보 입력", "상품명·특징·가격·사진", ""),
      s("vision", "상품 분석", "강점·타깃·차별점", "상품 사진·정보에서 핵심 강점·타깃 고객·경쟁 대비 차별점을 정리하라."),
      s("generate", "상세설명 작성", "구매전환형 상세설명", "캐치프레이즈→핵심 이점→사용 시나리오→스펙 요약→구매 유도 마무리 순으로 전환을 노린 상세설명을 작성하라."),
      s("generate", "광고 카피 5개", "톤이 다른 카피 5종", "같은 상품으로 톤이 다른 광고 카피 5개를 만들어 골라 쓸 수 있게 하라."),
      s("review", "표시광고 검토", "과장·위반 점검", "과장·표시광고 위반 소지·오류가 없는지 점검하고 신뢰감 있게 다듬어라."),
      s("finalize", "최종본 정리", "상세+카피+Q&A 묶음", "상세설명·광고 카피·예상 Q&A를 한 묶음으로 정리하라."),
      s("deliver", "전송", "이메일로", "상세설명+카피 묶음을 이메일로 보내라."),
    ],
  },
  {
    id: "tpl_reply", name: "고객 문의 자동 답변", icon: "🗨️",
    desc: "문의를 붙여넣으면 정중한 답변을 작성·검토해, 승인 후 발송.",
    steps: [
      s("input", "문의 입력", "고객 문의 내용을 붙여넣어요", ""),
      s("vision", "문의 의도 분석", "의도·감정 읽기", "고객 문의의 의도와 감정을 먼저 파악하라(불만/질문/요청 등 분류)."),
      s("generate", "답변 작성", "공감→해결→마무리", "공감 → 해결/안내 → 따뜻한 마무리 구조로 정중한 답변을 작성하라."),
      s("review", "톤·정책 검토", "오해 소지 점검", "톤이 과하거나 부족하지 않은지, 정책·오해 소지가 없는지 점검하고 더 매끄럽게 다듬어라."),
      s("deliver", "승인 후 발송", "확인 후 보내기", "검토가 끝나면 사용자가 확인·승인한 뒤 발송하라(반자동)."),
    ],
  },
  {
    id: "tpl_youtube", name: "유튜브 대본 패키지", icon: "🎬",
    desc: "주제로 대본·제목·설명·태그·챕터·썸네일까지 한 묶음.",
    steps: [
      s("input", "주제 입력", "영상 주제·길이·톤", ""),
      s("research", "주제 조사", "인기 영상·후킹 포인트", "주제 관련 인기 영상·검색 키워드·시청자가 반응하는 후킹 포인트를 조사하라."),
      s("generate", "대본·메타 작성", "대본+제목+설명+태그", "대본 + 제목 후보 + 설명문 + 태그 + 챕터(타임스탬프)를 작성하라."),
      s("review", "교차 검토", "흐름·후킹·SEO", "영상 흐름·도입 후킹·SEO를 점검하고 늘어지는 부분을 보강하라."),
      s("media", "썸네일", "썸네일 문구+이미지", "클릭을 부르는 썸네일 문구와 썸네일 이미지를 만들 프롬프트를 작성하라.", "🖼️"),
      s("finalize", "패키지 완성", "대본+제목+태그+썸네일", "대본·제목·설명·태그·챕터·썸네일을 업로드용 묶음으로 정리하라."),
    ],
  },
  {
    id: "tpl_newsletter", name: "뉴스레터 발송", icon: "📧",
    desc: "넣을 소식만 주면 큐레이션→본문→검토→발송 패키지까지.",
    steps: [
      s("input", "소식 입력", "넣을 소식·팁·링크", ""),
      s("research", "소식 큐레이션", "순서·핵심 정리", "넣을 소식·팁을 독자가 좋아할 순서로 큐레이션하고 각 항목의 핵심을 추려라."),
      s("generate", "본문 작성", "제목+미리보기+본문+CTA", "열어보고 싶은 제목 + 미리보기 문구 + 본문 + 행동 유도(CTA)를 작성하라."),
      s("review", "교차 검토", "톤·분량·CTA 점검", "톤·분량·CTA가 적절한지 점검하고 다듬어라."),
      s("finalize", "발송 패키지", "발송 직전 묶음", "제목 후보·미리보기·본문·CTA를 발송 직전 묶음으로 정리하라."),
      s("deliver", "전송", "이메일로", "완성본을 이메일로 보내라."),
    ],
  },
];

/** 템플릿 → 편집 가능한 새 UserFlow. 노드/링크/플로우 id를 매번 새로 발급, 순차 연결. 명령 포함. */
export function templateToFlow(t: FlowTemplate): UserFlow {
  const ids = t.steps.map(() => newId());
  const nodes: FlowNode[] = t.steps.map((step, i) => ({
    id: ids[i],
    kind: step.kind,
    icon: step.icon,
    title: step.title,
    role: step.role,
    detail: step.detail,
    instruction: step.instruction,
    x: 60 + (i % 4) * (NODE_W + 40),
    y: 70 + Math.floor(i / 4) * (NODE_H + 50),
  }));
  const links = ids.slice(1).map((to, i) => ({ from: ids[i], to }));
  return { id: newId(), name: t.name, nodes, links };
}
