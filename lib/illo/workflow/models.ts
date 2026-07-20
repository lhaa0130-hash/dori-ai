// 모델 역할 추상화 — 워크플로우는 "역할"만 선언하고 실제 모델은 여기서 매핑한다.
// 원칙: 워크플로우 정의에 모델명을 하드코딩하지 않는다. 모델이 바뀌거나 종료돼도
// 이 파일의 매핑만 고치면 모든 워크플로우가 따라온다.

export type ModelClass = "fast" | "balanced" | "reasoning" | "writing" | "judge";
export type ProviderId = "anthropic" | "openai" | "google" | "groq" | "openrouter" | "mock";

export type AvailableModel = {
  id: string;
  name: string;
  providerId: ProviderId;
  capabilities: {
    fast: boolean; writing: boolean; reasoning: boolean;
    structuredOutput: boolean; longContext: boolean;
  };
  /** 1M 토큰당 USD */
  inputCost?: number;
  outputCost?: number;
  active: boolean;
};

export type ProviderConfig = {
  id: ProviderId;
  name: string;
  /** 관리자가 켜둔 provider인가 */
  enabled: boolean;
  /** 키가 실제로 연결됐는가 */
  apiKeyConfigured: boolean;
  models: AvailableModel[];
};

const cap = (o: Partial<AvailableModel["capabilities"]>): AvailableModel["capabilities"] => ({
  fast: false, writing: false, reasoning: false, structuredOutput: false, longContext: false, ...o,
});

/** ⚠️ 단가·모델 id는 공식 문서 기준. 새 provider를 연결하면 여기에 추가하고 enabled를 켠다. */
export const PROVIDERS: ProviderConfig[] = [
  {
    id: "anthropic", name: "Anthropic Claude", enabled: true, apiKeyConfigured: true,
    models: [
      { id: "claude-haiku-4-5", name: "Haiku 4.5", providerId: "anthropic", active: true,
        inputCost: 1, outputCost: 5, capabilities: cap({ fast: true, structuredOutput: true }) },
      // Sonnet 5는 2026-08-31까지 도입가($2/$10), 이후 $3/$15
      { id: "claude-sonnet-5", name: "Sonnet 5", providerId: "anthropic", active: true,
        inputCost: 2, outputCost: 10, capabilities: cap({ writing: true, reasoning: true, structuredOutput: true, longContext: true }) },
      { id: "claude-opus-4-8", name: "Opus 4.8", providerId: "anthropic", active: true,
        inputCost: 5, outputCost: 25, capabilities: cap({ writing: true, reasoning: true, structuredOutput: true, longContext: true }) },
    ],
  },
  // ── 아래는 아직 미연결. enabled를 켜고 키를 넣으면 워크플로우 정의 수정 없이 즉시 사용된다 ──
  {
    id: "google", name: "Google Gemini", enabled: false, apiKeyConfigured: false,
    models: [
      { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", providerId: "google", active: true,
        capabilities: cap({ fast: true, structuredOutput: true }) },
      { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", providerId: "google", active: true,
        capabilities: cap({ writing: true, reasoning: true, structuredOutput: true, longContext: true }) },
    ],
  },
  {
    id: "openai", name: "OpenAI", enabled: false, apiKeyConfigured: false,
    models: [
      { id: "gpt-5-mini", name: "GPT-5 mini", providerId: "openai", active: true,
        capabilities: cap({ fast: true, structuredOutput: true }) },
      { id: "gpt-5", name: "GPT-5", providerId: "openai", active: true,
        capabilities: cap({ writing: true, reasoning: true, structuredOutput: true, longContext: true }) },
    ],
  },
  {
    id: "groq", name: "Groq", enabled: false, apiKeyConfigured: false,
    models: [
      { id: "groq-fast", name: "Groq 고속 모델", providerId: "groq", active: true,
        capabilities: cap({ fast: true }) },
    ],
  },
  {
    id: "mock", name: "모의(테스트)", enabled: false, apiKeyConfigured: true,
    models: [
      { id: "mock-model", name: "Mock", providerId: "mock", active: true,
        inputCost: 0, outputCost: 0, capabilities: cap({ fast: true, writing: true, reasoning: true, structuredOutput: true, longContext: true }) },
    ],
  },
];

