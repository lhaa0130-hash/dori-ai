# 재화·소유권 Writer 전수 재감사 (Phase 1)

기준 `2ed304b9463` · 도구 `scripts/audit-writer-scan.mjs` (감사 브랜치 신규)

대상 필드: `cottonCandy` `cottonCandyTotal` `ownedItems` `isPremium` `premium` `premiumUntil`
`purchasedItems` `inventory` `unlockedItems` `membership` `candyDailyTotal`

**총 327줄 / 51개 파일**을 10종으로 분류했다. 정규식 1회로 끝내지 않고
(a) **멀티라인 쓰기 블록** 스캔과 (b) **호출 그래프 추적**을 별도로 수행했다.

---

## 1. 분류 결과

| # | 분류 | 줄 | 파일 | 비고 |
|---|---|---|---|---|
| 1 | 서버 권위 writer | 45 | 5 | `functions/api/{claim-reward,purchase,admin/grant}.ts` + `_shared/{rewardPolicy,shopCatalog}` |
| 2 | **클라이언트 직접 Firestore writer** | **0** | **0** | ✅ 스캔 exit 0 |
| 3 | 읽기·표시 전용 | 119 | 31 | UI 렌더·캐시 조회 |
| 4 | 테스트 전용 | 109 | 9 | |
| 5 | 죽은 코드 | 1 함수 | 1 | `purchaseItem`(deprecated, 호출 0) |
| 6 | 문서·주석 | 40 | 17 | |
| 7 | build 산출물 | 2 | 2 | `.open-next/**` — **아래 §5 주의** |
| 8 | 위험한 legacy writer | **0** | 0 | `fsAddCandy`·`applyPendingCandyGrants` **정의 자체가 제거됨** |
| 9 | scripts/도구 | 2 | 1 | 이번 감사 스캐너 |
| 10 | 관리자 전용 | (1 에 포함) | | `functions/api/admin/grant.ts` |
| L | localStorage 캐시 writer | 2 | 1 | `lib/cottonCandy.ts` — 표시 전용 |
| R | Rules 방어 | 10 | 1 | `firestore.rules` |

### 멀티라인 쓰기 블록 스캔 (줄 단위 정규식의 사각지대)

`setDoc(`/`updateDoc(`/`addDoc(`/`runTransaction(`/`writeBatch(`/`increment(` 호출부터
**괄호 균형이 맞는 지점까지**를 블록으로 잡아 그 안에 재화 필드가 있는지 검사.

> 결과 **1건**: `contexts/AuthContext.tsx:85` — `setDoc(… cottonCandy: 100, cottonCandyTotal: 100 …)`
> = **가입 시 사용자 문서 최초 생성**(분류 10-b: 초기 문서 생성). Rules `usersRewardsSafeOnCreate` 가 ≤100 으로 상한.
> 다른 재화 필드 멀티라인 쓰기 **0건**.

### 잔존 `increment()` 호출 (재화 아님 확인)

`ArticleSocial`(좋아요) · `analytics`(UV/PV) · `social`(조회·좋아요·댓글수·방문) · `userAnimals`(좋아요).
**전부 카운터이며 재화·소유권과 무관.**

---

## 2. 필수 질문 — 증거로 답한다

### Q1. 클라이언트가 Firestore `increment` 를 직접 호출하는 재화 경로가 정말 0개인가?
**0개.** 스캐너 exit 0. `fsAddCandy` 는 **정의가 삭제**됐다(`git grep "function fsAddCandy" HEAD` → 0곳).
남은 `increment()` 는 전부 비재화 카운터(위 목록).

### Q2. 클라이언트가 절대값 merge 로 재화를 덮을 수 있는가?
**코드 경로 없음.** `spendCottonCandy`(L376)·`recordCandyHistory`(L309) 모두
Firestore 쓰기 **0** / localStorage 쓰기 2 — 표시용 캐시만 만진다.
단 **콘솔에서 직접 SDK 를 호출하는 것은 코드와 무관**하며, 그 방어는 Rules 다(→ §3).

### Q3. `ownedItems` 를 직접 추가할 수 있는가?
**신규 코드에는 없다.** `ownedItems` 참조는 전부 읽기(프로필·상점 표시)이거나 주석이다.
쓰기는 `/api/purchase` 서버 트랜잭션 뿐. Rules 도 `rewardFieldNames()` 에 포함해 잠근다.

