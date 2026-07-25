// 05-06H 정적 회귀 가드 — P0 종결 상태를 고정한다.
//  게임 전체 보상이 서버 권위 엔드포인트로 전환됐고, 클라이언트 직접 EXP 쓰기가 제거됐으며,
//  Firestore Rules 가 보상 필드를 잠갔음을 정적으로 검증한다.
//  ⚠️ 레거시 직접 EXP 라이터(addExp(email,amount)·fsSetExp·client doriExp write)가 재등장하면 실패한다.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("My World interaction context is on the server claim path (no client-authoritative addExp)", () => {
  const src = read("contexts/InteractionContext.tsx");
  assert.ok(src.includes("claimReward("), "서버 청구(claimReward)로 전환되어 있어야 한다");
  assert.equal(/\baddExp\s*\(/.test(src), false, "My World 가 addExp 로 회귀하면 안 된다");
});

test("cottonCandy no longer defines or calls the client-authoritative EXP writers", () => {
  const src = read("lib/cottonCandy.ts");
  assert.equal(/export function addExp\b/.test(src), false, "addExp 정의 제거");
  assert.equal(/\bfsSetExp\b/.test(src), false, "fsSetExp(유일한 Firestore doriExp 라이터) 제거");
  assert.equal(/\bwriteGameProfile\b/.test(src), false, "writeGameProfile 제거");
  assert.equal(/\bensureExpAtLeast\b/.test(src), false, "ensureExpAtLeast 제거");
  assert.ok(src.includes('submitGameReward("minigame_play"'), "미니게임 보상은 서버 청구로 전환");
});

test("no production caller invokes addExp(email, amount) anymore", () => {
  for (const file of [
    "app/community/write/page.client.tsx",
    "app/community/page.client.tsx",
    "components/my/MyDashboard.tsx",
  ]) {
    const src = read(file);
    assert.equal(/\baddExp\s*\(/.test(src), false, `${file} 는 더 이상 addExp 를 호출하지 않는다`);
    assert.equal(/\bensureExpAtLeast\s*\(/.test(src), false, `${file} 는 ensureExpAtLeast 를 호출하지 않는다`);
  }
  // Community 보상은 서버 검증 가능한 Firestore feed 소스(lib/social.ts)에서만 발행한다.
  const social = read("lib/social.ts");
  assert.ok(social.includes('submitGameReward("community_post"'), "feed 글 작성 → community_post");
  assert.ok(social.includes('submitGameReward("community_comment"'), "feed 댓글 → community_comment");
  // localStorage 전용 /community 보드는 서버 EXP 를 발행하지 않는다(소스 검증 불가).
  assert.equal(/submitGameReward/.test(read("app/community/write/page.client.tsx")), false, "board 글은 서버 보상 없음");
  assert.equal(/submitGameReward/.test(read("app/community/page.client.tsx")), false, "board 댓글은 서버 보상 없음");
});

test("the legacy gameData EXP writers are neutralized (no client Firestore doriExp write)", () => {
  const src = read("lib/gameData.ts").replace(/\/\/.*$/gm, ""); // 주석 제거 후 검사
  assert.equal(/updateDoc\([\s\S]*?doriExp/.test(src), false, "gameData 가 doriExp 를 Firestore 로 쓰면 안 된다");
});

test("mission completion routes to the server claim (mission_complete)", () => {
  const src = read("lib/missionProgress.ts");
  assert.ok(src.includes('submitGameReward("mission_complete"'), "미션 완료 → 서버 mission_complete 청구");
});

test("the reward server owns amounts; the client request schema forbids client-supplied EXP", () => {
  const policy = read("functions/_shared/rewardPolicy.ts");
  assert.ok(policy.includes("MY_WORLD_INTERACTION_XP"), "서버가 interaction xp 표를 소유");
  const ext = read("functions/_shared/rewardTypes.ts");
  assert.ok(ext.includes("EXTENDED_REWARD_POLICIES"), "서버가 확장 타입 금액·상한을 소유");
  assert.ok(ext.includes("sanitizeExtendedRewardRequest"), "확장 요청 정제(금액/uid 거부) 존재");
  const client = read("lib/rewardClient.ts");
  assert.equal(/body:\s*\{[^}]*amount/.test(client), false, "클라이언트가 amount 를 전송하면 안 된다");
});

test("Firestore rules lock the reward fields (doriExp/level/tier + daily/type counters)", () => {
  const rules = read("firestore.rules");
  assert.ok(rules.includes("rewardOperations"), "rewardOperations 원장 규칙 존재");
  assert.ok(rules.includes("rewardFieldNames"), "보상 필드 목록 함수 존재");
  assert.ok(rules.includes("usersRewardsUnchangedOnUpdate"), "update 시 보상 필드 불변 강제");
  assert.ok(rules.includes("usersRewardsSafeOnCreate"), "create 시 보상 필드 기본값 강제");
  const usersBlock = rules.slice(rules.indexOf("match /users/{userId}"), rules.indexOf("match /users/{userId}") + 900);
  assert.match(usersBlock, /allow update:[\s\S]*usersRewardsUnchangedOnUpdate\(\)/, "users update 에 잠금 적용");
  assert.match(usersBlock, /allow create:[\s\S]*usersRewardsSafeOnCreate\(\)/, "users create 에 잠금 적용");
  for (const f of ["doriExp", "level", "tier", "rewardDailyExp", "rewardTypeExp_minigame_play"]) {
    assert.ok(rules.includes(`'${f}'`), `잠금 목록에 ${f} 포함`);
  }
});
