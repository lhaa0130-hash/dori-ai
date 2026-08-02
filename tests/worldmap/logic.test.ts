// 월드맵 단위 테스트 (명세서 §17.1).
// 저장소 관례에 맞춰 node:test 를 쓴다.

import test from "node:test";
import assert from "node:assert/strict";

import { abbreviate, compareMetrics, formatDate, formatMetric, fullNumber } from "../../lib/worldmap/format.ts";
import { buildSearchIndex, searchCountries, normalize, parseUrlState, buildUrlQuery, worldRank } from "../../lib/worldmap/search.ts";
import { MapSyncController, clampLatitude, wrapLongitude, normalizeCamera, cameraForBounds, type MapAdapter, type Camera } from "../../lib/worldmap/mapSync.ts";
import { resolveLanguage } from "../../lib/worldmap/i18n.ts";
import type { CountryRecord, NumericMetric } from "../../lib/worldmap/types.ts";

// ── 도우미 ──────────────────────────────────────────────────────
const num = (v: number | null, y: number | null = 2024, u = "current_usd"): NumericMetric =>
  ({ v, y, u: u as NumericMetric["u"], s: v == null ? "missing" : "ok", src: v == null ? null : "world-bank" });

function country(over: Partial<CountryRecord> & { iso3: string }): CountryRecord {
  return {
    iso2: over.iso3.slice(0, 2), nameKo: "테스트", nameEn: "Test", officialNameEn: "Republic of Test",
    capitalKo: null, capitalEn: null, continentCode: "AS", continentKo: "아시아", continentEn: "Asia",
    subregionKo: null, subregionEn: null, center: [0, 0], bbox: [-1, -1, 1, 1], flagUrl: null,
    leader: { ko: null, en: null, titleKo: null, titleEn: null, role: "head_of_government", s: "missing", src: null },
    established: { date: null, s: "missing", src: null },
    religion: { ko: null, en: null, kind: null, labelKo: "주요 종교", labelEn: "Main religion", s: "missing", src: null },
    population: num(null), area: num(null), gdp: num(null), gdpPerCapita: num(null),
    ...over,
  } as CountryRecord;
}

// ── 숫자·날짜 포맷 (§13) ────────────────────────────────────────
test("한국어는 만·억·조 단위로 줄인다", () => {
  assert.equal(abbreviate(51_710_000, "ko"), "5171만");
  assert.equal(abbreviate(1_710_000_000_000, "ko"), "1.71조");
  assert.equal(abbreviate(1234, "ko"), "1,234");
});

test("영어는 K·M·B·T 단위로 줄인다", () => {
  assert.equal(abbreviate(51_710_000, "en"), "51.71M");
  assert.equal(abbreviate(1_710_000_000_000, "en"), "1.71T");
});

test("축약값과 별개로 원본 숫자를 접근성 텍스트로 준다", () => {
  const f = formatMetric(num(1_710_000_000_000), "ko");
  assert.equal(f.display, "$1.71조");
  assert.equal(f.full, `$${fullNumber(1_710_000_000_000, "ko")}`);
  assert.equal(f.year, "2024");
});

test("자료가 없으면 0 이 아니라 '자료 없음' 이다", () => {
  const f = formatMetric(num(null), "ko");
  assert.equal(f.display, "자료 없음");
  assert.equal(f.missing, true);
  assert.equal(f.year, null);
  assert.equal(formatMetric(num(null), "en").display, "No data");
});

test("1인당 GDP 는 축약하지 않는다", () => {
  assert.equal(formatMetric(num(36_239, 2024, "current_usd_per_person"), "ko").display, "$36,239");
});

test("면적은 km² 로 전체 숫자를 쓴다", () => {
  assert.equal(formatMetric(num(100_210, null, "km2"), "ko").display, "100,210 km²");
});