### Q4. `premium` 을 localStorage 값만으로 얻을 수 있는가?
**표시상으로만 가능하고, 권한으로는 불가능하다.**
`isPremiumUser()`(L771)는 `getCachedGameProfile(email)?.isPremium` — 로컬 캐시다.
그러나 유일한 소비자 `purchaseItem`(L781)은 **`@deprecated`·호출 0곳**이고 localStorage 만 쓴다.
실제 구매는 `/api/purchase` 가 **서버 문서**의 `u.isPremium === true` 만 본다.
→ 캐시를 조작하면 UI 가 "프리미엄"으로 보이지만 **실제 무료 구매는 서버가 거부**한다.

### Q5. 사용자 문서 create 시 보상 필드를 조작할 수 있는가?
**신규 Rules 아래에서는 상한 안에서만.** `usersRewardsSafeOnCreate`:
`cottonCandy ≤ 100` · `cottonCandyTotal ≤ 100` · `doriExp == 0` · `level/tier ≤ 1`,
그리고 `isPremium/ownedItems/candyDailyTotal/rewardType*` 계열은 **키가 있기만 해도 거부**.

> **삭제 후 재생성 파밍 검토** — 사용자는 자기 문서를 `delete` 할 수 있다(Rules L84).
> 재생성하면 `candyDailyTotal`·`rewardTypeCandy_*` 집계가 리셋되어 전역 상한 600 이 되살아난다.
> **그러나 Firestore 는 문서 삭제 시 하위 컬렉션을 지우지 않는다** →
> `users/{uid}/rewardOperations/{opId}` 와 `rewardClaims/{claimId}` 원장이 살아남아
> 같은 operationId 재청구는 `duplicate:true` 로 막힌다.
> 게다가 재화가 붙은 타입은 전부 **1일 1회(minigame_play·mission_complete)** 또는 **평생 1회(achievement/level)** 라
> 하루치 operationId 집합이 이미 소진돼 있다. 잔액은 100 으로 **줄어들기만** 한다.
> ⇒ **파밍 불가**. (Phase 5 에서 에뮬레이터 재현 테스트로 고정)

### Q6. Rules 배포 **전인 현재** 어떤 직접 쓰기를 허용하는가?
**구버전 Rules 는 재화 직접 쓰기를 전부 허용한다.** 즉 병합 후에도 오늘 기준
`cottonCandy`·`ownedItems`·`isPremium` 을 콘솔에서 임의 변경할 수 있다.
→ **병합은 재화 P0 를 닫지 않았다.** 서버 방어를 배치했을 뿐이다.

### Q7. 신규 client 배포 후 Rules 배포 **전**의 위험 창은?
- 정상 UI 경로는 전부 서버 권위가 된다(클라 직접 쓰기 코드가 없어짐).
- 그러나 **브라우저 콘솔에서 Firebase SDK 를 직접 호출하는 공격 창은 그대로 열려 있다.**
- 즉 이 구간의 위험은 "일반 사용자"가 아니라 "SDK 를 직접 부르는 사용자"에 한정된다.
- 이 창을 **최소화하려면 client 배포와 Rules 배포 간격을 짧게** 가져가야 한다(→ Phase 16).

### Q8. Rules 배포 후 구버전 client 가 깨지는 경로는?
Rules 를 먼저 배포하면 구버전 client 의 `fsAddCandy`·`purchaseShopItem(price)`·
`ownedItems` 직접 쓰기가 **전부 `permission-denied`** 가 된다.
사용자 화면에서는 미니게임 보상·상점 구매가 **조용히 실패**하거나 오류 토스트가 뜬다.
⇒ **Rules 를 client 보다 먼저 배포하면 안 된다.** (runbook 의 "코드 먼저, Rules 마지막" 근거)

### Q9. 출석 솜사탕은 왜 별도 계약으로 안전한가?
`claim-reward.ts:147-201` — 금액(`computeAttendanceReward`)·날짜(`todayKST(new Date())`)·
멱등(`rewardClaims/{claimId}`, `requireNotExists`)을 **전부 서버가 소유**한다.
클라이언트는 `rewardType` 만 보낸다. sourceId 도 operationId 도 받지 않는다.
따라서 `CANDY_ROLLOUT_MODE` 게이트 **밖**에 두어도 조작 여지가 없다(05-06P 부터 운영 중인 기존 동작).

