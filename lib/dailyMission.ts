// 일일 미션 완료 발행기 (05-07)
//
// ⚠️ 설계 원칙: 미션은 **활동이 실제로 일어난 그 자리**에서만 완료된다.
//   예전엔 /my 의 '받기' 버튼이 활동 여부와 무관하게 클라이언트 인자 금액만큼 지급했다(=P0).
//   지금은 이 함수를 글 저장·댓글 저장·게임 플레이·기사 열람·퀴즈 정답 지점에서 부르고,
//   금액·1일 1회·원장은 전부 서버(POST /api/claim-reward, mission_complete)가 소유한다.
//
// fire-and-forget: 실패해도 호출부 흐름을 막지 않는다(미션은 부가 보상).

/** 서버 MISSION_CANDY 표에 존재하는 미션 id. 여기 없는 id 는 서버가 0 을 지급한다. */
export type DailyMissionId =
  | "attendance" | "read_trend" | "write_post" | "write_comment" | "play_minigame" | "quiz_correct";

/** 미션 완료 청구. 지급 여부·금액은 서버가 정한다. */
export async function claimDailyMission(missionId: DailyMissionId): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    // 정적 import 순환(social → cottonCandy)을 피하려 동적 import 를 쓴다.
    const { getFirebaseAuth } = await import("@/lib/firebase");
    const email = getFirebaseAuth().currentUser?.email;
    if (!email) return;
    const m = await import("./cottonCandy");
    await m.completeMission(email, missionId);
  } catch { /* 부가 보상이라 삼킨다 */ }
}
