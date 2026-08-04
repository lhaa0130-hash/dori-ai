// 프로덕션 smoke — 지시서 08 §2.7 마지막 줄.
// "스크린샷 눈대중만으로 통과시키지 않는다. DOM 개수와 rendered feature 수를 둘 다 확인한다."

import { test, expect, type Page } from "@playwright/test";

const BASE = "https://illo.im";

async function ready(page: Page, path: string) {
  await page.goto(`${BASE}${path}`);
  await page.waitForFunction(() => document.querySelectorAll("canvas.maplibregl-canvas").length > 0, null, { timeout: 60_000 });
  await page.waitForTimeout(5000);
}

test("프로덕션 세계 보기 — 지도 위 점 0개", async ({ page }) => {
  for (const path of ["/world-map", "/world-map?mode=compare&countries=KOR,JPN", "/world-map?view=ranking&metric=population"]) {
    await ready(page, path);

    const dom = await page.evaluate(() => ({
      core: document.querySelectorAll('[data-role="micro-core"]').length,
      halo: document.querySelectorAll('[data-role="micro-halo"]').length,
      legend: document.querySelectorAll('[data-role="point-legend"]').length,
    }));
    expect(dom.core, `${path} — 작은 나라 점이 남았다`).toBe(0);
    expect(dom.halo, `${path} — halo 가 남았다`).toBe(0);
    expect(dom.legend, `${path} — 점이 없는데 범례가 떴다`).toBe(0);

    const caps = await page.evaluate(() => {
      const w = window as unknown as { __wmMap?: { getLayer(id: string): unknown; queryRenderedFeatures(o: unknown): unknown[] } };
      if (!w.__wmMap?.getLayer("capital-dot")) return -1;
      return w.__wmMap.queryRenderedFeatures({ layers: ["capital-dot"] } as never).length;
    });
    expect(caps, `${path} — 수도점이 그려졌다`).toBeLessThanOrEqual(0);
  }
});

test("프로덕션 — 나라를 고르면 점과 범례가 나온다", async ({ page }) => {
  await ready(page, "/world-map?country=MCO");
  const core = await page.locator('[data-role="micro-core"]').count();
  const legend = await page.locator('[data-role="point-legend"]').count();
  expect(core, "확대됐는데 작은 나라 점이 없다").toBeGreaterThan(0);
  expect(legend, "점이 나왔는데 범례가 없다").toBe(1);
});
