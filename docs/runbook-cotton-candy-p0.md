# cottonCandy P0 서버 권위 전환 — 배포 런북 (05-07)

> ⚠️ 이 문서는 **배포 절차서**다. 이 브랜치는 Draft PR 상태이며 아직 아무것도 배포하지 않았다.
> 배포는 사람이 승인한 뒤에만 진행한다.

---

## 1. 무엇을 닫는가

| # | 취약점 | 영향 | 닫는 방법 |
|---|---|---|---|
| 1 | `completeMission(email, id, reward, …)` 의 `reward` 가 **클라이언트 인자** | localStorage 게이트만 통과하면 임의 금액 무한 지급 | 금액을 서버 표(`MISSION_CANDY`)로 이관 + 미션당 1일 1회 원장 |
| 2 | /my 의 **'받기' 버튼**이 활동 없이 지급 | 기사·글·댓글·게임·퀴즈 없이 전 미션 수령 | 받기 버튼 제거 → 활동 지점에서만 청구 |
| 3 | `purchaseShopItem(email, key, **price**)` — 가격이 클라 인자 | `price=0` 으로 전 품목 무료 | 서버 카탈로그(`shopCatalog.ts`)가 가격 소유 |
| 4 | `isPremiumUser()` 가 **localStorage 만** 확인 | 로컬 플래그 하나로 전 품목 영구 무료 + `ownedItems` 직접 기록 | 서버가 `users/{uid}.isPremium` 로만 판정 |
| 5 | `ownedItems` 가 **Rules 미보호** | 콘솔에서 아이템 임의 추가 | Rules 잠금 + `/api/purchase` 만 기록 |
| 6 | 관리자 지급 실패 시 `notifications/{uid}/items` 에 예약 → 대상이 **스스로 반영** | 알림 생성 규칙이 `fromUid == auth.uid && fromUid != uid` 만 요구 → **계정 두 개로 무한 재화·프리미엄 자가지급** | 예약·자기적용 통로 제거, `/api/admin/grant` 가 관리자 확인 후 직접 지급 |
| 7 | `hydrateGameData` 가 `서버 >= 로컬` 일 때만 반영 | 로컬을 999999 로 조작하면 **영원히 서버 값으로 안 내려옴** | 서버 값 무조건 채택(EXP 와 동일) |
| 8 | `fsAddCandy` / `gameData` 의 클라 `increment` | 재화 직접 증감 | 전부 제거·무력화 + Rules 잠금 |

## 2. 서버 권위 경계 (배포 후 불변식)

```
적립 : POST /api/claim-reward   금액=서버 표, 상한=타입별+전역 일일, 멱등=rewardOperations
차감 : POST /api/purchase       가격=서버 카탈로그, 프리미엄=서버 문서, 멱등=purchases
관리 : POST /api/admin/grant    권한=서버 UID allowlist(+email), 멱등=grants
```

클라이언트가 `cottonCandy`·`cottonCandyTotal`·`ownedItems`·`isPremium` 을 Firestore 에
쓰는 경로는 **0개**다(정적 가드 `tests/candy-cutover-guard.test.ts` 가 고정).

### 2-1. 관리자 지급 권한 계약 (05-07B 강화)

`/api/admin/grant` 는 다음 **3가지를 전부** 통과해야 지급한다(AND):

1. Firebase ID 토큰이 Firestore 실검증 통과(서명·만료·uid 소유)
2. `uid ∈ REWARD_ADMIN_UIDS` — **서버 환경변수 allowlist**
3. 토큰 email 클레임 == `lhaa0130@gmail.com` (심층 방어)

추가로 **self-grant 금지**(관리자가 자기 계정에 지급 불가 — 감사 추적 보존).

> ⚠️ **fail-closed**: `REWARD_ADMIN_UIDS` 가 없으면 엔드포인트 전체가 503 으로 비활성이다.
> email 단독 판정을 쓰지 않는 이유 — Firebase 는 사용자가 스스로 email 을 바꿀 수 있고
> (`updateEmail`), 관리자 계정을 지우거나 주소를 바꾸면 그 주소가 풀린다. `email_verified` 도
> 강제되지 않는다. 즉 "지금은 우연히 안전한" 계약이라 재화 권한의 단독 근거로 부적합하다.
> 사용자 문서의 `isPremium`/`role` 같은 일반 필드도 관리자 근거로 쓰지 않는다.
>
> **이 변수를 설정하기 전까지 관리자 지급 기능은 동작하지 않는다.** 의도된 상태다.
> 🔜 후속: Firebase Custom Claims(`admin:true`)로 옮기면 env 관리 없이 더 강해진다.

### 2-2. 프리미엄 권한 계약

