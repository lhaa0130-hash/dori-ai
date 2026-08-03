// 감사 스크립트가 "실제로 오류를 잡는지" 확인한다 (지시서 07 §8).
//
// ⚠️ FAIL 0 은 그 자체로 아무것도 증명하지 않는다. 검사기가 고장 나서 아무것도
//    못 잡아도 FAIL 은 0 이 된다. 알려진 오류를 심어 검출되는지 먼저 본다.
//    실제로 첫 감사는 FAIL 195 를 냈는데, 원인은 제품이 아니라 감사 스크립트가
//    조사 로직을 따로 구현한 것이었다.

import test from "node:test";
import assert from "node:assert/strict";
import { josa, joinWithJosa } from "@/lib/worldmap/korean";

/** audit-korean.mjs 와 같은 판정 규칙. 여기서 깨지면 감사도 같이 깨진 것이다. */
function badYeyo(text: string): string | null {
  for (const m of text.matchAll(/([가-힣])(이에요|예요)/g)) {
    const code = m[1].charCodeAt(0);
    if (m[2] === "예요" && (code - 0xac00) % 28 !== 0) return `받침+예요 ${m[0]}`;
  }
  for (const m of text.matchAll(/([가-힣])이에요/g)) {
    const code = m[1].charCodeAt(0);
    if ((code - 0xac00) % 28 === 0) return `무받침+이에요 ${m[0]}`;
  }
  return null;
}

test("심는 테스트 — 틀린 문장은 반드시 검출된다", () => {
  assert.ok(badYeyo("수도는 서울예요."), "받침 있는 '서울' + 예요 를 놓쳤다");
  assert.ok(badYeyo("수도는 도쿄이에요."), "받침 없는 '도쿄' + 이에요 를 놓쳤다");
  assert.ok(/북한와/.test("북한와 국경을"), "북한와 를 놓쳤다");
  assert.ok(/인구은|인구이 /.test("인구이 13번째"), "인구이 를 놓쳤다");
});

test("맞는 문장은 오탐하지 않는다", () => {
  assert.equal(badYeyo("수도는 서울이에요."), null);
  assert.equal(badYeyo("수도는 도쿄예요."), null);
  assert.equal(badYeyo("바다가 없는 내륙국이에요."), null);
  assert.equal(badYeyo("13번째예요."), null);
});

test("GDP 처럼 영문 약어가 섞인 지표명 — 앞의 한글까지 거슬러 읽지 않는다", () => {
  // '1인당 GDP' 의 마지막 한글은 '당'(받침 ㅇ) 이지만 실제로 읽는 소리는 '지디피'다.
  // 이 구분이 없으면 감사가 "1인당 GDP이" 를 정답으로 만들어 버린다.
  assert.equal(josa("1인당 GDP", "이가"), "가");
  assert.equal(josa("GDP", "은는"), "는");
  assert.equal(josa("인구", "이가"), "가");
  assert.equal(josa("국토 면적", "이가"), "이");
});

test("이웃 나라 나열 — 1·2·3·4개 이상", () => {
  assert.equal(joinWithJosa(["조선민주주의인민공화국"], "과와"), "조선민주주의인민공화국과");
  assert.equal(joinWithJosa(["중국", "러시아"], "과와"), "중국, 러시아와");
  assert.equal(joinWithJosa(["중국", "러시아", "몽골"], "과와"), "중국, 러시아, 몽골과");
  assert.equal(joinWithJosa(["중국", "러시아", "몽골", "카자흐스탄"], "과와"), "중국, 러시아, 몽골 등 여러 나라와");
});
