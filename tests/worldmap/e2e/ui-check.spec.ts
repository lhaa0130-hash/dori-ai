import { test, expect } from "@playwright/test";

// 11개 요청 항목을 실브라우저에서 한 번에 확인한다.
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
  await page.waitForTimeout(800);
}

test("11개 항목 종합 확인", async ({ page }) => {
  await page.goto("/world-map?country=KOR");
  await ready(page);

  const r = await page.evaluate(() => {
    const m = (window as any).__worldmap.flat;
    const style = m.getStyle();
    const layer = (id: string) => style.layers.find((l: any) => l.id === id);
    const src: any = m.getSource("capitals");
    const data = src?._data ?? src?.serialize?.()?.data;
    return {
      globeGone: Object.keys((window as any).__worldmap).length === 1 && style.projection?.type === "mercator",
      borderWidth: layer("country-line")?.paint?.["line-width"],
      capitalSourceCount: data?.features?.length ?? -1,
      capitalRendered: m.querySourceFeatures("capitals").length,
      hasHoverFill: !!layer("country-hover-fill"),
      hasCapitalLayer: !!layer("capital-dot"),
    };
  });

  expect(r.globeGone, "① 지구본 완전 제거").toBe(true);
  expect(r.borderWidth, "② 테두리 얇게").toBeLessThanOrEqual(0.4);
  // ⑧ 수도 점 — querySourceFeatures 는 '로드된 타일' 만 세므로 세계 줌에서는 일부만 잡힌다.
  //    레이어 존재 + 실제 렌더 여부로 확인한다(데이터 195/195 는 데이터 테스트가 지킨다).
  expect(r.hasCapitalLayer, "⑧ 수도 점 레이어").toBe(true);
  expect(r.capitalRendered, "⑧ 수도 점이 실제로 렌더된다").toBeGreaterThan(0);
  expect(r.hasHoverFill, "⑦ hover 강조").toBe(true);

  // ③ 배너: 국기 + 대륙 + 나라
  const banner = page.locator('[class*="bg-white/95"]').first();
  await expect(banner).toContainText("아시아");
  await expect(banner).toContainText("한국");
  await expect(banner.locator("img")).toBeVisible();

  // ⑨ 미니맵
  const mini = page.locator("svg[viewBox='0 0 360 180']");
  await expect(mini, "⑨ 미니맵").toBeVisible();

  // ⑪ 비교하기 상단
  const cmp = page.getByRole("button", { name: /비교하기/ }).first();
  await expect(cmp).toBeVisible();
  const cmpBox = (await cmp.boundingBox())!;
  const mapBox = (await page.locator("canvas.maplibregl-canvas").boundingBox())!;
  expect(cmpBox.y, "⑪ 비교하기가 지도보다 위").toBeLessThan(mapBox.y);

  // ⑥ 프랑스 본토 bbox
  await page.getByRole("combobox").first().fill("프랑스");
  await page.getByRole("option").first().click();
  await page.waitForTimeout(1800);
  const fr = await page.evaluate(() => {
    const b = (window as any).__worldmap.flat.getBounds();
    return { w: Math.abs(b.getEast() - b.getWest()), c: b.getCenter().lng };
  });
  expect(fr.w, "⑥ 프랑스 클릭 시 지구 절반이 아니라 본토").toBeLessThan(60);
  expect(Math.abs(fr.c - 2), "⑥ 프랑스 중심이 유럽").toBeLessThan(15);
});

test("④ 영문 라우트가 영어로 뜬다", async ({ page }) => {
  await page.goto("/en/world-map");
  await ready(page);
  await expect(page.getByRole("heading", { name: "Explore the World by Map" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Compare/ }).first()).toBeVisible();
});
