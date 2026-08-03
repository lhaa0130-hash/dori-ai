// 한국어 조사 처리 (지시서 07 §3 · §10)
import test from "node:test";
import assert from "node:assert/strict";
import { josa, withJosa, joinWithJosa, hasFinalConsonant } from "../../lib/worldmap/korean.ts";

test("받침 있는 말과 없는 말에 맞는 조사를 고른다", () => {
  assert.equal(withJosa("대한민국", "은는"), "대한민국은");
  assert.equal(withJosa("케냐", "은는"), "케냐는");
  assert.equal(withJosa("면적", "이가"), "면적이");
  assert.equal(withJosa("인구", "이가"), "인구가");
  assert.equal(withJosa("면적", "을를"), "면적을");
  assert.equal(withJosa("인구", "을를"), "인구를");
  assert.equal(withJosa("일본", "과와"), "일본과");
  assert.equal(withJosa("케냐", "과와"), "케냐와");
});

test("실제로 났던 오류 — '북한와' 가 '북한과' 로 나온다", () => {
  assert.equal(withJosa("북한", "과와"), "북한과");
  assert.equal(withJosa("조선민주주의인민공화국", "과와"), "조선민주주의인민공화국과");
});

test("ㄹ 받침은 '로', 다른 받침은 '으로'", () => {
  assert.equal(withJosa("서울", "으로로"), "서울로");
  assert.equal(withJosa("한국", "으로로"), "한국으로");
  assert.equal(withJosa("케냐", "으로로"), "케냐로");
});

test("수도 이에요/예요", () => {
  assert.equal(withJosa("런던", "이에요예요"), "런던이에요");
  assert.equal(withJosa("도쿄", "이에요예요"), "도쿄예요");
  assert.equal(withJosa("리마", "이에요예요"), "리마예요");
  assert.equal(withJosa("서울", "이에요예요"), "서울이에요");
});

test("영문 약어는 읽는 소리로 판정한다", () => {
  // GDP 는 '지디피' → 받침 없음
  assert.equal(withJosa("GDP", "은는"), "GDP는");
  assert.equal(withJosa("GDP", "이가"), "GDP가");
  assert.equal(withJosa("UN", "은는"), "UN은");
});

test("괄호·구두점이 뒤에 있어도 마지막 한글로 판정한다", () => {
  assert.equal(josa("케냐(Kenya)", "과와"), "와");
  assert.equal(josa("일본 ", "과와"), "과");
});

test("판단할 수 없으면 받침 없는 쪽을 쓴다", () => {
  assert.equal(hasFinalConsonant("Zimbabwe"), null);
  assert.equal(withJosa("Zimbabwe", "과와"), "Zimbabwe와");
});

test("이웃 나라 목록을 개수에 맞게 잇는다", () => {
  assert.equal(joinWithJosa(["북한"], "과와"), "북한과");
  assert.equal(joinWithJosa(["중국", "러시아"], "과와"), "중국, 러시아와");
  assert.equal(joinWithJosa(["중국", "러시아", "몽골"], "과와"), "중국, 러시아, 몽골과");
  assert.equal(joinWithJosa(["중국", "러시아", "몽골", "카자흐스탄"], "과와"), "중국, 러시아, 몽골 등 여러 나라와");
});

test("공개 문구에 은(는)·이(가)·을(를) 형태를 쓰지 않는다", () => {
  for (const w of ["대한민국", "케냐", "GDP", "인구"]) {
    for (const k of ["은는", "이가", "을를", "과와"] as const) {
      const out = withJosa(w, k);
      assert.ok(!out.includes("("), `괄호 병기가 나왔다: ${out}`);
    }
  }
});
