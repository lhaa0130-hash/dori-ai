# My World 상태 매트릭스 (Workstream 1·2)

작성: 2026-07-26 · 근거: 소스 전수 조사 + headless Chrome 실측
원칙: **거짓 표현 금지** — 게스트에게 로그인 사용자처럼 보이는 값, 저장되지 않는데 저장되는 것처럼
보이는 표현, 실패했는데 성공한 것처럼 보이는 표현은 버그로 취급한다.

## 0. 상태의 단일 기준

| 계층 | 소유자 | 값 |
| --- | --- | --- |
| 인증 화면 분기 | `useGameProfile().authState` | `checking` · `guest` · `signed` |
| 원격 read/write 허용 | `lib/myWorld/identity.ts` | `loading` · `guest` · `ready` · `firebase-missing` · `session-missing` |
| 데이터별 상태 | 각 Context | `loading` · `error`(조회) · `saveError`/`writeError`(쓰기) · `offline` · ready |

**`authState`(표시)와 `identity`(권한)를 섞지 않는다.** identity 는 원격 접근을 막는 장치이고,
표시 조건으로 쓰면 헤더는 EXP 를 보여주고 상태 영역은 숨기는 불일치가 생긴다(Phase 2 에서 수정).

---

## 1. 상태표

| # | 상태 | 사용자가 보는 화면 | 허용 행동 | 차단 행동 | CTA | 재시도 | 데이터 원본 | localStorage 역할 | 오류 문구 | 접근성 알림 | 테스트 방법 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | **인증 확인 중** | 월드 바 = 스켈레톤 2줄, 무대·방은 정상 렌더. **게스트 문구·초대 CTA 렌더 안 함** | 캐릭터 터치·행동(로컬) | 원격 read/write | 없음 | 자동(onAuthStateChanged) | 없음(기본 상태) | 캐시 미조회 | — | `aria-busy` + `aria-label="로그인 상태를 확인하는 중"` | `flicker.mjs` — t=120·250ms 에서 `checking=Y guest=n cta=n` |
| 2 | **비로그인 게스트** | 월드 바 "…의 세계를 둘러보는 중 / 만져보고 꾸며볼 수 있어요 · 저장은 안 돼요", 무대 "체험 중" 배지, 상태 영역에 **EXP·레벨 없음**, 무대 아래 초대 1개 | 캐릭터 터치·행동 4종·가구 터치·방 편집(로컬) | 저장·EXP 적립·일기 | `/login?next=/my-world` **한 곳** | — | 로컬 기본값 | 오디오 설정만 | — | 상태 영역 "체험 중이에요. 친밀도와 EXP는 로그인한 뒤부터 저장돼요." | `audit2.mjs guest` — `authState=guest`, 수치 미노출 |
| 3 | **로그인 · 사용자 문서 없음** | 기본 방(러그·침대·책상·화분) + 일기 빈 상태 + 친밀도 0 | 전체 | — | 없음 | — | Firestore(문서 없음) → 도메인 기본값 | 캐시 없음 | — | 빈 상태 문구 | 에뮬레이터 필요 — **미검증** |
| 4 | **신규 사용자, 기본 데이터만** | #3 과 동일 + 월드 바 Lv.1·오늘 미터 0 | 전체 | — | 없음 | — | Firestore | 첫 로드 후 캐시 기록 | — | — | 에뮬레이터 필요 — **미검증** |
| 5 | **기존 사용자, 정상** | 전체 정상 | 전체 | — | 없음 | — | Firestore | 즉시 표시용 캐시 → 원격으로 정정 | — | — | 실계정 필요 — **미검증** |
| 6 | **일부 하위 데이터 누락** | 있는 것만 표시. 방 없음 → 기본 방, 일기 없음 → 빈 상태, 친밀도 없음 → 0 | 전체 | — | 방 0개면 "가구를 놓아 방을 시작해보세요" | — | Firestore 부분 | 부분 캐시 | — | 각 구획 빈 상태 | 에뮬레이터 필요 — **미검증** |
| 7 | **권한 거부** | 일기 = 오류 블록(다시 시도), 방 = 경고 줄(다시 시도), 무대는 로컬 상태 유지 | 로컬 상호작용 | 원격 저장 | "다시 시도" | 버튼(중복 방지 `savingRef`) | Firestore 거부 | 캐시 있으면 유지 + "최신이 아닐 수 있음" 명시 | "일기를 불러오지 못했어요…" / "방을 불러오지 못했어요." — **Firebase 원문 미노출** | `role="alert"` | uid 필요 — **실화면 미검증**(코드·타입 검증만) |
| 8 | **오프라인** | 무대 헤더 "오프라인 · 기기에 저장 중" 배지 | 전체(로컬 큐) | 원격 즉시 저장 | 없음 | `online` 이벤트에 자동 flush(single-flight) | 로컬 큐 | 큐 보관 | — | 배지 텍스트 | `navigator.onLine` 조작 필요 — **미검증** |
| 9 | **네트워크 지연** | 무대 헤더 "저장 중" 배지, 버튼은 활성 유지 | 전체 | — | 없음 | 디바운스 450ms 후 저장 | Firestore | 캐시 먼저 표시 | — | 배지 | — |
| 10 | **Firestore 읽기 실패** | #7 과 동일 경로 | 로컬 | 원격 | "다시 시도" | 버튼 | — | 캐시 우선 | 위와 동일 | `role="alert"` | Firestore 차단 실측 시 게스트는 요청 자체가 없어 진입 불가 |
| 11 | **저장 실패** | 방: 모달 하단 `role="alert"` 빨간 줄 + 상태 배지 "⚠️ 저장 실패". 캐릭터: 월드 알림 "대표 캐릭터를 저장하지 못했어요". 일기: 월드 알림 "일기를 기록하지 못했어요" | 재시도 | — | "저장" 재시도 | 버튼(저장 중 disabled) | — | draft 유지 | 사용자 문구만 | `role="alert"` / `aria-live=polite` | **WS1 에서 신규 노출** — 이전에는 `catch {}` 로 삼켜짐 |
| 12 | **세션 만료** | 월드 바가 게스트로, 방·일기·친밀도 초기화 | 게스트 범위 | 원격 | 초대 CTA | 재로그인 | — | 이전 사용자 캐시 접근 안 함(uid 스코프) | — | — | 로그아웃으로 확인 가능 — **미검증** |
| 13 | **다른 탭에서 변경** | 현재 탭은 모름(동기화 없음) | 전체 | — | 없음 | 새로고침 | Firestore | uid 스코프 캐시 | — | — | **알려진 공백** — cross-tab 동기화 미구현(범위 밖, 아래 §3) |
| 14 | **이전 localStorage 캐시 존재** | 캐시로 즉시 표시 → 원격 도착 시 정정. 원격 실패 시 "최신 방을 불러오지 못했어요. 기기에 저장된 방을 보여주고 있어요." | 전체 | — | "다시 시도" | 버튼 | 캐시 → Firestore | 표시 속도용 | 위 문구 | — | 코드 검증 |
| 15 | **손상된 localStorage** | 캐시를 버리고 기본값으로 시작(조용히) | 전체 | — | 없음 | — | 기본값 | `JSON.parse` 실패 → `null` 반환 | — | — | 6곳 전부 try/catch + normalize 확인(§2) |
| 16 | **이미지 자산 로드 실패** | 이모지 폴백. **깨진 아이콘 없음** | 전체 | — | 없음 | 캐릭터 변경 시 재시도 | `/characters`·`/rooms` | — | — | 캐릭터 이름은 부모 aria-label 이 전달 | **WS1 에서 수정** — 무대·방의 `<img>` 에 `onError` 가 없었다 |
| 17 | **prefers-reduced-motion** | 캐릭터 애니메이션·상승 피드백·알림 등장 애니메이션 정지(정보는 유지) | 전체 | — | 없음 | — | — | — | — | 정적 상태 변화로 전달 | `globals.css` 3규칙 + 에뮬레이션 |
| 18 | **모바일 저성능** | cooldown 시계는 남은 시간이 있을 때만 500ms 간격, 없으면 타이머 없음 | 전체 | — | 없음 | — | — | — | — | — | 코드 검증(§WS11) |

