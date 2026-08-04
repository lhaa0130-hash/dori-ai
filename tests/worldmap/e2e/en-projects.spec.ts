// 영문 프로젝트 목록에 나라콕이 나오는지 (사용자 요청).
//
// ⚠️ 이 페이지는 EN 오버레이에 항목이 없는 프로젝트를 `return null` 로 조용히 버린다.
//    그래서 "데이터에 있으니 보이겠지" 로 판단하면 안 된다. 실제 화면에서 센다.

import { test, expect } from "@playwright/test";

test("영문 프로젝트 목록에 NARAKOK 이 있고 영문 지도로 간다", async ({ page }) => {
  await page.goto("/en/projects");
  await page.waitForLoadState("networkidle");

  const card = page.locator("h2", { hasText: "NARAKOK" });
  await expect(card, "영문 프로젝트 목록에 NARAKOK 이 없다").toHaveCount(1);

  const body = (await page.locator("body").innerText()).replace(/\s+/g, " ");
  expect(body, "설명이 영어가 아니다").toContain("Tap a country on the map");
  expect(body, "한글이 섞였다").not.toMatch(/나라콕|지도 열기|대륙 색으로/);

  // 영어로 읽던 사람이 한글 지도에 떨어지면 안 된다.
  const link = page.locator('a[href="/en/world-map"]');
  await expect(link, "영문 지도로 가는 링크가 없다").toHaveCount(1);
  await expect(page.locator('a[href="/world-map"]'), "한글 지도로 가는 링크가 남아 있다").toHaveCount(0);
});

test("기존 프로젝트 카드가 사라지지 않았다", async ({ page }) => {
  await page.goto("/en/projects");
  await page.waitForLoadState("networkidle");
  const body = await page.locator("body").innerText();
  expect(body).toContain("Architecture Assistant");
  expect(body).toContain("Family Hub");
});
