// 완성된 워크플로우 템플릿 — 빈 캔버스에 노드를 하나씩 추가하기 전에,
// 바로 열어 쓰거나 수정해서 시작할 수 있는 "기성 플로우" 모음.
// 템플릿을 열면 노드/링크 id를 새로 발급해 '내 워크플로우'의 새 사본으로 편집된다.

import type { UserFlow, FlowNode } from "@/lib/illo/flows";
import { newId } from "@/lib/illo/flows";
import type { StepKind } from "@/lib/illo/automations";

export type TemplateStep = {
  kind: StepKind;
  icon: string;
  title: string;
  role: string;
  detail: string;
};

export type FlowTemplate = {
  id: string;
  name: string;
  icon: string;
  desc: string;
  steps: TemplateStep[];
};

const NODE_W = 170;
const NODE_H = 96;

// 단계 헬퍼 — kind별 기본 아이콘/역할을 채워 간결하게 정의.
const ICON: Record<StepKind, string> = {
  input: "📥", vision: "🔍", research: "📚", generate: "✍️",
  review: "✅", finalize: "📑", media: "🎨", deliver: "📤",
};
const ROLE: Record<StepKind, string> = {
  input: "입력", vision: "분석 AI", research: "조사 AI", generate: "작성 AI",
  review: "검토 AI", finalize: "편집 AI", media: "제작 AI", deliver: "전송",
};
const s = (kind: StepKind, title: string, detail: string, icon?: string): TemplateStep =>
  ({ kind, title, detail, icon: icon || ICON[kind], role: ROLE[kind] });

