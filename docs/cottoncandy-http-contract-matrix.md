# HTTP 계약 적대적 테스트 결과 (Phase 3)

하네스 `tests/edge/run-adversarial-e2e.mjs` (감사 브랜치 신규) · `npm run test:adversarial`
실행 환경: **로컬 Edge 전용** — `wrangler pages dev` 5개 인스턴스 + Firebase Auth/Firestore 에뮬레이터.
**Production 요청 0건.**

> 결과 **209/209** — 3회 연속 동일(아래 §5 flake 분석 참조).

## 0. 인스턴스 구성

롤아웃 값은 인스턴스 기동 시 고정되므로 상태별로 wrangler 를 나눠 띄운다.

| 포트 | CANDY_ROLLOUT_MODE | 그 외 |
|---|---|---|
| 8790 `ALL` | `all` | `REWARD_ADMIN_UIDS`=관리자, `ARTICLE_ADMIN_UIDS`=기사관리자 |
| 8791 `MISSING` | (미설정) | — |
| 8792 `CANARY` | `canary` | `REWARD_TEST_UIDS`=카나리UID |
| 8793 `OFF` | `off` | — |
| 8794 `ARTICLE_ONLY` | `all` | `ARTICLE_ADMIN_UIDS` 만 (REWARD 미설정) |

전 인스턴스 `REWARD_ENV=emulator`, `REWARD_ROLLOUT_MODE=all`.

## 1. 공통 HTTP 계층 — 3 endpoint × 21 변형

| 변형 | claim-reward | purchase | admin/grant |
|---|---|---|---|
| OPTIONS | 204 | 204 | 204 |
| GET / PUT / PATCH / DELETE / HEAD | 405 | 405 | 405 |
| 빈 body · 잘못된 JSON · 배열 · 문자열 · null · 숫자 · boolean | 400 | 400 | 400 |
| 중첩 객체 · 매우 긴 문자열 · Unicode · 제어문자 | 400 | 400 | 400 |
| `__proto__` 주입 · `constructor` 키 · 중복 JSON key | 400 | 400 | 400 |
| Content-Type 없음 / `text/plain` | 400 (CT 불신) | 400 | 400 |
| 과대 body(20KB) | 400 | 400 | 400 |

**5xx 0건.** 서버는 Content-Type 을 신뢰하지 않고 본문만 파싱한다.
`JSON.parse` 가 만드는 `__proto__` 는 **own key** 라 `Object.keys` 화이트리스트에서 걸린다.

## 2. Authorization 변형 — 3 endpoint × 10

토큰 없음 · 빈 Bearer · Bearer 접두사 없음 · Basic · JWT 아님 · 만료 · 잘못된 `aud` ·
잘못된 `iss` · **다른 Firebase project(`dori-ai-0130`)** → 전부 **401**.
클레임만 맞춘 **서명 없는 위조 토큰** → Firestore 실검증에서 차단(2xx 아님).

## 3. `/api/claim-reward`

| 공격 | 결과 |
|---|---|
| `amount`·`exp`·`candy`·`cottonCandy`·`uid`·`email`·`rewardDate` 주입 | **400 forbidden_field** |
| unknown rewardType | 400 |
| operationId 없음 / sourceId 없음 | 400 |
| allowlist 밖 missionId·achievementId | **400 unknown_source** |
| 미래 날짜(2099) · 과거 날짜(2020) sourceId | **400 invalid_source_date** |
| 존재하지 않는 날짜(2026-02-30) | 400 |
| URL 인코딩(`%5F`) · 경로 이스케이프(`../`) sourceId | 400 |
| 대문자 missionId · 공백 padding · **Unicode 유사문자(키릴 і)** | 400 |
| `lv_0` · `lv_010` · `lv_9999` · `lv_-1` · `lv_1e3` | 4xx |

### ★ 발견 — operationId 는 sourceId 에서 **완전히 파생**된다

`isValidExtendedOperationId` 가 `operationId === operationIdFor(policy, sourceId)` 를 요구한다.
따라서 다음 3종은 **멱등 계층에 도달하기 전에** 형식 검증에서 잘린다:

- 같은 source, 다른 operationId → **400 invalid_operation_id**
- 다른 source, 같은 operationId → **400 invalid_operation_id**
- 다른 rewardType, 같은 operationId → **400 invalid_operation_id**

당초 감사 가설(“duplicate 로 흡수될 것”)보다 **한 단계 더 강한 계약**이다.
prefix 규칙: `post_` `comment_` `mission_` `minigame_` `ach_` `lv_` (`game_activity` 만 source 불필요).

### Community 소유권

| 케이스 | 결과 |
|---|---|
| 존재하지 않는 feed | **404 source_not_found** |
| 타인 소유 feed | **403 source_not_owned** |
| 본인 소유 feed | 200 |
| 존재하지 않는 댓글 | 404 |

### 멱등

정상 미션 200 → 같은 operationId 재청구 **duplicate + awardedCandy 0**.
업적 `first_visit` 200 → 재청구 **duplicate + 0**.

## 4. `/api/purchase`

| 공격 | 결과 |
|---|---|
| `price`(0/음수) · `amount` · `balance` · `cottonCandy` · `uid` · `email` · `isPremium` · `ownedItems` · `quantity` 주입 | **400 forbidden_field:*** |
| 예상 밖 필드 | 400 unexpected_field |
| unknown itemKey · 형식 위반(`../../etc/passwd`) · 숫자 · 배열 · 없음 | 400 |
| **가격 0 아이템** | **400 item_not_purchasable** |
| 잔액 부족 | **422 insufficient_balance** — 문서 무변화 + **원장 미생성** |
| 사용자 문서 없음 | 404 |