test("수립일 포맷과 결측 처리", () => {
  assert.equal(formatDate("1948-08-15", "ko"), "1948년 8월 15일");
  assert.equal(formatDate(null, "ko"), "자료 없음");
  assert.equal(formatDate("깨진값", "en"), "No data");
});

// ── 비교 (§7.5) ────────────────────────────────────────────────
test("한쪽 값이 없으면 비교를 계산하지 않는다", () => {
  const c = compareMetrics(num(100), num(null));
  assert.equal(c.comparable, false);
  assert.equal(c.diff, null);
});

test("큰 값을 100% 로 정규화하고 절대 차이를 준다", () => {
  const c = compareMetrics(num(200), num(50));
  assert.equal(c.comparable, true);
  assert.equal(c.diff, 150);
  assert.equal(c.ratioA, 1);
  assert.equal(c.ratioB, 0.25);
  assert.equal(c.larger, "a");
});

// ── 검색 (§8.1) ────────────────────────────────────────────────
const SAMPLE = [
  country({ iso3: "KOR", iso2: "KR", nameKo: "한국", nameEn: "South Korea", officialNameEn: "Republic of Korea", continentCode: "AS", gdp: num(1_880_000_000_000) }),
  country({ iso3: "PRK", iso2: "KP", nameKo: "북한", nameEn: "North Korea", officialNameEn: "DPRK", continentCode: "AS" }),
  country({ iso3: "FRA", iso2: "FR", nameKo: "프랑스", nameEn: "France", officialNameEn: "French Republic", continentCode: "EU", gdp: num(3_000_000_000_000) }),
  country({ iso3: "BRA", iso2: "BR", nameKo: "브라질", nameEn: "Brazil", officialNameEn: "Federative Republic of Brazil", continentCode: "SA", gdp: num(2_100_000_000_000) }),
];
const INDEX = buildSearchIndex(SAMPLE);

test("악센트와 대소문자·공백 차이를 무시한다", () => {
  assert.equal(normalize("  ÉLAN  "), "elan");
  assert.equal(normalize("FRANCE"), "france");
});

test("prefix 일치가 contains 일치보다 앞선다", () => {
  // 'korea' 는 South Korea(contains) 와 North Korea(contains) 양쪽에 있고,
  // 'Republic of Korea' 는 prefix 가 아니다 → 순서가 안정적이어야 한다.
  const r = searchCountries(INDEX, "kor");
  assert.equal(r[0], "KOR", "KOR 의 iso3 가 prefix 로 먼저 잡혀야 한다");
  assert.ok(r.includes("PRK"));
});

test("한국어 이름으로 찾는다", () => {
  assert.deepEqual(searchCountries(INDEX, "브라"), ["BRA"]);
});

test("ISO2·ISO3 로 찾는다", () => {
  assert.deepEqual(searchCountries(INDEX, "FRA"), ["FRA"]);
  assert.deepEqual(searchCountries(INDEX, "kr"), ["KOR"]);
});

test("대륙 필터는 검색 결과를 제한한다", () => {
  assert.deepEqual(searchCountries(INDEX, "r", "SA"), ["BRA"]);
});

test("빈 질의는 결과가 없다", () => {
  assert.deepEqual(searchCountries(INDEX, "   "), []);
});

test("결과는 최대 10개", () => {
  const many = buildSearchIndex(Array.from({ length: 30 }, (_, i) => country({ iso3: `X${String(i).padStart(2, "0")}`, nameEn: `Xland ${i}` })));
  assert.equal(searchCountries(many, "xland").length, 10);
});

// ── URL 상태 (§8.3) ────────────────────────────────────────────
const VALID = new Set(["KOR", "JPN", "FRA"]);

test("소문자 ISO 를 대문자로 받아들인다", () => {
  assert.equal(parseUrlState(new URLSearchParams("country=kor"), VALID).country, "KOR");
});

