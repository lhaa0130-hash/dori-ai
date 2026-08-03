// 월드맵 공개 데이터 계약 (명세서 §9).
// 브라우저가 받는 wire 형식은 용량을 줄이려고 키를 짧게 썼고, 이 파일이 그 유일한 정의다.
// adapter 사정으로 이 계약을 임의로 바꾸지 않는다.

export type SupportedLanguage = "ko" | "en";
export type DataStatus = "ok" | "missing" | "stale";
export type ContinentCode = "AF" | "AS" | "EU" | "NA" | "SA" | "OC";
export type MetricUnit = "people" | "km2" | "current_usd" | "current_usd_per_person";

/** 숫자 지표 하나. v=값, y=기준연도, u=단위, s=상태, src=sources 표의 키. */
export interface NumericMetric {
  v: number | null;
  y: number | null;
  u: MetricUnit;
  s: DataStatus;
  src: string | null;
}

export interface TextMetric {
  ko: string | null;
  en: string | null;
  s: DataStatus;
  src: string | null;
}

export interface LeaderMetric extends TextMetric {
  titleKo: string | null;
  titleEn: string | null;
  role: "head_of_government" | "head_of_state";
}

export interface ReligionMetric extends TextMetric {
  /** official=국교, main=주요 종교. 의미가 다르므로 화면에서도 구분한다. */
  kind: "official" | "main" | null;
  labelKo: string;
  labelEn: string;
}

export interface EstablishedMetric {
  date: string | null;
  s: DataStatus;
  src: string | null;
}

export interface DataSource {
  provider: "rest-countries" | "world-bank" | "wikidata" | "manual";
  label: string;
  url: string;
  fetchedAt: string;
}

/** 언어처럼 코드 + 한/영 이름을 함께 갖는 값. 한글 이름이 없으면 ko 에 영어가 들어간다. */
export interface LocalizedName {
  code: string | null;
  ko: string;
  en: string;
}

export interface CurrencyInfo {
  code: string;
  ko: string;
  en: string;
  symbol: string | null;
}

export interface CountryRecord {
  iso2: string;
  iso3: string;
  nameKo: string;
  nameEn: string;
  officialNameEn: string;
  capitalKo: string | null;
  capitalEn: string | null;
  continentCode: ContinentCode;
  continentKo: string;
  continentEn: string;
  subregionKo: string | null;
  subregionEn: string | null;
  /** 라벨·카메라 기준점 — 본토 폴리곤의 무게중심. */
  center: [number, number];
  /** 본토 기준 경계 상자. 해외 영토는 제외한다(프랑스령 기아나 등). */
  bbox: [number, number, number, number];
  /** 수도 좌표 [경도, 위도]. 지도에 점 하나로 찍는다. */
  capitalPoint: [number, number] | null;
  /** ISO2 로 만든 flagcdn 국기 이미지(80px). world-countries 에는 국기 URL 이 없다. */
  flagUrl: string | null;
  /** 고해상도 화면용 2배 이미지 */
  flagUrl2x: string | null;
  /** 이미지가 막혔을 때 쓰는 이모지 국기 */
  flagEmoji: string | null;
  leader: LeaderMetric;
  established: EstablishedMetric;
  religion: ReligionMetric;
  population: NumericMetric;
  area: NumericMetric;
  gdp: NumericMetric;
  gdpPerCapita: NumericMetric;

  // ── 어린이용 지리 정보 ──────────────────────────────────────────
  languages: LocalizedName[];
  currencies: CurrencyInfo[];
  timezones: string[];
  /** 육지로 맞닿은 나라들의 ISO3. 195개국 레지스트리 안의 코드만 담긴다. */
  borderCountryIso3: string[];
  landlocked: boolean;
  /**
   * 육지 국경이 하나도 없는 섬나라.
   * landlocked === false 만으로 판정하지 않는다 — 국경 목록이 비어 있어야 한다.
   */
  islandCountry: boolean;
}

export interface CountryDataset {
  /** 스키마가 바뀌면 올린다. 구버전 스냅샷을 새 화면이 잘못 읽는 것을 막는다. */
  schemaVersion: number;
  generatedAt: string;
  stale: boolean;
  countries: CountryRecord[];
  sources: Record<string, DataSource>;
}

/** 지도 색칠과 비교에 쓰는 숫자 지표 키. */
export type MetricKey = "population" | "area" | "gdp" | "gdpPerCapita";
export const METRIC_KEYS: MetricKey[] = ["gdp", "gdpPerCapita", "population", "area"];

/** 지도에 표시할 두 가지 역할. A=선택 국가(오렌지), B=비교 국가(블루). */
export type Slot = "a" | "b";

/** URL `view` 파라미터 (명세서 §8.3). */
export type ViewMode = "split" | "flat" | "globe";
export const VIEW_MODES: ViewMode[] = ["split", "flat", "globe"];

export const CONTINENTS: ContinentCode[] = ["AS", "EU", "AF", "NA", "SA", "OC"];
