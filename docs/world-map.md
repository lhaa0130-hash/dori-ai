# 월드맵 (World Map)

평면 세계지도와 지구본을 한 화면에 놓고, 두 지도가 실시간으로 같은 곳을 비추도록 연동한
국가 정보 탐색 서비스. illo.im 안의 `/world-map` 경로로 제공한다.

- 한국어: **월드맵** — 지도로 만나는 세계 국가 정보
- English: **World Map** — Explore countries through maps

---

## 지원 범위

**195개국** = UN 회원국 193 + UN 옵서버 2(바티칸 `VAT`, 팔레스타인 `PSE`).

195개국 전부가 실제 Natural Earth 경계 폴리곤과 연결되어 있다(마커 대체 없음).

첫 배포에 **포함하지 않은 것**: 하위 행정구역, 역사적 국경, 연도별 차트, 여행·비자·날씨·환율,
로그인, 즐겨찾기, 댓글, 뉴스, 순위 전용 페이지, 지도자 사진, 장식용 생성 이미지.

향후 확장은 `대륙 → 국가 → 1차 행정구역 → 도시` 구조를 전제로 하며, 그래서 영구 ID로 **ISO 코드**만
쓴다(국가명 문자열이나 배열 인덱스를 ID로 쓰지 않는다).

---

## 로컬 실행

```bash
npm install
npm run dev
```

`http://localhost:3000/world-map`

월드맵 자체는 Firebase를 쓰지 않지만, 사이트 공통 레이아웃이 Firebase 설정을 fail-closed로
검사하므로 `.env.local`에 `NEXT_PUBLIC_FIREBASE_*` 값이 있어야 dev/build가 돈다.
값의 의미는 저장소 루트의 환경 변수 문서를 따른다. **월드맵 전용 환경 변수는 없다.**

---

## 데이터

### 출처와 라이선스