test("잘못된 ISO 와 지원하지 않는 값은 조용히 무시한다", () => {
  const s = parseUrlState(new URLSearchParams("country=ZZZ&compare=1234&lang=fr&view=hologram"), VALID);
  assert.equal(s.country, null);
  assert.equal(s.compare, null);
  assert.equal(s.lang, null);
  assert.equal(s.view, "split");
});

test("같은 국가는 A·B 로 동시에 지정할 수 없다", () => {
  assert.equal(parseUrlState(new URLSearchParams("country=KOR&compare=KOR"), VALID).compare, null);
});

test("선택 국가가 없으면 비교만 남기지 않는다", () => {
  assert.equal(parseUrlState(new URLSearchParams("compare=JPN"), VALID).compare, null);
});

test("URL 왕복이 상태를 보존한다", () => {
  const q = buildUrlQuery({ country: "KOR", compare: "JPN", lang: "en", view: "globe", continent: "AS" });
  const back = parseUrlState(new URLSearchParams(q.slice(1)), VALID);
  assert.equal(back.country, "KOR");
  assert.equal(back.compare, "JPN");
  assert.equal(back.lang, "en");
  assert.equal(back.view, "globe");
  assert.equal(back.continent, "AS");
});

test("기본값은 URL 에 넣지 않는다", () => {
  assert.equal(buildUrlQuery({ country: null, compare: null, lang: null, view: "split", continent: null }), "");
});

// ── 순위 ────────────────────────────────────────────────────────
test("세계 순위는 자료 없는 나라를 빼고 센다", () => {
  const r = worldRank(SAMPLE, "BRA", "gdp");
  assert.deepEqual(r, { rank: 2, total: 3 });   // FRA 3.0조 > BRA 2.1조 > KOR 1.88조, PRK 는 제외
  assert.equal(worldRank(SAMPLE, "PRK", "gdp"), null);
});

// ── 언어 결정 (§13) ────────────────────────────────────────────
test("언어는 URL → 저장값 → 브라우저 → en 순서로 정한다", () => {
  assert.equal(resolveLanguage("en", "ko", "ko-KR"), "en");
  assert.equal(resolveLanguage(null, "ko", "en-US"), "ko");
  assert.equal(resolveLanguage(null, null, "ko-KR"), "ko");
  assert.equal(resolveLanguage(null, null, "de-DE"), "en");
  assert.equal(resolveLanguage("fr", null, undefined), "en");
});

// ── 카메라 (§6.3) ──────────────────────────────────────────────
test("위도는 MapLibre 지원 범위로 자른다", () => {
  assert.equal(clampLatitude(95), 85);
  assert.equal(clampLatitude(-95), -85);
  assert.equal(clampLatitude(37.5), 37.5);
});

test("경도는 [-180, 180) 구간으로 되돌린다", () => {
  assert.equal(wrapLongitude(190), -170);
  assert.equal(wrapLongitude(-190), 170);
  // 540° 는 반자오선. 구간이 반열림이라 +180 이 아니라 -180 으로 떨어진다(같은 자오선).
  assert.equal(wrapLongitude(540), -180);
  assert.equal(wrapLongitude(37.5), 37.5);
});

test("zoom 은 공유 범위 안으로 제한한다", () => {
  const c = normalizeCamera({ center: [0, 0], zoom: 99, bearing: 0 }, [0.6, 7]);
  assert.equal(c.zoom, 7);
});

test("경계 상자로 카메라를 잡는다", () => {
  const cam = cameraForBounds([126, 33, 130, 38]);
  assert.ok(Math.abs(cam.center[0] - 128) < 0.01);
  assert.ok(Math.abs(cam.center[1] - 35.5) < 0.01);
  assert.ok(cam.zoom > 4 && cam.zoom <= 7, `zoom=${cam.zoom}`);
});

test("날짜변경선을 걸친 나라도 화면 밖으로 튀지 않는다", () => {
  // 러시아처럼 경도가 -180~180 전체로 잡히는 경우
  const cam = cameraForBounds([-180, 41, 180, 82]);
  assert.ok(cam.center[0] >= -180 && cam.center[0] <= 180);
  assert.ok(cam.zoom >= 0.6);
});

