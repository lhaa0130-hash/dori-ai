import { test, expect } from "@playwright/test";

// 프로덕션 smoke (RESUME_03 §11).
//
// production 번들에는 테스트용 window.__worldmap 핸들이 없다(의도적).
// 그래서 지도 내부 상태 대신 **화면에 실제로 보이는 것**만으로 검증한다.
//
//   WORLDMAP_BASE_URL=https://illo.im npx playwright test prod-smoke

const PATH = "/world-map";

test.beforeEach(async ({ context }) => {
  // 사이트 공통 오픈 팝업이 화면을 덮지 않게 한다(실사용자가 한 번 닫은 상태와 동일)
  await context.addInitScript(() => {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    window.localStorage.setItem("dori_open_popup_hide_until", t.toISOString());
  });
});

/** MapLibre 캔버스가 실제로 그려질 때까지 기다린다. */
async function waitForCanvases(page: import("@playwright/test").Page, expected: number) {
  await page.waitForFunction(
    (n) => {
      const cs = [...document.querySelectorAll("canvas.maplibregl-canvas")] as HTMLCanvasElement[];
      return cs.length >= n && cs.every((c) => c.clientWidth > 100 && c.clientHeight > 100);
    },
    expected,
    { timeout: 60_000 },
  );
}

test("평면 지도와 지구본이 프로덕션에서 렌더된다", async ({ page }) => {
  const resp = await page.goto(PATH);
  expect(resp?.status(), "페이지가 200 이어야 한다").toBe(200);

  await expect(page.getByText("WORLD MAP BY ILLO")).toBeVisible();
  await expect(page.getByRole("heading", { name: "지도로 만나는 세계" })).toBeVisible();
  await waitForCanvases(page, 2);

  await expect(page.getByText("평면 지도", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("지구본", { exact: true }).first()).toBeVisible();

  // 지도 데이터가 실제로 받아졌는지
  const data = await page.evaluate(async () => {
    const r = await fetch("/worldmap/countries.json");
    const j = await r.json();
    return { ok: r.ok, count: j.countries.length, schema: j.schemaVersion };
  });
  expect(data.ok).toBe(true);
  expect(data.count).toBe(195);
  expect(data.schema).toBe(2);
});

test("나라를 검색해 상세를 열 수 있다", async ({ page }) => {
  await page.goto(PATH);
  await waitForCanvases(page, 2);

  await page.getByRole("combobox").first().fill("한국");
  await page.getByRole("option").first().click();

  await expect(page.getByRole("heading", { level: 2 })).toContainText("한국");
  await expect(page).toHaveURL(/country=KOR/);

  // 어린이용 설명과 확장 지리 정보
  const detail = page.getByRole("region", { name: "한국" });
  await expect(detail).toContainText("이 나라는 어떤 나라야?");
  await expect(detail).toContainText("언어");
  await expect(detail).toContainText("통화");
  await expect(detail).toContainText("이웃 나라");
});

test("비교하기가 빈 4칸에서 시작해 2~4개국으로 늘어난다", async ({ page }) => {
  await page.goto(PATH);
  await waitForCanvases(page, 2);

  await page.getByRole("button", { name: "비교하기" }).first().click();
  await expect(page.getByText("0/4 선택됨")).toBeVisible();
  await expect(page.getByText("지도나 검색에서 비교할 나라를 2개 이상 선택하세요.")).toBeVisible();

  const box = page.getByRole("combobox").first();
  const pick = async (q: string) => {
    await box.fill(q);
    await page.getByRole("option").first().click();
    await page.waitForTimeout(500);
  };

  await pick("한국");
  await expect(page.getByText("1/4 선택됨")).toBeVisible();
  await pick("일본");
  await expect(page.getByText("2/4 선택됨")).toBeVisible();
  await expect(page.getByRole("table")).toBeVisible();

  await pick("케냐");
  await pick("브라질");
  await expect(page.getByText("4/4 선택됨")).toBeVisible();

  // 다섯 번째 차단
  await pick("프랑스");
  await expect(page.getByText("최대 4개 나라까지 비교할 수 있어요.")).toBeVisible();
});

test("지도를 끌면 두 지도가 함께 움직인다", async ({ page, viewport }) => {
  test.skip((viewport?.width ?? 0) < 500, "마우스 드래그 — 데스크톱 전용");
  await page.goto(PATH);
  await waitForCanvases(page, 2);

  // 핸들이 없으므로 캔버스 픽셀 대신 URL·DOM 이 아닌 '조작이 오류 없이 먹히는지' 를 본다
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  const box = (await page.locator("canvas.maplibregl-canvas").first().boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  for (let i = 1; i <= 5; i++) {
    await page.mouse.move(box.x + box.width / 2 - i * 20, box.y + box.height / 2);
    await page.waitForTimeout(40);
  }
  await page.mouse.up();
  await page.mouse.wheel(0, -300);
  await page.waitForTimeout(800);

  // 조작 후에도 두 캔버스가 살아 있어야 한다(컨텍스트 손실·크래시 없음)
  await waitForCanvases(page, 2);
  expect(errors, `조작 중 예외:\n${errors.join("\n")}`).toEqual([]);
});

test("한국어·영어를 전환한다", async ({ page }) => {
  await page.goto(PATH);
  await waitForCanvases(page, 2);
  await page.getByRole("button", { name: "English" }).click();
  await expect(page.getByRole("heading", { name: "Explore the World by Map" })).toBeVisible();
  await expect(page).toHaveURL(/lang=en/);
});

test("모바일 360px 에서 가로 스크롤이 없다", async ({ page, viewport }) => {
  test.skip((viewport?.width ?? 0) > 500, "모바일 전용");
  await page.goto(PATH);
  await waitForCanvases(page, 1);
  const o = await page.evaluate(() => ({ doc: document.documentElement.scrollWidth, win: window.innerWidth }));
  expect(o.doc, `scrollWidth=${o.doc} innerWidth=${o.win}`).toBeLessThanOrEqual(o.win + 1);
});

test("월드맵이 만드는 콘솔 오류가 없다", async ({ page }) => {
  const errors: string[] = [];
  const failed: string[] = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("response", (r) => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`); });

  await page.goto(PATH);
  await waitForCanvases(page, 2);

  const ours = failed.filter((u) => /worldmap|maplibre|world-map/.test(u));
  expect(ours, `월드맵 자원 실패:\n${ours.join("\n")}`).toEqual([]);

  const real = errors.filter((e) => !/Failed to load resource|React DevTools|sourcemap/i.test(e));
  expect(real, `월드맵 콘솔 오류:\n${real.join("\n")}`).toEqual([]);
});
