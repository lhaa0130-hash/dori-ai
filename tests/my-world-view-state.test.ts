// My World 표시 계약 회귀 — production seam 없이 상태를 재현한다.
//
// 컴포넌트가 표시 결정을 `lib/myWorld/view/worldView.ts` 의 순수 함수에 위임하므로,
// 이 fixture 들이 실제 화면 계약을 덮는다. URL 파라미터·전역 객체·에뮬레이터 연결 같은
// 테스트 seam 을 production 코드에 넣지 않는다.
import assert from "node:assert/strict";
import test from "node:test";
import {
  resolveSaveView,
  resolveSectionPhase,
  resolveSyncBadge,
  resolveWorldView,
  type WorldAuthState,
} from "../lib/myWorld/view/worldView.ts";

// ── 재현 상태 fixture (16종) ────────────────────────────────────────────────
const SECTION_FIXTURES = {
  "auth-loading": { authState: "checking" as WorldAuthState, loading: true, error: null, count: 0 },
  guest: { authState: "guest" as WorldAuthState, loading: false, error: null, count: 0 },
  "signed-in-new": { authState: "signed" as WorldAuthState, loading: false, error: null, count: 0 },
  "signed-in-existing": { authState: "signed" as WorldAuthState, loading: false, error: null, count: 5 },
  "diary-loading": { authState: "signed" as WorldAuthState, loading: true, error: null, count: 0 },
  "diary-empty": { authState: "signed" as WorldAuthState, loading: false, error: null, count: 0 },
  "diary-error": { authState: "signed" as WorldAuthState, loading: false, error: "일기를 불러오지 못했어요.", count: 0 },
  "diary-stale": { authState: "signed" as WorldAuthState, loading: false, error: "일기를 불러오지 못했어요.", count: 3 },
  "room-loading": { authState: "signed" as WorldAuthState, loading: true, error: null, count: 0 },
  "room-empty": { authState: "signed" as WorldAuthState, loading: false, error: null, count: 0 },
  "room-error": { authState: "signed" as WorldAuthState, loading: false, error: "방을 불러오지 못했어요.", count: 0 },
} as const;

test("인증 확인 중은 게스트로 위장하지 않는다", () => {
  const v = resolveWorldView({ authState: "checking" });
  assert.equal(v.showGuestCopy, false, "확인 중에 '저장 안 됨' 문구를 보여주면 로그인 사용자에게 거짓이다");
  assert.equal(v.showInvite, false, "확인 중에 로그인 초대를 띄우면 안 된다");
  assert.equal(v.showGuide, false);
  assert.equal(v.loginCtaCount, 0);
  assert.equal(resolveSectionPhase(SECTION_FIXTURES["auth-loading"]).phase, "checking");
});

test("게스트에게는 성장 수치를 보여주지 않는다", () => {
  const v = resolveWorldView({ authState: "guest" });
  assert.equal(v.showGrowthNumbers, false, "저장되지 않는 EXP·레벨을 '내 상태' 로 보여주면 거짓이다");
  assert.equal(v.showRecords, false);
  assert.equal(v.showGuestCopy, true);
});

test("로그인 CTA 는 화면에 한 곳만 존재한다", () => {
  assert.equal(resolveWorldView({ authState: "guest" }).loginCtaCount, 1);
  assert.equal(resolveWorldView({ authState: "signed" }).loginCtaCount, 0);
  assert.equal(resolveWorldView({ authState: "checking" }).loginCtaCount, 0);
});

test("로그인 사용자에게는 성장 수치와 기록이 보인다", () => {
  const v = resolveWorldView({ authState: "signed" });
  assert.equal(v.showGrowthNumbers, true);
  assert.equal(v.showRecords, true);
  assert.equal(v.showGuestCopy, false);
});

test("빈 상태와 오류를 구분한다 — 오류가 빈 상태로 위장되지 않는다", () => {
  assert.equal(resolveSectionPhase(SECTION_FIXTURES["diary-empty"]).phase, "empty");
  const err = resolveSectionPhase(SECTION_FIXTURES["diary-error"]);
  assert.equal(err.phase, "error");
  assert.equal(err.canRetry, true, "실패 후 무한 spinner 대신 재시도를 제공해야 한다");
});

test("로딩은 실패로 확정되면 끝난다 — 무한 spinner 금지", () => {
  assert.equal(resolveSectionPhase(SECTION_FIXTURES["diary-loading"]).phase, "loading");
  // 같은 입력에서 loading 이 끝나고 error 만 남으면 error 로 확정된다.
  assert.equal(
    resolveSectionPhase({ ...SECTION_FIXTURES["diary-loading"], loading: false, error: "실패" }).phase,
    "error",
  );
});

