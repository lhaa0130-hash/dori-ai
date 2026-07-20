// Provider Adapter — 엔진은 provider를 몰라야 한다. 이 인터페이스만 안다.
// 새 provider를 붙이려면 LlmAdapter를 하나 더 구현해 registry에 넣으면 끝.

import type { ProviderId } from "./models";

export type TokenUse = {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
};

export type LlmRequest = {
  modelId: string;
  prompt: string;
  temperature?: number;
  maxTokens: number;
  signal?: AbortSignal;
};
export type LlmResponse = { text: string; usage?: TokenUse };

export interface LlmAdapter {
  id: ProviderId;
  complete(req: LlmRequest): Promise<LlmResponse>;
}

/** 기존 BYOK 호출 통로(callClaude 래퍼)를 그대로 재사용한다 */
export type ClaudeCaller = (args: {
  prompt: string; model: string; maxTokens: number;
}) => Promise<{ text: string; usage?: TokenUse }>;

/**
 * ⚠️ Claude 최신 모델(Sonnet 5 / Opus 4.8 등)은 temperature를 보내면 400을 낸다.
 *    그래서 이 어댑터는 temperature를 전달하지 않는다(노드 설정의 temperature는
 *    이를 지원하는 다른 provider 어댑터에서 사용된다).
 */
export function claudeAdapter(call: ClaudeCaller): LlmAdapter {
  return {
    id: "anthropic",
    async complete(req) {
      const r = await call({ prompt: req.prompt, model: req.modelId, maxTokens: req.maxTokens });
      return { text: r.text, usage: r.usage };
    },
  };
}

/** 키 없이 전체 흐름을 검증하기 위한 Mock. 프롬프트에 섞인 힌트로 그럴듯한 JSON을 돌려준다. */
export function mockAdapter(opts?: { judgeScores?: number[] }): LlmAdapter {
  let judgeCall = 0;
  const scores = opts?.judgeScores ?? [87, 93];
  return {
    id: "mock",
    async complete(req) {
      await new Promise((r) => setTimeout(r, 40));
      const p = req.prompt;
      let text: string;
      if (p.includes("__NODE:judge__")) {
        const s = scores[Math.min(judgeCall, scores.length - 1)];
        judgeCall++;
        text = JSON.stringify({
          totalScore: s, passed: s >= 90,
          scores: { accuracy: 22, informativeness: 18, seo: 15, readability: 14, naturalness: 9, structure: 9 },
          issues: s >= 90 ? [] : [{
            category: "seo", targetSectionId: "section-2", severity: "medium",
            message: "검색 의도에 비해 구매 기준 설명이 부족함", recommendedAction: "expand",
          }],
        });
      } else if (p.includes("__NODE:input__")) {
        text = JSON.stringify({ topic: "제습기 추천", audience: "제습기를 처음 사는 일반 사용자", purpose: "정보 제공 및 제품 선택 도움", articleType: "comparison", tone: "친근하고 전문적", targetLength: 2500, language: "ko" });
      } else if (p.includes("__NODE:keyword__")) {
        text = JSON.stringify({ primaryKeyword: "제습기 추천", secondaryKeywords: ["원룸 제습기", "제습기 전기세", "제습기 고르는 법"], questionKeywords: ["제습기는 몇 리터가 적당한가"], searchIntent: { informational: 30, comparison: 50, purchase: 20 } });
      } else if (p.includes("__NODE:researchPlan__")) {
        text = JSON.stringify({ queries: [{ query: "제습기 적정 용량 공식 자료", sourcePriority: ["government", "manufacturer"] }, { query: "제습기 소비전력 스펙", sourcePriority: ["manufacturer"] }] });
      } else if (p.includes("__NODE:sources__")) {
        text = JSON.stringify({ sources: [{ url: "https://example.go.kr/a", title: "제습기 용량 기준", reliability: 92, sourceType: "official", usableClaims: ["10평 기준 10L/일 권장"], warnings: [] }], conflicts: [], missingInformation: [] });
      } else if (p.includes("__NODE:outline__")) {
        text = JSON.stringify({ titleCandidates: ["제습기 추천, 용량부터 고르세요"], outline: [{ heading: "제습기를 고르기 전에 알아야 할 기준", level: 2, purpose: "구매 기준 설명", requiredSources: [] }, { heading: "용량은 어떻게 계산하나", level: 2, purpose: "계산법", requiredSources: [] }] });
      } else if (p.includes("__NODE:fact__")) {
        text = JSON.stringify({ verifiedClaims: ["10평 기준 10L/일"], unsupportedClaims: [], incorrectClaims: [], requiredChanges: [] });
      } else if (p.includes("__NODE:seo__")) {
        text = JSON.stringify({ issues: [{ category: "seo", message: "도입부에 주요 키워드가 약함", recommendedAction: "expand" }], metaDescriptionDraft: "제습기 추천 기준과 용량 계산법을 정리했습니다." });
      } else if (p.includes("__NODE:meta__")) {
        text = JSON.stringify({ metaTitle: "제습기 추천 가이드", metaDescription: "용량·전기세 기준으로 고르는 법", slug: "dehumidifier-guide", tags: ["제습기", "가전"], category: "생활가전", imagePrompt: "밝은 거실의 제습기", ogTitle: "제습기 추천", ogDescription: "고르는 기준 총정리" });
      } else {
        text = `## 제습기를 고르기 전에 알아야 할 기준\n\n모의 본문입니다. (${req.modelId})\n\n## 용량은 어떻게 계산하나\n\n평수 기준으로 계산합니다.`;
      }
      return { text, usage: { inputTokens: 1000, outputTokens: 800, cacheReadTokens: 0, cacheWriteTokens: 0 } };
    },
  };
}

export type AdapterRegistry = Partial<Record<ProviderId, LlmAdapter>>;

export function buildRegistry(opts: { claude?: ClaudeCaller; mock?: LlmAdapter }): AdapterRegistry {
  const reg: AdapterRegistry = {};
  if (opts.claude) reg.anthropic = claudeAdapter(opts.claude);
  if (opts.mock) reg.mock = opts.mock;
  return reg;
}