- 서버가 읽는 유일한 출처: `users/{uid}.isPremium` (Firestore)
- 클라이언트는 create/update 어느 쪽으로도 이 필드를 쓸 수 없다(Rules 잠금 + create 시 존재 자체 금지)
- 유일한 설정 경로: `/api/admin/grant`(위 계약) → 즉 allowlist 미설정 시 **아무도 프리미엄이 될 수 없다**
- `isPremiumUser()`(클라)는 **표시 전용**. 결제 판정에 쓰이지 않는다
- 프리미엄 = 전 아이템 무료는 기존 제품 정책이며 코드로 확인됨(구 `purchaseItem`/`purchaseShopItem`)
- ⚠️ 만료 개념 없음(`premiumUntil` 미구현) — 한 번 켜지면 수동으로 끌 때까지 유지. 후속 과제

### 2-3. 상한 체계

| 층 | 값 | 근거 |
|---|---|---|
| 타입별 일일 | mission 300 · minigame 50 · achievement 3000 · level 3100 | `EXTENDED_REWARD_POLICIES.dailyCandyCap` |
| **전역 일일** | **600** | `DAILY_CANDY_TOTAL_CAP` — 서버 날짜 기준 `candyDailyDate/Total` |
| 미션 | 미션당 1일 1회 | 원장 `mission_{id}_{서버날짜}` |
| 업적 | 업적당 평생 1회 | 원장 `ach_{id}` |
| 레벨 | 마일스톤당 평생 1회 + 서버 EXP 재계산 검증 | 원장 `lv_{n}`, 앞자리 0 금지 |

정상 사용자의 하루 최대 획득(미션 전량 280 + 플레이 50 = 330)은 전역 상한에 걸리지 않는다.

### 남은 위험(정직한 한계)

- `mission_complete` / `achievement_claim` 은 **BOUNDED CLIENT-ASSERTED** 다. 서버가 "정말 기사를
  읽었는지 / 업적 조건을 채웠는지"까지는 증명하지 않는다. 기사 20초 체류·퀴즈 정답은 **클라이언트
  타이머·클라이언트 판정**이며 '검증됨'이 아니다. 다만 ①고정 금액 ②미션당 1일 1회(서버 날짜) /
  업적당 평생 1회 ③타입별 + 전역 일일 상한으로 **하루 최대 피해가 600 솜사탕**으로 묶인다
  (이전: 무한). 완전 서버검증은 후속 과제(§7).
- `community_post/comment` 와 `level_reward` 는 서버가 실제로 검증한다(feed 소스 소유권 / EXP 재계산).

## 3. 배포 순서 (⚠️ 순서 고정)

핵심 불변식 2가지:
- **코드가 먼저, Rules 가 마지막.** Rules 를 먼저 올리면 구버전 클라이언트가 쓰는 필드가 막힌다.
- **`CANDY_ROLLOUT_MODE=all` 전환은 신규 client 배포 *전*.** 반대로 하면 일반 사용자가 403 을 받는 구간이 생긴다.

| # | 단계 | 확인 |
|---|---|---|
| 1 | Production 에 **`CANDY_ROLLOUT_MODE=canary`** 사전 설정 | 구버전 Functions 는 이 변수를 모른다 → 영향 0 |
| 2 | (선택) **`REWARD_ADMIN_UIDS`** 설정 | 미설정이면 관리자 지급만 비활성(503). 나머지는 정상 |
| 3 | 구버전 영향 0 확인 | EXP 출석·미션 정상, 5xx 0건 |
| 4 | **신규 Functions 배포**(PR 머지) | CF Pages 가 Functions+static 을 함께 올린다 |
| 5 | **엔드포인트 카나리** — 지정 UID 로만 | 아래 스모크 참고 |
| 6 | **`CANDY_ROLLOUT_MODE=all`** 전환 | ⚠️ client 배포 전에 |
| 7 | 신규 client 배포 | (4와 같은 배포라면 6을 4보다 앞에 둔다) |
| 8 | **실제 UI 카나리** | 미션 1건·구매 1건·출석 1건 |
| 9 | legacy writer 0 확인 | 콘솔 permission-denied 0건 |
| 10 | **Firestore Rules 배포** (마지막) | `firebase deploy --only firestore:rules --project dori-ai-0130` |
| 11 | 직접 쓰기 차단 확인 | 콘솔에서 `cottonCandy` 직접 쓰기 → denied |
| 12 | 정상 기능 회귀 | room 배치·quickBar·프로필·feed·다이어리 저장 |

> ⚠️ 4와 7이 같은 배포라면(현 구성) **6을 4보다 먼저** 수행한다. 즉 실제 순서는
> `canary 설정 → all 전환 → 머지(Functions+client 동시) → UI 카나리 → Rules`.
> 카나리 구간을 제대로 쓰려면 Functions 만 먼저 올리는 별도 배포가 필요하다.

