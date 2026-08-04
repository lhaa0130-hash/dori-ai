// 호기심 모음 (지시서 08 §6).

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CURIOSITY_COLLECTIONS, buildCuriosity, type CuriosityId } from "@/lib/worldmap/curiosity";
import type { CountryDataset, CountryRecord } from "@/lib/worldmap/types";

const dataset = JSON.parse(readFileSync("public/worldmap/countries.json", "utf8")) as CountryDataset;
const ALL: CountryRecord[] = dataset.countries;

test("모든 모음이 서로 다른 결과를 낸다 — 이름만 바꾼 중복이 없다", () => {
  const seen = new Map<string, CuriosityId>();
  for (const c of CURIOSITY_COLLECTIONS) {
    const r = buildCuriosity(ALL, c.id);
    assert.ok(r, `${c.id} 를 만들지 못했다`);
    const key = r.countries.map((x) => x.iso3).join(",");
    const dup = seen.get(key);
    assert.equal(dup, undefined, `${c.id} 와 ${dup} 의 목록이 완전히 같다 — 개수만 늘리는 중복이다`);
    seen.set(key, c.id);
  }
});

test("모든 모음에 한 문장 판정 기준이 있다", () => {
  for (const c of CURIOSITY_COLLECTIONS) {
    assert.ok(c.ruleKo.length > 5, `${c.id} 한국어 기준 없음`);
    assert.ok(c.ruleEn.length > 5, `${c.id} 영어 기준 없음`);
    assert.ok(c.titleKo && c.titleEn, `${c.id} 제목 누락`);
  }
});

test("빈 모음을 공개하지 않는다", () => {
  for (const c of CURIOSITY_COLLECTIONS) {
    const r = buildCuriosity(ALL, c.id)!;
    assert.ok(r.total > 0, `${c.id} 에 해당 국가가 0개다`);
  }
});

test("결과는 195개국 안에서만 나온다", () => {
  const valid = new Set(ALL.map((c) => c.iso3));
  for (const c of CURIOSITY_COLLECTIONS) {
    for (const x of buildCuriosity(ALL, c.id)!.countries) {
      assert.ok(valid.has(x.iso3), `${c.id} 에 등록 밖 ISO3 ${x.iso3}`);
    }
  }
});

test("섬나라와 내륙국은 겹치지 않는다", () => {
  const island = new Set(buildCuriosity(ALL, "island")!.countries.map((c) => c.iso3));
  const landlocked = buildCuriosity(ALL, "landlocked")!.countries.map((c) => c.iso3);
  for (const iso of landlocked) {
    assert.ok(!island.has(iso), `${iso} 가 섬나라이면서 내륙국이다`);
  }
});

test("알려진 나라가 제자리에 들어간다", () => {
  const has = (id: CuriosityId, iso: string) =>
    buildCuriosity(ALL, id)!.countries.some((c) => c.iso3 === iso);

  assert.ok(has("island", "JPN"), "일본이 섬나라 목록에 없다");
  assert.ok(has("landlocked", "MNG"), "몽골이 내륙국 목록에 없다");
  assert.ok(has("equator", "ECU"), "에콰도르가 적도 목록에 없다");
  assert.ok(has("island", "ISL"), "아이슬란드가 섬나라 목록에 없다");
  assert.ok(has("double-landlocked", "UZB"), "우즈베키스탄이 두 겹 내륙국 목록에 없다");
  assert.ok(!has("double-landlocked", "MNG"), "몽골은 이웃(중국·러시아)에 바다가 있어 두 겹 내륙국이 아니다");
  assert.ok(has("single-neighbour", "KOR"), "대한민국이 이웃 1개 목록에 없다");

  // 반대 방향도 본다 — 걸러지지 않으면 필터가 아니라 통과기다.
  assert.ok(!has("landlocked", "KOR"), "대한민국이 내륙국으로 분류됐다");
  assert.ok(!has("island", "MNG"), "몽골이 섬나라로 분류됐다");
  assert.ok(!has("equator", "KOR"), "대한민국이 적도 목록에 있다");
});

test("모르는 id 는 조용히 null", () => {
  assert.equal(buildCuriosity(ALL, "nope" as CuriosityId), null);
});
