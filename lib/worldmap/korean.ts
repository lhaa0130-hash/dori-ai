// 한국어 조사 처리 (지시서 07 §3).
//
// 화면에 `은(는)`, `이(가)`, `을(를)` 을 쓰지 않는다. 앞말의 받침을 보고 하나를 고른다.
//
// 실제로 났던 오류:
//   "북한와 국경을 맞대고 있어요"   ← 받침 있는 말에 '와' 를 붙임
//   "인구은 자료가 없어..."          ← 지표 라벨에 '은' 을 고정으로 붙임
// 그래서 문장을 만드는 쪽에서 조사를 직접 이어 붙이지 않고 이 파일을 거치게 한다.

/** 조사 쌍 — [받침 있을 때, 받침 없을 때] */
const PAIRS = {
  은는: ["은", "는"],
  이가: ["이", "가"],
  을를: ["을", "를"],
  과와: ["과", "와"],
  으로로: ["으로", "로"],
  이에요예요: ["이에요", "예요"],
} as const;

export type JosaKind = keyof typeof PAIRS;

/**
 * 서비스에서 쓰는 영문 약어의 읽는 소리.
 * 'GDP' 는 '지디피' 로 읽으므로 받침이 없다 → "GDP는", "GDP가".
 * 자동 판정으로는 알 수 없어 표로 둔다.
 */
const ABBREV_HAS_FINAL: Record<string, boolean> = {
  GDP: false,   // 지디피
  ISO: false,   // 아이에스오
  UN: true,     // 유엔
  CO2: false,   // 씨오투
  UTC: false,   // 유티씨
  KRW: false,   // 케이알더블유
  USD: false,   // 유에스디
};

/**
 * 마지막 한글 음절의 받침 여부.
 * 괄호·따옴표·구두점이 뒤에 붙어 있어도 실제 마지막 한글을 찾는다.
 *   "대한민국 원(₩, KRW)" → 'W' 가 아니라 표를 먼저 본다
 *   "케냐)"               → '냐'
 */
export function hasFinalConsonant(word: string): boolean | null {
  const trimmed = word.trim();
  if (!trimmed) return null;

  // 영문 약어가 통째로 들어온 경우 먼저 표를 본다
  const upper = trimmed.toUpperCase();
  if (upper in ABBREV_HAS_FINAL) return ABBREV_HAS_FINAL[upper];

  // 뒤에서부터 한글 음절을 찾는다
  for (let i = trimmed.length - 1; i >= 0; i--) {
    const code = trimmed.charCodeAt(i);
    if (code >= 0xac00 && code <= 0xd7a3) {
      return (code - 0xac00) % 28 !== 0;
    }
    // 숫자로 끝나면 읽는 소리로 판정 (1 일, 2 이, 3 삼 …)
    if (code >= 0x30 && code <= 0x39) {
      // 0 영, 1 일, 3 삼, 6 육, 7 칠, 8 팔 → 받침 있음
      return [true, true, false, true, false, false, true, true, true, false][code - 0x30];
    }
    // 영문자로 끝나면 표에 없는 이상 판단하지 않는다
    if (/[A-Za-z]/.test(trimmed[i])) return null;
  }
  return null;
}

/** 마지막 한글 음절의 받침이 ㄹ 인지. '으로/로' 는 ㄹ 받침을 받침 없는 것처럼 다룬다. */
export function endsWithRieul(word: string): boolean {
  const trimmed = word.trim();
  for (let i = trimmed.length - 1; i >= 0; i--) {
    const code = trimmed.charCodeAt(i);
    if (code >= 0xac00 && code <= 0xd7a3) return (code - 0xac00) % 28 === 8;   // 8 = ㄹ
  }
  return false;
}

/**
 * 앞말에 맞는 조사를 돌려준다.
 * 판단할 수 없으면(영문 고유명사 등) 받침 없는 쪽을 쓴다 — '와', '는' 이 덜 어색하다.
 */
export function josa(word: string, kind: JosaKind): string {
  const [withFinal, withoutFinal] = PAIRS[kind];
  const final = hasFinalConsonant(word);
  // ⚠️ '으로/로' 만 예외다. 서울(ㄹ 받침)은 '서울로' 이지 '서울으로' 가 아니다.
  if (kind === "으로로" && endsWithRieul(word)) return withoutFinal;
  return final === true ? withFinal : withoutFinal;
}

/** 앞말 + 조사를 이어 붙인다. */
export function withJosa(word: string, kind: JosaKind): string {
  return `${word}${josa(word, kind)}`;
}

/**
 * 여러 이름을 한국어 목록으로 잇고 마지막에 조사를 붙인다.
 *   ["중국"]                       → "중국과"
 *   ["중국", "러시아"]             → "중국, 러시아와"
 *   ["중국", "러시아", "몽골"]     → "중국, 러시아, 몽골과"
 *   4개 이상                        → "중국, 러시아, 몽골 등 여러 나라와"
 */
export function joinWithJosa(
  names: string[],
  kind: JosaKind,
  { max = 3, moreSuffix = "등 여러 나라" }: { max?: number; moreSuffix?: string } = {},
): string {
  if (names.length === 0) return "";
  if (names.length <= max) {
    const list = names.join(", ");
    return withJosa(list, kind);
  }
  const shown = names.slice(0, max).join(", ");
  return `${shown} ${withJosa(moreSuffix, kind)}`;
}
