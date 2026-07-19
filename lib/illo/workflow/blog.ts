// 블로그 글 워크플로우 — 첫 번째 검증 대상.
// 4노드로 시작한다. 기획서의 9노드(Planner→Researcher→Writer→FactCheck→SEO→Humanizer→Judge→Publisher→Delivery)는
// '품질 상한선'이고, 노드를 늘렸을 때 결과가 그만큼 좋아지는지는 실측으로 판단한다.
// (노드가 늘수록 앞 결과를 계속 다시 읽어 입력 토큰이 누적 → 비용이 선형 이상으로 증가)

import type { WorkflowDef } from "./types";

export const BLOG_WORKFLOW: WorkflowDef = {
  id: "blog",
  label: "블로그 글 쓰기",
  description: "기획 → 작성 → 검토 → 다듬기. 네 명의 AI가 순서대로 협업해 글 한 편을 완성합니다.",
  inputLabel: "글 주제",
  inputPlaceholder: "예) 1인 사업자가 AI로 블로그를 자동화하는 방법",
  defaultModel: "claude-haiku-4-5",
  nodes: [
    {
      id: "plan",
      label: "기획",
      emoji: "🧭",
      role: "블로그 콘텐츠 기획자",
      instruction: [
        "이 주제로 글을 쓰기 전에 기획안을 만드세요.",
        "- 이 글을 읽을 사람은 누구이고, 무엇을 얻어가야 하는지",
        "- 제목 후보 3개",
        "- 소제목 4~6개로 구성한 목차",
        "- 각 소제목에서 다룰 핵심 내용 한 줄씩",
        "- 검색에 걸릴 만한 키워드 5개",
      ].join("\n"),
      maxTokens: 1200,
    },
    {
      id: "write",
      label: "작성",
      emoji: "✍️",
      role: "블로그 작가",
      instruction: [
        "위 기획안을 그대로 따라 블로그 글 초안을 완성하세요.",
        "- 목차 구성을 지키고, 소제목을 그대로 사용",
        "- 각 문단은 구체적인 예시나 숫자를 포함",
        "- 한국어로, 읽기 쉬운 문장으로",
        "- 마크다운 형식(## 소제목)",
      ].join("\n"),
      inputs: ["plan"],
      maxTokens: 4000,
    },
    {
      id: "review",
      label: "검토",
      emoji: "🔍",
      role: "깐깐한 편집장",
      instruction: [
        "위 초안을 검토하고 고쳐야 할 점만 지적하세요. 글을 다시 쓰지는 마세요.",
        "- 사실이 틀렸거나 근거 없이 단정한 부분",
        "- 내용이 겹치거나 비어 있는 부분",
        "- 뻔하고 알맹이 없는 문장",
        "- 기획안 의도와 어긋난 부분",
        "각 지적은 '어느 부분 → 무엇이 문제 → 어떻게 고칠지' 형식으로.",
        "고칠 게 없으면 '수정 필요 없음'이라고만 쓰세요.",
      ].join("\n"),
      inputs: ["plan", "write"],
      maxTokens: 1500,
    },
    {
      id: "polish",
      label: "다듬기",
      emoji: "✨",
      role: "글을 사람 글처럼 다듬는 교정자",
      instruction: [
        "초안에 검토 의견을 반영해 최종본을 완성하세요.",
        "- 지적된 부분을 모두 고칠 것",
        "- AI가 쓴 티가 나는 표현(과한 접속사, 형식적인 마무리, 뻔한 총평)을 걷어낼 것",
        "- 문장 길이를 다양하게, 담백하게",
        "- 최종 결과물(완성된 글)만 출력. 무엇을 고쳤는지는 쓰지 말 것",
      ].join("\n"),
      inputs: ["write", "review"],
      maxTokens: 4000,
    },
  ],
};

export const WORKFLOWS: WorkflowDef[] = [BLOG_WORKFLOW];
export function workflowById(id: string): WorkflowDef | null {
  return WORKFLOWS.find((w) => w.id === id) || null;
}
