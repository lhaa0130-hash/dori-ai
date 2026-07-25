// 보상 엔드포인트 실행 환경 해석(05-06I) — production / restricted / emulator.
//  ⚠️ fail-closed: emulator 모드는 로컬 전용 안전장치를 모두 통과해야만 활성화된다.
//   · project ID 는 반드시 demo- 접두(운영 프로젝트 오염 방지)
//   · Firestore/Auth emulator host 는 반드시 loopback
//   · production 대상은 항상 https(운영 Firestore), emulator 대상은 항상 http(loopback)
//   · production 경로에서 emulator URL, emulator 경로에서 production URL 을 쓰면 즉시 실패
//   · production 은 REWARD_ENV=production 일 때만. 그 외(미설정/preview)는 restricted(allowlist 강제).
import {
  type FirestoreTarget, productionFirestoreTarget, emulatorFirestoreTarget,
} from "./firestoreRest.ts";

const LOOPBACK_RE = /^(127\.0\.0\.1|localhost|\[::1\]|::1)(:\d{1,5})?$/;

export interface RewardEnvProduction { mode: "production"; target: FirestoreTarget; clientEmail: string; privateKey: string; }
export interface RewardEnvRestricted { mode: "restricted"; target: FirestoreTarget; clientEmail: string; privateKey: string; }
export interface RewardEnvEmulator { mode: "emulator"; target: FirestoreTarget; projectId: string; firestoreHost: string; authHost: string; }
export type ResolvedRewardEnv = RewardEnvProduction | RewardEnvRestricted | RewardEnvEmulator;
export type RewardEnvResult = { ok: true; env: ResolvedRewardEnv } | { ok: false; status: number; error: string };

export function resolveRewardEnv(env: Record<string, any>): RewardEnvResult {
  const rawMode = String(env.REWARD_ENV || "").trim().toLowerCase();

  if (rawMode === "emulator") {
    const projectId = String(env.FIREBASE_PROJECT_ID || "").trim();
    const firestoreHost = String(env.FIRESTORE_EMULATOR_HOST || "").trim();
    const authHost = String(env.FIREBASE_AUTH_EMULATOR_HOST || "").trim();
    // 로컬 전용 안전장치(하나라도 실패 시 지급하지 않음).
    if (!projectId.startsWith("demo-")) return { ok: false, status: 500, error: "emulator_requires_demo_project" };
    if (!LOOPBACK_RE.test(firestoreHost)) return { ok: false, status: 500, error: "emulator_firestore_host_not_loopback" };
    if (!LOOPBACK_RE.test(authHost)) return { ok: false, status: 500, error: "emulator_auth_host_not_loopback" };
    const target = emulatorFirestoreTarget(projectId, firestoreHost);
    // emulator 대상이 실수로 production URL 을 가리키면 즉시 실패.
    if (!target.emulator || !target.restBaseUrl.startsWith("http://")) return { ok: false, status: 500, error: "emulator_target_misconfigured" };
    if (target.restBaseUrl.includes("firestore.googleapis.com")) return { ok: false, status: 500, error: "emulator_target_points_to_production" };
    return { ok: true, env: { mode: "emulator", target, projectId, firestoreHost, authHost } };
  }

  // production / restricted — SA Secret 로 OAuth, 대상은 운영 Firestore(https).
  const clientEmail = String(env.FIREBASE_SA_CLIENT_EMAIL || "");
  const privateKey = String(env.FIREBASE_SA_PRIVATE_KEY || "");
  const target = productionFirestoreTarget();
  // 운영 대상이 emulator URL 을 쓰지 않는지 방어(구성상 불가하지만 명시).
  if (target.emulator || !target.restBaseUrl.startsWith("https://")) return { ok: false, status: 500, error: "production_target_misconfigured" };
  const isProduction = rawMode === "production";
  return { ok: true, env: { mode: isProduction ? "production" : "restricted", target, clientEmail, privateKey } };
}
