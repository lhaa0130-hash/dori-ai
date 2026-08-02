import { test, expect, type Page } from "@playwright/test";

// 월드맵 E2E (명세서 §17.4). 실제 브라우저에서 지도를 조작하고 관찰한다.
//
// 지도 객체는 개발 빌드가 window.__worldmap 으로 노출한다(production 번들에는 없다).
// 캔버스 픽셀은 읽을 수 없으므로 카메라 상태와 렌더된 feature 로 검증한다.

const PATH = "/world-map";

// 사이트 공통 '오픈 팝업'(components/layout/OpenPopup)은 첫 방문마다 fixed inset-0 z-[9999] 로
// 화면 전체를 덮는다. E2E 는 매번 새 프로필이라 항상 뜨고, 그러면 지도가 마우스를 못 받는다.
// 실사용자가 한 번 닫으면 그 날은 안 뜨는 것과 같은 상태를 만들어 준다.
test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    window.localStorage.setItem("dori_open_popup_hide_until", tomorrow.toISOString());
  });
});

interface Cam { lng: number; lat: number; zoom: number }

async function waitForMaps(page: Page, sides: string[] = ["flat", "globe"]) {
  await page.waitForFunction(
    (want) => {
      const w = (window as any).__worldmap;
      if (!w) return false;
      return want.every((s: string) => w[s] && w[s].isStyleLoaded() && w[s].querySourceFeatures("countries").length > 0);
    },
    sides,
    { timeout: 60_000 },
  );
}

const cam = (page: Page, side: string): Promise<Cam> =>
  page.evaluate((s) => {
    const m = (window as any).__worldmap[s];
    const c = m.getCenter();
    return { lng: +c.lng.toFixed(4), lat: +c.lat.toFixed(4), zoom: +m.getZoom().toFixed(4) };
  }, side);

const featureCount = (page: Page, side: string): Promise<number> =>
  page.evaluate((s) => (window as any).__worldmap[s].querySourceFeatures("countries").length, side);

// ── 기본 렌더 ───────────────────────────────────────────────────
test("페이지가 열리고 두 지도가 실제로 그려진다", async ({ page }) => {
  await page.goto(PATH);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("지도로 만나는 세계");
  await waitForMaps(page);

  // 195개국 경계가 실제로 들어왔는지 (명세서 §21)
  expect(await featureCount(page, "flat")).toBeGreaterThanOrEqual(195);
  expect(await featureCount(page, "globe")).toBeGreaterThanOrEqual(195);

  const projections = await page.evaluate(() => {
    const w = (window as any).__worldmap;
    return {
      flat: w.flat.getStyle().projection?.type,
      globe: w.globe.getStyle().projection?.type,
    };
  });
  expect(projections.flat).toBe("mercator");
  expect(projections.globe).toBe("globe");
});

test("월드맵이 만드는 콘솔 오류가 없다", async ({ page }) => {
  const errors: string[] = [];
  const failedUrls: string[] = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("response", (r) => { if (r.status() >= 400) failedUrls.push(`${r.status()} ${r.url()}`); });

  await page.goto(PATH);
  await waitForMaps(page);

  // 월드맵이 쓰는 자원은 전부 정상이어야 한다
  const ourFailures = failedUrls.filter((u) => /worldmap|maplibre/.test(u));
  expect(ourFailures, `월드맵 자원 로드 실패:\n${ourFailures.join("\n")}`).toEqual([]);

  // 사이트 전역 스크립트(광고·분석)는 로컬 개발 환경에서 403 이 난다 — 월드맵과 무관하다.
  // 그 외의 오류와 예외는 하나도 없어야 한다.
  const real = errors.filter(
    (e) => !/HMR|sourcemap|favicon|React DevTools|Failed to load resource/i.test(e),
  );
  expect(real, `월드맵 콘솔 오류:\n${real.join("\n")}`).toEqual([]);

  // 무엇을 걸러냈는지 남겨 둔다(무시한 실패가 늘어나면 눈에 띄게)
  const ignored = failedUrls.filter((u) => !/worldmap|maplibre/.test(u));
  if (ignored.length) console.log(`[참고] 월드맵과 무관한 로드 실패 ${ignored.length}건:\n${ignored.join("\n")}`);
});