### Q10. 관리자 기능 비활성이 일반 사용자 기능에 영향을 주는가?
**없다.** `/api/admin/grant` 는 별도 파일·별도 allowlist 이며,
`claim-reward`·`purchase` 어느 쪽도 `REWARD_ADMIN_UIDS` 를 참조하지 않는다.
영향은 `/admin` 화면의 **솜사탕 지급 버튼·프리미엄 토글 2개**뿐이고 크래시 없이 안내 토스트가 뜬다.
(실측: 유효 형식 토큰 → `503 reward_admin_not_configured`)

---

## 3. Rules 계층의 잔존 이슈 (재화와 무관하지만 기록)

| 위치 | 내용 | 등급 |
|---|---|---|
| `firestore.rules:6` | `isAdmin()` 이 **email 기준**(`request.auth.token.email == '…'`) | **P2** |
| `firestore.rules:372-373` | `visits/{uid}.pendingCandy/pendingPremium` — 관리자 지급 **폴백 경로** 잔존 | **P2** |
| `firestore.rules:375` | `visits/{uid}/days/{date}` → `allow write: if true` (미인증 쓰기) | **P2** |

**`isAdmin()` email 판정** — 서버 endpoint 는 05-08C 에서 email 판정을 완전히 제거했지만,
**Rules 계층은 여전히 email 이다.** 다만:
- 재화 필드는 `usersRewardsUnchangedOnUpdate` 가 **isAdmin 도 예외 없이** 잠근다.
- 재화형 알림 위조는 `notificationIsSafe()` 가 **isAdmin 분기에도 적용**된다.
- 따라서 email 을 위조해도(=해당 주소로 계정 생성) **재화를 만들 수는 없다.**
- 실제 위조 난이도: 그 주소는 소유자 계정이 점유 중이라 Firebase 가 `updateEmail` 을 거부한다.
⇒ 즉시 위험은 아니지만 **"관리자 계정이 사라지면 주소가 풀린다"** 는 05-07B #5 와 같은 구조적 약점이다.
→ 후속 과제: Rules `isAdmin()` 도 UID 기준으로 전환(이번 릴리스에 섞지 않음).

**`pendingCandy` 폴백** — 신규 client 에서 **소비자 0곳**(`git grep` 확인). 구버전 client 는 3곳에서 참조.
즉 이 경로는 신규 client 배포와 함께 **자연 사멸**한다. Rules 가드는 방어적으로 남겨둔다.

---

## 4. 과도기(현재) 상태에서 살아있는 writer

현재 Production client 는 **구버전**이다. 아래는 오늘 라이브에서 실행 중인 코드다.

| 구버전 writer | 파일:줄 | 현재 동작 |
|---|---|---|
| `fsAddCandy` | `d1faa790f3c:lib/cottonCandy.ts:50` | Firestore 직접 증감 — **작동 중** |
| `addCottonCandy` | 〃 `:399` | `fsAddCandy` 호출 — **작동 중** |
| `grantPlaytimeReward` | 〃 `:445` | 클라 +50 **AND** 서버 `minigame_play` 청구 → **카나리 UID 이중지급(P1)** |
| `purchaseShopItem(…, price)` | 〃 | 클라 가격 — **작동 중** |
| `adminGrantCandy` | 〃 `:95` | 알림 문서 예약(P0 #6 패턴) — **작동 중** |

→ 이 표가 "왜 client+Rules 배포가 남은 진짜 작업인가"의 근거다.

---

## 5. ⚠️ `.open-next/` 가 git 에 2,046개 추적 중

스캔 중 `.open-next/server-functions/default/index.mjs` 와
`.open-next/image-optimization-function/index.mjs` 에서 재화 필드 문자열이 검출됐다.
= **과거 SSR 번들 산출물이 저장소에 커밋돼 있다.**

- `.gitignore` 에 `open-next` 항목이 2줄 있는데도 **이미 추적 중인 파일은 계속 추적**된다.
- 현재 사이트는 `output:'export'` + 커밋된 `out/` 서빙이므로 **이 번들은 배포에 쓰이지 않는다**(죽은 산출물).
- 위험: 오래된 번들에 옛 설정·키가 굳어 있을 수 있다 → **Phase 12 에서 값 출력 없이 스캔**한다.
- 이번 감사에서 **삭제하지 않는다**(지시: 삭제·수정 금지 대상 아님이지만 릴리스와 무관하므로 후속 과제).
