// 05-07 정적 회귀 가드 — 솜사탕(cottonCandy)·보유 아이템(ownedItems)·프리미엄(isPremium) P0 종결 상태를 고정한다.
//  ⚠️ 클라이언트가 재화/아이템/프리미엄을 Firestore 에 직접 쓰는 코드가 재등장하면 실패한다.
//  (이 가드가 초록이어야만 Firestore Rules 의 cottonCandy/ownedItems 잠금을 배포할 수 있다.)
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
/** 주석을 지운 소스 — 문서 문장이 가드에 걸리지 않게. */
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

const CANDY_FIELDS = ["cottonCandy", "cottonCandyTotal", "ownedItems", "isPremium"];
/** 클라이언트 Firestore 쓰기 호출 안에 권위 필드가 들어가면 안 된다. */
const WRITE_CALL = /(setDoc|updateDoc|addDoc|runTransaction)\s*\([\s\S]{0,600}?\)/g;

const CLIENT_FILES = [
  "lib/cottonCandy.ts",
  "lib/gameData.ts",
  "lib/social.ts",
  "lib/shopClient.ts",
  "components/my/MyDashboard.tsx",
  "app/shop/page.tsx",
];

test("클라이언트 Firestore 쓰기에 재화·아이템·프리미엄 필드가 없다", () => {
  for (const f of CLIENT_FILES) {
    const src = code(f);
    for (const m of src.match(WRITE_CALL) || []) {
      for (const field of CANDY_FIELDS) {
        assert.equal(m.includes(field), false, `${f}: 클라이언트 쓰기에 ${field} 가 있으면 안 된다 → ${m.slice(0, 120)}`);
      }
    }
  }
});

test("fsAddCandy(클라이언트 재화 라이터)가 제거됐다", () => {
  assert.equal(/\bfsAddCandy\b/.test(code("lib/cottonCandy.ts")), false, "fsAddCandy 제거");
});

test("visits/notifications 를 통한 '지급 예약' 자기지급 통로가 제거됐다", () => {
  const src = code("lib/cottonCandy.ts");
  assert.equal(/\bapplyPendingCandyGrants\b/.test(src), false, "예약 자동 반영 함수 제거");
  assert.equal(/pendingCandy|pendingPremium/.test(src), false, "visits 예약 필드 참조 제거");
  assert.equal(/candy_grant|premium_grant/.test(src), false, "알림 예약 타입 참조 제거");
});

test("관리자 지급은 서버 엔드포인트만 사용한다", () => {
  const src = code("lib/cottonCandy.ts");
  assert.ok(src.includes("/api/admin/grant"), "adminGrantCandy/adminSetPremium 는 서버 호출");
  const server = code("functions/api/admin/grant.ts");
  // 05-08C: 관리자 인증·인가는 공통 모듈로 일원화됐다(로직 복제 금지).
  assert.ok(server.includes("verifyRewardAdmin"), "재화 관리자 검증은 공통 모듈 사용");
  assert.ok(server.includes("requireNotExists: true"), "지급 원장으로 멱등 보장");
});

test("⭐ 재화 관리자 권한은 REWARD_ADMIN_UIDS 전용 — email·기사권한으로 열리지 않는다", () => {
  const server = code("functions/api/admin/grant.ts");
  // email 판정이 남아 있으면 안 된다(05-08C 에서 제거).
  assert.equal(/ADMIN_EMAIL/.test(server), false, "email 상수로 권한을 판정하면 안 된다");
  assert.equal(/decoded\.email/.test(server), false, "email 클레임을 권한 근거로 쓰면 안 된다");
  // 기사 권한 변수로 재화가 열리면 안 된다.
  assert.equal(/ARTICLE_ADMIN_UIDS/.test(server), false, "재화 경로가 기사 allowlist 를 참조하면 안 된다");
  // 인증 로직을 로컬에 복제하지 않는다.
  assert.equal(/function decodeToken\b/.test(server), false, "토큰 디코딩을 복제하지 않는다");

  const shared = code("functions/_shared/adminAuth.ts");
  assert.ok(shared.includes('reward: "REWARD_ADMIN_UIDS"'), "reward capability 는 REWARD_ADMIN_UIDS");
  assert.ok(shared.includes('article: "ARTICLE_ADMIN_UIDS"'), "article capability 는 ARTICLE_ADMIN_UIDS");
  // 인가 판정 함수가 email 을 보지 않는다.
  const decide = shared.slice(shared.indexOf("export function decideAdminAccess"));
  assert.equal(/email/.test(decide.slice(0, decide.indexOf("\n}"))), false, "decideAdminAccess 가 email 을 참조하면 안 된다");
});

test("구매는 서버 권위 경로만 — 클라이언트가 가격을 보내지 않는다", () => {
  const client = code("lib/shopClient.ts");
  assert.ok(client.includes("/api/purchase"), "구매는 서버 엔드포인트");
  assert.equal(/JSON\.stringify\(\{[^}]*price/.test(client), false, "요청 본문에 price 금지");
  const candy = code("lib/cottonCandy.ts");
  assert.ok(candy.includes("purchaseItemOnServer"), "purchaseShopItem 은 서버 경로에 위임");
  const server = read("functions/api/purchase.ts");
  assert.ok(server.includes("u.isPremium === true"), "프리미엄은 서버 문서로만 판정");
});

test("hydrate 가 서버 잔액을 그대로 채택한다(로컬 max 금지)", () => {
  const src = code("lib/cottonCandy.ts");
  assert.equal(/d\.cottonCandy\s*>=\s*localCandy/.test(src), false, "로컬이 크면 유지하는 분기 제거");
  assert.equal(/Math\.max\(\s*d\.cottonCandy/.test(src), false, "서버·로컬 max 채택 금지");
});

test("서버가 재화 금액을 소유한다(미션·업적·레벨 표)", () => {
  const ext = read("functions/_shared/rewardTypes.ts");
  for (const t of ["MISSION_CANDY", "ACHIEVEMENT_CANDY", "LEVEL_REWARD_CANDY", "computeExtendedCandy"]) {
    assert.ok(ext.includes(t), `${t} 가 서버에 있어야 한다`);
  }
  // 레벨 보상은 서버가 EXP 로 레벨을 재계산해 검증한다.
  const handler = read("functions/api/claim-reward.ts");
  assert.ok(handler.includes("level_not_reached"), "레벨 미달 요청은 거부");
  assert.ok(handler.includes("levelFromSource"), "레벨 sourceId 를 서버가 해석");
});

test("미션은 '받기' 버튼이 아니라 활동 지점에서만 완료된다", () => {
  const dash = code("components/my/MyDashboard.tsx");
  assert.equal(/handleMissionClaim/.test(dash), false, "받기 버튼 핸들러 제거");
  assert.equal(/completeMission\s*\(/.test(dash), false, "대시보드가 미션을 직접 완료시키지 않는다");
  // 활동 지점 배선
  assert.ok(code("lib/social.ts").includes('claimDailyMission("write_post")'), "글 저장 성공 후 미션");
  assert.ok(code("lib/social.ts").includes('claimDailyMission("write_comment")'), "댓글 저장 성공 후 미션");
  assert.ok(code("lib/cottonCandy.ts").includes('completeMission(email, "play_minigame")'), "게임 플레이 후 미션");
  assert.ok(code("app/minigame/quiz/page.tsx").includes('claimDailyMission("quiz_correct")'), "퀴즈 정답 시 미션");
  assert.ok(code("components/insight/InsightDetail.tsx").includes('claimDailyMission("read_trend")'), "기사 체류 후 미션");
});
