# 나라콕 — SEO 기준값 (Phase 0)

측정: 2026-08-04 KST · 대상 <https://illo.im/world-map>, `/en/world-map`
방법: 프로덕션 응답 HTML 을 curl 로 받아 직접 확인. 브라우저 렌더 후가 아니라
**crawler 가 처음 받는 바이트**를 봤다.

---

## 1. 측정 결과

| URL | title | canonical | H1 |
| --- | --- | --- | --- |
| `/world-map` | 나라콕 \| 콕 눌러 만나는 세계 — 195개국 지도 \| illo | `https://illo.im/world-map` | 나라콕 |
| `/world-map?country=KOR` | **(동일)** | **`https://illo.im/world-map`** | **나라콕** |
| `/en/world-map` | NARAKOK \| Tap a Country, Meet the World \| illo | `https://illo.im/en/world-map` | NARAKOK |
| `/en/world-map?country=KOR` | **(동일)** | **`https://illo.im/en/world-map`** | **NARAKOK** |

지시서 §1.2 의 실측과 일치한다.

### 확인된 문제

1. **국가 상세가 검색엔진에는 존재하지 않았다.**
   `?country=KOR` 은 사용자에게 대한민국 페이지로 보이지만, title·description·H1·
   canonical 이 전부 허브와 같다. 195개국이 검색엔진에는 문서 하나다.

2. **국가로 가는 crawlable 링크가 없었다.**
   국가 선택은 지도 클릭(button)과 검색 입력뿐이다. crawler 는 button 을 누르지
   못하므로 link graph 에서 국가가 보이지 않는다.

3. **구조화 데이터가 사이트 공통뿐.**
   `Organization`, `WebSite` 만 있고 국가·대륙·랭킹·breadcrumb 은 없다.

4. **sitemap 에 `/world-map` 허브 2개만.**
   국가·대륙·랭킹 페이지가 애초에 없었으므로 넣을 것도 없었다.

### 잘 되어 있던 것 (건드리지 않음)

- 허브의 고유 title/description, `robots=index, follow`, self canonical
- `ko-KR` / `en` / `x-default` hreflang
- `/en/world-map` 의 `<html lang="en">` 과 영문 metadata

---

## 2. 렌더링 방식

- Next.js App Router, `output: "export"` — **정적 export**
- `out/` 을 저장소에 커밋하고 Cloudflare Pages 가 그대로 서빙
- 따라서 `out/` 안의 HTML 이 crawler 가 받는 바이트 그 자체다.
  SEO 감사는 코드가 아니라 이 파일들을 읽어야 한다 → `scripts/worldmap/audit-seo.mjs`
- 정적 export 라 서버 리다이렉트·동적 404 는 Cloudflare Pages 설정(`_redirects`)에
  의존한다. Next 의 `notFound()` 는 빌드 때 해당 경로를 만들지 않는 방식으로 동작한다.

---

## 3. 이번 Phase 에서 바꾼 것

| 항목 | 전 | 후 |
| --- | --- | --- |
| 국가 indexable 주소 | 0개 | `/world-map/countries/{slug}` KO/EN |
| 대륙 페이지 | 없음 | 6개 × KO/EN |
| 랭킹 페이지 | 없음 | 18개 × KO/EN |
| 호기심 모음 페이지 | 없음 | 9개 × KO/EN |
| 국가 목록 허브 | 없음 | `/world-map/countries` KO/EN |
| sitemap 내 나라콕 URL | 2 | 국가 목록·대륙·랭킹·호기심 + 1차 공개 30개국 |

색인 대상은 품질 gate 를 통과한 **1차 30개국**으로 제한했다(§4.4).
나머지 165개국은 페이지는 생성되지만 `noindex, follow` 이고 sitemap 에 넣지 않는다.
얇은 페이지를 한꺼번에 색인시키면 사이트 전체 평가가 내려간다 — 애드센스 심사에서
이미 겪은 문제다.

---

## 4. 사람이 해야 하는 작업

코드로 할 수 없어 사용자 확인이 필요한 항목이다.

- **Google Search Console** — `illo.im` 속성에서 새 sitemap 확인 및 색인 요청.
  서비스 계정 `indexing@illo-499705.iam.gserviceaccount.com` 은 `dori-ai.com` 에만
  검증되어 있어 `illo.im` 에는 Indexing API 를 쓸 수 없다(PERMISSION_DENIED).
  이 계정을 `illo.im` 속성의 소유자로 추가해야 자동 색인 요청이 가능하다.
- **네이버 서치어드바이저** — 사이트 소유 확인과 sitemap 제출 상태 확인.
- **28일/90일 KPI baseline** — 위 두 콘솔에 접근해야 기록할 수 있다.
  접근 권한이 없어 이번 보고서에는 추측을 적지 않았다.

---

## 5. 아직 하지 않은 것

- **국가 실제 사진(§10)** — Wikimedia Commons 라이선스 검증과 **사람의 승인**이
  전제다(§10.10 "승인만은 사람이 한다"). 승인 없이 사진을 올리지 않았다.
- **명소 페이지(§10.4)** — 사진이 선행 조건이라 함께 보류.
- **국가별 OG 이미지(§13.1)** — 실제 사진이 있어야 만들 수 있다.
- **Core Web Vitals 필드 데이터(§14)** — CrUX 접근이 필요하다.
