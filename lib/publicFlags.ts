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
//
//   ✅ 2026-08-15 재공개 — 위 두 방법이 아니라 **세 번째 방법**으로 조건이 풀렸다.
//      팔협 RPG(constants/projectsData.ts 의 slug "palhyup")를 추가했다. 실제로 실행되는 결과물이라
//      '운영 중'이 0개가 아니게 됐고, 이 페이지를 감춘 유일한 이유가 사라졌다.
//      게임 본체는 public/games/palhyup/index.html 이고 외부 요청이 하나도 없는 단일 파일이다.
//      만든 과정은 인사이트 리포트(/insight/article/report-13)로 발행해 상세 페이지에서 링크한다.
//   ⚠️ 다시 0개가 되면(팔협을 내리거나 status 를 바꾸면) 이 플래그도 함께 false 로 되돌려라 —
//      "운영 중 · 0개"가 찍힌 페이지를 상단 메뉴에 걸어두는 것이 애초의 문제였다.
export const SHOW_PROJECTS = true;

// ─────────────────────────────────────────────────────────────────────────────
// [죽은 페이지 일괄 정리]  2026-08-13
//   배포된 181개 페이지를 4개 축(본문 길이 / 사이트맵 포함 / robots 차단 / 인바운드 링크)으로
//   전수 분류한 결과, **어디서도 링크되지 않고 robots 로도 막히지 않은** 페이지들이 나왔다.
//   심사원이 URL 을 직접 치거나 사이트 구조를 훑다가 도달할 수 있는 자리라, 전부 라우트를 회수했다.
//   플래그가 아니라 `_` 접두어 rename 이므로 **접두어만 지우면 그대로 복구된다.**
//
//   ▶ 라우트 회수 목록 (앞의 숫자는 정리 시점의 실측 본문 한글자수)
//        3자   app/ai-assistant/control-tower → _control-tower   (noindex, 인바운드 0)
//        3자   app/flat-form                  → _flat-form       (noindex, 인바운드 0)
//       24자   app/academy                    → _academy
//      180자   app/my-world                   → _my-world
//      348자   app/talent                     → _talent          (noindex)
//
//   ⛔ /at 과 /post 는 회수했다가 **같은 날 되돌렸다. 다시는 지우지 마라.**
//      본문 5자·9자에 인바운드 링크 0이라 죽은 페이지로 보이지만, 실제로는 public/_redirects 의
//      rewrite 목적지다.  `/@<사용자명> → /at 200`,  `/post/<id> → /post 200`
//      즉 개인 홈과 게시물 상세를 그리는 **단일 렌더러**이고, 경로는 클라이언트가 읽어 처리한다.
//      정적 export 라 사전 생성이 불가능해서 이런 구조를 쓴 것이다.
//      지우는 순간 /@사용자명 과 /post/<id> 가 전부 404 가 된다(= SNS 기능 전멸).
//      HTML 링크를 세는 감사로는 절대 안 보인다 — rewrite 는 <a href> 로 존재하지 않는다.
//      scripts/adsense-quality-gate.mjs 검사 6 이 이걸 배포 전에 잡도록 추가해 뒀다.
//
//   ▶ 미니게임 5종 — 허브(/minigame)의 링크 목록에 없어 인바운드가 0이었다. 사이트맵에도 없다.
//        app/minigame/{dungeon, illo-tower, mart, tetris, typing} → 각각 `_` 접두어
//      ⚠️ 나머지 18종(허브에서 링크되는 것)은 **그대로 둔다**. 캔버스 게임이라 본문 글자수는
//         적지만 실제로 동작하는 기능이고, 애드센스 품질 게이트도 THIN_ALLOWED 로 예외 처리한다.
//      ▶ 복구할 때는 접두어를 지우는 것으로 끝내지 말고 **허브 목록에 반드시 링크를 추가**해라.
//         링크 없이 되살리면 지금과 똑같은 고아 페이지가 된다.
//
//   ▶ 함께 정리한 것
//      · public/flatform-app/  → _archive/flatform-app/   (/_flat-form 이 iframe 으로만 쓰던 정적 앱.
//                                 public 밖으로 빼서 배포에서 제외. 복구는 public/ 으로 되돌리면 끝)
//      · components/home/MiniGameSection.tsx  삭제 — 어디서도 렌더링되지 않는 죽은 컴포넌트였고,
//                                 하필 지금 회수한 /minigame/typing 을 링크하고 있었다.
//      · public/thumbnails/{trend,video,curation}  삭제 (300장·48MB) — 7/26 에 지운 섹션의 잔여 이미지.
//                                 실제로 쓰이던 1장(trend/report-01.png)만 thumbnails/reports/ 로 옮기고
//                                 content/reports/report-01.md 의 경로도 함께 고쳤다.
//      · content/projects/ (6편)·app/robots.txt.bak  삭제 — 이미 404 이거나 빌드에 안 들어가던 잔재.
//
//   ▶ public/ 안의 고아 정적 파일도 함께 정리 (라우트가 아니라서 app/ 만 봐서는 안 보인다)
//      · public/talent/index.html  삭제 — app/talent 를 회수해도 이게 그대로 /talent 를 서빙했다.
//        348자에 참조 0곳, robots 로도 안 막혀 있어 **심사원이 도달 가능한 상태였다.**
//      · public/games/boss/        삭제 (41MB) — 어떤 라우트도 참조하지 않는 유니티 빌드.
//        (/minigame/boss 가 쓰는 건 boss-clicker 다. 이름이 비슷해 남아 있던 것으로 보인다)
//      · public/games/illo-tower/  삭제 (33MB) — 위에서 회수한 _illo-tower 전용.
//        ▶ _illo-tower 를 되살릴 때 이것도 같이 복구해야 게임이 뜬다.
//      ⛔ public/games 의 나머지 6종(boss-clicker·cute-2048·galaxy-merge·gem-match·quick-draw·
//         tower-def)은 살아있는 /minigame/* 이 iframe 으로 쓴다. 지우면 게임이 깨진다.
//
//      ▶ 삭제분 복구:  git checkout <이 커밋의 직전 해시> -- <경로>
//
//   ⛔ /google4467f118f8497801 은 본문 0자지만 **절대 지우지 마라** — 서치 콘솔 소유권 확인 파일이다.