**정상 구매**: 200 · Firestore 잔액이 응답과 일치 · `ownedItems` 에 **정확히 1번** 추가.
**재구매**: duplicate · charged 0 · 잔액 불변 · `ownedItems` 중복 없음.

### ★ 프리미엄은 서버 문서만

- 서버 `isPremium: true` → 잔액 0 이어도 무료 획득(`premiumGrant: true`)
- 서버 `isPremium: "true"`(**문자열 위조**) → 프리미엄 아님 → **422**
- 요청 body 의 `isPremium` → 400

## 5. `/api/admin/grant`

| 공격 | 결과 |
|---|---|
| 일반 로그인 사용자 | **403** |
| **기사 관리자(ARTICLE_ADMIN_UIDS)** | **403 — 교차 권한 차단** |
| **REWARD_ADMIN_UIDS 미설정** | **503 reward_admin_not_configured** |
| 관리자 self-grant | **403 self_grant_forbidden** |
| body 에 `role:"admin"` | 400 unexpected_field |
| **사용자 문서에 `role:"admin"`, `isAdmin:true` 심기** | **여전히 403** |
| `candy` 0 / 1.5(소수) / `"100"`(문자열) / 1e9 / null | 400 |
| candy·isPremium 둘 다 없음 | 400 nothing_to_grant |
| operationId 접두사 위반 | 400 |
| targetUid 형식 위반 / email 형태 | 400 invalid_target |
| 존재하지 않는 대상 | 404 |
| **같은 operationId · 다른 금액** | **409 operation_id_reused** (잔액 불변 확인) |
| 같은 operationId · 같은 금액 | duplicate(추가지급 없음) |
| 과도한 음수 회수(-100000) | 200, 잔액 **0 에서 정지**(음수 금지) |
| `isPremium` 문자열 | 400 |
| 대상 본인이 자기에게 지급 | 403 |

## 6. 롤아웃 상태 기계 (Edge 실측)

| 상태 | 구매 | 미션 candy | 미션 EXP | **출석 candy** |
|---|---|---|---|---|
| `all` | 200 | 지급 | 지급 | 지급 |
| `off` | **403 candy_rollout_disabled** | **0** | **지급** | **지급 ★** |
| `canary` (목록 밖) | 403 | 0 | 지급 | 지급 |
| `canary` (목록 안) | 200 | 지급 | 지급 | 지급 |
| (미설정, emulator) | 200 | 지급 | 지급 | 지급 |

**★ 출석 솜사탕은 `off` 에서도 계속 지급된다** — 게이트 제외 계약이 Edge 로 고정됐다
(실측 응답 `{"cottonCandy":50,"bonus":0,"exp":5}`).
**EXP 롤아웃(`all`)이 재화 게이트를 열지 못한다**는 것도 `off` 인스턴스에서 확인.

> ⚠️ **커버리지 공백(정직하게)** — `CANDY_ROLLOUT_MODE` **미설정 시 production fail-closed(503
> `candy_rollout_mode_invalid`)** 는 Edge 로 재현할 수 없다. `production` 모드는 재화 게이트보다
> **먼저** SA 자격 검사에 걸려 `503 dependency_unavailable` 을 반환하기 때문이다.
> 이 계약은 `tests/candy-hardening.test.ts` 의 단위 테스트가 고정하며, 배포 전 실측으로도
> 확인했다(`resolveCandyGate({}, "production", …)` → 503).

## 7. 응답 유출 검사

7종 오류 응답(400/401/403/503 × 3 endpoint)에 대해 stack trace · 내부 경로 · API 키 ·
private key · ID 토큰 · 서비스 계정 · Firestore 원문 URL · email · 환경변수명을 검사 → **전부 0건**.
**모든 오류 응답이 512바이트 미만**(최대 85바이트).

## 8. 🔧 flake 분석 — 재시도로 덮지 않고 원인을 고쳤다

**증상**: 2회차 실행에서 관리자 9건 + 카나리 2건이 갑자기 403. 1회차는 통과.

**원인**: Windows 에서 `spawn("npx", …, { shell: true })` 로 띄운
`cmd.exe → npx → wrangler → workerd` 트리는 `child.kill()` 로 **셸만 죽고 손자 workerd 가 살아남는다.**
포트를 계속 점유한 유령 인스턴스에 **다음 실행이 그대로 붙었고**, 그 인스턴스는
**이전 실행의 UID allowlist**(`REWARD_ADMIN_UIDS`/`REWARD_TEST_UIDS`)를 들고 있었다.
→ 새 실행의 관리자·카나리 UID 가 목록에 없으니 정상 코드인데도 403.

증거: `Get-NetTCPConnection` 으로 8790–8794 에 `workerd` PID 5개 잔존 확인.

**조치**: 제품 코드가 아니라 **하네스**를 고쳤다 — 기동 전·종료 시 `netstat`/`taskkill /T /F` 로
포트 기준 정리(`killPort`). 이후 **3회 연속 209/209**, 종료 후 포트 5개 전부 해제 확인.

**분류**: 테스트 결함(하네스), 제품 결함 아님. 재시도 횟수는 늘리지 않았다.