// ── 검색·선택 ───────────────────────────────────────────────────
test("검색으로 대한민국을 선택하면 상세가 뜬다", async ({ page }) => {
  await page.goto(PATH);
  await waitForMaps(page);

  const box = page.getByRole("combobox").first();
  await box.fill("한국");
  const option = page.getByRole("option").first();
  await expect(option).toBeVisible();
  await option.click();

  await expect(page.getByRole("heading", { level: 2 })).toContainText("한국");
  await expect(page.getByText("수도", { exact: true }).first()).toBeVisible();
  await expect(page).toHaveURL(/country=KOR/);
});

test("키보드만으로 검색·선택할 수 있다", async ({ page }) => {
  await page.goto(PATH);
  await waitForMaps(page);

  const box = page.getByRole("combobox").first();
  await box.click();
  await box.type("Fran");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");

  await expect(page).toHaveURL(/country=FRA/);
});

test("국가를 선택하면 양쪽 지도가 같이 이동한다", async ({ page }) => {
  await page.goto(PATH);
  await waitForMaps(page);

  await page.getByRole("combobox").first().fill("브라질");
  await page.getByRole("option").first().click();
  await page.waitForTimeout(1600);   // easeTo 완료 대기

  const flat = await cam(page, "flat");
  const globe = await cam(page, "globe");
  const where = `flat=${JSON.stringify(flat)} globe=${JSON.stringify(globe)}`;
  // 브라질 중심은 대략 경도 -54, 위도 -14
  expect(Math.abs(flat.lng - (-54)), where).toBeLessThan(12);
  expect(Math.abs(globe.lng - (-54)), where).toBeLessThan(12);
  expect(Math.abs(flat.lng - globe.lng)).toBeLessThan(1);
  expect(Math.abs(flat.zoom - globe.zoom)).toBeLessThan(0.2);
});

// ── 실시간 카메라 연동 (핵심 게이트, 명세서 §6.3) ────────────────
test("평면 지도를 드래그하면 지구본이 따라온다", async ({ page, viewport }) => {
  test.skip((viewport?.width ?? 0) < 500, "마우스 드래그 — 데스크톱 전용(모바일은 터치 팬 테스트가 따로 있다)");
  await page.goto(PATH);
  await waitForMaps(page);

  const before = await cam(page, "globe");
  const canvas = page.locator("canvas").first();
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  // 여러 단계로 끌어 '움직이는 동안' 따라오는지 본다 (moveend 만 맞추는 구현은 불합격)
  for (let i = 1; i <= 6; i++) {
    await page.mouse.move(box.x + box.width / 2 - i * 18, box.y + box.height / 2);
    await page.waitForTimeout(40);
  }
  const during = await cam(page, "globe");
  await page.mouse.up();

  expect(during.lng, "드래그 도중에 이미 따라와야 한다").not.toBeCloseTo(before.lng, 2);
  const after = await cam(page, "globe");
  const flatAfter = await cam(page, "flat");
  expect(Math.abs(after.lng - flatAfter.lng)).toBeLessThan(1);
});

test("지구본을 드래그하면 평면 지도가 따라온다", async ({ page, viewport }) => {
  test.skip((viewport?.width ?? 0) < 500, "마우스 드래그 — 데스크톱 전용");
  await page.goto(PATH);
  await waitForMaps(page);

  const before = await cam(page, "flat");
  const canvas = page.locator("canvas").nth(1);
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  for (let i = 1; i <= 6; i++) {
    await page.mouse.move(box.x + box.width / 2 + i * 18, box.y + box.height / 2);
    await page.waitForTimeout(40);
  }
  const during = await cam(page, "flat");
  await page.mouse.up();

  expect(during.lng).not.toBeCloseTo(before.lng, 2);
  const globeAfter = await cam(page, "globe");
  expect(Math.abs((await cam(page, "flat")).lng - globeAfter.lng)).toBeLessThan(1);
});

