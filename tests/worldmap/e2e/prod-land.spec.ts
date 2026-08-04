// 프로덕션에서 195개국 밖 육지가 실제로 그려지는지.
// 파일이 올라간 것과 지도에 그려지는 것은 다르다 — 레이어 순서나 소스 이름이 틀리면
// 파일은 200 인데 화면은 그대로 비어 있다.

import { test, expect } from "@playwright/test";

const BASE = "https://illo.im";

test("프로덕션 — 그린란드·서사하라 자리에 육지가 있다", async ({ page }) => {
  await page.goto(`${BASE}/world-map`);
  await page.waitForFunction(() => document.querySelectorAll("canvas.maplibregl-canvas").length > 0, null, { timeout: 60_000 });
  await page.waitForTimeout(6000);

  for (const [name, lon, lat] of // ⚠️ 좌표를 눈대중으로 고르면 안 된다. 우리 모로코 폴리곤이 서사하라 북부를
    //    이미 포함해서 (-13, 24.5) 는 모로코로 잡힌다. other-land 만 있는 지점을 쓴다.
    [["그린란드", -42, 72], ["서사하라", -13.5, 23.5], ["대만", 121, 23.7],
     ["뉴칼레도니아", 165.5, -21.3], ["포클랜드", -59, -51.7]] as const) {
    await page.evaluate(([lo, la]) =>
      (window as never as { __wmMap: { jumpTo(o: unknown): void } }).__wmMap.jumpTo({ center: [lo, la], zoom: 4 }), [lon, lat]);
    await page.waitForTimeout(2000);

    const hit = await page.evaluate(([lo, la]) => {
      const w = window as unknown as {
        __wmMap?: { project(c: [number, number]): { x: number; y: number }; queryRenderedFeatures(p: unknown, o?: unknown): unknown[] };
      };
      if (!w.__wmMap) return -1;
      const p = w.__wmMap.project([lo as number, la as number]);
      return w.__wmMap.queryRenderedFeatures(p as never, { layers: ["other-land-fill"] } as never).length;
    }, [lon, lat]);

    expect(hit, `${name} 자리가 라이브에서 여전히 비어 있다`).toBeGreaterThan(0);
  }
});
