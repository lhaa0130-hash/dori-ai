// illo Blog Expert — Workflow 하나가 곧 "AI 회사"다.
// 사용자는 '블로그 작성'만 누르고, 내부에서 아래 Agent들이 협업한다(기획서 §5).
//   기획 → 조사 → 웹검색 → 작성 → 사실검증 → SEO → 사람말투 → 심사 → 발행형식 → 전송
// 심사(Judge)가 80점 미만이면 '작성'으로 되돌아가 다시 일한다.
//
// ⚠️ 모델 우선순위(Priority 1/2/3)는 기획서의 의도를 그대로 선언해 둔 것이고,
//    지금 실제로 연결된 provider는 Claude뿐이라 나머지는 자동으로 다음 순위로 내려간다.
//    (providers.ts의 CONNECTED에 추가하는 순간 이 정의 그대로 그 모델을 쓰기 시작한다)
//    non-Claude 모델 id는 '선언된 의도'이며 검증되지 않았다 — 연결 시 공식 id로 확인할 것.

import type { WorkflowDef } from "./types";

export const BLOG_WORKFLOW: WorkflowDef = {
  id: "blog",
  label: "블로그 글 쓰기",
  description: "주제만 넣으면 기획·조사·작성·검증·심사까지 AI 팀이 알아서 처리하고 완성된 글만 드립니다.",
  inputLabel: "글 주제",
  inputPlaceholder: "예) 1인 사업자가 AI로 블로그를 자동화하는 방법",
  agents: [
    {
      id: "plan", label: "기획", emoji: "🧭", capability: "llm",
      role: "블로그 콘텐츠 기획자",
      instruction: [
        "이 주제로 글을 쓰기 위한 기획안을 만드세요.",
        "- 독자는 누구이고 무엇을 얻어가야 하는가",
        "- 제목 후보 3개",
        "- 소제목 4~6개 목차",
        "- 각 소제목에서 다룰 핵심 한 줄",
        "- 검색 키워드 5개",
      ].join("\n"),
      // 속도 우선 — 기획은 가볍고 빨라야 한다
      models: [
        { provider: "gemini", model: "gemini-2.5-flash", why: "속도 우선" },
        { provider: "claude", model: "claude-haiku-4-5", why: "저렴·빠름" },
      ],
      maxTokens: 1200,
    },
    {
      id: "research", label: "조사", emoji: "📚", capability: "llm",
      role: "자료 조사원",
      instruction: [
        "기획안을 보고, 글에 들어가야 할 사실·수치·사례를 정리하세요.",
        "- 확실한 것과 불확실한 것을 구분해 표시",
        "- 확인이 필요한 항목은 '[확인필요]'로 표시",
      ].join("\n"),
      inputs: ["plan"],
      models: [
        { provider: "openai", model: "gpt-5", why: "사실 정리 강점" },
        { provider: "claude", model: "claude-haiku-4-5" },
      ],
      maxTokens: 1600,
    },
    {
      id: "search", label: "웹검색", emoji: "🔍", capability: "search",
      role: "최신 정보 검색원",
      instruction: "조사 내용 중 [확인필요] 항목을 실제 웹에서 검색해 출처와 함께 보강하세요.",
      inputs: ["research"],
      models: [{ provider: "search", model: "tavily", why: "실시간 검색" }],
      maxTokens: 1600,
    },
    {
      id: "write", label: "작성", emoji: "✍️", capability: "llm",
      role: "블로그 작가",
      instruction: [
        "기획안의 목차를 그대로 따라 글을 완성하세요.",
        "- 조사 자료의 사실·수치를 본문에 녹일 것",
        "- 소제목은 마크다운(## )",
        "- 문단마다 구체적 예시나 숫자",
        "- 심사 의견이 함께 넘어왔다면 그 지적을 우선 반영할 것",
      ].join("\n"),
      inputs: ["plan", "research", "search", "judge"],
      // 품질 우선 — 글의 본체
      models: [
        { provider: "claude", model: "claude-sonnet-5", why: "글쓰기 품질 우선" },
        { provider: "openai", model: "gpt-5" },
        { provider: "gemini", model: "gemini-2.5-pro" },
      ],
      maxTokens: 4000,
    },
    {
      id: "fact", label: "사실검증", emoji: "🧪", capability: "llm",
      role: "팩트 체커",
      instruction: [
        "초안에서 사실이 틀렸거나 근거 없이 단정한 문장만 골라내세요.",
        "글을 다시 쓰지 말고, '문장 → 문제 → 수정안' 형식으로만 지적하세요.",
        "문제가 없으면 '이상 없음'.",
      ].join("\n"),
      inputs: ["write", "research", "search"],
      models: [
        { provider: "openai", model: "gpt-5", why: "검증 강점" },
        { provider: "claude", model: "claude-haiku-4-5" },
      ],
      maxTokens: 1500,
    },
    {
      id: "seo", label: "SEO", emoji: "📈", capability: "llm",
      role: "검색최적화 담당",
      instruction: [
        "검색에 잘 걸리도록 고칠 점을 지적하세요(글을 다시 쓰지 말 것).",
        "- 제목/소제목에 키워드가 자연스럽게 들어갔는지",
        "- 메타 설명문 1개(150자 내외) 제안",
        "- 보완할 키워드",
      ].join("\n"),
      inputs: ["write", "plan"],
      models: [
        { provider: "gemini", model: "gemini-2.5-flash", why: "저비용 반복 작업" },
        { provider: "claude", model: "claude-haiku-4-5" },
      ],
      maxTokens: 1200,
    },
    {
      id: "human", label: "사람말투", emoji: "✨", capability: "llm",
      role: "AI 티를 걷어내는 교정자",
      instruction: [
        "초안에 사실검증·SEO 지적을 모두 반영해 최종 원고를 완성하세요.",
        "- AI 티(과한 접속사, 형식적 마무리, 뻔한 총평)를 걷어낼 것",
        "- 문장 길이를 다양하게, 담백하게",
        "- 완성된 글만 출력. 무엇을 고쳤는지 쓰지 말 것",
      ].join("\n"),
      inputs: ["write", "fact", "seo"],
      models: [
        { provider: "claude", model: "claude-sonnet-5", why: "자연스러운 문체" },
        { provider: "openai", model: "gpt-5" },
      ],
      maxTokens: 4000,
    },
    {
      id: "judge", label: "심사", emoji: "⚖️", capability: "llm",
      role: "편집장(최종 심사)",
      instruction: [
        "이 글을 발행해도 되는지 100점 만점으로 심사하세요.",
        "기준: 사실 정확성 / 읽는 맛 / 주제 충실도 / AI 티가 없는지 / SEO.",
        "80점 미만이면 무엇을 어떻게 고쳐야 하는지 작가가 바로 실행할 수 있게 구체적으로 쓰세요.",
      ].join("\n"),
      inputs: ["human", "plan"],
      models: [
        { provider: "openai", model: "gpt-5", why: "냉정한 평가" },
        { provider: "claude", model: "claude-sonnet-5" },
      ],
      maxTokens: 1200,
      // 기획서: Judge 80점 이하 → Writer 다시 실행 (비용 폭주 방지로 최대 2회)
      judge: { min: 80, retryFrom: "write", maxRetry: 2 },
    },
    {
      id: "publish", label: "발행형식", emoji: "📄", capability: "llm",
      role: "발행 담당",
      instruction: [
        "최종 원고를 그대로 발행 가능한 형태로 정리하세요.",
        "맨 위에 제목, 그 아래 메타 설명, 그 아래 본문(마크다운). 내용을 새로 쓰지 말 것.",
      ].join("\n"),
      inputs: ["human", "seo"],
      models: [
        { provider: "gemini", model: "gemini-2.5-flash", why: "형식 정리는 저렴하게" },
        { provider: "claude", model: "claude-haiku-4-5" },
      ],
      maxTokens: 4000,
    },
    {
      id: "deliver", label: "전송", emoji: "📤", capability: "deliver",
      role: "전송 담당",
      instruction: "완성본을 지정한 채널(이메일·깃허브·노션 등)로 내보냅니다.",
      inputs: ["publish"],
      models: [{ provider: "deliver", model: "email" }],
    },
  ],
};

export const WORKFLOWS: WorkflowDef[] = [BLOG_WORKFLOW];
export function workflowById(id: string): WorkflowDef | null {
  return WORKFLOWS.find((w) => w.id === id) || null;
}
