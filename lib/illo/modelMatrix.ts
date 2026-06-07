// ⚙️ 관리자 전용 — 기능별 추천 모델 매핑.
// 소비자에게는 어떤 모델이 연결됐는지 노출하지 않습니다(UI에 모델 선택 없음).
// AI가 각 작업 성격에 맞춰 추천한 모델이며, 매달 1회 검토해 이 파일만 갱신하면 됩니다.
//
// 현재 모델/가격(입력·출력, $/1M tokens):
//   claude-haiku-4-5  — $1 / $5   · 빠르고 저렴 (짧은 응답·요약·번역·대화)
//   claude-sonnet-4-6 — $3 / $15  · 균형, 장문/창의 품질 (블로그·카피·상세·문서)
//   claude-opus-4-8   — $5 / $25  · 최고 성능 (필요 시에만)
//
// ⚠️ 무료(공용 키) 사용자는 비용 관리를 위해 서버 프록시가 Haiku로 고정합니다.
//    이 매트릭스는 본인 키(무제한) 및 추후 유료 사용자에게 적용됩니다.

export const MATRIX_UPDATED = '2026-06-01'; // 마지막 갱신일 (매달 검토)

// 기능 id → 모델 id
export const FEATURE_MODEL: Record<string, string> = {
  // 핵심
  assistant: 'claude-haiku-4-5',   // 비서실: 빠른 응답 우선
  // AI 작업 도구
  docs: 'claude-sonnet-4-6',       // 문서 작성: 구조·품질
  mail: 'claude-haiku-4-5',        // 메일: 짧고 빠르게
  summary: 'claude-haiku-4-5',     // 요약: 저렴·빠름
  copy: 'claude-sonnet-4-6',       // 광고 카피: 창의성
  product: 'claude-sonnet-4-6',    // 상품 상세: 설득력
  reply: 'claude-haiku-4-5',       // 리뷰 답변: 짧고 빠름
  translate: 'claude-haiku-4-5',   // 번역·교정: 빠름
  meeting: 'claude-haiku-4-5',     // 회의록: 빠름
  blog: 'claude-sonnet-4-6',       // 블로그: 장문 품질
  sns: 'claude-haiku-4-5',         // SNS: 짧은 글
};

export const FEATURE_MODEL_FALLBACK = 'claude-haiku-4-5';

/** 기능에 미리 매칭된 모델 id (소비자에겐 비공개). */
export function modelForFeature(featureId: string): string {
  return FEATURE_MODEL[featureId] || FEATURE_MODEL_FALLBACK;
}