export const FLOW_TEMPLATES: FlowTemplate[] = [
  {
    id: "tpl_blog",
    name: "블로그 글 자동 발행",
    icon: "✍️",
    desc: "주제만 주면 조사→작성→검토→이미지→발행까지. 가장 많이 쓰는 기본형.",
    steps: [
      s("input", "주제 입력", "글 주제·키워드와 말투·길이를 입력해요."),
      s("research", "자료·키워드 조사", "최신 정보·검색 키워드·상위 경쟁글을 조사해 개요를 잡아요."),
      s("generate", "본문 작성", "제목·도입·소제목(H2)·마무리 구조로 SEO에 맞는 본문을 써요."),
      s("review", "교차 검토", "다른 AI가 가독성·정확성·SEO·오탈자를 점검하고 보강해요."),
      s("media", "대표 이미지", "글에 어울리는 대표 이미지를 생성해요.", "🎨"),
      s("finalize", "최종본 정리", "제목·본문·메타·해시태그·이미지를 한 묶음으로 정리해요."),
      s("deliver", "전송·발행", "완성본을 이메일·카카오로 보내거나 사이트 초안으로 등록해요."),
    ],
  },
  {
    id: "tpl_sns",
    name: "SNS 게시물 제작",
    icon: "📱",
    desc: "사진/영상을 주면 분석→트렌드 조사→글·해시태그→검토→전송.",
    steps: [
      s("vision", "자료 분석", "올린 사진·영상에서 홍보 포인트·분위기·색감을 읽어내요."),
      s("research", "트렌드·해시태그", "지금 잘 먹히는 트렌드·인기 해시태그·반응 좋은 톤을 조사해요."),
      s("generate", "게시물 작성", "첫 줄 후킹 + 본문 + 해시태그 초안을 플랫폼에 맞게 써요."),
      s("review", "교차 검토", "과장·오류·정책위반을 잡고 더 자연스럽게 다듬어요."),
      s("media", "이미지", "게시물에 어울리는 대표 이미지를 생성해요.", "🎨"),
      s("finalize", "최종본 정리", "본문·해시태그·이미지·추천 발행시간을 묶어요."),
      s("deliver", "전송", "완성본을 카카오(나에게 보내기)·이메일로 보내요."),
    ],
  },
  {
    id: "tpl_product",
    name: "상품 등록 자료 제작",
    icon: "🛍️",
    desc: "상품 사진·정보를 주면 상세설명 + 광고 카피 5개까지 한 번에.",
    steps: [
      s("vision", "상품 분석", "사진·정보에서 핵심 강점·타깃·차별점을 정리해요."),
      s("generate", "상세설명 작성", "구매전환형 상세설명을 시나리오까지 담아 써요."),
      s("generate", "광고 카피 5개", "톤이 다른 광고 카피 5개를 만들어 골라 쓰게 해요."),
      s("review", "표시광고 검토", "과장·표시광고 위반 소지·오류를 점검하고 다듬어요."),
      s("finalize", "최종본 정리", "상세설명·카피·이미지·예상 Q&A를 한 묶음으로 정리해요."),
      s("deliver", "전송", "상세설명+카피 묶음을 이메일로 보내요."),
    ],
  },
  {
    id: "tpl_reply",
    name: "고객 문의 자동 답변",
    icon: "🗨️",
    desc: "문의를 붙여넣으면 정중한 답변을 작성·검토해, 승인 후 발송.",
    steps: [
      s("input", "문의 입력", "고객 문의 내용을 붙여넣어요."),
      s("generate", "답변 작성", "공감→해결/안내→따뜻한 마무리 구조로 정중히 써요."),
      s("review", "톤·정책 검토", "톤·정책·오해 소지를 점검하고 더 매끄럽게 다듬어요."),
      s("deliver", "승인 후 발송", "사장님이 한 번 확인·승인하면 발송해요(반자동)."),
    ],
  },
  {
    id: "tpl_youtube",
    name: "유튜브 대본 패키지",
    icon: "🎬",
    desc: "주제로 대본·제목·설명·태그·챕터·썸네일까지 한 묶음.",
    steps: [
      s("input", "주제 입력", "영상 주제와 길이·톤을 입력해요."),
      s("research", "주제 조사", "인기 영상·키워드·후킹 포인트를 조사해요."),
      s("generate", "대본·메타 작성", "대본 + 제목 후보 + 설명문 + 태그 + 챕터를 써요."),
      s("review", "교차 검토", "흐름·후킹·SEO를 점검하고 보강해요."),
      s("media", "썸네일", "썸네일 문구와 썸네일 이미지를 만들어요.", "🖼️"),
      s("finalize", "패키지 완성", "대본·제목·설명·태그·챕터·썸네일을 묶어요."),
    ],
  },
  {
    id: "tpl_newsletter",
    name: "뉴스레터 발송",
    icon: "📧",
    desc: "넣을 소식만 주면 큐레이션→본문→검토→발송 패키지까지.",
    steps: [
      s("input", "소식 입력", "넣을 소식·팁·링크를 모아 입력해요."),
      s("research", "소식 큐레이션", "독자가 좋아할 순서로 큐레이션하고 핵심을 추려요."),
      s("generate", "본문 작성", "열어보고 싶은 제목 + 미리보기 + 본문 + CTA를 써요."),
      s("review", "교차 검토", "톤·분량·CTA가 적절한지 점검하고 다듬어요."),
      s("finalize", "발송 패키지", "제목 후보·미리보기·본문·CTA를 발송 직전 묶음으로 정리해요."),
      s("deliver", "전송", "완성본을 이메일로 보내요."),
    ],
  },
];

/** 템플릿 → 편집 가능한 새 UserFlow. 노드/링크/플로우 id를 매번 새로 발급, 순차 연결. */
export function templateToFlow(t: FlowTemplate): UserFlow {
  const ids = t.steps.map(() => newId());
  const nodes: FlowNode[] = t.steps.map((step, i) => ({
    id: ids[i],
    kind: step.kind,
    icon: step.icon,
    title: step.title,
    role: step.role,
    detail: step.detail,
    x: 60 + (i % 4) * (NODE_W + 40),
    y: 70 + Math.floor(i / 4) * (NODE_H + 50),
  }));
  const links = ids.slice(1).map((to, i) => ({ from: ids[i], to }));
  return { id: newId(), name: t.name, nodes, links };
}
