import assert from "node:assert/strict";
import test from "node:test";
import { resolveRewardEnv } from "../functions/_shared/rewardEnv.ts";
import { productionFirestoreTarget, emulatorFirestoreTarget } from "../functions/_shared/firestoreRest.ts";

const SA = { FIREBASE_SA_CLIENT_EMAIL: "svc@x.iam", FIREBASE_SA_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\nx\n-----END PRIVATE KEY-----" };

test("production 모드 → 운영 Firestore(https) 대상", () => {
  const r = resolveRewardEnv({ REWARD_ENV: "production", ...SA });
  assert.ok(r.ok && r.env.mode === "production");
  if (r.ok) { assert.equal(r.env.target.emulator, false); assert.match(r.env.target.restBaseUrl, /^https:\/\/firestore\.googleapis\.com/); }
});

test("REWARD_ENV 미설정 → restricted(allowlist 강제 모드)", () => {
  const r = resolveRewardEnv({ ...SA });
  assert.ok(r.ok && r.env.mode === "restricted");
});

test("emulator 모드 → demo- 프로젝트 + loopback + http 대상", () => {
  const r = resolveRewardEnv({ REWARD_ENV: "emulator", FIREBASE_PROJECT_ID: "demo-illo-myworld", FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080", FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099" });
  assert.ok(r.ok && r.env.mode === "emulator");
  if (r.ok && r.env.mode === "emulator") {
    assert.equal(r.env.target.emulator, true);
    assert.match(r.env.target.restBaseUrl, /^http:\/\/127\.0\.0\.1:8080/);
    assert.equal(r.env.projectId, "demo-illo-myworld");
  }
});

test("fail-closed: emulator 인데 데모 프로젝트가 아니면 거부", () => {
  const r = resolveRewardEnv({ REWARD_ENV: "emulator", FIREBASE_PROJECT_ID: "dori-ai-0130", FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080", FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099" });
  assert.ok(!r.ok);
  if (!r.ok) assert.equal(r.error, "emulator_requires_demo_project");
});

test("fail-closed: emulator host 가 loopback 이 아니면 거부(운영 유출 차단)", () => {
  for (const host of ["firestore.googleapis.com", "10.0.0.5:8080", "evil.example.com:8080"]) {
    const r = resolveRewardEnv({ REWARD_ENV: "emulator", FIREBASE_PROJECT_ID: "demo-x", FIRESTORE_EMULATOR_HOST: host, FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099" });
    assert.ok(!r.ok, `${host} 는 거부돼야 한다`);
    if (!r.ok) assert.equal(r.error, "emulator_firestore_host_not_loopback");
  }
  const rAuth = resolveRewardEnv({ REWARD_ENV: "emulator", FIREBASE_PROJECT_ID: "demo-x", FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080", FIREBASE_AUTH_EMULATOR_HOST: "auth.prod:9099" });
  assert.ok(!rAuth.ok && !rAuth.ok && rAuth.error === "emulator_auth_host_not_loopback");
});

test("target 구성: production=https·emulator=http, 프로젝트/URL 일관", () => {
  const p = productionFirestoreTarget();
  assert.equal(p.emulator, false);
  assert.ok(p.restBaseUrl.includes(p.projectId) && p.documentRoot.includes(p.projectId));
  const e = emulatorFirestoreTarget("demo-illo-myworld", "127.0.0.1:8080");
  assert.equal(e.emulator, true);
  assert.ok(e.restBaseUrl.startsWith("http://127.0.0.1:8080") && e.documentRoot.includes("demo-illo-myworld"));
  // 운영 URL 이 emulator 대상에 섞이지 않는다.
  assert.equal(e.restBaseUrl.includes("firestore.googleapis.com"), false);
});