// ── 동기화 컨트롤러 (§6.3 · §17.1) ──────────────────────────────
function fakeMap(): MapAdapter & { jumps: Camera[]; eases: Array<[Camera, number]>; stops: number; camera: Camera } {
  const state = {
    camera: { center: [0, 0] as [number, number], zoom: 1, bearing: 0 },
    jumps: [] as Camera[],
    eases: [] as Array<[Camera, number]>,
    stops: 0,
    getCamera: () => state.camera,
    jumpTo: (c: Camera) => { state.jumps.push(c); state.camera = c; },
    easeTo: (c: Camera, d: number) => { state.eases.push([c, d]); state.camera = c; },
    stop: () => { state.stops++; },
  };
  return state;
}

/** 프레임을 즉시 실행해 테스트를 동기적으로 만든다. */
const immediate = { scheduleFrame: (cb: () => void) => { cb(); return 1; }, cancelFrame: () => {} };

test("한쪽을 움직이면 다른 쪽만 따라간다", () => {
  const ctl = new MapSyncController(immediate);
  const flat = fakeMap(), globe = fakeMap();
  ctl.register("flat", flat); ctl.register("globe", globe);

  ctl.beginInteraction("flat");
  ctl.handleMove("flat", { center: [127, 37], zoom: 4, bearing: 0 });

  assert.equal(globe.jumps.length, 1, "지구본이 따라와야 한다");
  assert.equal(flat.jumps.length, 0, "발신자는 자기 자신을 움직이지 않는다");
  assert.deepEqual(globe.jumps[0].center, [127, 37]);
});

test("메아리로 되돌아온 move 는 무시한다 — 떨림 방지", () => {
  const ctl = new MapSyncController(immediate);
  const flat = fakeMap(), globe = fakeMap();
  // 지구본이 옮겨지면 곧바로 move 를 되쏘는 상황을 재현한다
  globe.jumpTo = (c: Camera) => {
    globe.jumps.push(c);
    ctl.handleMove("globe", c);        // ← 실제 MapLibre 가 하는 일
  };
  ctl.register("flat", flat); ctl.register("globe", globe);

  ctl.beginInteraction("flat");
  ctl.handleMove("flat", { center: [10, 10], zoom: 3, bearing: 0 });

  assert.equal(globe.jumps.length, 1);
  assert.equal(flat.jumps.length, 0, "되돌아온 move 로 발신자를 다시 움직이면 무한 왕복이 된다");
});

test("발신자가 아닌 지도의 move 는 버린다", () => {
  const ctl = new MapSyncController(immediate);
  const flat = fakeMap(), globe = fakeMap();
  ctl.register("flat", flat); ctl.register("globe", globe);

  ctl.beginInteraction("flat");
  ctl.handleMove("globe", { center: [50, 50], zoom: 5, bearing: 0 });   // 지구본은 지금 발신자가 아니다
  assert.equal(flat.jumps.length, 0);
});

test("조작이 끝나면 다른 지도도 다시 발신할 수 있다", () => {
  const ctl = new MapSyncController(immediate);
  const flat = fakeMap(), globe = fakeMap();
  ctl.register("flat", flat); ctl.register("globe", globe);

  ctl.beginInteraction("flat");
  ctl.endInteraction("flat");
  ctl.beginInteraction("globe");
  ctl.handleMove("globe", { center: [1, 2], zoom: 3, bearing: 0 });
  assert.equal(flat.jumps.length, 1);
});

test("새 입력이 시작되면 진행 중이던 자동 이동을 취소한다", () => {
  const ctl = new MapSyncController(immediate);
  const flat = fakeMap(), globe = fakeMap();
  ctl.register("flat", flat); ctl.register("globe", globe);
  ctl.beginInteraction("flat");
  assert.equal(globe.stops, 1, "상대 지도의 애니메이션을 멈춰야 한다");
  assert.equal(flat.stops, 0);
});

