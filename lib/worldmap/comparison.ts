// 2~4개국 비교 상태 (후속 지시서 §3).
//
// 핵심 규약:
//   · 일반 탐색의 단일 선택(selectedCountry)과 비교 선택은 **완전히 별개**다.
//   · 비교 모드에 들어가도 지금 보고 있던 나라를 자동으로 넣지 않는다.
//     "왜 한국이 저절로 들어가 있지?" 를 만들지 않기 위한 의도적 설계다.
//   · colorSlot 은 배열 index 와 항상 같다. 제거·순서변경 뒤에도 다시 매긴다.

export type ComparisonColorSlot = 0 | 1 | 2 | 3;

export interface ComparisonSelection {
  iso3: string;
  colorSlot: ComparisonColorSlot;
}

export type WorldMapMode = "explore" | "compare";

export interface WorldMapUiState {
  mode: WorldMapMode;
  selectedCountry: string | null;
  comparisonCountries: ComparisonSelection[];
}

export const MAX_COMPARISON = 4;

/** 비교 표는 2개국부터 의미가 있다. */
export const MIN_COMPARISON_TABLE = 2;

export const COMPARISON_COLORS = [
  { key: "orange", fill: "#ff8b55", soft: "#ffe2d2" },
  { key: "blue", fill: "#4b7bec", soft: "#dfe8ff" },
  { key: "green", fill: "#3f9b72", soft: "#dff3e9" },
  { key: "purple", fill: "#8b5ec4", soft: "#eee3fa" },
] as const;

export function colorFor(slot: number) {
  return COMPARISON_COLORS[slot] ?? COMPARISON_COLORS[0];
}

/** colorSlot 을 배열 순서대로 다시 매긴다. 모든 변경 함수는 이걸 통과해야 한다. */
function reslot(list: Array<{ iso3: string }>): ComparisonSelection[] {
  return list.slice(0, MAX_COMPARISON).map((item, i) => ({ iso3: item.iso3, colorSlot: i as ComparisonColorSlot }));
}

export type AddResult =
  | { status: "added"; list: ComparisonSelection[] }
  | { status: "duplicate"; list: ComparisonSelection[]; iso3: string }
  | { status: "full"; list: ComparisonSelection[] };

/**
 * 비교 목록에 추가한다.
 *   · 이미 있으면 중복으로 넣지 않고 그 나라를 알려준다(화면에서 해당 chip 을 잠깐 강조).
 *   · 4개가 차 있으면 조용히 무시하지 않고 'full' 을 알려 안내 문구를 띄우게 한다.
 */
export function addComparison(list: ComparisonSelection[], iso3: string): AddResult {
  if (list.some((c) => c.iso3 === iso3)) return { status: "duplicate", list, iso3 };
  if (list.length >= MAX_COMPARISON) return { status: "full", list };
  return { status: "added", list: reslot([...list, { iso3 }]) };
}

export function removeComparison(list: ComparisonSelection[], iso3: string): ComparisonSelection[] {
  return reslot(list.filter((c) => c.iso3 !== iso3));
}

/** direction: -1 앞으로, +1 뒤로. 끝에서 더 밀면 그대로 둔다. */
export function moveComparison(list: ComparisonSelection[], iso3: string, direction: -1 | 1): ComparisonSelection[] {
  const from = list.findIndex((c) => c.iso3 === iso3);
  if (from < 0) return list;
  const to = from + direction;
  if (to < 0 || to >= list.length) return list;
  const next = list.slice();
  [next[from], next[to]] = [next[to], next[from]];
  return reslot(next);
}

export function clearComparison(): ComparisonSelection[] {
  return [];
}

/** 임의의 ISO3 목록을 유효한 비교 상태로 정규화한다. URL 복원에 쓴다. */
export function normalizeComparison(isoList: string[], valid?: Set<string>): ComparisonSelection[] {
  const seen = new Set<string>();
  const out: Array<{ iso3: string }> = [];
  for (const raw of isoList) {
    if (typeof raw !== "string") continue;
    const iso3 = raw.trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(iso3)) continue;       // 형식이 틀리면 버린다
    if (valid && !valid.has(iso3)) continue;      // 없는 나라면 버린다
    if (seen.has(iso3)) continue;                 // 중복 제거, 처음 순서 유지
    seen.add(iso3);
    out.push({ iso3 });
    if (out.length >= MAX_COMPARISON) break;      // 5개째부터는 버린다
  }
  return reslot(out);
}

export function shouldShowTable(list: ComparisonSelection[]): boolean {
  return list.length >= MIN_COMPARISON_TABLE;
}
