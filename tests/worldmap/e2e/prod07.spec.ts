// 프로덕션 smoke (지시서 07 §11). HTTP 200 은 아무것도 증명하지 않는다 — 실제 렌더 내용을 본다.
import { test, expect } from "@playwright/test";

const BASE = "https://illo.im";

test("프로덕션 — 대한민국 상세 표기 (§6 · §2)", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes("mobile"), "한 번이면 충분");
  await page.goto(`${BASE}/world-map?country=KOR`);
  await page.waitForFunction(() => document.querySelectorAll("canvas.maplibregl-canvas").length > 0, null, { timeout: 60_000 });
  await page.waitForTimeout(5000);
  const body = (await page.locator("body").innerText()).replace(/\s+/g, " ");

  expect(body).toContain("대한민국");
  expect(body, "이웃 문장 조사 오류").not.toMatch(/북한와/);
  expect(body, "인구 표기 소수점").not.toMatch(/\d+\.\d+만 명/);
  expect(body).toMatch(/세계 \d+위 \/ \d+개국/);
  expect(body).toMatch(/2\d{3}년 기준/);
  expect(body).toContain("대한민국 원(₩, KRW)");
  expect(body).toContain("한국 표준시 · UTC+09:00");
  expect(body, "괄호 조사").not.toMatch(/은\(는\)|이\(가\)|을\(를\)/);
});

test("프로덕션 — 랭킹 문장 조사 (§4)", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes("mobile"), "한 번이면 충분");
  for (const m of ["population", "gdp"]) {
    await page.goto(`${BASE}/world-map?view=ranking&metric=${m}&country=KOR`);
    await page.waitForTimeout(4000);
    const body = (await page.locator("body").innerText()).replace(/\s+/g, " ");
    expect(body, `${m} 랭킹 조사 오류`).not.toMatch(/인구은|인구이 |GDP은|GDP이 /);
  }
});

test("프로덕션 — 조선민주주의인민공화국 정식명 (§5)", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes("mobile"), "한 번이면 충분");
  await page.goto(`${BASE}/world-map?country=PRK`);
  await page.waitForTimeout(5000);
  const body = (await page.locator("body").innerText()).replace(/\s+/g, " ");
  expect(body).toContain("조선민주주의인민공화국");
});
