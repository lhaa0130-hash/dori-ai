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
  center: [number, number];
  bbox: [number, number, number, number];
  flagUrl: string | null;
  leader: LeaderMetric;
  established: EstablishedMetric;
  religion: ReligionMetric;
  population: NumericMetric;
  area: NumericMetric;
  gdp: NumericMetric;
  gdpPerCapita: NumericMetric;
}

export interface CountryDataset {
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
