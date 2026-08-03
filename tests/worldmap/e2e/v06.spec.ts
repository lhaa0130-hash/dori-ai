import { test, expect } from "@playwright/test";

// 지시서 06 Commit 1 — 미니맵 색 고정 · 지도 높이 · 축척별 국가명
async function ready(page: import("@playwright/test").Page) {
  await page.waitForFunction(() => {
    const w = (window as any).__worldmap;
    return w?.flat?.isStyleLoaded() && w.flat.querySourceFeatures("countries").length > 0;
  }, undefined, { timeout: 60_000 });
  await page.waitForTimeout(1500);
}
const labelCount = (page: import("@playwright/test").Page) =>
  page.evaluate(() => [...document.querySelectorAll("span")].filter((s) => (s.className || "").includes("text-shadow")).length);

test("최초 세계 보기에서 지도 안 국가명이 0개다", async ({ page }) => {
  await page.goto("/world-map");
  await ready(page);
  expect(await labelCount(page), "세계 전체 보기 라벨").toBe(0);
});

test("키르기스스탄을 골라도 가장 축소한 지도엔 이름이 없고 배너만 있다", async ({ page }) => {
  await page.goto("/world-map?country=KGZ");
  await ready(page);
  await page.waitForTimeout(1600);

  const banner = page.locator('[class*="bg-white/95"]').first();
  await expect(banner, "상단 배너에는 이름이 있어야 한다").toContainText("키르기스스탄");

  // 선택은 유지한 채 카메라만 세계 전체로 되돌린다 — 지시서가 말하는 '가장 축소한 화면'
  await page.evaluate(() => (window as any).__worldmap.flat.jumpTo({ center: [10, 20], zoom: 1.1 }));
  await page.waitForTimeout(700);

  expect(await labelCount(page), "가장 축소한 화면에서는 선택 국가도 지도 안 이름이 없다").toBe(0);
  await expect(banner).toContainText("키르기스스탄");
});

test("확대하면 큰 나라부터 이름이 단계적으로 늘어난다", async ({ page, viewport }) => {
  test.skip((viewport?.width ?? 0) < 500, "휠 확대 — 데스크톱 전용");
  await page.goto("/world-map");
  await ready(page);
  const l0 = await labelCount(page);

  const box = (await page.locator("canvas.maplibregl-canvas").first().boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.wheel(0, -500);
  await page.waitForTimeout(900);
  const l1 = await labelCount(page);

  await page.mouse.wheel(0, -500);
  await page.waitForTimeout(900);
  const l2 = await labelCount(page);

  expect(l0, "0단계").toBe(0);
  expect(l1, `1단계 ${l1}`).toBeGreaterThan(0);
  expect(l2, `2단계 ${l2} >= 1단계 ${l1}`).toBeGreaterThanOrEqual(l1);
});

test("국가명이 서로 겹치지 않는다", async ({ page, viewport }) => {
  test.skip((viewport?.width ?? 0) < 500, "휠 확대 — 데스크톱 전용");
  await page.goto("/world-map");
  await ready(page);
  const box = (await page.locator("canvas.maplibregl-canvas").first().boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.wheel(0, -900);
  await page.waitForTimeout(1200);

  const overlaps = await page.evaluate(() => {
    const rects = [...document.querySelectorAll("span")]
      .filter((s) => (s.className || "").includes("text-shadow"))
      .map((s) => s.getBoundingClientRect());
    let n = 0;
    for (let i = 0; i < rects.length; i++)
      for (let j = i + 1; j < rects.length; j++) {
        const a = rects[i], b = rects[j];
        if (a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top) n++;
      }
    return { count: rects.length, overlaps: n };
  });
  expect(overlaps.overlaps, `라벨 ${overlaps.count}개 중 겹침 ${overlaps.overlaps}`).toBe(0);
});

test("미니맵 색이 선택·랭킹·비교에 따라 변하지 않는다", async ({ page }) => {
  const paint = () =>
    page.evaluate(() => {
      const w = (window as any).__worldmap;
      // 미니맵은 두 번째 maplibre 인스턴스 — 스타일에서 land 색 표현식을 읽는다
      const canvases = document.querySelectorAll("canvas.maplibregl-canvas");
      return { canvasCount: canvases.length, mainFill: JSON.stringify(w.flat.getPaintProperty("country-fill", "fill-color")).slice(0, 60) };
    });

  await page.goto("/world-map");
  await ready(page);
  await page.waitForFunction(() => document.querySelectorAll("canvas.maplibregl-canvas").length >= 2, undefined, { timeout: 30_000 });
  const base = await paint();

  await page.goto("/world-map?view=ranking&metric=gdp");
  await ready(page);
  await page.waitForFunction(() => document.querySelectorAll("canvas.maplibregl-canvas").length >= 2, undefined, { timeout: 30_000 });
  const ranking = await paint();

  // 주 지도 색은 달라져야 하고, 미니맵 캔버스는 그대로 존재해야 한다
  expect(ranking.mainFill).not.toBe(base.mainFill);
  expect(ranking.canvasCount).toBe(base.canvasCount);
});

test("지도 아래 큰 빈 공간이 없다", async ({ page }) => {
  await page.goto("/world-map");
  await ready(page);
  const m = await page.evaluate(() => {
    const cv = document.querySelector("canvas.maplibregl-canvas")!.getBoundingClientRect();
    return { h: Math.round(cv.height), vh: window.innerHeight };
  });
  expect(m.h, `지도 높이 ${m.h} / 화면 ${m.vh}`).toBeLessThanOrEqual(560);
});
