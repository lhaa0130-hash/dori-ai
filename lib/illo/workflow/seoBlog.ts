// SEO 블로그 글 작성 — Workflow Store 첫 상품.
// 14개 노드가 각자 역할을 맡고, 심사 90점 미만이면 '부분 재작성'만 하고 다시 심사한다.
// 노드는 모델명을 모른다. 역할(ModelClass)만 선언하고 실제 모델은 프리셋이 정한다.

import type { FinalOutput, JudgeResult, NodeCtx, WorkflowDef } from "./types";
import { DEFAULT_SETTINGS } from "./types";
import type { SearchResult } from "./search";

const S = (v: unknown) => (typeof v === "string" ? v : JSON.stringify(v ?? "", null, 2));
/** 지금 시점의 본문 — 재작성본이 있으면 그것, 없으면 다듬은 본문, 그것도 없으면 초안 */
const currentText = (c: NodeCtx) =>
  (c.out.rewrite as string) || (c.out.human as string) || (c.out.article as string) || "";

const opt = (c: NodeCtx, k: string) => {
  const v = c.userInput[k];
  return v == null || v === "" ? "" : String(v);
};

export const SEO_BLOG_WORKFLOW: WorkflowDef = {
  id: "seo-blog",
  label: "SEO 블로그 글 작성",
  description:
    "주제만 입력하면 키워드 분석, 자료 조사, 목차 설계, 본문 작성, 사실 검증, SEO 최적화, 문체 개선과 품질 평가를 거쳐 게시 가능한 블로그 글을 생성합니다.",
  defaultSettings: DEFAULT_SETTINGS,
  fields: [
    { key: "topic", label: "글 주제", placeholder: "예) 제습기 추천", required: true, type: "text" },
    { key: "keywords", label: "주요 키워드", placeholder: "쉼표로 구분 (선택)", type: "text" },
    { key: "audience", label: "독자 대상", placeholder: "예) 원룸에 사는 자취생 (선택)", type: "text" },
    { key: "purpose", label: "글 작성 목적", placeholder: "예) 제품 선택을 돕는다 (선택)", type: "text" },
    { key: "articleType", label: "글 유형", type: "select", options: [
      { value: "information", label: "정보 전달" },
      { value: "comparison", label: "비교·추천" },
      { value: "howto", label: "방법 안내" },
      { value: "review", label: "후기·리뷰" },
    ] },
    { key: "tone", label: "말투", placeholder: "예) 친근하지만 전문적인 문체 (선택)", type: "text" },
    { key: "targetLength", label: "목표 글자 수", placeholder: "2500", type: "number" },
    { key: "referenceUrls", label: "참고 URL", placeholder: "줄바꿈으로 구분 (선택)", type: "textarea" },
    { key: "mustInclude", label: "반드시 포함할 내용", placeholder: "(선택)", type: "textarea" },
    { key: "mustExclude", label: "제외할 내용", placeholder: "(선택)", type: "textarea" },
  ],
  nodes: [
    // 1 ────────────────────────────────────────────────
    {
      id: "input", label: "Input Analyzer", userLabel: "입력 분석", emoji: "🧾",
      kind: "llm", modelClass: "fast", temperature: 0.1, json: true, maxTokens: 800,
      prompt: (c) => `__NODE:input__
사용자 입력을 표준 JSON으로 구조화하세요. 창의성 없이 정확하게만.

주제: ${opt(c, "topic")}
키워드: ${opt(c, "keywords") || "(없음)"}
독자: ${opt(c, "audience") || "(미지정 — 주제로 추론)"}
목적: ${opt(c, "purpose") || "(미지정 — 주제로 추론)"}
글 유형: ${opt(c, "articleType") || c.settings.articleType}
말투: ${opt(c, "tone") || c.settings.tone}
목표 글자수: ${opt(c, "targetLength") || c.settings.targetLength}
반드시 포함: ${opt(c, "mustInclude") || "(없음)"}
제외: ${opt(c, "mustExclude") || "(없음)"}

다음 키만 가진 JSON만 출력:
{"topic","audience","purpose","articleType","tone","targetLength","language","mustInclude","mustExclude"}`,
    },
    // 2 ────────────────────────────────────────────────
    {
      id: "keyword", label: "Keyword Planner", userLabel: "키워드 조사", emoji: "🔑",
      kind: "llm", modelClass: "fast", temperature: 0.3, json: true, maxTokens: 900,
      prompt: (c) => `__NODE:keyword__
아래 기획 정보로 SEO 키워드를 설계하세요.

${S(c.out.input)}

JSON만 출력:
{"primaryKeyword": "", "secondaryKeywords": [], "questionKeywords": [],
 "searchIntent": {"informational": 0, "comparison": 0, "purchase": 0}}`,
    },
    // 3 ────────────────────────────────────────────────
    {
      id: "researchPlan", label: "Research Planner", userLabel: "자료 조사 계획", emoji: "🗺️",
      kind: "llm", modelClass: "reasoning", temperature: 0.2, json: true, maxTokens: 900,
      prompt: (c) => `__NODE:researchPlan__
글을 쓰기 전에 무엇을 검색해야 하는지 계획하세요.
필요한 '사실'과 '자료 유형'(제품 스펙, 공식 제조사 정보, 공공기관 자료, 최근 가격, 사용법, 안전 정보, 통계)을 분리해 질의를 만드세요.

기획: ${S(c.out.input)}
키워드: ${S(c.out.keyword)}

JSON만 출력:
{"queries":[{"query":"","sourcePriority":["government","manufacturer","expert"]}]}`,
    },
    // 4 ────────────────────────────────────────────────
    {
      id: "websearch", label: "Web Search", userLabel: "자료 조사", emoji: "🌐",
      kind: "search",
      queries: (c) => {
        const p = c.out.researchPlan as { queries?: { query: string }[] } | undefined;
        const qs = (p?.queries || []).map((q) => q.query).filter(Boolean);
        return qs.length ? qs : [String(c.userInput.topic || "")];
      },
    },
    // 5 ────────────────────────────────────────────────
    {
      id: "sources", label: "Source Analyzer", userLabel: "자료 검토", emoji: "🔬",
      kind: "llm", modelClass: "reasoning", temperature: 0.1, json: true, maxTokens: 1600,
      prompt: (c) => `__NODE:sources__
검색된 출처를 정리하고 신뢰도를 평가하세요.
광고성 자료 구분, 오래된 정보 구분, 상충 주장 탐지, 공식 자료 우선순위를 판단합니다.

검색 결과:
${S(c.out.websearch)}

JSON만 출력:
{"sources":[{"url":"","title":"","reliability":0,"sourceType":"official","usableClaims":[],"warnings":[]}],
 "conflicts":[], "missingInformation":[]}`,
    },
    // 6 ────────────────────────────────────────────────
    {
      id: "outline", label: "Outline Planner", userLabel: "목차 설계", emoji: "🧭",
      kind: "llm", modelClass: "writing", temperature: 0.4, json: true, maxTokens: 1400,
      prompt: (c) => `__NODE:outline__
검색 의도와 검증된 자료를 반영해 목차를 설계하세요. H2/H3의 논리적 흐름이 중요합니다.

기획: ${S(c.out.input)}
키워드/검색의도: ${S(c.out.keyword)}
검증된 자료: ${S(c.out.sources)}

JSON만 출력:
{"titleCandidates":[], "outline":[{"heading":"","level":2,"purpose":"","requiredSources":[]}]}`,
    },
    // 7 ────────────────────────────────────────────────
    {
      id: "article", label: "Article Writer", userLabel: "글 작성", emoji: "✍️",
      kind: "llm", modelClass: "writing", temperature: 0.6, maxTokens: 4000,
      prompt: (c) => `__NODE:article__
목차와 검증된 자료로 본문을 작성하세요.

목차: ${S(c.out.outline)}
검증된 자료(이 안의 사실만 사용): ${S(c.out.sources)}
키워드: ${S(c.out.keyword)}
말투: ${opt(c, "tone") || c.settings.tone}
목표 분량: 약 ${opt(c, "targetLength") || c.settings.targetLength}자

구성: 제목 → 도입부 → H2/H3 본문 → 표 또는 목록 → FAQ → 결론 → 사용 출처.
자료에 없는 수치·날짜·가격은 지어내지 마세요. ${c.settings.outputFormat === "markdown" ? "마크다운으로" : ""} 본문만 출력하세요.`,
    },
    // 8 ────────────────────────────────────────────────
    {
      id: "fact", label: "Fact Checker", userLabel: "사실 검토", emoji: "🧪",
      kind: "llm", modelClass: "reasoning", temperature: 0.1, json: true, maxTokens: 1600,
      avoidProviderOf: "article",   // 작성자와 다른 provider로 검증(자기 확증 방지)
      prompt: (c) => `__NODE:fact__
본문의 검증 가능한 주장(날짜·가격·수치·통계·법률·제도·제품명/사양·기관명·인용)을 자료와 대조하세요.
확인되지 않은 내용은 사실처럼 단정하지 말고 삭제/완화/출처필요/교체 중 하나로 처리하도록 지시하세요.

본문:
${currentText(c)}

자료: ${S(c.out.sources)}

JSON만 출력:
{"verifiedClaims":[], "unsupportedClaims":[], "incorrectClaims":[],
 "requiredChanges":[{"sectionId":"","originalText":"","reason":"","action":"soften"}]}`,
    },
    // 9 ────────────────────────────────────────────────
    {
      id: "seo", label: "SEO Reviewer", userLabel: "SEO 검토", emoji: "📈",
      kind: "llm", modelClass: "reasoning", temperature: 0.1, json: true, maxTokens: 1400,
      prompt: (c) => `__NODE:seo__
검색 의도 충족도를 가장 중요하게 보고 SEO를 검토하세요(키워드 밀도 수치만으로 평가하지 말 것).
검사: 제목/도입부 키워드, H2·H3 구조, 검색 의도 충족, 키워드 과다 반복, 표·목록 활용, FAQ, 문단 길이, 중복 문장.

본문:
${currentText(c)}

키워드/검색의도: ${S(c.out.keyword)}

JSON만 출력:
{"issues":[{"category":"seo","targetSectionId":"","severity":"medium","message":"","recommendedAction":"expand"}],
 "metaDescriptionDraft":""}`,
    },
    // 10 ───────────────────────────────────────────────
    {
      id: "human", label: "Humanizer", userLabel: "문체 개선", emoji: "✨",
      kind: "llm", modelClass: "writing", temperature: 0.5, maxTokens: 4000,
      prompt: (c) => `__NODE:human__
아래 지적을 반영하고 AI 문체를 걷어내 자연스러운 한국어로 다듬으세요.

본문:
${currentText(c)}

사실 검토: ${S(c.out.fact)}
SEO 검토: ${S(c.out.seo)}

고칠 대상: 반복 접속사, 기계적 문단 구조, 과도한 요약 표현, 불필요한 강조, 같은 길이 문장 반복, 번역체, 부자연스러운 결론.
제한: 사실·수치·출처를 바꾸지 말 것. SEO 핵심 키워드를 임의로 빼지 말 것. 의미를 바꾸지 말 것.
완성된 본문만 출력하세요.`,
    },
    // 11 ───────────────────────────────────────────────
    {
      id: "judge", label: "Quality Judge", userLabel: "품질 검토", emoji: "⚖️",
      kind: "llm", modelClass: "judge", temperature: 0, json: true, maxTokens: 1400,
      avoidProviderOf: "article",   // 작성자와 다른 provider가 심사
      judge: { passScore: 90, rewriteNode: "rewrite", maxRewrite: 2, contentNodes: ["human", "rewrite"] },
      prompt: (c) => `__NODE:judge__
아래 글을 100점 만점으로 평가하세요.
배점: 정확성 25 / 정보성 20 / SEO·검색의도 20 / 가독성 15 / 자연스러움 10 / 구조 완성도 10.

글:
${currentText(c)}

기획: ${S(c.out.input)}
키워드: ${S(c.out.keyword)}

JSON만 출력:
{"totalScore":0,"passed":false,
 "scores":{"accuracy":0,"informativeness":0,"seo":0,"readability":0,"naturalness":0,"structure":0},
 "issues":[{"category":"seo","targetSectionId":"","severity":"medium","message":"","recommendedAction":"expand"}]}`,
    },
    // 12 ───────────────────────────────────────────────
    {
      id: "rewrite", label: "Targeted Rewrite", userLabel: "부분 보완", emoji: "🩹",
      kind: "llm", modelClass: "writing", temperature: 0.4, maxTokens: 4000,
      onlyWhenRewrite: true,
      prompt: (c) => {
        const j = (c.out.judge || {}) as JudgeResult;
        return `__NODE:rewrite__
심사에서 지적된 부분만 고치세요. 글 전체를 다시 쓰지 마세요.

현재 글:
${currentText(c)}

심사 점수: ${j.totalScore ?? "-"}
지적사항:
${S(j.issues)}

지적된 섹션만 수정하고 나머지는 그대로 두세요. 문체와 전체 일관성을 유지하세요.
수정이 반영된 글 전체를 출력하세요(설명 없이).`;
      },
    },
    // 13 ───────────────────────────────────────────────
    {
      id: "meta", label: "Meta Generator", userLabel: "게시 정보 생성", emoji: "🏷️",
      kind: "llm", modelClass: "fast", temperature: 0.3, json: true, maxTokens: 900,
      prompt: (c) => `__NODE:meta__
게시에 필요한 부가 정보를 만드세요.

글: ${currentText(c).slice(0, 3000)}
키워드: ${S(c.out.keyword)}

JSON만 출력:
{"metaTitle":"","metaDescription":"","slug":"","tags":[],"category":"","imagePrompt":"","ogTitle":"","ogDescription":""}`,
    },
    // 14 ───────────────────────────────────────────────
    {
      id: "final", label: "Final Output", userLabel: "최종 완성", emoji: "📦",
      kind: "code",
      run: (c): FinalOutput => {
        const meta = (c.out.meta || {}) as Record<string, unknown>;
        const j = (c.out.__bestDetails__ || c.out.judge || {}) as JudgeResult;
        const content = (c.out.__best__ as string) || currentText(c);
        const outline = (c.out.outline || {}) as { titleCandidates?: string[] };
        const srcAnalysis = (c.out.sources || {}) as { sources?: unknown[] };
        return {
          title: String(meta.metaTitle || outline.titleCandidates?.[0] || c.userInput.topic || ""),
          content,
          metaTitle: String(meta.metaTitle || ""),
          metaDescription: String(meta.metaDescription || ""),
          slug: String(meta.slug || ""),
          tags: Array.isArray(meta.tags) ? (meta.tags as string[]) : [],
          imagePrompt: String(meta.imagePrompt || ""),
          qualityScore: Number(c.out.__bestScore__ ?? j.totalScore ?? 0),
          qualityDetails: (j.scores || {}) as Record<string, unknown>,
          sources: ((srcAnalysis.sources as SearchResult[]) || []),
          executionSummary: {
            totalNodes: 14, completedNodes: 0, rewriteCount: 0,
            totalTokens: 0, estimatedCost: 0, durationMs: 0,   // 엔진이 채운다
          },
        };
      },
    },
  ],
};

export const WORKFLOWS: WorkflowDef[] = [SEO_BLOG_WORKFLOW];
export function workflowById(id: string): WorkflowDef | null {
  return WORKFLOWS.find((w) => w.id === id) || null;
}
