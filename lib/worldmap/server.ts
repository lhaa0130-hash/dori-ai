// 서버(빌드 시점)에서 국가 데이터를 읽는 통로 (지시서 10 §14.1).
//
// ⚠️ 국가 페이지의 본문은 반드시 server HTML 에 있어야 한다. 지도 canvas 안에만
//    있는 정보는 검색엔진에게 없는 것과 같고, 지도 로딩이 실패한 사용자에게도 없다.
//    그래서 클라이언트 fetch 가 아니라 빌드 때 파일에서 직접 읽는다.

import { readFileSync } from "node:fs";
import path from "node:path";
import type { CountryDataset, CountryRecord } from "./types";

let cache: CountryDataset | null = null;

export function loadCountryDataset(): CountryDataset {
  if (cache) return cache;
  const file = path.join(process.cwd(), "public", "worldmap", "countries.json");
  cache = JSON.parse(readFileSync(file, "utf8")) as CountryDataset;
  return cache;
}

export function loadCountries(): CountryRecord[] {
  return loadCountryDataset().countries;
}

export function findByIso3(iso3: string): CountryRecord | undefined {
  return loadCountries().find((c) => c.iso3 === iso3);
}
