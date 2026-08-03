// 화면 표기 통일 (지시서 07 §6).
//
// 같은 값을 화면마다 다르게 적으면 사용자는 다른 정보라고 느낀다.
// 연도·순위·통화·시간대 표기는 전부 이 파일 하나를 거친다.

import type { CurrencyInfo, SupportedLanguage } from "./types";

/** `기준 2025` 가 아니라 `2025년 기준`. */
export function formatYear(year: number | string | null, lang: SupportedLanguage): string | null {
  if (year == null || year === "") return null;
  return lang === "ko" ? `${year}년 기준` : `As of ${year}`;
}

/** `세계 순위 13/191` 이 아니라 `세계 13위 / 191개국`. */
export function formatWorldRank(rank: number, total: number, lang: SupportedLanguage): string {
  return lang === "ko" ? `세계 ${rank}위 / ${total}개국` : `World #${rank} of ${total}`;
}

/** `대한민국 원 ₩ (KRW)` 이 아니라 `대한민국 원(₩, KRW)`. */
export function formatCurrency(c: CurrencyInfo, lang: SupportedLanguage): string {
  const name = (lang === "ko" ? c.ko : c.en)?.trim();
  const inner = [c.symbol?.trim(), c.code].filter(Boolean).join(", ");
  if (!name) return inner || c.code;
  return inner ? `${name}(${inner})` : name;
}

/**
 * IANA 시간대 ID 를 사람이 읽는 표기로 바꾼다.
 *
 * ⚠️ `Asia/Seoul` 을 그대로 보여주면 어린이가 읽을 수 없다. 하지만 기술 ID 를 버리지도
 *    않는다 — 표준 이름과 UTC 오프셋을 앞에 두고 ID 는 괄호 안 보조 정보로 남긴다.
 */
export function formatTimezones(zones: string[], lang: SupportedLanguage): string {
  if (!zones.length) return lang === "ko" ? "자료 없음" : "No data";

  // ⚠️ 원본은 같은 시간대를 세 가지 형태로 함께 준다.
  //      ["Asia/Seoul", "Korea Standard Time", "UTC+09:00"]
  //    그대로 이어 붙이면 "한국 표준시 · UTC+09:00 (Asia/Seoul), Korea Standard Time,
  //    UTC+09:00" 처럼 같은 말을 세 번 하게 된다. IANA ID 만 남기고 나머지는 버린다.
  const ids = zones.filter((z) => z.includes("/"));
  const use = ids.length ? ids : zones.slice(0, 1);
  return [...new Set(use.map((z) => formatTimezone(z, lang)))].join(", ");
}

export function formatTimezone(zone: string, lang: SupportedLanguage): string {
  const offset = utcOffset(zone);
  const name = zoneName(zone, lang);
  const head = [name, offset].filter(Boolean).join(" · ");
  if (!head) return zone;
  // 기술 ID 는 보조 정보로만 남긴다.
  return `${head} (${zone})`;
}

/** 실제 시간대 규칙으로 현재 UTC 오프셋을 구한다. 하드코딩한 표를 쓰지 않는다. */
function utcOffset(zone: string): string | null {
  try {
    const fmt = new Intl.DateTimeFormat("en-US", { timeZone: zone, timeZoneName: "longOffset" });
    const part = fmt.formatToParts(new Date(0)).find((p) => p.type === "timeZoneName")?.value;
    if (!part) return null;
    // "GMT+09:00" → "UTC+09:00", "GMT" → "UTC+00:00"
    if (part === "GMT") return "UTC+00:00";
    return part.replace("GMT", "UTC");
  } catch {
    return null;   // 알 수 없는 ID 는 조용히 넘긴다. 오프셋을 지어내지 않는다.
  }
}

/** 표준시 이름. 공인 한국어 이름이 있는 것만 옮기고, 나머지는 영어 원문을 그대로 둔다. */
const ZONE_NAME_KO: Record<string, string> = {
  "Asia/Seoul": "한국 표준시",
  "Asia/Pyongyang": "평양시간",
  "Asia/Tokyo": "일본 표준시",
  "Asia/Shanghai": "중국 표준시",
  "Europe/London": "그리니치 표준시",
  "Europe/Paris": "중앙유럽 표준시",
  "America/New_York": "미국 동부 표준시",
  "America/Los_Angeles": "미국 태평양 표준시",
  UTC: "협정 세계시",
};

function zoneName(zone: string, lang: SupportedLanguage): string | null {
  if (lang === "ko") return ZONE_NAME_KO[zone] ?? null;
  try {
    const fmt = new Intl.DateTimeFormat("en-US", { timeZone: zone, timeZoneName: "long" });
    return fmt.formatToParts(new Date(0)).find((p) => p.type === "timeZoneName")?.value ?? null;
  } catch {
    return null;
  }
}
