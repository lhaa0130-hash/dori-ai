// 월드맵 외부 데이터 출처 정의와 공용 fetch 헬퍼.
//
// 원칙(명세서 §0.17): 값이 없으면 만들어내지 않는다. 항상 null + status:"missing" 으로 둔다.
// 모든 수집은 이 파일의 SOURCES 를 통해서만 하고, 화면에는 여기 label/url 을 그대로 보여준다.

export const UA = "illo-worldmap/1.0 (https://illo.im; contact via illo.im)";

export const SOURCES = {
  restCountries: {
    provider: "rest-countries",
    label: "REST Countries (world-countries 데이터셋)",
    // restcountries.com 공개 엔드포인트는 2026-08 기준 응답이 불안정해(success:false) 배포 차단 위험이 있다.
    // 동일 원본 데이터셋인 mledoze/countries(=REST Countries 의 데이터 소스)를 고정 버전으로 받는다.
    url: "https://cdn.jsdelivr.net/npm/world-countries@5.1.0/countries.json",
    homepage: "https://restcountries.com/docs/countries",
    license: "ODbL-1.0",
  },
  worldBank: {
    provider: "world-bank",
    label: "World Bank Open Data",
    url: "https://api.worldbank.org/v2",
    homepage: "https://datahelpdesk.worldbank.org/knowledgebase/articles/889392",
    license: "CC BY-4.0",
  },
  wikidata: {
    provider: "wikidata",
    label: "Wikidata",
    url: "https://query.wikidata.org/sparql",
    homepage: "https://www.wikidata.org/wiki/Wikidata:SPARQL_query_service",
    license: "CC0-1.0",
  },
  naturalEarth: {
    provider: "manual",
    label: "Natural Earth Admin 0 – Countries 1:110m",
    url: "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_110m_admin_0_countries.geojson",
    homepage: "https://www.naturalearthdata.com/downloads/110m-cultural-vectors/110m-admin-0-countries/",
    license: "Public Domain",
  },
};

/**
 * World Bank 지표 코드.
 * 랭킹에 쓰는 지표는 전부 여기서만 정의한다. 확보율이 낮으면 랭킹에서 빼되
 * **값을 추정해 채우지 않는다.**
 */
export const WB_INDICATORS = {
  population: "SP.POP.TOTL",
  gdp: "NY.GDP.MKTP.CD",
  gdpPerCapita: "NY.GDP.PCAP.CD",
  // 랭킹 확장
  gdpGrowth: "NY.GDP.MKTP.KD.ZG",          // 연간 성장률 %
  lifeExpectancy: "SP.DYN.LE00.IN",        // 기대수명 (년)
  internetUsageRate: "IT.NET.USER.ZS",     // 인터넷 사용 인구 %
  urbanPopulationRate: "SP.URB.TOTL.IN.ZS",// 도시 인구 %
  birthRate: "SP.DYN.CBRT.IN",             // 조출생률 (인구 1000명당)
  childPopulationRate: "SP.POP.0014.TO.ZS",// 0~14세 인구 %
  forestAreaRate: "AG.LND.FRST.ZS",        // 산림 면적 %
  renewableEnergyRate: "EG.FEC.RNEW.ZS",   // 재생에너지 소비 비중 %
  co2PerCapita: "EN.GHG.CO2.PC.CE.AR5",    // 1인당 CO2 (t)
};

/** 재시도 포함 JSON fetch. 실패해도 던지지 않고 null 을 돌려 부분 장애를 흡수한다. */
export async function fetchJson(url, { retries = 3, timeoutMs = 60000, headers = {} } = {}) {
  for (let attempt = 0; attempt < retries; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        signal: ctrl.signal,
        headers: { "User-Agent": UA, Accept: "application/json", ...headers },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (attempt === retries - 1) {
        process.stderr.write(`  ! fetch 실패 (${retries}회): ${url.slice(0, 90)} — ${err.message}\n`);
        return null;
      }
      // 지수 백오프. Wikidata·World Bank 는 순간 rate limit 이 잦다.
      await new Promise((r) => setTimeout(r, 1500 * 2 ** attempt));
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
}

/** Wikidata SPARQL 실행. 결과는 [{var: value}] 로 평탄화한다. */
export async function sparql(query) {
  const url = `${SOURCES.wikidata.url}?format=json&query=${encodeURIComponent(query)}`;
  const json = await fetchJson(url, { timeoutMs: 120000, headers: { Accept: "application/sparql-results+json" } });
  if (!json?.results?.bindings) return null;
  return json.results.bindings.map((row) => {
    const out = {};
    for (const [k, v] of Object.entries(row)) out[k] = v.value;
    return out;
  });
}

/** ISO-8601 또는 Wikidata 시각 문자열에서 YYYY-MM-DD 만 뽑는다. 불확실하면 null. */
export function isoDate(raw) {
  if (typeof raw !== "string") return null;
  const m = raw.match(/^([+-]?\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const [, y, mo, d] = m;
  const year = Number(y);
  // 기원전·미래 날짜는 국가 수립일로 쓰지 않는다(명세서 §10.4).
  if (year < 1 || year > new Date().getUTCFullYear()) return null;
  return `${String(year).padStart(4, "0")}-${mo}-${d}`;
}
