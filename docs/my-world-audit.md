# My World 구조·디자인 전수 조사 (2026-07-26)

기준 커밋: `origin/main` = `d1faa790f3c`
브랜치: `refactor/my-world-structure-design`
측정 방법: 로컬 `next dev`(3210) + headless Chrome CDP 실측. 추측 없이 재현된 것만 기록한다.

---

## 1. 파일 책임표

### 진입점 / 조립

| 파일 | 책임 | 주요 호출 |
| --- | --- | --- |
| `app/my-world/page.tsx` | Provider 5중 중첩, Hero 마크업, 게임 프로필 상태(level/tier/exp/candy), 카드 6장 배치, 캐릭터 선택 모달 | `useAuth`, `getCachedGameProfile`, `getCottonCandyBalance`, `hydrateGameData`, `calculateLevelProgress` |

### 상태 (contexts)

| 파일 | 책임 | 원격 접근 | 비고 |
| --- | --- | --- | --- |
| `contexts/AuthContext.tsx` | Firebase Auth 구독 → `session`/`status` | Firestore `users/{uid}` 생성 | My World 밖 공용. 변경 금지 대상 |
| `contexts/CharacterContext.tsx` | 대표 캐릭터 선택·저장 | `getCharacterState`/`saveSelectedCharacter` | `uid()`를 effect 본문에서 읽고 deps 는 `session.user.email` |
| `contexts/DiaryContext.tsx` | 일기 조회/추가/삭제 | `getDiaryState`/`addDiaryEntry` | **오류를 전부 삼킴 → 화면에 실패 표시 수단 없음** |
| `contexts/RoomContext.tsx` | `savedRoom`/`draftRoom` 분리, 편집 명령 18종, 저장 | `loadRoomState`/`saveRoomState` | 저장 오류는 있으나 **로드 오류 상태 없음** |
| `contexts/InteractionContext.tsx` | 상호작용 판정·감정·애니메이션 큐·알림·서버 보상 청구·오프라인 큐 | `loadInteractionState`/`saveInteractionState`, `claimReward` | P0 보안 작업으로 Identity Gate 적용됨. **이 트랙에서 로직 변경 금지** |
| `contexts/InteractionAudioContext.tsx` | 효과음 mute/volume | localStorage | — |

### 도메인 (lib/myWorld)

| 파일 | 책임 |
| --- | --- |
| `identity.ts` | 원격 read/write 게이트(순수). Firestore 문서 ID 기준은 Firebase UID |
| `storageScope.ts` | 인증된 스코프 생성 |
| `rewardOutbox.ts` | 보상 청구 재시도 큐 — **cottonCandy 브랜치와 충돌 파일** |
| `character/{registry,state,types,utils}.ts` | 캐릭터 12종 카탈로그·상태·희귀도 |
| `diary/{constants,state,types,utils}.ts` | 일기 엔트리 빌더·그룹핑·시간 포맷 |
| `interaction/{constants,engine,catalog,emotion,state,storage,animation,events,diaryTrigger,types}.ts` | 보상 수치·cooldown·감정·반응 카탈로그·동기화 |
| `room/{registry,state,constants,calculations,utils,types}.ts` | 가구 12종·기본 방·좌표 계산(퍼센트) |

### 표시 (components/my-world)

