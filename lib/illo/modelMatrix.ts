// ⚙️ 관리자 전용 — 분야별 추천 모델 카탈로그 (소비자에겐 비공개).
// 텍스트뿐 아니라 이미지·영상·음성·음악까지 각 분야 최적 모델을 미리 매칭해 둔다.
// 매달 1회 검토해 이 파일만 갱신하면 됨. 소비자는 "무슨 작업"만 고르면 자동 매칭됨.
//
// ── 현행 모델/가격 메모(2026-06 기준) ──
//  [텍스트]
//   anthropic claude-haiku-4-5   $1/$5    빠르고 저렴 (대화·요약·번역·답변·SNS)
//   anthropic claude-sonnet-4-6  $3/$15   장문·창의 (블로그·카피·상세·문서)
//   anthropic claude-opus-4-8    $5/$25   최고급 (전략·고난도)
//   openai    gpt-5.5 / gpt-5.4-mini      범용·코드
//   gemini    gemini-2.5-pro / -flash     초저가·대량 (flash)
//   deepseek  deepseek-chat / -reasoner   가성비 대량
//   ollama    (로컬·무료)                  비용 0
//  [이미지] fal.ai 경유
//   fal-ai/imagen4/preview                범용 고품질
//   fal-ai/flux-pro/v1.1                   범용 고품질
//   fal-ai/bytedance/seedream/v3          범용
//   fal-ai/ideogram/v2                    글자(텍스트) 강함
//   fal-ai/recraft-v3                     디자인·로고
//   fal-ai/gemini-flash-image (nano-banana) 편집·일관성
//  [영상] fal.ai
//   fal-ai/kling-video                    고품질
//   fal-ai/google/veo                     고품질
//   fal-ai/bytedance/seedance/v1          범용
//   fal-ai/ltx-video                      빠름·저렴
//   fal-ai/minimax/video-01 (Hailuo)      대안
//  [음성] elevenlabs(TTS 최상) / openai TTS(저렴) / openai whisper(STT)
//  [음악] suno / fal.ai music

export type Provider =
  | 'anthropic' | 'openai' | 'gemini' | 'deepseek' | 'ollama'
  | 'fal' | 'elevenlabs' | 'suno';
export type Domain = 'text' | 'image' | 'video' | 'tts' | 'stt' | 'music';

export const PROVIDER_LABEL: Record<Provider, string> = {
  anthropic: 'Claude', openai: 'OpenAI GPT', gemini: 'Google Gemini',
  deepseek: 'DeepSeek', ollama: '로컬(무료)',
  fal: 'fal.ai', elevenlabs: 'ElevenLabs', suno: 'Suno',
};

export interface ModelPick {
  provider: Provider;
  model: string;
  domain: Domain;
  note?: string;
}

export const MATRIX_UPDATED = '2026-06-07'; // 마지막 갱신일 (매달 검토)

// ───────────────────────── 텍스트 기능별 매칭 ─────────────────────────
// (현재 웹 실행은 텍스트=Claude. 다른 provider는 실행 연동을 단계적으로 붙임)
export const FEATURE_PICK: Record<string, ModelPick> = {
  assistant: { provider: 'anthropic', model: 'claude-haiku-4-5',  domain: 'text', note: '비서: 빠른 응답' },
  docs:      { provider: 'anthropic', model: 'claude-sonnet-4-6', domain: 'text', note: '문서: 구조·품질' },
  mail:      { provider: 'anthropic', model: 'claude-haiku-4-5',  domain: 'text', note: '메일: 빠름' },
  summary:   { provider: 'gemini',    model: 'gemini-2.5-flash',  domain: 'text', note: '요약: 초저가·빠름' },
  copy:      { provider: 'anthropic', model: 'claude-sonnet-4-6', domain: 'text', note: '카피: 창의성' },
  product:   { provider: 'anthropic', model: 'claude-sonnet-4-6', domain: 'text', note: '상세: 설득력' },
  reply:     { provider: 'anthropic', model: 'claude-haiku-4-5',  domain: 'text', note: '답변: 빠름' },
  translate: { provider: 'gemini',    model: 'gemini-2.5-flash',  domain: 'text', note: '번역: 다국어·저렴' },
  meeting:   { provider: 'anthropic', model: 'claude-haiku-4-5',  domain: 'text', note: '회의록: 빠름' },
  blog:      { provider: 'anthropic', model: 'claude-sonnet-4-6', domain: 'text', note: '블로그: 장문 품질' },
  sns:       { provider: 'anthropic', model: 'claude-haiku-4-5',  domain: 'text', note: 'SNS: 짧은 글' },
};