| 항목 | 출처 | 라이선스 |
|---|---|---|
| 국가명·수도·지역·면적·국기 | [REST Countries](https://restcountries.com/docs/countries) 데이터셋(`world-countries` 고정 버전) | ODbL-1.0 |
| 인구 `SP.POP.TOTL` · GDP `NY.GDP.MKTP.CD` · 1인당 GDP `NY.GDP.PCAP.CD` | [World Bank Open Data](https://datahelpdesk.worldbank.org/knowledgebase/articles/889392) | CC BY-4.0 |
| 대표 지도자 · 국가 수립일 · 종교 · 수도 한글명 | [Wikidata](https://www.wikidata.org/wiki/Wikidata:SPARQL_query_service) | CC0-1.0 |
| 국가 경계 | [Natural Earth Admin 0 1:110m](https://www.naturalearthdata.com/downloads/110m-cultural-vectors/110m-admin-0-countries/) (110m에 없는 소국은 50m 보충) | Public Domain |
| 지도 렌더링 | [MapLibre GL JS](https://maplibre.org/) | BSD-3-Clause |

`restcountries.com` 공개 엔드포인트는 응답이 불안정해(`{success:false}`) 배포를 막을 위험이 있어,
같은 원본 데이터셋을 고정 버전으로 받는다.

### 갱신 (`sync:data`)

```bash
npm run sync:data
```

레지스트리 구성 → 경계 연결 → World Bank → Wikidata → manual override → 검증 → 저장.

```bash
npm run sync:data -- --dry-run   # 파일을 쓰지 않고 결과만 확인
npm run verify:data              # 구워진 산출물만 검사
```

산출물:

| 파일 | 용도 | 크기 |
|---|---|---|
| `public/worldmap/countries.json` | 브라우저가 받는 전체 데이터 | ~205KB |
| `public/worldmap/countries.geojson` | 지도 경계 | ~188KB |
| `data/worldmap/snapshot.json` | 마지막 정상 스냅샷(fallback) | ~438KB |
| `data/worldmap/country-registry.json` | 195개국 레지스트리 | 작음 |
| `data/worldmap/manual-overrides.json` | 수동 보정 + NE 비표준 코드 매핑 | 작음 |

**배포 전에 실행한다.** 외부 API가 죽으면 마지막 스냅샷을 유지하되,
**레지스트리(195개국)와 경계 연결이 깨지면 배포 차단 오류로 즉시 중단**한다.

### 캐시 정책

브라우저는 외부 API를 직접 부르지 않는다. 수집은 배포 전 `sync:data`가 끝내고,
런타임에는 구워진 스냅샷만 읽는다(CORS·rate limit·API 변경을 서버에서 흡수).

`/api/countries` 응답은 `max-age=300, s-maxage=3600`.

### 값이 없을 때

**값을 만들어내지 않는다.** 언제나 `자료 없음 / No data`로 표시하고 출처·기준연도를 함께 둔다.
GDP·1인당 GDP는 계산하거나 추정하지 않고, 종교는 비율을 추정하지 않으며 동등한 값이 여럿이면
하나를 임의로 고르지 않는다.

---

## 서버 API

이 사이트는 `output: 'export'` 정적 배포라 Next.js API route를 쓸 수 없다.
저장소가 이미 쓰는 **Cloudflare Pages Functions**로 같은 계약을 제공한다.

```http
GET /api/countries?lang=ko        → ApiEnvelope<CountrySummary[]>
GET /api/countries/KOR?lang=ko    → ApiEnvelope<CountryRecord>
```

- ISO 대소문자 무시, 없는 ISO는 404
- 지원하지 않는 언어는 `ko` fallback
- 일부 항목이 비어도 기본 정보가 있으면 200 + 부분 데이터, 빈 항목은 `errors`에 기록
- 비교 전용 API는 없다 — 상세 두 번을 조합해 쓴다

---

## 테스트

```bash
npm run test:worldmap    # 단위 + 데이터 무결성 (node:test)
npm run test:e2e         # Playwright (dev 서버가 떠 있어야 한다)
```

E2E는 데스크톱(1440×900)과 모바일(360×780) 두 프로필로 돈다.
`WORLDMAP_BASE_URL`로 대상 주소를 바꿀 수 있다(기본 `http://localhost:3100`).

지도는 WebGL을 쓰므로 headless Chromium에 SwiftShader를 켜야 한다 — `playwright.config.ts`에 설정돼 있다.

E2E는 개발 빌드가 노출하는 `window.__worldmap` 핸들로 카메라 상태를 관찰한다.
**이 핸들은 production 번들에 들어가지 않는다.**

---

## 배포

이 저장소의 배포는 Cloudflare Pages가 커밋된 `out/`을 서빙하는 구조이며,
빌드·배포는 매시 정각 n8n 단일 워크플로우가 전담한다.
**월드맵 브랜치도 소스만 커밋하고 `out/`은 커밋하지 않는다.**

GitHub Actions는 이 저장소에 설정되어 있지 않다. 품질 게이트는 위 명령을 로컬에서 실행해 확인한다.

---

## 알려진 데이터 한계

- **종교 166/195 자료 없음.** Wikidata에서 국교(P3075)를 선언한 나라는 28개뿐이고,
  대표 종교(P140)까지 합쳐도 29개다. 대부분의 세속국가에는 신뢰할 수 있는 단일값이 없어
  임의로 채우지 않고 `자료 없음`으로 둔다.
- **GDP·1인당 GDP 4/195 자료 없음** (World Bank 미수록 국가).
- **인구 1/195 자료 없음.**
- 국가 수립일은 Wikidata `inception` 기준이라 "현 체제 성립일"과 "독립일"이 나라마다 다르게
  잡힐 수 있다. 예외는 `manual-overrides.json`으로 보정한다.
- 경계는 1:110m 축척이라 작은 섬과 국경 세부는 단순화되어 있다.

---

## 향후 확장

- 하위 행정구역(1차 행정구역 → 도시) — ID 체계는 이미 ISO 기반이라 그대로 확장 가능
- 연도별 지표 추이
- 지도자 사진 등 이미지 — **추가 전에 종류·출처·라이선스·갱신 방법·fallback·용량을 정리해 승인받는다.**
  현재 이미지 정책은 지도·지구본과 국기만 사용하며, 국기가 실패하면 ISO 코드 placeholder를 보여준다.