test("볼 것이 있으면 실패해도 화면을 비우지 않는다(경고만 덧붙임)", () => {
  const v = resolveSectionPhase(SECTION_FIXTURES["diary-stale"]);
  assert.equal(v.phase, "ready");
  assert.equal(v.staleWarning, true);
  assert.equal(v.canRetry, true);
});

test("게스트 구획은 로딩·오류 단계로 새지 않는다", () => {
  // 게스트는 원격 요청을 하지 않으므로 loading/error 가 들어와도 guest 로 확정된다.
  const v = resolveSectionPhase({ authState: "guest", loading: true, error: "무시되어야 함", count: 0 });
  assert.equal(v.phase, "guest");
  assert.equal(v.canRetry, false);
});

test("모든 fixture 가 정의된 단계 중 하나로만 해석된다", () => {
  const allowed = new Set(["checking", "guest", "loading", "error", "empty", "ready"]);
  for (const [name, input] of Object.entries(SECTION_FIXTURES)) {
    const v = resolveSectionPhase(input);
    assert.ok(allowed.has(v.phase), `${name} → ${v.phase}`);
  }
});

test("저장 상태는 색이 아니라 아이콘+문구로 구분된다", () => {
  const base = { authState: "signed" as WorldAuthState, saving: false, dirty: false, saveError: null };
  assert.deepEqual(resolveSaveView({ ...base }), { tone: "saved", icon: "✅", text: "저장됨" });
  assert.equal(resolveSaveView({ ...base, saving: true }).tone, "saving");
  assert.equal(resolveSaveView({ ...base, dirty: true }).tone, "dirty");
  assert.equal(resolveSaveView({ ...base, saveError: "실패" }).tone, "failed");
  assert.equal(resolveSaveView({ ...base, authState: "guest" }).tone, "guest");
  // 실패가 다른 상태보다 우선 — 저장 중이면서 실패한 이전 시도를 숨기지 않는다.
  assert.equal(resolveSaveView({ ...base, saving: true, saveError: "실패" }).tone, "failed");
  // 모든 tone 에 아이콘과 문구가 있다(색 단독 전달 금지).
  for (const tone of ["saved", "saving", "dirty", "failed", "guest"] as const) {
    const v = resolveSaveView({
      ...base,
      authState: tone === "guest" ? "guest" : "signed",
      saving: tone === "saving",
      dirty: tone === "dirty",
      saveError: tone === "failed" ? "실패" : null,
    });
    assert.ok(v.icon.length > 0 && v.text.length > 0, tone);
  }
});

test("게스트 저장 상태는 '저장됨' 이라고 말하지 않는다", () => {
  const v = resolveSaveView({ authState: "guest", saving: false, dirty: false, saveError: null });
  assert.equal(v.tone, "guest");
  assert.ok(v.text.includes("로그인"), "저장되지 않는다는 사실을 알려야 한다");
  assert.ok(!v.text.includes("저장됨"), "게스트에게 '저장됨' 은 거짓이다");
});

test("오프라인과 저장 지연을 구분하고, 둘 다 아니면 배지를 만들지 않는다", () => {
  assert.equal(resolveSyncBadge({ offline: true, syncing: false }), "오프라인 · 기기에 저장 중");
  assert.equal(resolveSyncBadge({ offline: false, syncing: true }), "저장 중");
  assert.equal(resolveSyncBadge({ offline: false, syncing: false }), null);
  // 오프라인이면 저장 중보다 오프라인을 먼저 말한다(원인이 더 중요하다).
  assert.equal(resolveSyncBadge({ offline: true, syncing: true }), "오프라인 · 기기에 저장 중");
});

test("사용자 문구에 Firebase 기술 용어가 섞이지 않는다", () => {
  const forbidden = [/permission-denied/i, /FirebaseError/i, /firestore/i, /\b5\d\d\b/, /unauthenticated/i];
  const texts = [
    resolveSaveView({ authState: "signed", saving: false, dirty: false, saveError: "x" }).text,
    resolveSyncBadge({ offline: true, syncing: false }) ?? "",
    resolveSyncBadge({ offline: false, syncing: true }) ?? "",
    resolveSaveView({ authState: "guest", saving: false, dirty: false, saveError: null }).text,
  ];
  for (const t of texts) {
    for (const re of forbidden) assert.equal(re.test(t), false, `${t} ← ${re}`);
  }
});