### 사전 확인 (값 출력 금지 — 존재 여부만)
- 기존: `REWARD_ENV=production`, `REWARD_ROLLOUT_MODE=all`, `FIREBASE_SA_CLIENT_EMAIL`, `FIREBASE_SA_PRIVATE_KEY`
- **신규**: `CANDY_ROLLOUT_MODE`(필수 — 없으면 재화 전부 fail-closed), `REWARD_ADMIN_UIDS`(선택)

### 엔드포인트 스모크
- `OPTIONS /api/purchase` → 204 / `GET /api/purchase` → 405 / 인증 없는 POST → 401
- `POST /api/purchase {itemKey, price:0}` → **400** (가격 위조 거부)
- `POST /api/admin/grant` (allowlist 미설정 시) → **503 admin_grant_disabled**
- 미션 `sourceId` 를 미래 날짜로 → **400 invalid_source_date**

### 카나리 1건
지정 UID 로 저가 아이템 1개 구매 → 잔액이 정확히 가격만큼 감소 + `users/{uid}/purchases/{op}` 원장 1건.

### 시간 창 — 자동배포 충돌 회피

`deploy.js` 가 **매시 정각~04분** 에 `pull → build → commit out/ → push` 를 돈다.
**정각 5분 이후에 머지**하고, 다음 정각 전에 스모크까지 끝낸다. 머지 시각이 :55~:05 에
걸리면 다음 사이클을 기다린다. (이 브랜치는 `out/` 을 커밋하지 않았다 — 정책 준수.)

## 4. 롤백

| 증상 | 조치 |
|---|---|
| 재화 관련 이상(과지급·오류 급증) | **`CANDY_ROLLOUT_MODE=off`** — 재화만 즉시 차단되고 EXP 는 계속 동작한다(가장 빠른 킬스위치) |
| 영향 범위만 줄이고 싶다 | `CANDY_ROLLOUT_MODE=canary` |
| 관리자 지급 이상 | `REWARD_ADMIN_UIDS` 를 비우면 엔드포인트가 503 으로 닫힌다 |
| 구매/미션이 실패(4xx·5xx 급증) | `REWARD_ROLLOUT_MODE=canary` 로 되돌려 영향 범위를 allowlist 로 축소 |
| Rules 때문에 정상 저장이 막힘 | **Rules 만** 이전 버전으로 롤백(코드는 유지). 코드는 Rules 없이도 안전하다 — 클라이언트에 재화 writer 자체가 없다 |
| 심각 | PR revert → 재배포. 원장(`purchases`/`grants`/`rewardOperations`)은 남으므로 재배포 후에도 이중 지급되지 않는다 |

⚠️ **금지**: 문제가 생겨도 클라이언트 직접 쓰기 권한을 되돌리지 말 것. 그건 P0 재개방이다.

## 5. 검증 현황 (이 브랜치)

| 스위트 | 1차(05-07) | 2차 감사 후(05-07B) |
|---|---|---|
| 단위 (`npm test`) | 150/150 | **165/165** |
| 에뮬레이터 Rules (`test:my-world:emulator`) | 42/42 | **47/47** |
| Edge HTTP E2E (`test:reward:edge`) | 66/66 | **91/91** |
| 브라우저 DOM 클릭 E2E (`test:reward:ui`) | 63/63 | **63/63** |
| 프로덕션 빌드 (`npm run build`) | PASS | **PASS** (`out/` 미커밋) |

전부 `origin/main` 병합 **후** 재실행한 결과다.

### 05-07B 에서 테스트 기대값을 바꾼 곳과 이유

| 테스트 | 변경 | 사유 |
|---|---|---|
| edge: `알 수 없는 미션/업적 id` | 200+candy 0 → **400 unknown_source** | 제품 계약 강화(원장 쓰레기 차단). 테스트 약화 아님 |
| edge: `mission_complete/minigame_play` | 하드코딩 과거 날짜 → **서버 KST 오늘** | 날짜 검증 신설로 과거 날짜가 정당하게 거부됨 |
| emulator: `악성 알림` | "생성은 가능" → **"생성 자체가 거부"** | Rules 로 위조까지 차단(더 강해짐) |
| UI: `checkin` 미션 | UTC 날짜 → **KST 날짜** | 서버 날짜 기준과 맞춤(자정 근처 flake 제거) |

⚠️ 1차(05-07)에서 UI E2E 총합을 15→25 등으로 바꾼 건 **제품 정책 변경**이 근거다
(한 활동이 community 보상 + 일일 미션 두 건을 순차 청구). 중복 지급도 테스트 약화도 아니며,
`waitExpSettled` 로 '목표 도달 후 안정'까지 확인해 **초과 지급도 검출**한다.

## 5-1. 구버전 호환성 표

