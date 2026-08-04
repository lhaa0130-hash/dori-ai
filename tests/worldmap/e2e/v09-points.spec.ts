// 지시서 08 §2.7 — 세계 전체 보기에서 지도 위 점이 정확히 0개인지 실제 화면에서 센다.
//
// ⚠️ 스크린샷 눈대중으로 통과시키지 않는다. DOM 개수와 MapLibre 가 실제로 그린
//    feature 수를 둘 다 확인한다. opacity:0 으로 숨긴 점은 "0개" 가 아니다.

import { test, expect, type Page } from "@playwright/test";

/** §2.7 이 요구하는 4개 viewport. 세계 fit zoom 이 화면 크기마다 달라지므로 전부 본다. */
const VIEWPORTS = [
  { name: "1440x900", width: 1440, height: 900 },
  { name: "1024x768", width: 1024, height: 768 },
  { name: "390x844", width: 390, height: 844 },
  { name: "320x568", width: 320, height: 568 },
];

async function ready(page: Page, url = "/world-map") {
  await page.goto(url);
  await page.waitForFunction(() => document.querySelectorAll("canvas.maplibregl-canvas").length > 0, null, { timeout: 60_000 });
  await page.waitForTimeout(3800);
}

/** 화면에 실제로 그려진 '점' 을 종류별로 센다. */
async function countPoints(page: Page) {
  return page.evaluate(() => {
    const visible = (el: Element) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && Number(cs.opacity) > 0;
    };
    const micro = [...document.querySelectorAll('[data-role="micro-core"]')].filter(visible).length;
    const halo = [...document.querySelectorAll('[data-role="micro-halo"]')].filter(visible).length;
    // 작은 나라 marker 의 투명 hit target — 보이지 않아도 지도 조작을 막을 수 있다.
    const hit = [...document.querySelectorAll('[data-role="micro-core"]')]
      .map((e) => e.closest("button")).filter(Boolean).length;
    // 점에 붙는 비교 번호 badge
    const legend = document.querySelectorAll('[data-role="point-legend"]').length;
    return { micro, halo, hit, legend };
  });
}

/** 현재 확대량(zoomDelta). 세계 fit zoom 은 화면마다 다르므로 절대 zoom 을 쓰지 않는다. */
async function zoomDelta(page: Page): Promise<number> {
  return page.evaluate(() => {
    const w = window as unknown as { __wmMap?: { getZoom(): number }; __wmBaseZoom?: number };
    if (!w.__wmMap || w.__wmBaseZoom == null) return NaN;
    return w.__wmMap.getZoom() - w.__wmBaseZoom;
  });
}

/** 실제 휠로 목표 구간에 들어갈 때까지 확대·축소한다. */
async function zoomUntil(page: Page, min: number, max: number) {
  await page.mouse.move(700, 450);
  for (let i = 0; i < 30; i++) {
    const d = await zoomDelta(page);
    if (d >= min && d <= max) return d;
    await page.mouse.wheel(0, d < min ? -120 : 120);
    await page.waitForTimeout(320);
  }
  const d = await zoomDelta(page);
  throw new Error(`zoomDelta 를 ${min}~${max} 로 못 맞췄다 (현재 ${d})`);
}

/** MapLibre 가 지금 프레임에 실제로 그린 수도점 feature 수. DOM 에는 안 나온다. */
async function capitalFeatureCount(page: Page): Promise<number> {
  return page.evaluate(() => {
    const w = window as unknown as { __wmMap?: { getLayer(id: string): unknown; queryRenderedFeatures(o: unknown): unknown[] } };
    if (!w.__wmMap?.getLayer("capital-dot")) return -1;
    return w.__wmMap.queryRenderedFeatures({ layers: ["capital-dot"] } as never).length;
  });
}

