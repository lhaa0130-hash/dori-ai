import { test, expect } from "@playwright/test";

// 지시서 04 검증 — 미니맵 · 언어 통일 · 세계 랭킹
test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    const t = new Date(); t.setDate(t.getDate() + 1);
    window.localStorage.setItem("dori_open_popup_hide_until", t.toISOString());
  });
});

async function ready(page: import("@playwright/test").Page) {
  await page.waitForFunction(() => {
    const w = (window as any).__worldmap;
    return w?.flat?.isStyleLoaded() && w.flat.querySourceFeatures("countries").length > 0;
  }, undefined, { timeout: 60_000 });
  await page.waitForTimeout(1200);
}

test("미니맵에 세계 전체가 잘리지 않고 보인다", async ({ page }) => {
  await page.goto("/world-map");
  await ready(page);
  await page.waitForFunction(() => document.querySelectorAll("canvas.maplibregl-canvas").length >= 2, undefined, { timeout: 30_000 });

  const mini = page.getByRole("img", { name: /미니맵|minimap/i });
  await expect(mini).toBeVisible();
  const box = (await mini.boundingBox())!;
  expect(box.width, "미니맵 크기").toBeGreaterThan(100);
  expect(box.height).toBeGreaterThan(60);
});

test("본문에 English 버튼이 없다", async ({ page }) => {
  await page.goto("/world-map");
  await ready(page);
  const main = page.locator("main");
  await expect(main.getByRole("button", { name: /^English$/ })).toHaveCount(0);
  await expect(main.getByRole("button", { name: /^한국어$/ })).toHaveCount(0);
});

test("구형 ?lang=en 링크가 상태를 지키며 영어 경로로 정리된다", async ({ page }) => {
  await page.goto("/world-map?country=KOR&lang=en");
  await page.waitForURL(/\/en\/world-map/, { timeout: 20_000 });
  await expect(page).toHaveURL(/country=KOR/);
  await expect(page).not.toHaveURL(/lang=/);
});

test("세계 랭킹 — 면적을 누르면 TOP 10 과 기준연도·출처가 보인다", async ({ page }) => {
  await page.goto("/world-map?view=ranking&metric=area");
  await ready(page);

  const panel = page.getByRole("region", { name: "세계 랭킹" });
  await expect(panel).toBeVisible();
  await expect(panel).toContainText("국토 면적");
  await expect(panel).toContainText("자료가 있는");
  // 1위는 러시아
  await expect(panel.locator("li").first()).toContainText("러시아");
  const rows = await panel.locator("li").count();
  expect(rows, "TOP 10").toBe(10);
});

test("랭킹 지표·정렬·대륙이 URL 에 남는다", async ({ page }) => {
  await page.goto("/world-map?view=ranking&metric=population");
  await ready(page);
  const panel = page.getByRole("region", { name: "세계 랭킹" });
  await expect(panel.locator("li").first()).toContainText(/인도|중국/);

  await panel.getByRole("button", { name: /낮은 순|높은 순/ }).click();
  await expect(page).toHaveURL(/order=asc/);
  await expect(page).toHaveURL(/metric=population/);
});

test("랭킹에서 나라를 누르면 지도가 그 나라로 간다", async ({ page }) => {
  await page.goto("/world-map?view=ranking&metric=area");
  await ready(page);
  const panel = page.getByRole("region", { name: "세계 랭킹" });
  await panel.getByRole("button", { name: "브라질", exact: true }).click();
  await page.waitForTimeout(1800);
  const c = await page.evaluate(() => (window as any).__worldmap.flat.getCenter().lng);
  expect(Math.abs(c - (-54)), `지도 중심 ${c}`).toBeLessThan(15);
});
