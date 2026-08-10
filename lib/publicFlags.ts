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

// [나라콕(world-map)]  2026-08-10 비공개 전환
//   이유: 동물도감을 내린 8/4 에 `feat(worldmap): add indexable country and taxonomy routes` 가
//        머지되어 8/8 배포로 라이브에 나갔다. 그 결과 **배포 HTML 639개 중 458개(72%)가 /world-map**
//        이 되었다. 국가 상세는 195개국 × ko/en = 390 페이지이고, 전부 같은 CountryArticle 템플릿에
//        데이터만 치환한 것이다(본문 실측: argentina 한글 499자, japan 454자, asia 대륙 286자).
//        즉 동물도감(중앙값 264자 × 1205편)에서 규모만 줄어든 **동일한 scaled content abuse 패턴**이다.
//   ⚠️ 더 나쁜 점: 사이트맵은 130개만 신고하고 나머지 328개는 noindex 였다. 그런데 `/world-map/countries`
//      목록 페이지가 195개국 전부에 링크하므로 심사원은 한 번의 클릭으로 다 볼 수 있었다.
//      2차 거절(2026-07-26)의 최대 교훈이 정확히 "noindex 는 심사에 무효"였는데 그걸 그대로 반복한 것이다.
//   유지 근거도 있었다(World Bank·Wikidata·Natural Earth 라는 확인 가능한 출처, 국가마다 실제로 다른
//   수치, 지도·비교·검색이라는 실사용 효용). 그건 **기능을 보존할 이유**이지 390개 검색용 문서를
//   그대로 둘 이유는 아니다. 그래서 데이터·컴포넌트는 전부 남기고 공개 라우트만 철회한다.
//
//   ▶ 복구 방법(승인 후 — 한 번에 390개를 되살리지 말 것)
//     1) 이 파일의 SHOW_WORLDMAP 을 true 로 바꾼다  → /projects 소개·영문 프로젝트 링크가 되살아난다
//     2) 라우트 폴더 이름을 되돌린다
//          app/_world-map    → app/world-map
//          app/en/_world-map → app/en/world-map
//     3) app/en/_world-map/page.tsx 의 `@/app/_world-map/page.client` import 경로도 함께 되돌린다
//     4) robots.ts 는 손댈 것 없다 — 일부러 "/world-map" disallow 를 넣지 않았다.
//        (막으면 구글이 404 를 못 봐서 옛 URL 이 색인에 계속 남는다. robots.ts 의 2026-08-08 주석 참고)
//     5) ⛔ 국가 상세는 **사람이 편집한 소수(10개국 안팎)부터** 다시 열어라. 기준: 공통 템플릿을
//        제외한 고유 서술 800자 이상. 랭킹 18·신기한나라 9·대륙 6 은 각각 허브 1개로 합치는 게 낫다.
//        영문판은 한국어와 동시에 자동 생성하지 말고 따로 편집한다(얇은 복제가 공개면을 2배로 만든다).
export const SHOW_WORLDMAP = false;

// [/video]  2026-08-10 비공개 전환
//   이유: 7/26 에 큐레이션 110편을 삭제했는데 페이지 껍데기만 남았다. app/video/page.tsx 가
//        getAllCurations() 에서 category === "영상" 을 읽으므로 **구조적으로 항상 0건**이고,
//        정적 HTML 본문이 literally "AI 영상 0개 / 아직 영상이 없습니다" 였다. 그런데 사이트맵에
//        priority 0.8 · daily 로 제출되고 헤더 "AI영상" 메뉴로 링크돼 있었다.
//        "빈 카테고리 = 준비 중 인상"은 7/26 거절 사유로 이미 확인된 항목이다.
//   ▶ 복구: SHOW_VIDEO=true + app/_video → app/video. 단 **영상 콘텐츠를 실제로 채운 뒤에** 열어라.
export const SHOW_VIDEO = false;

// [/community]  2026-08-10 공개 링크·사이트맵에서 제외 (라우트는 유지)
//   이유: 실제 백엔드가 없는 스텁이다. app/community/page.tsx 의 getCommunityPosts() 는
//        `// Dummy function ... return an empty array to show the "no posts" state` 주석이 달린
//        더미이고, 글은 브라우저 localStorage 에만 있다. 로그아웃 상태(=심사원이 보는 화면)의
//        정적 HTML 에는 <main> 자체가 없고 클라이언트 렌더 후 "아직 글이 없어요."만 남는다.
//        그런데 사이트맵에 priority 0.8 · daily 로 제출되고 홈에서 3곳이 링크하고 있었다.
//   ⚠️ 라우트는 지우지 않는다 — MyDashboard 리워드 미션(write_post·write_comment)과
//      constants/missions.ts 가 /community 를 가리키고 있어서, 라우트를 없애면 로그인 회원에게
//      죽은 링크가 생긴다. 대신 ①사이트맵 제외 ②robots disallow(회원 전용 화면 /feed·/profile 과
//      동일한 취급) ③공개 내비게이션 링크 제거로 심사원 동선에서만 뺀다.
//   ▶ 복구: SHOW_COMMUNITY=true → 홈·하단바·퀵바·검색·사이드바 링크가 되살아난다.
//      단 **DB 연동으로 실제 글이 쌓인 뒤에** 열고, 그때 robots.ts 의 "/community" 도 함께 뺀다.
export const SHOW_COMMUNITY = false;

// [/projects]  2026-08-10 사이트맵·상단 내비에서 제외 (라우트는 유지)
//   이유: 나라콕·동물도감을 비공개로 내리자 목록에 남은 '운영 중' 서비스가 0개가 되었다.
//        (대리인:AI비서는 app/projects/page.tsx 의 ADMIN_ONLY_SLUGS 로 비관리자에게 숨김,
//         건축보조·가족정보는 둘 다 status "준비 중")
//        그 결과 페이지 본문이 한글 240자에 **"운영 중 · 0 개"** + "준비 중" 2개가 되어,
//        없애려던 '준비 중' 인상을 이 페이지가 대신 만들게 됐다. 그래서 공개 동선에서 뺀다.
//   ▶ 라우트는 지우지 않는다 — "맞춤 제작 의뢰"(이메일 CTA)라는 실제 사업 기능이 있고,
//     /ai-assistant/intro 가 내부에서 링크한다(사업 페이지 안쪽 동선은 그대로 둔다).
//   ▶ 되살리는 더 좋은 방법 두 가지(둘 중 하나를 하면 SHOW_PROJECTS=true 로 되돌려도 좋다):
//       ① ADMIN_ONLY_SLUGS 에서 "illo" 를 빼서 실제 운영 중인 대리인:AI비서를 노출 → "운영 중 1개"
//       ② 나라콕을 사람이 편집한 소수 국가로 재공개하면 자동으로 "운영 중" 항목이 돌아온다
export const SHOW_PROJECTS = false;
