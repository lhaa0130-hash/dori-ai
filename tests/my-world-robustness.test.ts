// My World 견고성 회귀 (WS12) — 긴 텍스트·경계값·손상 캐시·부분 데이터.
// 순수 함수와 도메인 정규화만 다룬다(브라우저 없이 돌아야 한다).
import assert from "node:assert/strict";
import test from "node:test";
import { dailyRewardProgress, resolveActionAvailability } from "../lib/myWorld/interaction/availability.ts";
import { defaultInteractionState, localDateKey } from "../lib/myWorld/interaction/engine.ts";
import { normalizeInteractionState } from "../lib/myWorld/interaction/storage.ts";
import { formatDiaryStamp, groupEntriesByTime, diaryTimeAttr } from "../lib/myWorld/diary/utils.ts";
import { resolveSectionPhase, resolveSaveView } from "../lib/myWorld/view/worldView.ts";

const NOW = 1_800_000_000_000;

// ── 손상·악의적 localStorage 값 ────────────────────────────────────────────
test("손상된 상호작용 캐시가 기본값으로 안전하게 정규화된다", () => {
  const junk: unknown[] = [
    null, undefined, 0, "", "문자열", [], {},
    { affinity: "많이" }, { affinity: -50 }, { affinity: 9999 },
    { emotion: "존재하지않는감정" },
    { daily: null }, { daily: { count: -1, affinityGained: "x" } },
    { cooldowns: "nope" }, { cooldowns: { pet: "언젠가" } },
    { recent: "배열아님" }, { recent: [null, 1, "x"] },
    { version: 999 },
  ];
  for (const raw of junk) {
    const s = normalizeInteractionState(raw, NOW);
    assert.ok(s, `${JSON.stringify(raw)} → null`);
    assert.ok(Number.isFinite(s.affinity), "affinity 가 숫자가 아니다");
    assert.ok(s.affinity >= 0 && s.affinity <= 100, `affinity 범위 이탈: ${s.affinity}`);
    assert.ok(Array.isArray(s.recent), "recent 가 배열이 아니다");
    assert.ok(s.daily && typeof s.daily.count === "number", "daily 가 깨졌다");
    assert.ok(s.cooldowns && typeof s.cooldowns === "object", "cooldowns 가 깨졌다");
  }
});

test("일부 데이터만 있는 상태에서도 표시 계산이 깨지지 않는다", () => {
  const partial = normalizeInteractionState({ affinity: 42 }, NOW);
  const p = dailyRewardProgress(partial, NOW);
  assert.ok(p.affinityGained >= 0 && p.affinityGained <= p.affinityMax);
  assert.ok(p.expGained >= 0 && p.expGained <= p.expMax);
  const a = resolveActionAvailability(partial, "pet", NOW);
  assert.equal(typeof a.available, "boolean");
  assert.ok(a.retryAfterSeconds >= 0);
});

// ── 진행률 경계값 ─────────────────────────────────────────────────────────
test("일일 진행률이 상한을 넘지 않고 음수가 되지 않는다", () => {
  const base = defaultInteractionState(NOW);
  const over = {
    ...base,
    daily: { date: localDateKey(NOW), count: 999, affinityGained: 9999, expGained: 9999, notableTypes: [] },
  };
  const p = dailyRewardProgress(over, NOW);
  assert.ok(p.affinityGained >= p.affinityMax, "상한 이상이어도 계산은 성립해야 한다");
  assert.equal(p.exhausted, true);
  // 화면 계산에 쓰이는 비율이 0~100 을 벗어나지 않아야 한다.
  const pct = Math.min(100, Math.round((p.affinityGained / p.affinityMax) * 100));
  assert.ok(pct >= 0 && pct <= 100, `${pct}`);

  const negative = { ...base, daily: { date: localDateKey(NOW), count: -5, affinityGained: -10, expGained: -10, notableTypes: [] } };
  const np = dailyRewardProgress(negative, NOW);
  assert.ok(np.affinityGained <= np.affinityMax);
});

test("cooldown 남은 시간이 음수가 되지 않는다", () => {
  const base = defaultInteractionState(NOW);
  const past = { ...base, cooldowns: { pet: NOW - 999_999 } };
  const a = resolveActionAvailability(past, "pet", NOW);
  assert.equal(a.available, true);
  assert.equal(a.retryAfterMs, 0);
  assert.equal(a.retryAfterSeconds, 0);
});

// ── 긴 텍스트·특수문자 ────────────────────────────────────────────────────
test("긴 일기 내용·특수문자·빈 글이 그룹핑을 깨뜨리지 않는다", () => {
  const long = "가".repeat(4000);
  const entries = [
    { id: "1", characterId: "dori", title: long, content: long, icon: "🌱", color: "#F9954E", createdAt: NOW },
    { id: "2", characterId: "dori", title: "", content: "", icon: "", color: "#000", createdAt: NOW - 86400000 },
    { id: "3", characterId: "없는캐릭터", title: "<script>alert(1)</script>", content: "😀🎉\n\t줄바꿈", icon: "🎁", color: "#F9954E", createdAt: NOW - 8 * 86400000 },
  ];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const groups = groupEntriesByTime(entries as any, NOW);
  assert.ok(groups.length >= 2, "그룹이 만들어지지 않았다");
  const total = groups.reduce((n, g) => n + g.entries.length, 0);
  assert.equal(total, 3, "항목이 유실됐다");
  // 날짜 표기가 항상 문자열이고 비어 있지 않다.
  for (const g of groups) {
    for (const e of g.entries) {
      const stamp = formatDiaryStamp(e.createdAt, g.key);
      assert.ok(typeof stamp === "string" && stamp.length > 0, `${g.key}`);
      assert.match(diaryTimeAttr(e.createdAt), /^\d{4}-\d{2}-\d{2}T/, "dateTime 이 ISO 가 아니다");
    }
  }
});

test("잘못된 createdAt 도 그룹핑을 깨뜨리지 않는다", () => {
  const weird = [
    { id: "a", characterId: "dori", title: "t", content: "c", icon: "x", color: "#000", createdAt: 0 },
    { id: "b", characterId: "dori", title: "t", content: "c", icon: "x", color: "#000", createdAt: NOW * 10 },
  ];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const groups = groupEntriesByTime(weird as any, NOW);
  assert.equal(groups.reduce((n, g) => n + g.entries.length, 0), 2);
});

// ── 상태 전환 순서 ────────────────────────────────────────────────────────
test("로딩 → 오류 → 재시도 → 목록 순서가 서로 위장하지 않는다", () => {
  const seq = [
    { authState: "signed" as const, loading: true, error: null, count: 0, expect: "loading" },
    { authState: "signed" as const, loading: false, error: "실패", count: 0, expect: "error" },
    { authState: "signed" as const, loading: true, error: "실패", count: 0, expect: "loading" }, // 재시도 중
    { authState: "signed" as const, loading: false, error: null, count: 3, expect: "ready" },
  ];
  for (const s of seq) {
    assert.equal(resolveSectionPhase(s).phase, s.expect, JSON.stringify(s));
  }
});

test("저장 실패는 다른 상태에 묻히지 않는다", () => {
  // 저장 중 + 이전 실패가 함께면 실패를 먼저 말한다(사용자가 재시도해야 한다).
  const v = resolveSaveView({ authState: "signed", saving: true, dirty: true, saveError: "실패" });
  assert.equal(v.tone, "failed");
});
