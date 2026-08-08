// 공개 노출 스위치 — 애드센스 심사 대비로 특정 섹션을 임시 비공개로 돌릴 때 쓴다.
//
// ⚠️ noindex·robots 만으로는 부족하다. 애드센스 심사원은 사이트를 직접 방문해 읽기 때문에,
//    "숨김"은 ①라우트를 아예 생성하지 않고 ②모든 내부 링크를 지우고 ③사이트맵에서 빼는 것까지다.
//
// [동물도감(몽글로)]  2026-08-04 비공개 전환
//   이유: 카드 1205편 전부가 실제 콘텐츠 400자 미만(중앙값 264자)이고 같은 템플릿이 1205번 반복된다.
//        공개 URL의 92%가 이 얇은 페이지라, 구글이 '대량생성 저품질(scaled content abuse)'로 볼
//        위험이 매우 커서 애드센스 승인의 핵심 걸림돌이었다.
//   데이터는 그대로 보존한다(data/animal-cards.json, public/images/animal). 되살릴 때 손실 없음.
//
//   ▶ 복구 방법(승인 후)
//     1) 이 파일의 SHOW_ANIMAL 을 true 로 바꾼다  → 네비게이션·사이트맵·검색 링크가 되살아난다
//     2) 라우트 폴더 이름을 되돌린다              → 페이지가 다시 생성된다
//          app/_animal    → app/animal
//          app/en/_animal → app/en/animal
//     3) app/admin/page.tsx 와 lib/animal-seo.ts 의 `@/app/_animal/page.client` import 경로도 함께 되돌린다
//     4) robots.ts 는 손댈 것 없다 — 2026-08-08 에 "/animal" disallow 를 이미 뺐다.
//        (막아두면 구글이 404 를 못 봐서 옛 URL 이 색인에 계속 남는 문제가 있었다. robots.ts 주석 참고)
export const SHOW_ANIMAL = false;