test("휠 확대가 양방향으로 연동된다", async ({ page, viewport }) => {
  test.skip((viewport?.width ?? 0) < 500, "휠 이벤트 — 데스크톱 전용");
  await page.goto(PATH);
  await waitForMaps(page);

  const flatCanvas = page.locator("canvas").first();
  const fb = (await flatCanvas.boundingBox())!;
  await page.mouse.move(fb.x + fb.width / 2, fb.y + fb.height / 2);
  await page.mouse.wheel(0, -400);
  await page.waitForTimeout(900);

  let f = await cam(page, "flat");
  let g = await cam(page, "globe");
  expect(f.zoom, "평면 지도가 확대돼야 한다").toBeGreaterThan(1.15);
  expect(Math.abs(f.zoom - g.zoom), "지구본 zoom 이 따라와야 한다").toBeLessThan(0.2);

  // 이번엔 지구본에서 축소
  const globeCanvas = page.locator("canvas").nth(1);
  const gb = (await globeCanvas.boundingBox())!;
  await page.mouse.move(gb.x + gb.width / 2, gb.y + gb.height / 2);
  await page.mouse.wheel(0, 400);
  await page.waitForTimeout(900);

  const f2 = await cam(page, "flat");
  const g2 = await cam(page, "globe");
  expect(g2.zoom).toBeLessThan(g.zoom);
  expect(Math.abs(f2.zoom - g2.zoom)).toBeLessThan(0.2);
});

test("반복 조작 후에도 떨림이나 무한 이벤트가 없다", async ({ page, viewport }) => {
  test.skip((viewport?.width ?? 0) < 500, "마우스 반복 조작 — 데스크톱 전용");
  await page.goto(PATH);
  await waitForMaps(page);

  const canvas = page.locator("canvas").first();
  const box = (await canvas.boundingBox())!;
  for (let round = 0; round < 4; round++) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 60, box.y + box.height / 2 + 30);
    await page.mouse.move(box.x + box.width / 2 - 60, box.y + box.height / 2 - 30);
    await page.mouse.up();
    await page.mouse.wheel(0, round % 2 === 0 ? -200 : 200);
  }
  // 조작을 멈춘 뒤 카메라가 스스로 계속 움직이면 이벤트가 왕복하고 있는 것이다
  await page.waitForTimeout(1200);
  const a = await cam(page, "flat");
  await page.waitForTimeout(900);
  const b = await cam(page, "flat");

  expect(a.lng, "정지 후 경도가 계속 변하면 이벤트 왕복이다").toBeCloseTo(b.lng, 4);
  expect(a.zoom).toBeCloseTo(b.zoom, 4);

  const ga = await cam(page, "globe");
  expect(Math.abs(ga.lng - b.lng)).toBeLessThan(1);
});

test("확대 중에도 선택 강조가 유지된다", async ({ page }) => {
  await page.goto(`${PATH}?country=KOR`);
  await waitForMaps(page);
  await page.waitForTimeout(1400);

  const highlighted = () =>
    page.evaluate(() => {
      const m = (window as any).__worldmap.flat;
      const f = m.getFilter("country-selected");
      return JSON.stringify(f);
    });

  const before = await highlighted();
  expect(before).toContain("KOR");

  const canvas = page.locator("canvas").first();
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.wheel(0, -300);
  await page.waitForTimeout(700);

  expect(await highlighted()).toContain("KOR");
});

