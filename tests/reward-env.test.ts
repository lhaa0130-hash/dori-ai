import assert from "node:assert/strict";
import test from "node:test";
import { resolveRewardEnv } from "../functions/_shared/rewardEnv.ts";
import { productionFirestoreTarget, emulatorFirestoreTarget } from "../functions/_shared/firestoreRest.ts";

const SA = { FIREBASE_SA_CLIENT_EMAIL: "svc@x.iam", FIREBASE_SA_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\nx\n-----END PRIVATE KEY-----" };
const EMU = { REWARD_ENV: "emulator", FIREBASE_PROJECT_ID: "demo-illo-myworld", FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080", FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099" };

test("운영 + rollout=all → production/all, https 대상", () => {
  const r = resolveRewardEnv({ REWARD_ENV: "production", REWARD_ROLLOUT_MODE: "all", ...SA });
  assert.ok(r.ok && r.env.mode === "production" && r.env.rollout === "all");
  if (r.ok) { assert.equal(r.env.target.emulator, false); assert.match(r.env.target.restBaseUrl, /^https:\/\/firestore\.googleapis\.com/); }
});

test("운영 + rollout=canary → production/canary", () => {
  const r = resolveRewardEnv({ REWARD_ENV: "production", REWARD_ROLLOUT_MODE: "canary", ...SA });
  assert.ok(r.ok && r.env.mode === "production" && r.env.rollout === "canary");
});

test("fail-closed: 운영에서 rollout 미설정 → rollout_mode_invalid(암묵적 all 금지)", () => {
  const r = resolveRewardEnv({ REWARD_ENV: "production", ...SA });
  assert.ok(!r.ok);
  if (!r.ok) { assert.equal(r.error, "rollout_mode_invalid"); assert.equal(r.status, 503); }
});

test("fail-closed: 운영 rollout 오타 → rollout_mode_invalid", () => {
  for (const v of ["ALL_USERS", "prod", "everyone", ""]) {
    const r = resolveRewardEnv({ REWARD_ENV: "production", REWARD_ROLLOUT_MODE: v, ...SA });
    assert.ok(!r.ok && !r.ok && r.error === "rollout_mode_invalid", `${v} 는 거부돼야 한다`);
  }
});

test("REWARD_ENV 미설정도 운영 경로 취급 → rollout 필수(fail-closed)", () => {
  const r = resolveRewardEnv({ ...SA });
  assert.ok(!r.ok && !r.ok && r.error === "rollout_mode_invalid");
});

test("emulator → demo- + loopback, rollout 기본 all", () => {
  const r = resolveRewardEnv({ ...EMU });
  assert.ok(r.ok && r.env.mode === "emulator" && r.env.rollout === "all");
  if (r.ok && r.env.mode === "emulator") {
    assert.equal(r.env.target.emulator, true);
    assert.match(r.env.target.restBaseUrl, /^http:\/\/127\.0\.0\.1:8080/);
  }
});

test("emulator + rollout=canary → 게이트 테스트 가능", () => {
  const r = resolveRewardEnv({ ...EMU, REWARD_ROLLOUT_MODE: "canary" });
  assert.ok(r.ok && r.env.mode === "emulator" && r.env.rollout === "canary");
});

test("fail-closed: emulator 데모 프로젝트 아님 → 거부", () => {
  const r = resolveRewardEnv({ ...EMU, FIREBASE_PROJECT_ID: "dori-ai-0130" });
  assert.ok(!r.ok && !r.ok && r.error === "emulator_requires_demo_project");
});

test("fail-closed: emulator host loopback 아님 → 거부(운영 유출 차단)", () => {
  for (const host of ["firestore.googleapis.com", "10.0.0.5:8080"]) {
    const r = resolveRewardEnv({ ...EMU, FIRESTORE_EMULATOR_HOST: host });
    assert.ok(!r.ok && !r.ok && r.error === "emulator_firestore_host_not_loopback", `${host} 거부`);
  }
  const rAuth = resolveRewardEnv({ ...EMU, FIREBASE_AUTH_EMULATOR_HOST: "auth.prod:9099" });
  assert.ok(!rAuth.ok && !rAuth.ok && rAuth.error === "emulator_auth_host_not_loopback");
});

test("target: production=https·emulator=http, 프로젝트/URL 일관", () => {
  const p = productionFirestoreTarget();
  assert.equal(p.emulator, false);
  assert.ok(p.restBaseUrl.includes(p.projectId) && p.documentRoot.includes(p.projectId));
  const e = emulatorFirestoreTarget("demo-illo-myworld", "127.0.0.1:8080");
  assert.equal(e.emulator, true);
  assert.ok(e.restBaseUrl.startsWith("http://127.0.0.1:8080") && e.documentRoot.includes("demo-illo-myworld"));
  assert.equal(e.restBaseUrl.includes("firestore.googleapis.com"), false);
});