| 파일 | 크기 | 책임 | 문제 |
| --- | --- | --- | --- |
| `interaction/CharacterInteractionStage.tsx` | 9.9KB | 방 무대 + 캐릭터 터치/롱프레스/더블탭 + 친밀도 + 감정 + 행동 4개 + 효과음 설정 | **한 컴포넌트가 6개 관심사를 겸함** |
| `interaction/InteractionNotices.tsx` | 1.4KB | 보상 알림을 방 무대 위에 절대배치 | **캐릭터를 최대 80% 가림(실측)** |
| `interaction/SpeechBubble.tsx` | 1.0KB | 말풍선 | 캐릭터와 겹치지 않음(실측 확인) |
| `interaction/AffinityMeter.tsx` | 1.7KB | 친밀도 바 | 정상 |
| `room/RoomPreviewCard.tsx` | 2.5KB | 방 축소 미리보기 + 편집 진입 | **무대와 동일한 방을 두 번 렌더 → 데스크톱 565px 중복** |
| `room/RoomEditorModal.tsx` | 10KB | 편집 모달(캔버스·툴바·팔레트·확인·로그인 유도) | 팔레트 고정 `h-56` → 아이템 행이 잘림 |
| `room/RoomCanvas.tsx` | 8.2KB | 공용 렌더러(미리보기/편집 공용) | **가구가 `tabIndex=-1` → 키보드로 선택 불가** |
| `room/RoomToolbar.tsx` | 3.5KB | 선택 가구 편집 | 44px 타깃 준수(양호) |
| `room/RoomItemPalette.tsx` | 3.5KB | 카테고리·검색·그리드 | 검색 input 32px |
| `DiaryCard.tsx` | 4.6KB | 일기 타임라인 | **오류 상태 없음**, 비로그인 안내 문구가 390px에서 쪼개짐 |
| `RecentActivityCard.tsx` | 1.4KB | 최근 활동 | **placeholder — 데이터 소스 없음(항상 빈 상태)** |
| `CreationsCard.tsx` | 1.2KB | 오늘 만든 작품 | **placeholder — 항상 빈 상태** |
| `AchievementsCard.tsx` | 1.8KB | 업적 | **placeholder — 6개 전부 자물쇠 고정** |
| `BackgroundHero.tsx` / `CharacterCard.tsx` / `CharacterAvatar.tsx` / `CharacterSelectModal.tsx` | — | Hero·아바타·선택 모달 | 정상 |

### 사용되지 않는 코드

- `RoomContext.updateItem`, `reloadRoom` — context 로 노출되지만 UI 호출부 없음(향후 확장 여지, 삭제하지 않음).
- `RecentActivityCard`/`CreationsCard`/`AchievementsCard` 의 props 는 어디서도 전달되지 않음(전부 기본값).
- 실제 dead export 는 발견되지 않음.

---

## 2. 실측 결과 (before)

전 breakpoint 공통: **가로 스크롤 0**, `main` 최대폭 640px(`max-w-2xl`).

| breakpoint | 문서 높이 | 행동 버튼 | 44px 미달 인터랙티브 |
| --- | --- | --- | --- |
| 1440 | 3235px | 144×41, 1줄 | 10개 |
| 1024 | 3235px | 144×41, 1줄 | 10개 |
| 768 | 3115px | 144×41, 1줄 | 10개 |
| 390 | 2850px | 142×44, 1줄 | 1개 |
| 360 | 2841px | 127×44, 1줄 | 1개 |

### 2-1. 보고된 문제 중 **재현되지 않은** 것

- `쓰다듬기`/`인사하기`/`선물하기`/`재우기` 버튼의 줄바꿈 → **5개 breakpoint 전부 1줄.** 현재 main 에서는 발생하지 않는다.
- 가로 스크롤 → **전 breakpoint 0px.**

### 2-2. 보고된 문제 중 **재현된** 것

**① 상호작용 결과가 캐릭터를 가린다 (최우선)**
`쓰다듬기`→`인사하기`→`선물하기` 연속 실행 후 실측:

| 뷰포트 | 동시 알림 수 | 캐릭터 면적 가림 |
| --- | --- | --- |
| 360 | 3개 | 5% + **80%** |
| 390 | 2개 | 20% + **72%** |

원인: `InteractionNotices` 가 방 무대 안쪽 `absolute inset-x-3 bottom-3` 에 세로 스택으로 쌓이고, 캐릭터는 같은 무대의 `top:82%` 에 있다. 알림 3개가 쌓이면 무대 전체가 알림 벽이 된다.

**② 좁은 카드 안에 상태가 동시에 표시됨**
`함께 놀기` 카드 하나가 방·캐릭터·친밀도·감정·행동4개·효과음 설정을 모두 담는다(모바일 494px, 데스크톱 688px).

**③ 핵심 행동과 부가 정보의 우선순위 불명확**
카드 6장이 전부 `sm:col-span-2` 로 강제되어 2열 그리드가 무의미하다. 이 중 3장(`최근 활동`·`오늘 만든 작품`·`업적`)은 데이터 소스가 없는 placeholder 로, 데스크톱에서 610px, 모바일에서 655px 를 차지하며 실제 기능을 아래로 밀어낸다.