// ── 비교 (§7.5) ────────────────────────────────────────────────
test("두 국가를 비교하고 교환·초기화할 수 있다", async ({ page }) => {
  await page.goto(`${PATH}?country=KOR`);
  await waitForMaps(page);

  await page.getByRole("button", { name: "비교", exact: true }).click();
  const compareBox = page.getByRole("combobox").last();
  await compareBox.fill("일본");
  await page.getByRole("option").first().click();

  await expect(page).toHaveURL(/compare=JPN/);
  await expect(page.getByText("A · 선택 국가")).toBeVisible();
  await expect(page.getByText("B · 비교 국가")).toBeVisible();

  await page.getByRole("button", { name: "A/B 교환" }).click();
  await expect(page).toHaveURL(/country=JPN/);
  await expect(page).toHaveURL(/compare=KOR/);

  await page.getByRole("button", { name: "비교 초기화" }).click();
  await expect(page).not.toHaveURL(/compare=/);
});

test("같은 국가를 A·B 로 지정할 수 없다", async ({ page }) => {
  await page.goto(`${PATH}?country=KOR&compare=KOR`);
  await waitForMaps(page);
  await expect(page).not.toHaveURL(/compare=KOR/);
  await expect(page).toHaveURL(/country=KOR/);
});

// ── 다국어·URL (§8.3 · §13) ────────────────────────────────────
test("한국어·영어를 전환한다", async ({ page }) => {
  await page.goto(PATH);
  await waitForMaps(page);
  await page.getByRole("button", { name: "English" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Explore the World by Map");
  await expect(page).toHaveURL(/lang=en/);
});

test("URL 을 새로 열어도 선택·비교 상태가 복원된다", async ({ page }) => {
  await page.goto(`${PATH}?country=KOR&compare=JPN&lang=en&view=flat`);
  await waitForMaps(page, ["flat"]);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Explore the World by Map");
  await expect(page.getByText("A · Selected")).toBeVisible();
  await expect(page.getByText("B · Comparison")).toBeVisible();
  // view=flat 이면 지구본 캔버스는 없다
  expect(await page.locator("canvas").count()).toBe(1);
});

test("잘못된 URL 파라미터는 조용히 무시한다", async ({ page }) => {
  await page.goto(`${PATH}?country=ZZZ&compare=1234&lang=fr&view=hologram`);
  await waitForMaps(page);
  await expect(page.getByText("지도에서 국가를 선택하거나 검색해 보세요.")).toBeVisible();
  expect(await page.locator("canvas").count()).toBe(2);
});

// ── 데이터 표시 (§0.17) ────────────────────────────────────────
test("자료가 없으면 0 이 아니라 '자료 없음' 으로 보인다", async ({ page }) => {
  await page.goto(PATH);
  await waitForMaps(page);

  // 공식 종교가 없는 나라(대다수)를 하나 열어 확인한다
  await page.getByRole("combobox").first().fill("한국");
  await page.getByRole("option").first().click();

  // 상세 패널은 aria-label 이 국가명인 section 이다
  const detail = page.getByRole("region", { name: "한국" });
  await expect(detail).toBeVisible();
  await expect(detail).toContainText("자료 없음");
  // 숫자 지표에는 기준연도가 붙는다
  await expect(page.getByText(/기준 20\d\d/).first()).toBeVisible();
});

test("GDP 는 명목·현재 달러임을 표시한다", async ({ page }) => {
  await page.goto(`${PATH}?country=KOR`);
  await waitForMaps(page);
  await expect(page.getByText("명목 · 현재 미국 달러").first()).toBeVisible();
});

// ── 모바일 (§7.2 · §17.4) ──────────────────────────────────────
test("모바일 터치로 지도를 밀면 다른 지도가 따라온다", async ({ page, viewport }) => {
  test.skip((viewport?.width ?? 0) > 500, "터치 전용");
  await page.goto(PATH);
  await waitForMaps(page);

  const before = await cam(page, "globe");

  // Playwright 의 mouse 는 터치 기기에서 지도를 움직이지 못한다.
  // MapLibre 가 실제로 듣는 touchstart/move/end 를 직접 쏜다.
  await page.evaluate(async () => {
    const target = (window as any).__worldmap.flat.getCanvasContainer() as HTMLElement;
    const r = target.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const touch = (x: number, y: number) =>
      new Touch({ identifier: 1, target, clientX: x, clientY: y, pageX: x, pageY: y });
    const fire = (type: string, x: number, y: number) => {
      const t = touch(x, y);
      target.dispatchEvent(
        new TouchEvent(type, {
          touches: type === "touchend" ? [] : [t],
          targetTouches: type === "touchend" ? [] : [t],
          changedTouches: [t],
          bubbles: true, cancelable: true,
        }),
      );
    };
    fire("touchstart", cx, cy);
    for (let i = 1; i <= 6; i++) {
      fire("touchmove", cx - i * 14, cy);
      await new Promise((res) => requestAnimationFrame(() => res(null)));
    }
    fire("touchend", cx - 84, cy);
  });
  await page.waitForTimeout(500);

  const after = await cam(page, "globe");
  const flatAfter = await cam(page, "flat");
  expect(after.lng, "터치 팬으로도 지구본이 따라와야 한다").not.toBeCloseTo(before.lng, 2);
  expect(Math.abs(after.lng - flatAfter.lng)).toBeLessThan(1);
});

test("360px 에서 가로 스크롤이 생기지 않는다", async ({ page, viewport }) => {
  test.skip((viewport?.width ?? 0) > 500, "모바일 viewport 전용");
  await page.goto(PATH);
  await waitForMaps(page);

  const overflow = await page.evaluate(() => ({
    doc: document.documentElement.scrollWidth,
    win: window.innerWidth,
  }));
  expect(overflow.doc, `scrollWidth=${overflow.doc} innerWidth=${overflow.win}`).toBeLessThanOrEqual(overflow.win + 1);
});

test("모바일에서 평면 지도/지구본 탭을 전환한다", async ({ page, viewport }) => {
  test.skip((viewport?.width ?? 0) > 500, "모바일 viewport 전용");
  await page.goto(PATH);
  await waitForMaps(page);

  await page.getByRole("button", { name: "지구본", exact: true }).click();
  await expect(page).toHaveURL(/view=globe/);
  expect(await page.locator("canvas").count()).toBe(1);

  await page.getByRole("button", { name: "평면 지도", exact: true }).click();
  await expect(page).toHaveURL(/view=flat/);
  expect(await page.locator("canvas").count()).toBe(1);

  // 탭을 바꿔도 지도가 실제로 다시 그려져야 한다(숨은 컨테이너는 폭이 0 이라 놓치기 쉽다)
  const size = await page.evaluate(() => {
    const c = document.querySelector("canvas") as HTMLCanvasElement;
    const r = c.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height) };
  });
  expect(size.w).toBeGreaterThan(200);
  expect(size.h).toBeGreaterThan(200);
});

