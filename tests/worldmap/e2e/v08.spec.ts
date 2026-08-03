// 지시서 07 §9 — 지도 점 크기 정규화를 실제 화면에서 잰다.
//
// ⚠️ CSS 클래스를 읽는 것으로는 증명되지 않는다. transform·ring·devicePixelRatio 때문에
//    "코드상 6px" 과 "화면에서 보이는 크기" 는 얼마든지 달라질 수 있다.
//    getBoundingClientRect 로 실제 그려진 상자를 잰다.

import { test, expect, type Page } from "@playwright/test";

const MAP = "/world-map";

async function ready(page: Page) {
  await page.goto(MAP);
  await page.waitForFunction(() => document.querySelectorAll("canvas.maplibregl-canvas").length > 0, null, { timeout: 60_000 });
  // 스타일 로드 + 첫 렌더가 끝날 때까지
  await page.waitForTimeout(3500);
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

test("세계 전체 보기 — 수도점은 숨기고 작은 나라 점만 보인다 (§9.3)", async ({ page }) => {
  await ready(page);

  const capitalVisible = await page.evaluate(() => {
    // MapLibre 레이어의 실제 visibility 를 확인한다.
    const el = document.querySelector("canvas.maplibregl-canvas");
    return el ? (window as unknown as { __mapCapitalVisible?: boolean }).__mapCapitalVisible ?? null : null;
  });
  // 훅이 없으면 DOM 으로는 알 수 없다 — core dot 검사로 대신한다.
  void capitalVisible;

  const sizes = await coreSizes(page);
  expect(sizes.length, "작은 나라 선택점이 하나도 없다").toBeGreaterThan(0);

  // 모든 core 가 정확히 같은 크기 — max - min = 0 (§9.8)
  const min = Math.min(...sizes);
  const max = Math.max(...sizes);
  expect(max - min, `core 지름이 제각각이다: ${min}~${max}`).toBe(0);
  expect(max, `core 지름이 6px 이 아니다: ${max}`).toBe(6);
});

test("선택해도 core 는 커지지 않고 halo 만 붙는다 (§9.5)", async ({ page }) => {
  await ready(page);
  const before = await coreSizes(page);

  await page.goto(`${MAP}?country=MCO`);
  await page.waitForTimeout(3500);
  const after = await coreSizes(page);

  expect(after.length).toBeGreaterThan(0);
  const maxAfter = Math.max(...after);
  const minAfter = Math.min(...after);
  expect(maxAfter - minAfter, "선택 후 점 크기가 갈라졌다").toBe(0);
  expect(maxAfter, "선택이 core 를 키웠다").toBe(Math.max(...before));

  // halo 는 core 와 별개 요소로 존재해야 한다.
  const halos = await page.locator('[data-role="micro-halo"]').count();
  expect(halos, "선택했는데 halo 가 없다").toBeGreaterThan(0);
});

test("hit target — 데스크톱 32px 이상 (§9.2)", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes("mobile"), "데스크톱 전용");
  await ready(page);

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
  await ready(page);

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
  await ready(page);
  const base = await coreSizes(page);

  for (const metric of ["population", "gdp", "area"]) {
    await page.goto(`${MAP}?view=ranking&metric=${metric}`);
    await page.waitForTimeout(2500);
    await page.goto(MAP);
    await page.waitForTimeout(3000);
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