test("실시간 연동은 easeTo 가 아니라 jumpTo 를 쓴다 — 애니메이션 큐 방지", () => {
  const ctl = new MapSyncController(immediate);
  const flat = fakeMap(), globe = fakeMap();
  ctl.register("flat", flat); ctl.register("globe", globe);
  ctl.beginInteraction("flat");
  for (let i = 0; i < 5; i++) ctl.handleMove("flat", { center: [i, i], zoom: 2, bearing: 0 });
  assert.equal(globe.eases.length, 0);
  assert.equal(globe.jumps.length, 5);
});

test("한 프레임에 여러 move 가 와도 마지막 것만 반영한다", () => {
  let queued: (() => void) | null = null;
  const ctl = new MapSyncController({
    scheduleFrame: (cb) => { queued = cb; return 1; },
    cancelFrame: () => { queued = null; },
  });
  const flat = fakeMap(), globe = fakeMap();
  ctl.register("flat", flat); ctl.register("globe", globe);

  ctl.beginInteraction("flat");
  ctl.handleMove("flat", { center: [1, 1], zoom: 2, bearing: 0 });
  ctl.handleMove("flat", { center: [2, 2], zoom: 2, bearing: 0 });
  ctl.handleMove("flat", { center: [3, 3], zoom: 2, bearing: 0 });
  assert.equal(globe.jumps.length, 0, "프레임 전에는 아직 반영하지 않는다");

  queued!();
  assert.equal(globe.jumps.length, 1, "프레임당 한 번만 반영한다");
  assert.deepEqual(globe.jumps[0].center, [3, 3]);
});

test("명시적 이동은 양쪽에 같은 duration 으로 적용한다", () => {
  const ctl = new MapSyncController(immediate);
  const flat = fakeMap(), globe = fakeMap();
  ctl.register("flat", flat); ctl.register("globe", globe);

  ctl.moveAll({ center: [127, 37], zoom: 5, bearing: 0 }, 700);
  assert.equal(flat.eases.length, 1);
  assert.equal(globe.eases.length, 1);
  assert.equal(flat.eases[0][1], 700);
  assert.equal(globe.eases[0][1], 700);
});

test("명시적 이동 중 지도가 되쏘는 move 로 서로를 다시 움직이지 않는다", () => {
  const ctl = new MapSyncController(immediate);
  const flat = fakeMap(), globe = fakeMap();
  flat.easeTo = (c: Camera, d: number) => { flat.eases.push([c, d]); ctl.handleMove("flat", c); };
  ctl.register("flat", flat); ctl.register("globe", globe);

  ctl.moveAll({ center: [9, 9], zoom: 4, bearing: 0 }, 700);
  assert.equal(globe.jumps.length, 0, "명시적 이동 도중의 메아리는 무시해야 한다");
});

test("등록 해제하면 더 이상 따라가지 않는다", () => {
  const ctl = new MapSyncController(immediate);
  const flat = fakeMap(), globe = fakeMap();
  ctl.register("flat", flat); ctl.register("globe", globe);
  ctl.unregister("globe");
  ctl.beginInteraction("flat");
  ctl.handleMove("flat", { center: [1, 1], zoom: 2, bearing: 0 });
  assert.equal(globe.jumps.length, 0);
});

test("dispose 후에는 대기 프레임이 남지 않는다", () => {
  const ctl = new MapSyncController();
  const flat = fakeMap();
  ctl.register("flat", flat);
  ctl.beginInteraction("flat");
  ctl.handleMove("flat", { center: [1, 1], zoom: 2, bearing: 0 });
  ctl.dispose();
  assert.equal(ctl.debugState.hasPendingFrame, false);
  assert.equal(ctl.debugState.activeSource, null);
});
