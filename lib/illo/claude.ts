// Claude 호출 — 두 가지 모드:
//  1) 무료(공용 키): 본인 키 없이 로그인 토큰으로 Firebase 프록시 호출 → 운영자 키 + Haiku, 하루 50회.
//  2) 본인 키: 브라우저에서 Anthropic 직접 호출(무제한). anthropic-dangerous-direct-browser-access 헤더.
// 키는 어느 쪽이든 운영자 서버에 저장되지 않음(무료 모드는 서버가 자기 키로 대신 호출만).

export const ILLO_MODELS: { id: string; label: string }[] = [
  { id: 'claude-haiku-4-5', label: 'Haiku 4.5 · 빠르고 저렴' },
  { id: 'claude-sonnet-4-6', label: 'Sonnet 4.6 · 균형' },
];
export const ILLO_DEFAULT_MODEL = 'claude-haiku-4-5';

const ENDPOINT = 'https://api.anthropic.com/v1/messages';
// 무료(공용 키) 프록시 — 운영자 Claude 키를 보관한 Firebase Function.
const PROXY_URL = 'https://us-central1-dori-ai-0130.cloudfunctions.net/assistantProxy';
// AI 게이트웨이 — 분야별 최고 AI를 서버에서 라우팅(Claude/Gemini/GPT/fal/Tavily…).
const GATEWAY_URL = 'https://us-central1-dori-ai-0130.cloudfunctions.net/illoGateway';

/** 기본 미디어 생성 — 글 한 줄로 이미지/영상 바로 생성(fal.ai). 패키지 아님. */
export async function callMedia(opts: {
  idToken: string; kind: 'image' | 'video'; prompt: string;
}): Promise<CallResult> {
  let res: Response;
  try {
    res = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${opts.idToken}` },
      body: JSON.stringify({ kind: opts.kind, featureId: opts.kind, prompt: opts.prompt }),
    });
  } catch {
    throw new Error('네트워크 오류로 연결하지 못했습니다. 인터넷 연결을 확인해 주세요.');
  }
  if (res.status === 429) throw new Error('FREE_QUOTA_EXCEEDED');
  if (res.status === 401) throw new Error('로그인이 만료됐어요. 새로고침 후 다시 시도해 주세요.');
  if (!res.ok) {
    let detail = '';
    try { detail = (await res.json())?.error || ''; } catch { /* */ }
    throw new Error(`오류 (${res.status})${detail ? ': ' + detail : ''}`);
  }
  const rem = res.headers.get('x-quota-remaining');
  const data = await res.json();
  return {
    text: '',
    image: data.image || null,
    video: data.video || null,
    quotaRemaining: rem != null && rem !== '' ? Math.max(0, parseInt(rem, 10) || 0) : undefined,
  };
}

/** 게이트웨이 호출. kind='package'면 여러 AI(리서치→작성→검토→이미지/영상)를 연쇄 실행. */
export async function callGateway(opts: {
  idToken: string; featureId: string; prompt: string;
  kind?: 'text' | 'package'; input?: string; maxTokens?: number;
}): Promise<CallResult> {
  let res: Response;
  try {
    res = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${opts.idToken}` },
      body: JSON.stringify({
        kind: opts.kind || 'text', featureId: opts.featureId,
        prompt: opts.prompt, input: opts.input || '', maxTokens: opts.maxTokens || 2048,
      }),
    });
  } catch {
    throw new Error('네트워크 오류로 연결하지 못했습니다. 인터넷 연결을 확인해 주세요.');
  }
  if (res.status === 429) throw new Error('FREE_QUOTA_EXCEEDED');
  if (res.status === 401) throw new Error('로그인이 만료됐어요. 새로고침 후 다시 시도해 주세요.');
  if (!res.ok) {
    let detail = '';
    try { detail = (await res.json())?.error || ''; } catch { /* */ }
    throw new Error(`오류 (${res.status})${detail ? ': ' + detail : ''}`);
  }
  const rem = res.headers.get('x-quota-remaining');
  const data = await res.json();
  return {
    text: data.text || '(빈 응답)',
    image: data.image || null,
    video: data.video || null,
    steps: Array.isArray(data.steps) ? data.steps : undefined,
    quotaRemaining: rem != null && rem !== '' ? Math.max(0, parseInt(rem, 10) || 0) : undefined,
  };
}

export interface CallOpts {
  apiKey?: string;   // 본인 키(있으면 직접 호출, 무제한)
  idToken?: string;  // 무료 모드용 로그인 토큰(본인 키 없을 때)
  prompt: string;
  model?: string;
  maxTokens?: number;
}
export interface CallResult {
  text: string;
  quotaRemaining?: number; // 무료 모드일 때 오늘 남은 호출 수
  image?: string | null;   // 패키지 결과 이미지 URL(fal.ai)
  video?: string | null;   // 패키지 결과 영상 URL(fal.ai)
  steps?: string[];        // 실제로 돌아간 AI 단계(소비자 표시용)
}

/** Claude 호출. 실패 시 사용자용 한국어 에러를 throw (무료 한도 초과는 'FREE_QUOTA_EXCEEDED'). */
export async function callClaude(opts: CallOpts): Promise<CallResult> {
  const { apiKey, idToken, prompt, model = ILLO_DEFAULT_MODEL, maxTokens = 2000 } = opts;
  const useProxy = !apiKey && !!idToken;
  if (!apiKey && !idToken) throw new Error('LOGIN_REQUIRED');

  let res: Response;
  try {
    res = await fetch(useProxy ? PROXY_URL : ENDPOINT, {
      method: 'POST',
      headers: useProxy
        ? { 'content-type': 'application/json', authorization: `Bearer ${idToken}` }
        : {
            'content-type': 'application/json',
            'x-api-key': (apiKey as string).trim(),
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
      body: JSON.stringify({ model, max_tokens: maxTokens, messages: [{ role: 'user', content: prompt }] }),
    });
  } catch {
    throw new Error('네트워크 오류로 연결하지 못했습니다. 인터넷 연결을 확인해 주세요.');
  }

  if (useProxy && res.status === 429) throw new Error('FREE_QUOTA_EXCEEDED');
  if (!res.ok) {
    let detail = '';
    try { detail = (await res.json())?.error?.message || ''; } catch { /* */ }
    if (res.status === 401) throw new Error(useProxy ? '로그인이 만료됐어요. 새로고침 후 다시 시도해 주세요.' : 'API 키가 올바르지 않습니다. 키를 다시 확인해 주세요.');
    if (res.status === 400 && /model/i.test(detail)) throw new Error('이 키로 사용할 수 없는 모델입니다. 다른 모델을 선택해 보세요.');
    if (res.status === 429) throw new Error('요청이 많습니다(또는 크레딧 부족). 잠시 후 다시 시도해 주세요.');
    throw new Error(`오류 (${res.status})${detail ? ': ' + detail : ''}`);
  }

  let quotaRemaining: number | undefined;
  if (useProxy) {
    const rem = res.headers.get('x-quota-remaining');
    if (rem != null && rem !== '') quotaRemaining = Math.max(0, parseInt(rem, 10) || 0);
  }
  const data = await res.json();
  const text = Array.isArray(data?.content)
    ? data.content.filter((b: { type?: string }) => b?.type === 'text').map((b: { text?: string }) => b.text || '').join('')
    : '';
  return { text: text || '(빈 응답)', quotaRemaining };
}