| 조합 | 결과 |
|---|---|
| 구 client + 구 Functions | 현재 운영 상태. 영향 없음 |
| 구 client + 신 Functions | ✅ 정상. 구 client 는 `/api/claim-reward` 만 부르고 계약이 하위호환. `CANDY_ROLLOUT_MODE` 를 몰라도 서버가 알아서 판단 |
| 신 client + 신 Functions | ✅ 정상(목표 상태) |
| 신 client + 구 Functions | ⚠️ `/api/purchase`·`/api/admin/grant` 가 **404**. 상점 구매 실패로 보인다. → 배포 순서상 신 client 는 신 Functions 와 **같은 배포**로 나가므로 이 조합은 발생하지 않는다 |
| 신 client + 신 Rules | ✅ 정상 |
| 장시간 열린 **구버전 탭** + 신 Rules | ⚠️ 구 탭의 직접 writer(`fsAddCandy` 등)가 `permission-denied`. **이중 지급이나 데이터 손상은 없다** — 쓰기가 거부될 뿐이고 서버 잔액이 단일 원본이다. 새로고침하면 해소 |

- CDN/브라우저 캐시: `out/` 은 해시 파일명이라 신규 배포 시 새 URL 로 받는다. 별도 cache-busting 불필요
- Service Worker: 이 프로젝트는 SW 를 쓰지 않는다(등록 코드 0건) → 구버전 코드가 고착될 경로 없음
- `hydrateGameData` 는 **서버 값을 무조건 채택**한다(로컬 max 채택 제거) → 조작된 캐시가 서버 위에 남지 않는다
- 계정 전환 시 outbox/캐시는 UID 로 스코프된다(`rewardOutboxKey(uid)`) → 타인 잔액·구매 결과를 읽지 않는다

## 6. 데이터 마이그레이션

없음. 기존 `users/{uid}.cottonCandy` 값을 그대로 쓴다. 새 필드(`rewardTypeCandy_*`,
`candyDailyDate/Total`)는 서버가 처음 지급할 때 생성된다. `ownedItems` 도 기존 배열을 그대로 이어받는다.

### 기존 운영 데이터에 대한 읽기 전용 점검 계획 (별도 승인 필요 — 아직 실행 안 함)

production 에 과거의 악성 `candy_grant` 알림이 남아 있을 수 있다. **무해하다** —
소비 코드(`applyPendingCandyGrants`)가 제거됐고 Rules 가 재화 쓰기를 막는다.
그래도 규모를 알고 싶다면 아래를 **값이 아닌 집계만** 확인한다.

```
collectionGroup('items') where type in ['candy_grant','premium_grant'] → count() 만 조회
```

⚠️ 이번 작업에서는 운영 알림을 **조회·수정·삭제하지 않았다.** 실행하려면 사용자 승인이 필요하다.
삭제·마이그레이션은 승인 없이 하지 않는다.

## 7. 후속 과제 (이번 범위 밖)

1. **미션/업적 조건 서버 검증** — 예: `write_post` 는 오늘 작성된 feed 문서 존재를 서버가 조회해
   확인. 현재는 상한으로만 방어(§2).
2. **`/api/missions/complete` 는 존재하지 않는 엔드포인트** — `lib/missionHelpers.ts` 가 호출하지만
   항상 404 로 실패한다(`app/ai-tools` 에서 사용). 제거하거나 구현할 것.
3. **`components/layout/AccountMenu.tsx` 는 죽은 코드** — 렌더되지 않는데 미션 UI 를 갖고 있다.
4. **'포인트 내역' 탭이 localStorage 기반** — 서버 원장(`rewardOperations`/`purchases`)을 읽도록
   바꾸면 기기 간에 내역이 일치한다.
5. **`lib/gameData.ts` 전체가 죽은 모듈** — import 0건. 무력화만 해 둔 상태라 삭제 검토.
6. **가입 환영 보너스 100 이 클라이언트 create** — Rules 로 ≤100 상한을 걸어 파밍은 불가하지만,
   서버 지급으로 옮기면 더 깔끔하다.
7. **관리자 권한을 Firebase Custom Claims 로 이관** — 현재는 `REWARD_ADMIN_UIDS` env allowlist.
   Custom Claims(`admin:true`)면 env 관리 없이 토큰 자체에 권한이 실린다.
8. **프리미엄 만료(`premiumUntil`)** — 현재 만료 개념이 없어 한 번 켜지면 수동으로 꺼야 한다.
9. **업적 조건 서버 검증** — 현재는 평생 1회 원장으로만 방어. 조건(글 수·좋아요 수 등)은 미검증.
10. **`/api/admin/grant` 사유(reason) 카탈로그** — 현재 관리자는 상한(1,000,000) 안에서 임의 금액을
    보낼 수 있다. 서버 소유 사유·금액표로 좁히면 오조작·내부자 위험이 더 준다.