---

## 2. 손상 데이터 방어 실측 (상태 15)

`JSON.parse` 6곳 전부 `try/catch` + 정규화 함수를 통과한다.

| 위치 | 방어 |
| --- | --- |
| `lib/myWorld/character/state.ts:43` | `try/catch` → `null`, `normalizeCharacterState` |
| `lib/myWorld/room/state.ts:85` | `try/catch` → `null`, `normalizeRoomState` |
| `lib/myWorld/interaction/storage.ts:112` | `try/catch` → `null`, `normalizeInteractionState` (주석: "손상된 JSON 방어") |
| `lib/myWorld/rewardOutbox.ts:71` | `try/catch` → `[]` |
| `lib/myWorld/storageScope.ts:64` | `try/catch` → `null` |
| `contexts/InteractionAudioContext.tsx:24` | `try/catch` → 기본값 |

---

## 3. WS1·WS2 에서 실제로 고친 것

### ① 인증 확인 중이 게스트로 위장했다 (거짓 표현 + 깜빡임)

`authState` 를 도입하기 전에는 `loggedIn = status === "authenticated"` 뿐이어서
`status === "loading"` 구간에 **로그인 사용자에게도** 게스트 화면이 보였다:
"만져보고 꾸며볼 수 있어요 · 저장은 안 돼요" + 로그인 초대 CTA.