test("모바일에서 검색·상세·비교가 동작한다", async ({ page, viewport }) => {
  test.skip((viewport?.width ?? 0) > 500, "모바일 viewport 전용");
  await page.goto(`${PATH}?view=flat`);
  await waitForMaps(page, ["flat"]);

  await page.getByRole("combobox").first().fill("일본");
  await page.getByRole("option").first().click();
  await expect(page.getByRole("heading", { level: 2 })).toContainText("일본");

  await page.getByRole("button", { name: "비교", exact: true }).click();
  await page.getByRole("combobox").last().fill("한국");
  await page.getByRole("option").first().click();
  await expect(page).toHaveURL(/compare=KOR/);
});

// ── 대륙 필터 (§8.2) ───────────────────────────────────────────
test("대륙 필터는 지도에서 국가를 지우지 않고 흐리게만 한다", async ({ page }) => {
  await page.goto(PATH);
  await waitForMaps(page);
  const before = await featureCount(page, "flat");

  await page.getByRole("button", { name: "유럽", exact: true }).click();
  await page.waitForTimeout(600);

  expect(await featureCount(page, "flat"), "필터로 feature 를 제거하면 안 된다").toBe(before);
  const opacity = await page.evaluate(() =>
    JSON.stringify((window as any).__worldmap.flat.getPaintProperty("country-fill", "fill-opacity")),
  );
  expect(opacity).toContain("0.25");
});