**④ 방이 두 번 렌더된다**
`함께 놀기` 무대와 `내 방` 미리보기가 같은 `savedRoom` 을 같은 렌더러로 그린다(1440 캡처에서 동일한 그림 2개). 데스크톱 565px 중복.

**⑤ 모바일에서 수치가 작다**
`효과음 설정` summary 18px, 볼륨 슬라이더 16px, `로그인` 링크 31px, `방 꾸미기` 31px. 768(터치 태블릿)에서 44px 미달 10개.

### 2-3. 추가로 발견된 문제

- **키보드로 가구를 선택할 수 없다.** 편집 모달 실측: 가구 4개, 포커스 가능 가구 **0개**. 방향키 nudge·Delete 는 "선택된 가구"가 있어야 동작하는데 선택 수단이 포인터뿐이다.
- **일기 실패가 보이지 않는다.** `DiaryContext` 가 `catch {}` 로 삼켜서, 권한 오류·네트워크 오류가 "빈 상태"와 구별되지 않는다.
- **방 로드 실패도 보이지 않는다.** `RoomContext` 는 저장 오류만 노출한다.
- **cooldown 을 미리 알 수 없다.** 사용 불가 상태가 버튼에 표시되지 않고, 누른 뒤에야 "N초 뒤에 다시 해주세요" 알림으로 알려준다.
- **일일 보상 상한**(친밀도 20 / EXP 40)에 도달해도 버튼은 그대로 활성이며, 누른 뒤 알림으로만 안내된다.
- 팔레트 컨테이너가 `h-56` 고정이라 360px 화면에서 가구 썸네일 행이 중간에서 잘린다.
- `업적` 6개가 항상 자물쇠라 정보량이 0이다.
- (My World 밖) 첫 방문 팝업 `OpenPopup` 이 390px 에서 뷰포트를 넘어간다 — **이 트랙 범위 밖**, 별도 보고.

### 2-4. console

My World 진입 시 발생하는 오류: **0건**. 경고 2종은 전역 레이아웃 기인이며 My World 코드와 무관하다.
- LCP 이미지 `priority` 경고(홈 썸네일)
- Google 광고 iframe 의 report-only CSP `frame-ancestors` 위반

---

## 3. 정보구조 재배치 (Phase 2)

실제 존재하는 기능만 재배치한다. 없는 기능은 추가하지 않는다.

| 그룹 | 내용 | 노출 방식 |
| --- | --- | --- |
| 1. 현재 상태 | 캐릭터·희귀도·닉네임·티어·Lv·솜사탕·오늘의 한마디 | Hero, 항상 |
| 2. 함께 놀기 | 방 무대(캐릭터 터치/롱프레스/더블탭/가구 터치) + **EXP·친밀도·감정 단일 상태 영역** + 행동 4개 | 항상 |
| 3. 내 방 | 가구 수·저장 상태·편집 진입 (무대가 이미 방을 보여주므로 미리보기 중복 제거) | 항상, 슬림 |
| 4. 기록 | AI 일기 | 항상 |
| 5. 부가 | 최근 활동 · 오늘 만든 작품 · 업적 · 효과음 설정 | **접힘(progressive disclosure)** |

placeholder 3장을 삭제하지 않고 접힌 그룹으로 옮긴다 — 기능·의미는 유지하고 우선순위만 낮춘다.

---

## 4. 목표 코드 구조 (Phase 3)

현재 구조가 이미 `page → components → contexts → lib` 로 분리돼 있으므로 **최소 안전 변경**을 택한다. 새 전역 상태 라이브러리는 도입하지 않는다.

```
app/my-world/page.tsx          조립 + Provider 중첩만 (마크업·상태 제거)
components/my-world/
  WorldHero.tsx                (신규) Hero 마크업 — page.tsx 에서 분리
  WorldExtras.tsx              (신규) 부가 그룹 접힘 컨테이너
  interaction/
    CharacterInteractionStage.tsx  무대 + 조립 (관심사 3개로 축소)
    CharacterStatus.tsx        (신규) EXP·친밀도·감정 단일 상태 영역
    InteractionActions.tsx     (신규) 행동 4개 + cooldown/사유 표시
    WorldFeedback.tsx          (신규) 보상 피드백 — 무대 밖, 병합 표시
    InteractionNotices.tsx     (삭제) WorldFeedback 로 대체
hooks/my-world/
  useGameProfile.ts            (신규) level/tier/exp/candy 조회 — page.tsx 에서 분리
lib/myWorld/interaction/
  availability.ts              (신규) 순수 함수: cooldown·일일상한 → 행동 가능 여부
```

