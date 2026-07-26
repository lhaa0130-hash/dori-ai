// My World 보상 **표시** 계약 회귀 (WS5).
//
// ⚠️ 보상 계약 자체(요청 body·operationId·지급량·cooldown·서버 판정)는 검증 대상이 아니다.
//    그건 tests/reward-client.test.ts·reward-policy-*.test.ts 가 이미 덮는다.
//    여기서는 **UI 가 서버 결과를 어떻게 말하는지**만 고정한다.
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const src = (rel: string) => readFileSync(new URL(rel, root), "utf8");

test("응답 전에 증가량을 확정 표시하지 않는다", () => {
  const ctx = src("contexts/InteractionContext.tsx");
  // claimReward 호출 **앞**에 EXP 알림을 띄우면 실패했을 때도 성공처럼 보인다.
  const claimIdx = ctx.indexOf("void claimReward(");
  assert.ok(claimIdx > 0, "claimReward 호출을 찾지 못했다");
  const before = ctx.slice(0, claimIdx);
  assert.equal(
    /notify\(\{[^}]*tone:\s*"exp"/.test(before),
    false,
    "claimReward 호출 전에 EXP 알림을 띄우면 안 된다(낙관적 표시 금지)",
  );
  // 서버가 준 awardedExp 로만 표시한다.
  assert.ok(ctx.includes("outcome.result.awardedExp"), "서버 awardedExp 를 표시에 써야 한다");
});

test("실패를 한 문구로 뭉개지 않는다 — outcome 5종을 각각 다르게 말한다", () => {
  const ctx = src("contexts/InteractionContext.tsx");
  for (const status of ["applied", "duplicate", "queued", "rejected"]) {
    assert.ok(ctx.includes(`"${status}"`), `${status} 분기가 없다`);
  }
  // skipped 는 게스트 안내가 담당하므로 별도 알림을 만들지 않는다(주석으로 근거 명시).
  assert.ok(ctx.includes("skipped"), "skipped 처리 근거가 없다");
  // 서로 다른 문구인지 — 중복 라벨이 있으면 뭉갠 것이다.
  const labels = [...ctx.matchAll(/label:\s*"([^"]{4,})"/g)].map((m) => m[1]);
  const rewardLabels = labels.filter((l) => /반영|불안정|적립/.test(l));
  assert.ok(rewardLabels.length >= 3, `보상 관련 문구가 너무 적다: ${JSON.stringify(rewardLabels)}`);
  assert.equal(new Set(rewardLabels).size, rewardLabels.length, "보상 문구가 중복된다");
});

test("사용자 문구에 HTTP 코드·기술 용어가 없다", () => {
  const ctx = src("contexts/InteractionContext.tsx");
  const labels = [...ctx.matchAll(/label:\s*`?"?([^"`]{2,60})"?`?,\s*tone/g)].map((m) => m[1]);
  for (const l of labels) {
    assert.equal(/\b(4\d\d|5\d\d)\b/.test(l), false, `HTTP 코드 노출: ${l}`);
    assert.equal(/Firebase|Firestore|permission-denied|token/i.test(l), false, `기술 용어 노출: ${l}`);
  }
});

test("요청 중에는 같은 행동을 다시 보내지 않는다", () => {
  const actions = src("components/my-world/interaction/InteractionActions.tsx");
  assert.ok(actions.includes("claiming"), "claiming 상태를 받지 않는다");
  assert.match(actions, /disabled\s*=\s*loading \|\| waiting \|\| claiming/, "요청 중 버튼이 비활성화되지 않는다");
  assert.ok(actions.includes("적립 중"), "요청 중 상태가 화면에 보이지 않는다");
});

test("cooldown 시계는 미래 cooldown 이 있을 때만 돈다(interval 누수 방지)", () => {
  const actions = src("components/my-world/interaction/InteractionActions.tsx");
  // 지나간 타임스탬프로 조건을 만들면 interval 이 영구히 돈다.
  assert.equal(
    /some\(\(until\) => typeof until === "number" && until > 0\)/.test(actions),
    false,
    "`until > 0` 조건은 지나간 cooldown 에도 참이라 interval 이 멈추지 않는다",
  );
  assert.ok(actions.includes("hasFuture"), "미래 cooldown 판정이 없다");
  assert.match(actions, /if \(!hasFuture\(t\)\) clearInterval\(timer\)/, "스스로 멈추는 정리 코드가 없다");
});

test("보상 계약 파일을 수정하지 않았다 — UI 는 결과만 소비한다", () => {
  const ctx = src("contexts/InteractionContext.tsx");
  // 금액·operationId 규칙을 UI 에서 만들지 않는다.
  assert.equal(/amount\s*:/.test(ctx), false, "UI 가 금액을 보내면 안 된다");
  assert.ok(ctx.includes("deriveOperationId(event.id)"), "operationId 는 기존 규칙을 그대로 쓴다");
  // cooldown 수치는 constants 가 소유한다(UI 가 자체 시간을 만들지 않는다).
  const availability = src("lib/myWorld/interaction/availability.ts");
  assert.ok(availability.includes("INTERACTION_AFFINITY_DAILY_MAX"), "상한은 constants 에서 온다");
  assert.equal(/=\s*\d{3,}\s*;?\s*\/\/\s*cooldown/i.test(availability), false, "표시용 모듈이 cooldown 수치를 정의하면 안 된다");
});
