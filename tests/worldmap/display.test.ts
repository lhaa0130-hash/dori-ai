// 표기 통일 (지시서 07 §6).

import test from "node:test";
import assert from "node:assert/strict";
import { formatYear, formatWorldRank, formatCurrency, formatTimezone, formatTimezones } from "@/lib/worldmap/display";
import { koPopulation } from "@/lib/worldmap/format";

test("인구는 소수점 없이 만·억 단위로 끊는다", () => {
  assert.equal(koPopulation(51684564), "약 5,168만 명");
  assert.equal(koPopulation(1428627663), "약 14억 2,863만 명");
  assert.equal(koPopulation(9816), "약 9,816명");
  // '5168.46만 명' 이 원래 오류였다. 화면에 소수점이 나오면 안 된다.
  assert.ok(!koPopulation(51684564).includes("."));
});

test("연도·순위 표기", () => {
  assert.equal(formatYear(2025, "ko"), "2025년 기준");
  assert.equal(formatYear(null, "ko"), null);
  assert.equal(formatWorldRank(13, 191, "ko"), "세계 13위 / 191개국");
});

test("통화는 이름(기호, 코드)", () => {
  assert.equal(
    formatCurrency({ code: "KRW", ko: "대한민국 원", en: "South Korean won", symbol: "₩" }, "ko"),
    "대한민국 원(₩, KRW)",
  );
  // 기호가 없어도 괄호가 비거나 쉼표만 남지 않아야 한다.
  assert.equal(
    formatCurrency({ code: "XOF", ko: "서아프리카 CFA 프랑", en: "CFA franc", symbol: null }, "ko"),
    "서아프리카 CFA 프랑(XOF)",
  );
});

test("시간대는 표준시 이름 · UTC 오프셋, 기술 ID 는 보조", () => {
  assert.equal(formatTimezone("Asia/Seoul", "ko"), "한국 표준시 · UTC+09:00 (Asia/Seoul)");
  // 알 수 없는 ID 라도 오프셋을 지어내지 않는다.
  assert.equal(formatTimezone("Not/AZone", "ko"), "Not/AZone");
});

test("같은 시간대를 세 형태로 주더라도 한 줄로 합친다", () => {
  // 원본 데이터가 실제로 이렇게 들어온다. 그대로 이어 붙이면 같은 말을 세 번 한다.
  assert.equal(
    formatTimezones(["Asia/Seoul", "Korea Standard Time", "UTC+09:00"], "ko"),
    "한국 표준시 · UTC+09:00 (Asia/Seoul)",
  );
  assert.equal(formatTimezones([], "ko"), "자료 없음");
});
