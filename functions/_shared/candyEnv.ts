// 재화(솜사탕·아이템) 전용 롤아웃 게이트 (05-07B)
//
// ⚠️ 왜 EXP 의 REWARD_ROLLOUT_MODE 를 재사용하지 않는가:
//   운영은 이미 REWARD_ROLLOUT_MODE=all 이다(EXP 릴리스 05-06P). 이걸 그대로 쓰면 새 재화 기능이
//   **배포 즉시 전체 사용자에게 열린다** — 카나리 구간 자체가 없다. 재화는 EXP 와 달리 되돌리기가
//   어렵고(잔액·아이템은 사용자가 이미 소비할 수 있다) 금전적 성격이 있어 별도 게이트가 필요하다.
//
// 계약: CANDY_ROLLOUT_MODE = off | canary | all
//   · 미설정·오타·알 수 없는 값 → **fail-closed(off 와 동일)**. 암묵적 개방 금지.
//   · off    → 재화 관련 요청 전부 거부(candy_rollout_disabled). EXP 는 영향 없음.
//   · canary → REWARD_TEST_UIDS allowlist 안의 UID 만 허용(목록이 비면 fail-closed).
//   · all    → 전체 인증 사용자. 인증·소유권·상한·원장 검증은 그대로 유지.
//
// ⚠️ 이 게이트는 인증/보안 검증을 끄지 않는다. '누구에게 지급/차감하는가' 범위만 정한다.
// ⚠️ 구버전 Functions 는 이 변수를 모른다 → 변수를 미리 넣어도 구버전 동작에 영향이 없다(무시됨).

export type CandyRolloutMode = "off" | "canary" | "all";

export interface CandyGateAllowed { ok: true; mode: CandyRolloutMode }
export interface CandyGateDenied { ok: false; status: number; error: string }
export type CandyGateResult = CandyGateAllowed | CandyGateDenied;

/** CANDY_ROLLOUT_MODE 정규화. 유효하지 않으면 null → 호출부에서 fail-closed. */
export function parseCandyRollout(raw: unknown): CandyRolloutMode | null {
  const v = String(raw ?? "").trim().toLowerCase();
  return v === "off" || v === "canary" || v === "all" ? v : null;
}

/**
 * 재화 게이트 판정.
 * @param envMode  실행 환경("emulator" 면 로컬 기본값 all 허용 — 개발 편의)
 * @param uid      인증된 사용자 UID(반드시 토큰 검증을 마친 값)
 * @param allow    REWARD_TEST_UIDS 파싱 결과
 */
export function resolveCandyGate(
  env: Record<string, any>,
  envMode: "production" | "emulator",
  uid: string,
  allow: Set<string>,
): CandyGateResult {
  const parsed = parseCandyRollout(env.CANDY_ROLLOUT_MODE);
  // 로컬 에뮬레이터는 미설정 시 all(테스트 편의). 운영은 미설정이면 fail-closed.
  const mode: CandyRolloutMode | null = parsed ?? (envMode === "emulator" ? "all" : null);
  if (!mode) return { ok: false, status: 503, error: "candy_rollout_mode_invalid" };
  if (mode === "off") return { ok: false, status: 403, error: "candy_rollout_disabled" };
  if (mode === "canary") {
    if (allow.size === 0) return { ok: false, status: 503, error: "candy_canary_requires_allowlist" };
    if (!allow.has(uid)) return { ok: false, status: 403, error: "candy_rollout_disabled" };
  }
  return { ok: true, mode };
}
