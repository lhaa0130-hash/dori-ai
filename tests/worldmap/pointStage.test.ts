// 점 표시 단계 (지시서 08 §2.1 · §2.7).

import test from "node:test";
import assert from "node:assert/strict";
import { pointStage, POINT_STAGE_ENTER, POINT_STAGE_HYSTERESIS } from "@/lib/worldmap/mapSync";

test("경계값 — overview / context / local", () => {
  assert.equal(pointStage(0), "overview");
  assert.equal(pointStage(0.54), "overview");
  assert.equal(pointStage(0.55), "context");
  assert.equal(pointStage(1.29, "context"), "context");
  assert.equal(pointStage(1.3, "context"), "local");
  assert.equal(pointStage(4, "local"), "local");
});

test("base zoom 을 아직 모르면 overview 로 본다", () => {
  // ⚠️ 모르는 상태에서 점을 그리면 첫 렌더에 점이 번쩍 나타났다 사라진다.
  assert.equal(pointStage(null), "overview");
  assert.equal(pointStage(NaN), "overview");
  // Infinity 는 정상적인 확대량이 아니다. "확대가 확실하니 local" 로 보지 않고
  // 값이 이상하면 점을 안 그리는 쪽을 택한다 — 잘못 그리는 것보다 안 그리는 게 낫다.
  assert.equal(pointStage(Infinity), "overview");
});

test("경계 위에서 왕복해도 깜빡이지 않는다 (hysteresis)", () => {
  const h = POINT_STAGE_HYSTERESIS;

  // 올라갈 때는 정해진 문턱을 넘어야 켜진다.
  assert.equal(pointStage(POINT_STAGE_ENTER.context - 0.001, "overview"), "overview");
  assert.equal(pointStage(POINT_STAGE_ENTER.context, "overview"), "context");

  // 이미 켜져 있으면 조금 내려가도 유지된다.
  assert.equal(pointStage(POINT_STAGE_ENTER.context - h / 2, "context"), "context");
  assert.equal(pointStage(POINT_STAGE_ENTER.local - h / 2, "local"), "local");

  // 여유값보다 더 내려가면 확실히 꺼진다.
  assert.equal(pointStage(POINT_STAGE_ENTER.context - h - 0.01, "context"), "overview");
  assert.equal(pointStage(POINT_STAGE_ENTER.local - h - 0.01, "local"), "context");
});

test("축소해서 overview 로 돌아오면 어떤 직전 단계에서든 overview 다", () => {
  for (const prev of ["overview", "context", "local"] as const) {
    assert.equal(pointStage(0, prev), "overview", `${prev} 에서 축소했는데 점이 남는다`);
  }
});