수정 후 실측(390px, `flicker.mjs`):

| t | checking 스켈레톤 | 게스트 문구 | 초대 CTA | 무대 top | 캐릭터 top |
| --- | --- | --- | --- | --- | --- |
| 120ms | **Y** | n | n | 196 | 401 |
| 250ms | **Y** | n | n | 196 | 401 |
| 400ms | n | Y | Y | 196 | 401 |
| 2500ms | n | Y | Y | 196 | 401 |

무대·캐릭터 위치는 **196 / 401px 로 고정** — 게스트 확정 시 늘어나는 445px 는 전부
무대 **아래로 추가**되며 이미 보고 있던 내용을 밀지 않는다.

### ② 이미지 실패 시 깨진 아이콘 (상태 16)

`CharacterInteractionStage.tsx` 와 `RoomCanvas.tsx` 가 `<img src={character.image}>` 를
직접 렌더하면서 `onError` 가 없었다. `CHARACTER_ASSETS_READY` 를 켠 뒤 파일 하나가 없으면
브라우저 기본 깨진 이미지가 노출된다.
→ 공용 `components/my-world/CharacterImage.tsx` 로 통합:
플래그 확인 · `onError` → 이모지 폴백 · 정사각 비율 예약(레이아웃 흔들림 방지) ·
캐릭터 변경 시 실패 기록 초기화 · 장식일 때 `alt=""`.

### ③ 저장 실패를 Context 가 삼켰다 (상태 11)

| 위치 | 이전 | 이후 |
| --- | --- | --- |
| `CharacterContext.selectCharacter` | `catch { /* 조용히 */ }` | `saveError` 상태 + `clearSaveError` |
| `DiaryContext.addEntry` | `catch { /* 조용히 */ }` | `writeError` 상태 + `clearWriteError` |

표시: 신규 `components/my-world/WorldNotices.tsx` — 월드 바 바로 아래, `aria-live=polite`,
닫기 버튼 제공. Firebase 원문은 Context 단계에서 이미 사용자 문구로 바뀐다.

### ④ 죽은 코드 제거

`WorldHero`(Phase 2 산물, Phase 3 에서 `WorldBar` 로 대체) · `AffinityMeter`(→ `CharacterStatus`) ·
그리고 그 둘만 참조하던 `BackgroundHero` · `CharacterCard` — 참조 0 확인 후 삭제.

---

## 4. 남은 `catch {}` 와 판단

의도적으로 남긴 것(삼켜도 거짓이 되지 않거나, 삼키지 않으면 더 나쁜 경우):

| 위치 | 이유 |
| --- | --- |
| `InteractionContext:123` `hydrateGameData` | 실패해도 캐시 값으로 표시 계속. 실패를 알릴 화면이 없다(수치는 낙관 표시가 아니라 캐시) |
| `InteractionContext:296` `flushRewardOutbox` | 실패 시 **큐를 유지**하는 것이 정답. 사용자에게 알릴 것이 없다 |
| `InteractionContext:109·349` `currentUser` 접근 | Firebase 미초기화 방어. 실패 시 identity gate 가 원격을 막는다 |
| `RoomContext:231` 저장 후 일기 기록 | 일기 실패가 방 저장을 취소하면 안 된다. 실패는 `DiaryContext.writeError` 로 이미 노출됨 |
| localStorage `setItem` 계열 | 저장소 사용 불가(사파리 프라이빗 등)에서 기능을 멈추면 안 된다 |
| `DiaryContext.removeEntry` | UI 호출부 없음(향후) |
| `RoomCanvas` pointer capture | 브라우저 미지원 방어 |

**보상 계약은 건드리지 않았다** — `claimReward` 요청 body·operationId·지급량·cooldown 판정 무변경.

---

## 5. 알려진 공백 (수정하지 않음, 근거 기록)

| 항목 | 이유 |
| --- | --- |
| 상태 13 cross-tab 동기화 | `storage` 이벤트 구독은 새 동기화 계약이 필요하고, 잘못 만들면 다른 탭의 오래된 상태가 최신을 덮을 수 있다. Firestore 실시간 구독은 읽기 비용·보안 계약 영향. 범위 밖 |
| 상태 3·4·5·6·7·10·12 실화면 | 실제 Firebase uid 필요. 에뮬레이터는 JDK 21+ 요구(이 기기 17) |
| 상태 8 오프라인 실화면 | CDP 오프라인 에뮬레이션은 dev 서버 자체를 끊어 페이지 로드가 실패 → 별도 하네스 필요(WS3 에서 fixture 로 대체 검증) |
