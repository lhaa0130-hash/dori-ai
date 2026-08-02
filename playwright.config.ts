import { defineConfig, devices } from "@playwright/test";

// 월드맵 E2E (명세서 §17.4). 데스크톱과 모바일 viewport 둘 다 돌린다.
//
// WebGL: headless Chromium 은 기본적으로 GPU 가 없어 MapLibre 가 뜨지 않는다.
// SwiftShader(소프트웨어 래스터라이저)를 명시적으로 켜야 실제 지도가 그려진다.
const GL_ARGS = [
  "--enable-unsafe-swiftshader",
  "--use-gl=angle",
  "--use-angle=swiftshader",
  "--enable-webgl",
  "--ignore-gpu-blocklist",
];

export default defineConfig({
  testDir: "./tests/worldmap/e2e",
  timeout: 90_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,          // 지도 렌더는 CPU 를 많이 써서 병렬로 돌리면 불안정하다
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.WORLDMAP_BASE_URL ?? "http://localhost:3100",
    launchOptions: { args: GL_ARGS },
    // 실패했을 때 무엇을 봤는지 남긴다
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 }, launchOptions: { args: GL_ARGS } } },
    { name: "mobile", use: { ...devices["Pixel 5"], viewport: { width: 360, height: 780 }, launchOptions: { args: GL_ARGS } } },
  ],
});
