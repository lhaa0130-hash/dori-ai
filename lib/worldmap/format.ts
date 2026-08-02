// 숫자·날짜 표기 (명세서 §13). 축약값 옆에는 항상 원본 숫자를 접근성 텍스트로 함께 준다.

import type { MetricUnit, NumericMetric, SupportedLanguage } from "./types";

const KO_UNITS: Array<[number, string]> = [
  [1e12, "조"],
  [1e8, "억"],
  [1e4, "만"],
];
const EN_UNITS: Array<[number, string]> = [
  [1e12, "T"],
  [1e9, "B"],
  [1e6, "M"],
  [1e3, "K"],
];

function trim(n: number): string {
  // 1.70 → 1.7, 5.00 → 5
  const s = n.toFixed(2);
  return s.replace(/\.?0+$/, "");
}

/** 큰 수를 언어별 관습대로 줄인다. 한국어는 만·억·조, 영어는 K·M·B·T. */
export function abbreviate(value: number, lang: SupportedLanguage): string {
  const abs = Math.abs(value);
  const units = lang === "ko" ? KO_UNITS : EN_UNITS;
  for (const [size, suffix] of units) {
    if (abs >= size) return `${trim(value / size)}${suffix}`;
  }
  return new Intl.NumberFormat(lang === "ko" ? "ko-KR" : "en-US").format(Math.round(value));
}

/** 자릿수 구분 기호가 들어간 전체 숫자. 접근성 텍스트와 tooltip 에 쓴다. */
export function fullNumber(value: number, lang: SupportedLanguage): string {
  return new Intl.NumberFormat(lang === "ko" ? "ko-KR" : "en-US").format(Math.round(value));
}

export interface FormattedMetric {
  /** 화면에 크게 보이는 값. 자료가 없으면 '자료 없음'. */
  display: string;
  /** 스크린리더·tooltip 용 전체 표기. 자료가 없으면 null. */
  full: string | null;
  /** 기준연도 표기. 없으면 null. */
  year: string | null;
  missing: boolean;
}

export const NO_DATA = { ko: "자료 없음", en: "No data" } as const;

export function formatMetric(metric: NumericMetric | undefined, lang: SupportedLanguage): FormattedMetric {
  if (!metric || metric.v == null || metric.s === "missing") {
    return { display: NO_DATA[lang], full: null, year: null, missing: true };
  }
  const v = metric.v;
  const full = fullNumber(v, lang);
  let display: string;
  let fullText: string;

  switch (metric.u as MetricUnit) {
    case "people":
      display = lang === "ko" ? `${abbreviate(v, "ko")} 명` : abbreviate(v, "en");
      fullText = lang === "ko" ? `${full} 명` : `${full} people`;
      break;
    case "km2":
      display = `${full} km²`;
      fullText = `${full} km²`;
      break;
    case "current_usd":
      display = `$${abbreviate(v, lang)}`;
      fullText = `$${full}`;
      break;
    case "current_usd_per_person":
      // 1인당 GDP 는 자릿수가 작아 축약하면 오히려 읽기 나쁘다. 원본 그대로 쓴다.
      display = `$${full}`;
      fullText = lang === "ko" ? `$${full} / 1인` : `$${full} per person`;
      break;
    default:
      display = full;
      fullText = full;
  }

  return {
    display,
    full: fullText,
    year: metric.y != null ? String(metric.y) : null,
    missing: false,
  };
}

/** YYYY-MM-DD → 언어별 표기. */
export function formatDate(date: string | null, lang: SupportedLanguage): string {
  if (!date) return NO_DATA[lang];
  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) return NO_DATA[lang];
  return lang === "ko"
    ? `${y}년 ${m}월 ${d}일`
    : new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" })
        .format(Date.UTC(y, m - 1, d) as unknown as Date);
}

/**
 * 두 값의 비교 결과. 한쪽이라도 없으면 계산하지 않는다(명세서 §7.5).
 * ratio 는 큰 값을 1 로 둔 정규화 값이라 비교 막대 길이에 바로 쓸 수 있다.
 */
export interface Comparison {
  comparable: boolean;
  diff: number | null;
  ratioA: number;
  ratioB: number;
  larger: "a" | "b" | "same" | null;
}

export function compareMetrics(a: NumericMetric | undefined, b: NumericMetric | undefined): Comparison {
  const av = a && a.s !== "missing" ? a.v : null;
  const bv = b && b.s !== "missing" ? b.v : null;
  if (av == null || bv == null) return { comparable: false, diff: null, ratioA: 0, ratioB: 0, larger: null };

  const max = Math.max(Math.abs(av), Math.abs(bv));
  return {
    comparable: true,
    diff: Math.abs(av - bv),
    ratioA: max === 0 ? 0 : Math.abs(av) / max,
    ratioB: max === 0 ? 0 : Math.abs(bv) / max,
    larger: av === bv ? "same" : av > bv ? "a" : "b",
  };
}
