// 미니게임 리워드 광고 — 광고 SDK 연결 전 스텁.
// MartGame.tsx 등에서 import 하는데 모듈이 없어 프로덕션 빌드가 깨져 있었음(복구).
// 광고 연동 시 showRewardedAd를 실제 구현으로 교체하면 됨.

export type RewardedPlacement = string;

export type RewardedResult =
  | { status: "granted"; provider: string }
  | { status: "unavailable" }
  | { status: "dismissed" };

/**
 * 리워드 광고를 띄우고 결과를 반환. 현재는 광고 미연결 → 항상 unavailable(보상 미지급).
 * 실제 광고 SDK 연동 시 이 함수만 교체한다.
 */
export async function showRewardedAd(_opts: {
  placement: RewardedPlacement;
  game: string;
  level?: string | number;
}): Promise<RewardedResult> {
  return { status: "unavailable" };
}