// ───────────────────────── 미디어 분야별 매칭 ─────────────────────────
// 미디어 기능(추후 추가)에서 사용할 1순위 모델. 대안은 ALT에 정리.
export const MEDIA_PICK: Record<string, ModelPick> = {
  image:        { provider: 'fal', model: 'fal-ai/imagen4/preview',                domain: 'image', note: '범용 고품질' },
  image_text:   { provider: 'fal', model: 'fal-ai/ideogram/v2',                    domain: 'image', note: '글자 렌더 강함' },
  image_design: { provider: 'fal', model: 'fal-ai/recraft-v3',                     domain: 'image', note: '디자인·로고' },
  image_edit:   { provider: 'fal', model: 'fal-ai/gemini-flash-image',             domain: 'image', note: '편집·일관성(nano-banana)' },
  video:        { provider: 'fal', model: 'fal-ai/kling-video/v1/standard/text-to-video', domain: 'video', note: '고품질' },
  video_fast:   { provider: 'fal', model: 'fal-ai/ltx-video',                      domain: 'video', note: '빠름·저렴' },
  tts:          { provider: 'elevenlabs', model: 'eleven_multilingual_v2',         domain: 'tts',   note: '성우·나레이션 최상' },
  tts_cheap:    { provider: 'openai', model: 'gpt-4o-mini-tts',                     domain: 'tts',   note: '저렴' },
  stt:          { provider: 'openai', model: 'gpt-4o-transcribe',                  domain: 'stt',   note: '받아쓰기' },
  music:        { provider: 'suno',  model: 'suno-v4',                             domain: 'music', note: '음악·BGM' },
};

// 분야별 대안(관리자 참고용)
export const ALT: Record<string, ModelPick[]> = {
  image: [
    { provider: 'fal', model: 'fal-ai/flux-pro/v1.1', domain: 'image' },
    { provider: 'fal', model: 'fal-ai/bytedance/seedream/v3/text-to-image', domain: 'image' },
  ],
  video: [
    { provider: 'fal', model: 'fal-ai/google/veo', domain: 'video' },
    { provider: 'fal', model: 'fal-ai/bytedance/seedance/v1/lite/text-to-video', domain: 'video' },
    { provider: 'fal', model: 'fal-ai/minimax/video-01', domain: 'video' },
  ],
  text: [
    { provider: 'openai', model: 'gpt-5.5', domain: 'text' },
    { provider: 'gemini', model: 'gemini-2.5-pro', domain: 'text' },
    { provider: 'deepseek', model: 'deepseek-chat', domain: 'text' },
  ],
};

export const FEATURE_MODEL_FALLBACK = 'claude-haiku-4-5';

/** 기능에 매칭된 모델 정보(provider+model). 소비자엔 비공개. */
export function pickForFeature(featureId: string): ModelPick {
  return FEATURE_PICK[featureId] || { provider: 'anthropic', model: FEATURE_MODEL_FALLBACK, domain: 'text' };
}

/**
 * 현재 텍스트 실행 경로용 — Claude 모델 id 반환(하위호환).
 * 텍스트 기능이 Claude가 아닐 경우(예: gemini)에도, 실행 연동 전까지는
 * Claude로 폴백해 동작을 보장한다. (멀티 provider 실행은 단계적으로 연동)
 */
export function modelForFeature(featureId: string): string {
  const p = pickForFeature(featureId);
  if (p.provider === 'anthropic') return p.model;
  // 텍스트 비-Claude는 품질 등가 Claude로 폴백
  return p.domain === 'text' ? 'claude-haiku-4-5' : FEATURE_MODEL_FALLBACK;
}
