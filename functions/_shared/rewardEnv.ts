// 보상 엔드포인트 실행 환경 + 롤아웃 정책 해석(05-06I·05-06K).
//  환경(REWARD_ENV): emulator | 그 외(=운영 Firestore 대상)
//  롤아웃(REWARD_ROLLOUT_MODE): canary | all  — '누구에게 지급하는가'를 명시적으로 결정.
//   ⚠️ fail-closed 원칙:
//    · emulator 는 로컬 안전장치(demo- 프로젝트 + loopback host)를 모두 통과해야만 활성.
//    · 운영 경로에서 롤아웃 모드가 없거나 알 수 없으면 즉시 실패(암묵적 all 금지).
//    · canary 는 REWARD_TEST_UIDS(allowlist)가 필수 — 핸들러가 비었으면 fail-closed, 목록 밖 UID 는 rollout_disabled.
//    · all 은 canary UID 제한만 해제한다. 인증·소유권·상한·원장·타입 검증은 그대로 유지.
//   ⚠️ 롤아웃 모드는 인증/보안 검증을 끄지 않는다. UID 지급 대상 범위만 정한다.
import {
  type FirestoreTarget, productionFirestoreTarget, emulatorFirestoreTarget,
} from "./firestoreRest.ts";

const LOOPBACK_RE = /^(127\.0\.0\.1|localhost|\[::1\]|::1)(:\d{1,5})?$/;

export type RolloutMode = "canary" | "all";
export interface RewardEnvProduction { mode: "production"; target: FirestoreTarget; clientEmail: string; privateKey: string; rollout: RolloutMode; }
export interface RewardEnvEmulator { mode: "emulator"; target: FirestoreTarget; projectId: string; firestoreHost: string; authHost: string; rollout: RolloutMode; }
export type ResolvedRewardEnv = RewardEnvProduction | RewardEnvEmulator;
export type RewardEnvResult = { ok: true; env: ResolvedRewardEnv } | { ok: false; status: number; error: string };

/** REWARD_ROLLOUT_MODE 정규화. 유효하지 않으면 null(→ 운영은 fail-closed). */
function parseRollout(raw: unknown): RolloutMode | null {
  const v = String(raw || "").trim().toLowerCase();
  return v === "canary" || v === "all" ? v : null;
}

export function resolveRewardEnv(env: Record<string, any>): RewardEnvResult {
  const rawMode = String(env.REWARD_ENV || "").trim().toLowerCase();

  if (rawMode === "emulator") {
    const projectId = String(env.FIREBASE_PROJECT_ID || "").trim();
    const firestoreHost = String(env.FIRESTORE_EMULATOR_HOST || "").trim();
    const authHost = String(env.FIREBASE_AUTH_EMULATOR_HOST || "").trim();
    if (!projectId.startsWith("demo-")) return { ok: false, status: 500, error: "emulator_requires_demo_project" };
    if (!LOOPBACK_RE.test(firestoreHost)) return { ok: false, status: 500, error: "emulator_firestore_host_not_loopback" };
    if (!LOOPBACK_RE.test(authHost)) return { ok: false, status: 500, error: "emulator_auth_host_not_loopback" };
    const target = emulatorFirestoreTarget(projectId, firestoreHost);
    if (!target.emulator || !target.restBaseUrl.startsWith("http://")) return { ok: false, status: 500, error: "emulator_target_misconfigured" };
    if (target.restBaseUrl.includes("firestore.googleapis.com")) return { ok: false, status: 500, error: "emulator_target_points_to_production" };
    // 로컬은 기본 all(개발 편의). 명시하면 canary 로 게이트 테스트 가능.
    const rollout = parseRollout(env.REWARD_ROLLOUT_MODE) ?? "all";
    return { ok: true, env: { mode: "emulator", target, projectId, firestoreHost, authHost, rollout } };
  }

  // 운영 경로 — 대상은 운영 Firestore(https). SA Secret 은 핸들러가 검사.
  const clientEmail = String(env.FIREBASE_SA_CLIENT_EMAIL || "");
  const privateKey = String(env.FIREBASE_SA_PRIVATE_KEY || "");
  const target = productionFirestoreTarget();
  if (target.emulator || !target.restBaseUrl.startsWith("https://")) return { ok: false, status: 500, error: "production_target_misconfigured" };
  // ⚠️ 롤아웃 모드가 없거나 알 수 없으면 fail-closed(암묵적 all 금지 → 배포 후 조용한 전체 개방 방지).
  const rollout = parseRollout(env.REWARD_ROLLOUT_MODE);
  if (!rollout) return { ok: false, status: 503, error: "rollout_mode_invalid" };
  return { ok: true, env: { mode: "production", target, clientEmail, privateKey, rollout } };
}
