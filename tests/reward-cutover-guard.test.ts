// 05-06G 정적 회귀 가드 — 직접 EXP 쓰기 패턴을 감시한다.
// My World 는 서버 청구로 전환됐어야 하고(회귀 금지), 아직 미전환인 호출자는 명시적 allowlist 로
// 고정한다 → 새 직접 쓰기 호출자가 들어오면 실패한다(SECURITY HARDENING INCOMPLETE 추적).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("My World interaction context no longer calls the client-authoritative addExp", () => {
  const src = read("contexts/InteractionContext.tsx");
  assert.ok(src.includes("claimReward("), "서버 청구(claimReward)로 전환되어 있어야 한다");
  assert.equal(/\baddExp\s*\(/.test(src), false, "My World 가 addExp 로 회귀하면 안 된다");
});

test("client-authoritative addExp callers are a known, tracked set (still INCOMPLETE)", () => {
  // 아직 서버로 전환되지 않은 addExp(email, amount) 직접 호출자. 전환 시 이 목록에서 제거.
  const EXPECTED_REMAINING = [
    "app/community/page.client.tsx",      // 댓글 +5
    "app/community/write/page.client.tsx",// 글 +15
    "lib/cottonCandy.ts",                 // ensureExpAtLeast / grantPlaytimeReward / checkAttendance 내부
  ];
  for (const file of EXPECTED_REMAINING) {
    assert.ok(/\baddExp\s*\(/.test(read(file)), `${file} 는 여전히 직접 addExp 를 호출한다(추적됨)`);
  }
});

test("the reward server owns amounts; the client request schema forbids client-supplied EXP", () => {
  const policy = read("functions/_shared/rewardPolicy.ts");
  assert.ok(policy.includes("MY_WORLD_INTERACTION_XP"), "서버가 xp 표를 소유");
  assert.ok(policy.includes("sanitizeInteractionRewardRequest"), "요청 정제 존재");
  // 클라이언트 reward API 가 금액/최종 EXP 를 전송하지 않는지(코드 상 forbidden).
  const client = read("lib/rewardClient.ts");
  assert.equal(/body:\s*\{[^}]*amount/.test(client), false, "클라이언트가 amount 를 전송하면 안 된다");
});

test("Firestore rules still block client writes to the reward ledger", () => {
  const rules = read("firestore.rules");
  assert.ok(rules.includes("rewardOperations"), "rewardOperations 원장 규칙 존재");
  const block = rules.slice(rules.indexOf("rewardOperations"));
  assert.match(block.slice(0, 200), /allow write:\s*if false/, "원장 client write 차단");
});

// ⚠️ 아직 하지 않은 것(=SECURITY HARDENING INCOMPLETE):
//   · firestore.rules 의 users.doriExp/level/tier 직접 client write 차단(전 콜러 전환 선결)
//   · community/minigame(grantPlaytimeReward)/attendance/mission 서버 전환
// 이 가드는 그 사실을 테스트로 고정한다.
test("EXP fields are NOT yet locked in rules (documents the remaining P0 surface)", () => {
  const rules = read("firestore.rules");
  const usersBlock = rules.slice(rules.indexOf("match /users/{userId}"), rules.indexOf("match /users/{userId}") + 400);
  // 아직 doriExp 불변 조건이 없다 → 잠그면 미전환 콜러가 깨지므로 의도적으로 미적용.
  assert.equal(usersBlock.includes("doriExp"), false,
    "현재는 doriExp 잠금 없음(전 콜러 전환 후 잠가야 함). 잠금이 생기면 이 테스트를 갱신하고 콜러 전환을 확인할 것.");
});