원칙 적용:
- Firebase 호출은 표시 컴포넌트에 새로 넣지 않는다(기존 위치 유지).
- localStorage 접근은 `lib/` 안에 머문다.
- `any` 신규 도입 0.
- 보상 API 호출 코드는 **복사하지 않는다** — `InteractionContext` 의 기존 경로만 사용한다.
- listener/timer 는 기존 cleanup 패턴을 유지한다.

---

## 5. 디자인 토큰 정리 (Phase 4)

현재 크림·오렌지(`#F9954E`)·핑크 계열을 유지한다. 재디자인이 아니라 값의 통일이다.

| 항목 | 현재 | 정리 후 |
| --- | --- | --- |
| 카드 radius | `rounded-3xl` 일관 | 유지 |
| 카드 padding | `p-4 sm:p-5` / `p-5` 혼용 | `p-4 sm:p-5` 통일 |
| 카드 제목 | 15px / 16px 혼용 | 15px(`font-extrabold`) 통일 |
| 본문 | 13px | 유지 |
| 보조 문구 | 10/11/12px 혼용 | 11px 통일(배지 10px 유지) |
| 버튼 높이 | 31 / 32 / 41 / 44px 혼용 | 인터랙티브 최소 44px |
| 아이콘 버튼 | 32px | 40px(모바일 44px) |
| 상태색 | 저장됨 emerald / 수정됨 오렌지 / 실패 red | 유지 + 아이콘 병기(색 단독 금지) |
| focus ring | `focus-visible:outline-[#F9954E]` 일부만 | 전 인터랙티브 요소 적용 |
| breakpoint | `sm`(640) 중심 | 그리드는 `md`(768)에서 2열 |

---

## 6. cottonCandy P0 브랜치와의 충돌 분류

`security/p0-cotton-candy-authority` 가 수정하는 29개 파일과 대조한 결과:

**충돌 없음 — 자유롭게 구현**
`app/my-world/page.tsx`, `components/my-world/**`(전체), `contexts/CharacterContext.tsx`, `contexts/DiaryContext.tsx`, `contexts/RoomContext.tsx`, `contexts/InteractionAudioContext.tsx`, `hooks/**`, `lib/myWorld/interaction/**`, `lib/myWorld/room/**`, `lib/myWorld/diary/**`, `lib/myWorld/character/**`, `docs/my-world-audit.md`

**낮은 충돌 — 별도 커밋으로 격리**
`contexts/InteractionContext.tsx` — 파일 자체는 cottonCandy 가 수정하지 않지만 `lib/rewardClient.ts`·`lib/cottonCandy.ts`·`lib/myWorld/rewardOutbox.ts`(모두 충돌 파일)의 API 를 사용한다. 이 트랙에서는 **보상·identity 로직을 건드리지 않고**, 알림 문구 생성부만 필요한 최소 범위로 다룬다.

> 재대조(cottonCandy tip `62efd695add` 기준): 두 브랜치가 수정하는 파일의 **교집합 0건**.

**높은 충돌 — cottonCandy 병합 후로 보류**
`lib/cottonCandy.ts`, `lib/rewardClient.ts`, `lib/myWorld/rewardOutbox.ts`, `components/my/MyDashboard.tsx`, `firestore.rules`, `functions/**`, `tests/emulator/myworld-integration.test.ts`, `tests/reward-cutover-guard.test.ts`
→ **이 트랙에서 수정하지 않는다.** `useGameProfile` 은 main 에 이미 존재하는 export(`getCachedGameProfile`·`getCottonCandyBalance`·`hydrateGameData`)만 호출한다(page.tsx 가 이미 쓰던 것과 동일).

---

## 7. 개선 결과 (after 실측)

같은 측정 스크립트·같은 환경(`next dev`, headless Chrome CDP)에서 재측정했다.

### 7-1. 반응형 / 레이아웃