for (const vp of VIEWPORTS) {
  test.describe(`${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test("최초 세계 보기 — 점 0개, hit target 0개, 범례 없음", async ({ page }) => {
      await ready(page);
      const c = await countPoints(page);
      expect(c.micro, "작은 나라 점이 남아 있다").toBe(0);
      expect(c.halo, "halo 가 남아 있다").toBe(0);
      expect(c.hit, "투명 hit target 이 남아 있다").toBe(0);
      expect(c.legend, "점이 없는데 범례가 떠 있다").toBe(0);

      const caps = await capitalFeatureCount(page);
      expect(caps, "세계 보기에서 수도점이 그려졌다").toBeLessThanOrEqual(0);
    });

    test("선택·비교 상태로 들어와도 세계 보기면 점 0개", async ({ page }) => {
      for (const url of ["/world-map?mode=compare&countries=KOR,JPN", "/world-map?view=ranking&metric=population"]) {
        await ready(page, url);
        const c = await countPoints(page);
        expect(c.micro + c.halo + c.hit, `${url} 에서 점이 남았다`).toBe(0);
      }
    });

    test("overview 에서 점 관련 focusable 이 0개", async ({ page }) => {
      await ready(page);
      const focusable = await page.evaluate(() =>
        [...document.querySelectorAll("button")].filter((b) => b.querySelector('[data-role="micro-core"]')).length);
      expect(focusable).toBe(0);
    });
  });
}

test("확대하면 수도점 → 작은 나라점 순서로 나타나고, 축소하면 즉시 사라진다", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes("mobile"), "휠 확대는 데스크톱에서 검사한다");
  await ready(page);

  const before = await countPoints(page);
  expect(before.micro).toBe(0);
  expect(await capitalFeatureCount(page)).toBeLessThanOrEqual(0);

  // context — 수도점만
  //
  // ⚠️ "휠 몇 번" 으로 단계를 가정하지 않는다. 휠 한 칸의 zoom 변화량은 브라우저·OS·
  //    지도 크기마다 다르다(이 환경에서 -300 은 delta 0.40 으로 아직 overview 였다).
  //    실제 delta 를 재서 목표 구간에 들어갈 때까지 굴린다.
  await zoomUntil(page, 0.55, 1.29);
  const ctx = await countPoints(page);
  const ctxCaps = await capitalFeatureCount(page);
  expect(ctxCaps, "확대했는데 수도점이 안 나온다").toBeGreaterThan(0);
  expect(ctx.micro, "context 단계에서 작은 나라 점이 벌써 나왔다").toBe(0);
  expect(ctx.legend, "점이 나왔는데 범례가 없다").toBe(1);
  expect(await page.locator('[data-role="legend-micro"]').count(),
    "작은 나라 점이 없는데 범례에 '작은 나라' 가 있다").toBe(0);

  // local — 작은 나라 점까지
  await zoomUntil(page, 1.35, 3.5);
  await page.waitForTimeout(900);
  const loc = await countPoints(page);
  expect(loc.micro, "local 까지 확대했는데 작은 나라 점이 없다").toBeGreaterThan(0);
  expect(await page.locator('[data-role="legend-micro"]').count(), "범례에 두 의미가 없다").toBe(1);

  // 다시 축소 — 전부 사라져야 한다
  await zoomUntil(page, -5, 0.4);
  await page.waitForTimeout(1200);
  const back = await countPoints(page);
  expect(back.micro + back.halo + back.hit, "축소했는데 점이 남았다").toBe(0);
  expect(back.legend, "축소했는데 범례가 남았다").toBe(0);
  expect(await capitalFeatureCount(page), "축소했는데 수도점이 남았다").toBeLessThanOrEqual(0);
});

test("보이지 않는 marker 가 지도 드래그를 막지 않는다", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes("mobile"), "드래그는 데스크톱에서 검사한다");
  await ready(page);

  const center0 = await page.evaluate(() => {
    const w = window as unknown as { __wmMap?: { getCenter(): { lng: number } } };
    return w.__wmMap?.getCenter().lng ?? null;
  });
  await page.mouse.move(700, 450);
  await page.mouse.down();
  await page.mouse.move(500, 450, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(1200);
  const center1 = await page.evaluate(() => {
    const w = window as unknown as { __wmMap?: { getCenter(): { lng: number } } };
    return w.__wmMap?.getCenter().lng ?? null;
  });

  expect(center0).not.toBeNull();
  expect(Math.abs((center1 as number) - (center0 as number)), "지도가 끌리지 않았다").toBeGreaterThan(1);
});
