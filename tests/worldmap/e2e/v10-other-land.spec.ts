// 195개국이 아닌 육지도 지도에 그려지는지.
//
// 세계지도인데 육지가 빠지면 지도가 틀린 것이다. 그린란드가 통째로 비어
// 북대서양이 바다처럼 보였고, 모로코와 모리타니 사이(서사하라)도 하얗게 뚫려 있었다.
//
// ⚠️ 다만 이 땅들은 '나라' 가 아니다. 클릭·검색·랭킹·비교에 들어가면 195개국 계약이 깨진다.
//    보이기만 하고 나머지 기능에서는 빠져야 한다 — 그 두 가지를 함께 검사한다.

import { test, expect, type Page } from "@playwright/test";

async function ready(page: Page, url = "/world-map") {
  await page.goto(url);
  await page.waitForFunction(() => document.querySelectorAll("canvas.maplibregl-canvas").length > 0, null, { timeout: 60_000 });
  await page.waitForTimeout(4000);
}

/** 그 좌표에 우리가 그린 육지가 있는지 — MapLibre 에 직접 묻는다. */
async function landAt(page: Page, lon: number, lat: number) {
  return page.evaluate(([lo, la]) => {
    const w = window as unknown as {
      __wmMap?: { project(c: [number, number]): { x: number; y: number }; queryRenderedFeatures(p: unknown, o?: unknown): unknown[] };
    };
    if (!w.__wmMap) return { other: 0, country: 0 };
    const p = w.__wmMap.project([lo as number, la as number]);
    return {
      other: w.__wmMap.queryRenderedFeatures(p as never, { layers: ["other-land-fill"] } as never).length,
      country: w.__wmMap.queryRenderedFeatures(p as never, { layers: ["country-fill"] } as never).length,
    };
  }, [lon, lat]);
}

test("그린란드·서사하라·대만 자리에 육지가 그려진다", async ({ page }) => {
  await ready(page);

  const places: Array<[string, number, number]> = [
    ["그린란드", -42, 72],
    ["서사하라", -13, 24.5],
    ["대만", 121, 23.7],
    ["뉴칼레도니아", 165.5, -21.3],
    ["코소보", 20.9, 42.6],
  ];

  for (const [name, lon, lat] of places) {
    // 화면 안에 들어와야 queryRenderedFeatures 가 잡는다.
    await page.evaluate(([lo, la]) => (window as never as { __wmMap: { jumpTo(o: unknown): void } }).__wmMap.jumpTo({ center: [lo, la], zoom: 4 }), [lon, lat]);
    await page.waitForTimeout(1600);
    const hit = await landAt(page, lon, lat);
    expect(hit.other + hit.country, `${name} 자리가 비어 있다 — 바다로 보인다`).toBeGreaterThan(0);
  }
});

test("195개국 밖 육지는 눌러도 나라가 선택되지 않는다", async ({ page }) => {
  await ready(page);
  // 그린란드 한가운데로 이동해 정중앙을 누른다.
  await page.evaluate(() => (window as never as { __wmMap: { jumpTo(o: unknown): void } }).__wmMap.jumpTo({ center: [-42, 72], zoom: 4 }));
  await page.waitForTimeout(1800);

  const before = page.url();
  const box = page.locator("canvas.maplibregl-canvas").first();
  const bb = await box.boundingBox();
  if (bb) await page.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2);
  await page.waitForTimeout(1500);

  // 나라가 아니므로 country 선택 상태가 생기면 안 된다.
  expect(page.url(), "195개국 밖 땅을 눌렀는데 나라가 선택됐다").toBe(before);
});

test("195개국 계약이 그대로다 — 검색·랭킹에 들어가지 않는다", async ({ page }) => {
  await ready(page);
  const search = page.locator('input[type="text"], input[type="search"]').first();
  for (const q of ["그린란드", "서사하라", "대만"]) {
    await search.fill(q);
    await page.waitForTimeout(700);
    const body = (await page.locator("body").innerText()).replace(/\s+/g, " ");
    // 입력한 글자는 화면에 남지만, 국가 결과로 잡히면 안 된다.
    expect(body, `${q} 가 국가 검색 결과에 나왔다`).not.toMatch(new RegExp(`${q}\\s*·\\s*[A-Z]{3}`));
  }

  const res = await page.request.get("/worldmap/countries.json");
  const data = await res.json();
  expect(data.countries.length, "195개국 계약이 바뀌었다").toBe(195);
});
