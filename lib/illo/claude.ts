// 브라우저에서 Anthropic(Claude) 직접 호출 — 서버 없이, 회원 본인 키로.
// anthropic-dangerous-direct-browser-access 헤더로 브라우저 직접 호출 허용(키는 사용자 브라우저에만 존재).

export const ILLO_MODELS: { id: string; label: string }[] = [
  { id: 'claude-haiku-4-5', label: 'Haiku 4.5 · 빠르고 저렴' },
  { id: 'claude-sonnet-4-6', label: 'Sonnet 4.6 · 균형' },
];
export const ILLO_DEFAULT_MODEL = 'claude-haiku-4-5';

const ENDPOINT = 'https://api.anthropic.com/v1/messages';

export interface CallOpts {
  apiKey: string;
  prompt: string;
  model?: string;
  maxTokens?: number;
}

/** Claude 호출 → 생성 텍스트 반환. 실패 시 사용자용 한국어 에러를 throw. */
export async function callClaude({ apiKey, prompt, model = ILLO_DEFAULT_MODEL, maxTokens = 2000 }: CallOpts): Promise<string> {
  if (!apiKey) throw new Error('API 키가 없습니다. 먼저 Claude API 키를 입력해 주세요.');
  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey.trim(),
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
  } catch {
    throw new Error('네트워크 오류로 Claude에 연결하지 못했습니다. 인터넷 연결을 확인해 주세요.');
  }

  if (!res.ok) {
    let detail = '';
    try {
      const j = await res.json();
      detail = j?.error?.message || '';
    } catch { /* ignore */ }
    if (res.status === 401) throw new Error('API 키가 올바르지 않습니다. 키를 다시 확인해 주세요.');
    if (res.status === 400 && /model/i.test(detail)) throw new Error('이 키로 사용할 수 없는 모델입니다. 다른 모델을 선택해 보세요.');
    if (res.status === 429) throw new Error('요청이 많습니다(또는 크레딧 부족). 잠시 후 다시 시도하거나 Anthropic 잔액을 확인해 주세요.');
    throw new Error(`Claude 오류 (${res.status})${detail ? ': ' + detail : ''}`);
  }

  const data = await res.json();
  const text = Array.isArray(data?.content)
    ? data.content.filter((b: { type?: string }) => b?.type === 'text').map((b: { text?: string }) => b.text || '').join('')
    : '';
  return text || '(빈 응답)';
}
