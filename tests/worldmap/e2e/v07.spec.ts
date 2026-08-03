import { test, expect } from "@playwright/test";

// 지시서 07 — 한국어 조사·정식 국가명·별칭 검색
async function ready(page: import("@playwright/test").Page) {
  await page.waitForFunction(() => {
    const w = (window as any).__worldmap;
    return w?.flat?.isStyleLoaded() && w.flat.querySourceFeatures("countries").length > 0;
  }, undefined, { timeout: 60_000 });
  await page.waitForTimeout(1200);
}

test("대한민국 설명의 이웃 문장이 올바르다", async ({ page }) => {
  await page.goto("/world-map?country=KOR");
  await ready(page);
  const detail = page.getByRole("region", { name: "대한민국" });
  await expect(detail).toBeVisible();
  const text = (await detail.innerText()).replace(/\s+/g, " ");
  expect(text, "잘못된 조사").not.toContain("북한와");
  expect(text).toContain("조선민주주의인민공화국과 국경을 맞대고 있어요");
});

test("정식 국가명이 제목에 쓰인다", async ({ page }) => {
  await page.goto("/world-map?country=PRK");
  await ready(page);
  await expect(page.getByRole("heading", { level: 2 })).toContainText("조선민주주의인민공화국");
});

test("'한국'·'북한' 별칭으로 계속 검색된다", async ({ page }) => {
  await page.goto("/world-map");
  await ready(page);
  const box = page.getByRole("combobox").first();

  await box.fill("한국");
  await expect(page.getByRole("option").first()).toContainText("대한민국");
  await page.getByRole("option").first().click();
  await expect(page).toHaveURL(/country=KOR/);

  await box.fill("북한");
  await expect(page.getByRole("option").first()).toContainText("조선민주주의인민공화국");
});

test("랭킹 문장에 '인구은'·'GDP이' 같은 오류가 없다", async ({ page }) => {
  for (const metric of ["population", "gdp"]) {
    await page.goto(`/world-map?view=ranking&metric=${metric}&country=TUV`);
    await ready(page);
    const panel = page.getByRole("region", { name: "세계 랭킹" });
    const text = (await panel.innerText()).replace(/\s+/g, " ");
    for (const bad of ["인구은", "인구이 ", "GDP은", "GDP이 ", "은(는)", "이(가)", "을(를)"]) {
      expect(text, `잘못된 조사: ${bad}`).not.toContain(bad);
    }
  }
});