export type ModelRef = { providerId: ProviderId; modelId: string };

export function providerById(id: ProviderId): ProviderConfig | null {
  return PROVIDERS.find((p) => p.id === id) || null;
}
export function modelByRef(ref: ModelRef): AvailableModel | null {
  return providerById(ref.providerId)?.models.find((m) => m.id === ref.modelId) || null;
}
export function providerLabel(id: ProviderId): string {
  return providerById(id)?.name || id;
}
/** 실제로 호출 가능한가 = provider가 켜져 있고 키가 있고 모델이 살아 있음 */
export function isUsable(ref: ModelRef): boolean {
  const p = providerById(ref.providerId);
  if (!p || !p.enabled || !p.apiKeyConfigured) return false;
  return !!p.models.find((m) => m.id === ref.modelId && m.active);
}

/** 프리셋 = 역할(ModelClass)마다 후보 모델을 우선순위로 나열한 것 */
export type Preset = {
  id: "economy" | "standard" | "premium";
  label: string;
  desc: string;
  bind: Record<ModelClass, ModelRef[]>;
};

const A = (modelId: string): ModelRef => ({ providerId: "anthropic", modelId });
const G = (modelId: string): ModelRef => ({ providerId: "google", modelId });
const O = (modelId: string): ModelRef => ({ providerId: "openai", modelId });
const Q = (modelId: string): ModelRef => ({ providerId: "groq", modelId });

export const PRESETS: Preset[] = [
  {
    id: "economy", label: "이코노미", desc: "비용·속도 우선",
    bind: {
      fast: [G("gemini-2.5-flash"), Q("groq-fast"), A("claude-haiku-4-5")],
      balanced: [G("gemini-2.5-flash"), A("claude-haiku-4-5")],
      writing: [A("claude-haiku-4-5"), G("gemini-2.5-flash")],
      reasoning: [G("gemini-2.5-pro"), A("claude-haiku-4-5")],
      judge: [G("gemini-2.5-pro"), A("claude-haiku-4-5")],
    },
  },
  {
    id: "standard", label: "스탠다드", desc: "품질과 비용의 균형 (기본)",
    bind: {
      fast: [G("gemini-2.5-flash"), A("claude-haiku-4-5"), Q("groq-fast")],
      balanced: [O("gpt-5-mini"), A("claude-haiku-4-5"), G("gemini-2.5-flash")],
      writing: [A("claude-sonnet-5"), O("gpt-5"), G("gemini-2.5-pro")],
      reasoning: [O("gpt-5"), A("claude-sonnet-5"), G("gemini-2.5-pro")],
      judge: [O("gpt-5"), G("gemini-2.5-pro"), A("claude-sonnet-5")],
    },
  },
  {
    id: "premium", label: "프리미엄", desc: "품질 우선",
    bind: {
      fast: [G("gemini-2.5-flash"), A("claude-haiku-4-5")],
      balanced: [A("claude-sonnet-5"), O("gpt-5")],
      writing: [A("claude-opus-4-8"), A("claude-sonnet-5"), O("gpt-5")],
      reasoning: [O("gpt-5"), A("claude-opus-4-8"), G("gemini-2.5-pro")],
      judge: [O("gpt-5"), G("gemini-2.5-pro"), A("claude-opus-4-8")],
    },
  },
];

export function presetById(id: string): Preset {
  return PRESETS.find((p) => p.id === id) || PRESETS[1];
}

/**
 * 역할 → 실제로 쓸 모델 목록(1순위 + 폴백들).
 * avoidProvider: Writer가 쓴 provider를 Judge/FactChecker가 피하도록 (자기 확증 방지).
 *   피할 수 없으면(다른 provider가 없으면) 마지막 순위로 남겨 두고 쓴다 — 아예 못 도는 것보단 낫다.
 */
export function resolveChain(
  cls: ModelClass, preset: Preset, avoidProvider?: ProviderId | null,
): ModelRef[] {
  const usable = preset.bind[cls].filter(isUsable);
  if (!avoidProvider) return usable;
  const others = usable.filter((r) => r.providerId !== avoidProvider);
  const same = usable.filter((r) => r.providerId === avoidProvider);
  return [...others, ...same];   // 다른 provider 우선, 없으면 같은 것이라도
}
