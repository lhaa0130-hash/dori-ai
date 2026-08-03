import { test, expect } from "@playwright/test";

// 지시서 05 배포 1 — 하단 공간 · 작은 섬나라 카메라 · 환영 팝업
// ⚠️ 팝업을 미리 끄지 않는다. 월드맵에서 팝업이 안 뜨는지가 검증 대상이다.

async function ready(page: import("@playwright/test").Page) {
  await page.waitForFunction(() => {
    const w = (window as any).__worldmap;
    return w?.flat?.isStyleLoaded() && w.flat.querySourceFeatures("countries").length > 0;
  }, undefined, { timeout: 60_000 });
  await page.waitForTimeout(1800);
}

test("환영 팝업이 월드맵을 가리지 않는다", async ({ page }) => {
  await page.goto("/world-map");
  await ready(page);
  // 화면을 덮는 z-9999 오버레이가 없어야 한다
  const covering = await page.evaluate(() => {
    const box = document.querySelector("canvas.maplibregl-canvas")!.getBoundingClientRect();
    const stack = (document as any).elementsFromPoint(box.x + box.width / 2, box.y + box.height / 2) as Element[];
    const top = stack[0];
    return { tag: top.tagName, cls: String(top.className).slice(0, 60) };
  });
  expect(covering.cls, `지도 위를 덮는 요소: ${JSON.stringify(covering)}`).not.toContain("z-[9999]");
});

test("영어 경로에서도 팝업이 지도를 가리지 않는다", async ({ page }) => {
  await page.goto("/en/world-map");
  await ready(page);
  const blocked = await page.evaluate(() =>
    [...document.querySelectorAll("div")].some((d) => (d.className || "").includes("z-[9999]") && (d.className || "").includes("inset-0")),
  );
  expect(blocked, "영어 경로 팝업").toBe(false);
});

test("통가를 골라도 바다만 보이지 않는다", async ({ page }) => {
  await page.goto("/world-map?country=TON");
  await ready(page);
  const cam = await page.evaluate(() => {
    const m = (window as any).__worldmap.flat;
    const c = m.getCenter();
    return { zoom: m.getZoom(), lng: c.lng, lat: c.lat, rendered: m.queryRenderedFeatures({ layers: ["country-fill"] }).length };
  });
  expect(cam.zoom, `통가 zoom ${cam.zoom}`).toBeLessThanOrEqual(5.7);
  expect(Math.abs(cam.lng - (-175)), `통가 경도 ${cam.lng}`).toBeLessThan(6);
  expect(cam.rendered, "화면에 육지가 보여야 한다").toBeGreaterThan(0);
});

test("피지 — 날짜변경선 도서국도 정상 이동한다", async ({ page }) => {
  await page.goto("/world-map?country=FJI");
  await ready(page);
  const cam = await page.evaluate(() => {
    const m = (window as any).__worldmap.flat;
    return { zoom: m.getZoom(), lng: m.getCenter().lng };
  });
  // 피지는 약 177E ~ 178W. 세계 전체로 축소되면 zoom 이 1 이하로 떨어진다.
  expect(cam.zoom, `피지 zoom ${cam.zoom} — 세계 전체로 축소되면 안 된다`).toBeGreaterThan(2.5);
  expect(Math.abs(Math.abs(cam.lng) - 178), `피지 경도 ${cam.lng}`).toBeLessThan(6);
});

test("지도 높이가 상태에 따라 달라진다", async ({ page, viewport }) => {
  // 모바일은 지시서대로 상태와 무관하게 하나의 높이를 쓴다(§1).
  test.skip((viewport?.width ?? 0) < 500, "데스크톱 전용");
  await page.goto("/world-map");
  await ready(page);
  const explore = (await page.locator("canvas.maplibregl-canvas").first().boundingBox())!.height;

  await page.goto("/world-map?country=KOR");
  await ready(page);
  const selected = (await page.locator("canvas.maplibregl-canvas").first().boundingBox())!.height;

  expect(selected, `전체 ${explore} vs 선택 ${selected}`).toBeLessThan(explore);
  expect(selected).toBeGreaterThan(300);
});

test("지도 아래에 큰 빈 공간이 남지 않는다", async ({ page }) => {
  await page.goto("/world-map?country=KOR");
  await ready(page);
  const gap = await page.evaluate(() => {
    const cv = document.querySelector("canvas.maplibregl-canvas")!.getBoundingClientRect();
    const detail = document.querySelector("section[aria-label]")?.getBoundingClientRect();
    return detail ? Math.round(detail.top - cv.bottom) : -1;
  });
  expect(gap, `지도 하단 ~ 상세 시작 간격 ${gap}px`).toBeLessThan(120);
  expect(gap).toBeGreaterThanOrEqual(0);
});
