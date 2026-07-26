// My World 자산 계약 회귀 — 이미지가 도착했을 때 코드 재작업 없이 반영되도록 계약을 고정한다.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import {
  EMOTION_ASSET_KEYS,
  getAllAssetSpecs,
  getAssetManifest,
  getMvpAssetSpecs,
} from "../lib/myWorld/assets/manifest.ts";
const root = new URL("../", import.meta.url);

// utils.ts / constants.ts 는 `@/` alias 를 쓰는 타입 import 를 가질 수 있으므로
// 플래그는 소스에서 직접 읽는다(로더 의존 없이 검증 가능해야 한다).
function readFlag(rel: string, name: string): boolean {
  const src = readFileSync(new URL(rel, root), "utf8");
  const m = new RegExp(`${name}\\s*=\\s*(true|false)`).exec(src);
  assert.ok(m, `${name} 을 찾지 못했다`);
  return m[1] === "true";
}

const CHARACTER_ASSETS_READY = () => readFlag("lib/myWorld/character/utils.ts", "CHARACTER_ASSETS_READY");
const ROOM_ASSETS_READY = () => readFlag("lib/myWorld/room/constants.ts", "ROOM_ASSETS_READY");
const publicPath = (p: string) => new URL(`public${p}`, root);

test("manifest 경로에 중복이 없다", () => {
  const paths = getAllAssetSpecs().map((s) => s.path);
  const dup = paths.filter((p, i) => paths.indexOf(p) !== i);
  assert.deepEqual(dup, [], `중복: ${dup.join(", ")}`);
});

test("모든 spec 에 용도·표시크기·원본해상도·우선순위가 있다", () => {
  for (const s of getAllAssetSpecs()) {
    assert.ok(s.purpose.length > 0, s.path);
    assert.ok(s.displayMax.w > 0 && s.displayMax.h > 0, s.path);
    assert.ok(s.source.w > 0 && s.source.h > 0, s.path);
    assert.ok(s.priority === "eager" || s.priority === "lazy", s.path);
    assert.ok(s.budgetKb > 0, s.path);
  }
});

test("원본 해상도는 표시 크기의 2배 이상이다(1x/2x 관계)", () => {
  for (const s of getAllAssetSpecs()) {
    assert.ok(
      s.source.w >= s.displayMax.w * 2 && s.source.h >= s.displayMax.h * 2,
      `${s.path} — 표시 ${s.displayMax.w}x${s.displayMax.h} 대비 원본 ${s.source.w}x${s.source.h}`,
    );
  }
});

test("첫 화면 자산만 eager 다 — 하단 기록·효과는 lazy", () => {
  const eager = getAllAssetSpecs().filter((s) => s.priority === "eager").map((s) => s.path);
  // 무대 캐릭터(portrait·avatar)·가구 sprite·방 배경만 eager 여야 한다.
  for (const p of eager) {
    assert.ok(
      /\/(portrait|avatar|sprite|scene)\.webp$/.test(p),
      `첫 화면 자산이 아닌데 eager 다: ${p}`,
    );
  }
  // 일기·효과 자산은 절대 eager 가 아니다.
  for (const p of eager) assert.ok(!p.includes("/my-world/"), p);
});

test("감정 자산 키가 Emotion 타입과 일치한다", () => {
  const src = readFileSync(new URL("lib/myWorld/interaction/types.ts", root), "utf8");
  const block = /export type Emotion =([\s\S]*?);/.exec(src);
  assert.ok(block, "Emotion 타입을 찾지 못했다");
  const declared = [...block[1].matchAll(/"([a-z_]+)"/g)].map((m) => m[1]);
  for (const key of EMOTION_ASSET_KEYS) {
    assert.ok(declared.includes(key), `Emotion 에 없는 감정 자산 키: ${key}`);
  }
});

test("readiness 플래그는 자산이 없는 동안 반드시 꺼져 있다 (fail-safe)", () => {
  const mvp = getMvpAssetSpecs();
  const missing = mvp.filter((s) => !existsSync(publicPath(s.path)));
  if (missing.length > 0) {
    assert.equal(
      CHARACTER_ASSETS_READY(),
      false,
      `MVP 자산 ${missing.length}개가 없는데 CHARACTER_ASSETS_READY=true — 깨진 이미지가 배포된다`,
    );
    assert.equal(ROOM_ASSETS_READY(), false, `MVP 자산 ${missing.length}개가 없는데 ROOM_ASSETS_READY=true`);
  }
});

test("manifest 는 실제 registry(캐릭터 12종·가구 12종)를 덮는다", () => {
  const paths = getAllAssetSpecs().map((s) => s.path);
  const charIds = [...readFileSync(new URL("lib/myWorld/character/registry.ts", root), "utf8").matchAll(/\{\s*id:\s*"([a-z]+)"/g)].map((m) => m[1]);
  const itemIds = [...readFileSync(new URL("lib/myWorld/room/registry.ts", root), "utf8").matchAll(/def\(\{\s*id:\s*"([a-z-]+)"/g)].map((m) => m[1]);
  assert.equal(charIds.length, 12);
  assert.equal(itemIds.length, 12);
  for (const id of charIds) assert.ok(paths.includes(`/characters/${id}/portrait.webp`), id);
  for (const id of itemIds) assert.ok(paths.includes(`/rooms/items/${id}/sprite.webp`), id);
});

test("투명 배경 요구가 용도와 맞다 — 방 배경은 불투명, 캐릭터·가구는 투명", () => {
  for (const s of getAllAssetSpecs()) {
    if (s.path.includes("/characters/") || s.path.includes("/rooms/items/")) {
      assert.equal(s.transparent, true, `${s.path} 는 투명이어야 한다`);
    }
    if (s.path.endsWith("/scene.webp") || s.path.endsWith("guest-preview.webp")) {
      assert.equal(s.transparent, false, `${s.path} 는 불투명이어야 한다`);
    }
  }
});

test("MVP 집합이 착수 가능한 최소 단위다", () => {
  const mvp = getMvpAssetSpecs();
  // 기본 캐릭터(dori) + 가구 12종 + 방 배경 + 빈 상태 2종
  assert.ok(mvp.some((s) => s.path === "/characters/dori/portrait.webp"));
  assert.ok(mvp.some((s) => s.path === "/rooms/backgrounds/basic/scene.webp"));
  assert.equal(mvp.filter((s) => s.path.includes("/rooms/items/")).length, 24);
  // dori 외 캐릭터는 MVP 가 아니다(먼저 하나를 완성해 일관성 기준을 만든다).
  assert.equal(mvp.filter((s) => /\/characters\/(?!dori\/)/.test(s.path)).length, 0);
});

test("그룹별 readiness 플래그가 명시돼 있다", () => {
  const groups = getAssetManifest();
  assert.equal(groups.length, 4);
  assert.equal(groups.find((g) => g.key === "character")?.readinessFlag, "CHARACTER_ASSETS_READY");
  assert.equal(groups.find((g) => g.key === "room-item")?.readinessFlag, "ROOM_ASSETS_READY");
  assert.equal(groups.find((g) => g.key === "state")?.readinessFlag, null);
});