| 항목 | before | after |
| --- | --- | --- |
| 가로 스크롤 (5개 breakpoint) | 0px | 0px (유지) |
| 행동 버튼 줄바꿈 | 없음 | 없음 (`whitespace-nowrap` 으로 못 박음) |
| 44px 미달 인터랙티브 (1440/1024/768) | 10개 | **0개** |
| 44px 미달 인터랙티브 (390/360) | 1개 | **0개** |
| 행동 버튼 크기 (360) | 127×44 | 127×51 |
| 행동 버튼 크기 (1440) | 144×**41** | 144×56 |
| 문서 높이 360 | 2841px | **2059px** (−27%) |
| 문서 높이 390 | 2850px | **2031px** (−29%) |
| 문서 높이 768 | 3115px | **2132px** (−32%) |
| 문서 높이 1440 | 3235px | **2252px** (−30%) |
| `내 방` 카드 높이 (1440) | 565px | **115px** |

### 7-2. 겹침 (핵심 문제)

`쓰다듬기`→`인사하기`→`선물하기` 연속 실행 후 캐릭터가 가려지는 비율:

| 뷰포트 | before | after |
| --- | --- | --- |
| 360 | 5% + **80%** | **0%** |
| 390 | 20% + **72%** | **0%** |

피드백을 무대 밖 전용 줄로 내렸으므로 구조적으로 겹칠 수 없다. 말풍선은 무대 상단에 남아 있고 캐릭터와 겹치지 않는다(before/after 모두 확인).

### 7-3. 접근성

| 항목 | before | after |
| --- | --- | --- |
| 편집 모달에서 키보드로 선택 가능한 가구 | **0 / 4** | **4 / 4** |
| 44px 미달 터치 타깃(편집 모달) | 다수 | 0 |
| 저장 실패 문구 모바일 노출 | 숨김(`hidden sm:inline`) | 노출(`role="alert"`) |
| 상태 전달 방식 | 색 단독(저장됨/수정됨/실패) | 색 + 아이콘 + 문장 |
| reduced motion | 캐릭터만 | 캐릭터 + 보상 피드백 |

### 7-4. 성능

| 항목 | before | after |
| --- | --- | --- |
| `/my-world` route JS | 28.7 kB | 31.6 kB (+2.9) |
| First Load JS | 261 kB | 264 kB (+3) |
| DOM 노드(문서 전체, 390) | 568 | 567 |
| 방 캔버스 렌더 수 | **4** (미리보기+무대 중복) | **2** |
| 새 런타임 의존성 | — | **0개** |

번들이 약 3 kB 늘었다. 상태 영역·cooldown 계산·섹션 오류 경계가 추가된 대가이며, 새 패키지는 도입하지 않았다. 방 캔버스 중복 렌더가 사라져 초기 페인트 작업량은 줄었다.

### 7-5. 검증

- 단위 테스트 **160 pass / 0 fail** (기존 153 + 신규 7)
- `tsc --noEmit` 오류 **26개 → 26개** (전부 기존 오류, My World 관련 신규 0)
- `next build` 성공, `/my-world` 프리렌더 정상
- My World 진입 시 console 오류 **0건**(경고 1건은 홈 썸네일 LCP 힌트로 무관)
- `git diff --check` 통과, secret scan 통과

### 7-6. 이 환경에서 실행하지 못한 검증

- **Firebase 에뮬레이터 스위트**(`npm run test:my-world:emulator`) — firebase-tools 가 JDK 21+ 를 요구하고 이 기기는 JDK 17 이다. 로그인 상태의 Room/Diary/Interaction 영속화 회귀는 **미검증**.
- **ESLint** — 저장소의 `eslint.config.mjs`(flat config)와 설치된 eslint 8.57 이 맞지 않아 `origin/main` 에서도 동일하게 실패한다. 이 트랙에서 고치지 않았다(설정·의존성 변경 회피).
- **로그인 사용자 UI 검증** — 실제 계정 로그인은 수행하지 않았다. 비로그인(체험 모드) 경로만 브라우저로 확인했다.

### 7-7. 범위 밖에서 발견한 문제 (별도 처리 권장)

- 첫 방문 팝업 `components/layout/OpenPopup.tsx` 이 390px 에서 뷰포트를 넘어간다(모달이 오른쪽으로 잘림). My World 컴포넌트가 아니므로 이 트랙에서 수정하지 않았다.
