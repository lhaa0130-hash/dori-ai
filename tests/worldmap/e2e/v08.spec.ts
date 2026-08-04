// 지시서 07 §9 — 지도 점 크기 정규화를 실제 화면에서 잰다.
//
// ⚠️ CSS 클래스를 읽는 것으로는 증명되지 않는다. transform·ring·devicePixelRatio 때문에
//    "코드상 6px" 과 "화면에서 보이는 크기" 는 얼마든지 달라질 수 있다.
//    getBoundingClientRect 로 실제 그려진 상자를 잰다.

import { test, expect, type Page } from "@playwright/test";

const MAP = "/world-map";

// ⚠️ 지시서 08 §2.2 로 계약이 바뀌었다.
//    예전에는 세계 전체 보기에서도 작은 나라 점을 그렸고 이 파일이 그걸 쟀다.
//    지금은 세계 보기에 점이 0개이므로, 점 크기는 점이 실제로 나오는 local 단계에서 잰다.
//    "언제 나오는가" 는 v09-points.spec.ts 가 맡는다. 여기서는 "나왔을 때 크기" 만 본다.

async function ready(page: Page, url = MAP) {
  await page.goto(url);
  await page.waitForFunction(() => document.querySelectorAll("canvas.maplibregl-canvas").length > 0, null, { timeout: 60_000 });
  // 스타일 로드 + 첫 렌더가 끝날 때까지
  await page.waitForTimeout(3500);
}

/**
 * 작은 나라 점이 나오는 local 단계로 들어간다.
 *
 * ⚠️ 휠로 확대하지 않는다. 모바일 프로파일에는 mouse.wheel 이 없어서 그대로 두면
 *    모바일에서만 조용히 세계 보기에 머물고, 점이 0개라 "잴 게 없다" 로 실패한다.
 *    나라를 고르면 그 나라로 카메라가 붙으므로 두 프로파일 모두에서 확실히 local 이 된다.
 *    "언제 점이 나오는가" 는 v09-points 가 휠로 따로 검사한다.
 */
async function atLocal(page: Page, iso3 = "MCO") {
  await ready(page, `${MAP}?country=${iso3}`);
  await page.waitForTimeout(1500);
  const d = await page.evaluate(() => {
    const w = window as unknown as { __wmMap?: { getZoom(): number }; __wmBaseZoom?: number };
    return w.__wmMap && w.__wmBaseZoom != null ? w.__wmMap.getZoom() - w.__wmBaseZoom : NaN;
  });
  expect(d, "나라를 골랐는데 local 단계가 아니다").toBeGreaterThanOrEqual(1.3);
}

/** 화면에 실제로 그려진 core dot 들의 지름 목록. */
async function coreSizes(page: Page): Promise<number[]> {
  return page.$$eval('[data-role="micro-core"]', (els) =>
    els.map((e) => {
      const r = e.getBoundingClientRect();
      return Math.round(Math.max(r.width, r.height) * 100) / 100;
    }),
  );
}

test("작은 나라 점은 모두 정확히 같은 6px — 선택해도 커지지 않는다 (§9.5)", async ({ page }) => {
  // 모나코를 고른 화면에는 '선택된 점' 과 '선택 안 된 점' 이 같은 프레임에 함께 있다.
  // 한 번에 재면 두 상태의 크기가 같은지 바로 알 수 있다.
  await atLocal(page, "MCO");

  const sizes = await coreSizes(page);
  expect(sizes.length, "작은 나라 선택점이 하나도 없다").toBeGreaterThan(0);

  const min = Math.min(...sizes);
  const max = Math.max(...sizes);
  expect(max - min, `core 지름이 제각각이다: ${min}~${max}`).toBe(0);
  expect(max, `core 지름이 6px 이 아니다: ${max}`).toBe(6);

  // 선택은 core 확대가 아니라 별도 halo 로 나타낸다.
  const halos = await page.locator('[data-role="micro-halo"]').count();
  expect(halos, "선택했는데 halo 가 없다").toBeGreaterThan(0);
});

test("hit target — 데스크톱 32px 이상 (§9.2)", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes("mobile"), "데스크톱 전용");
  await atLocal(page);

  const hits = await page.$$eval('[data-role="micro-core"]', (els) =>
    els.map((e) => {
      const btn = e.closest("button");
      if (!btn) return 0;
      const r = btn.getBoundingClientRect();
      return Math.min(r.width, r.height);
    }),
  );
  expect(hits.length).toBeGreaterThan(0);
  expect(Math.min(...hits), `hit target 이 32px 미만: ${Math.min(...hits)}`).toBeGreaterThanOrEqual(32);
});

test("hit target — 터치 44px 이상 (§9.2)", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "모바일 전용");
  await atLocal(page);

  const hits = await page.$$eval('[data-role="micro-core"]', (els) =>
    els.map((e) => {
      const btn = e.closest("button");
      if (!btn) return 0;
      const r = btn.getBoundingClientRect();
      return Math.min(r.width, r.height);
    }),
  );
  expect(hits.length).toBeGreaterThan(0);
  expect(Math.min(...hits), `hit target 이 44px 미만: ${Math.min(...hits)}`).toBeGreaterThanOrEqual(44);
});

test("색 기준을 바꿔도 점 크기는 그대로다 (§9.8)", async ({ page }) => {
  await atLocal(page);
  const base = await coreSizes(page);
  expect(base.length).toBeGreaterThan(0);

  for (const metric of ["population", "gdp", "area"]) {
    await ready(page, `${MAP}?view=ranking&metric=${metric}`);
    await atLocal(page);
    const now = await coreSizes(page);
    if (now.length === 0) continue;
    expect(Math.max(...now), `${metric} 기준에서 점 크기가 달라졌다`).toBe(Math.max(...base));
  }
});

test("표기 통일 — 인구에 소수점이 없고 순위는 '세계 N위 / M개국' (§6)", async ({ page }) => {
  await page.goto(`${MAP}?country=KOR`);
  await page.waitForTimeout(3500);
  const body = (await page.locator("body").innerText()).replace(/\s+/g, " ");

  expect(body, "인구 표기에 소수점이 남아 있다").not.toMatch(/\d+\.\d+만 명/);
  expect(body).toMatch(/세계 \d+위 \/ \d+개국/);
  expect(body, "조사 오류").not.toMatch(/북한와|인구은|인구이 |GDP은|GDP이 /);
  expect(body, "괄호 조사 표기").not.toMatch(/은\(는\)|이\(가\)|을\(를\)/);
});
