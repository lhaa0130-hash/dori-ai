# 릴리스 배포 순서 · rollback 설계 (차단 3건 통합)

브랜치 `fix/cottoncandy-release-blockers` · base `2ed304b9463` · **미배포**

이번 릴리스는 **서버 endpoint 가 새로 생기므로 endpoint-first** 다.
(칭호 enforcement 를 endpoint 로 정한 근거: `docs/title-authority-decision.md`)

## 0. 현재 상태

| 계층 | 상태 |
|---|---|
| Functions | 병합본(이중지급 결함 **있음**, canary 한정) |
| Client | 구버전 `vG_Fwmt0xMymPpf4uymsB` |
| Rules | 구버전 |
| `CANDY_ROLLOUT_MODE` | `canary` |
| 관리자(`REWARD_ADMIN_UIDS`) | **미설정 = 비활성 유지** |
| 자동배포 | **Disabled** |

## 1. 배포 단계표

각 단계는 **성공 기준 / 중단 조건 / rollback / 데이터 변화량 / 사람 확인**을 갖는다.

| # | 단계 | 성공 기준 | 중단 조건 | rollback | 데이터 변화 |
|---|---|---|---|---|---|
| 1 | Draft PR 검토 | 리뷰 완료 | — | — | 0 |
| 2 | 최신 main 재확인 | `origin/main` 이 `2ed304b9463` 그대로, 충돌 0 | main 이 움직였다 → 재통합 | — | 0 |
| 3 | Ready → merge (사람) | Checks success | Checks 실패 | PR revert | 0 |
| 4 | **Functions 배포**(merge 자동) | `/api/profile/title` OPTIONS 405→**204**<br>`/api/purchase` 204 유지<br>`/api/admin/grant` **503** 유지<br>**buildId 불변** | 5xx 발생 · buildId 변경 · `/login`≠200 | CF 이전 deployment | 0 |
| 5 | 구버전 client 호환 확인 | 사이트 정상 · `/api/claim-reward` 401(무인증) · 5xx 0<br>구버전은 `candyOwner` 를 안 보내므로 **미니게임 재화 0**(이중지급 소멸) | 기존 기능 실패 | 4와 동일 | 0 |
| 6 | 지정 UID 카나리(사람) | 미니게임 1판 → **+50 만**(100 아님) · 출석 정상 | 예상 밖 금액 | `CANDY_ROLLOUT_MODE=off` 저장 후 재배포 | 카나리 계정만 |
| 7 | `CANDY_ROLLOUT_MODE=all` 저장 | CF 화면 저장 확인 | — | 값 되돌림 | 0 |
| 8 | 같은 Functions 재배포 | 비카나리 계정도 재화 경로 200 | 403 지속 | 7 되돌림 | 0 |
| 9 | 비카나리 계약 확인 | 일반 계정 미션·구매 정상 | 5xx·403 | 7·8 되돌림 | 소액 |
| 10 | **신규 client build + verifier + 배포** | `deploy.js` 통과(키 검증 포함) · buildId **변경** | verifier 실패 → **커밋·푸시에 도달하지 않음** | `out/` 이전 커밋으로 되돌리고 재배포 | 0 |
| 11 | 신규 칭호 UI 확인(사람) | 보유/직접입력/사용안함 3탭 동작 · 저장 성공 | 저장 실패 | 10 rollback | 본인 계정 |
| 12 | legacy 사용자 확인 | 기존 구매자 1명의 칭호가 **배지와 함께** 그대로 | 배지 사라짐 | 10 rollback | 0 |
| 13 | **Firestore Rules 배포(마지막)** | 규칙 게시 성공 | 게시 오류 | Rules 이전 버전 재게시 | 0 |
| 14 | 직접 쓰기 차단 확인 | 콘솔에서 `cottonCandy`·`ownedItems`·`bg`·`titleMode` 직접 쓰기 → `permission-denied` | 통과해 버림 | 13 rollback | 0 |
| 15 | 정상 저장 회귀 | 프로필 텍스트·room·diary·character·quickBar 저장 정상 | 거부됨 | 13 rollback | 본인 계정 |
| 16 | 모니터링 15분 / 1시간 | 5xx 0 · 403/409 비율 안정 | 5xx 발생 | 해당 계층 rollback | — |

> **왜 Rules 가 마지막인가**: Rules 를 먼저 배포하면 구버전 client 의 재화·장착·칭호 쓰기가
> 전부 `permission-denied` 가 되어 **사용자 화면에서 조용히 실패**한다(실측 ❌12건, `docs/cottoncandy-rules-compatibility.md`).

## 2. Rollback 설계 (계층별)

**롤백 순서는 배포의 역순**: Rules → client → Functions.

| 계층 | 방법 | 효과 | 주의 |
|---|---|---|---|
| Rules | 이전 버전 재게시 | 직접 쓰기 차단이 **다시 열린다** | ⚠️ **보안 구멍이 재개방된다.** 신규 client 는 정상 동작(서버 경로를 쓰므로) |
| client | `out/` 이전 커밋 복원 후 배포 | 구버전 UI 로 복귀 | Rules 가 신규면 **먼저 Rules 를 되돌려야** 한다 |
| Functions | CF 이전 deployment | `/api/profile/title` 소멸 | 신규 client 가 살아 있으면 **칭호 저장 전부 실패** |
| rollout | `CANDY_ROLLOUT_MODE=off` + 재배포 | 신규 재화 경로만 차단 | **가장 안전한 킬스위치**. 출석·EXP 는 유지 |
| title 스키마 | **되돌릴 것이 없다** | 신규 필드는 추가만 됐고 legacy `title` 이 계속 동기화된다 | 구버전 client 는 `title` 만 읽으므로 그대로 표시된다 |

### 조합 안전성

| 조합 | 안전한가 |
|---|---|
| 신규 client + 구 Rules | ✅ 기능 정상. 콘솔 직접쓰기 창만 열림 |
| 구 client + 신규 Rules | 🔴 **금지** — 재화·장착·칭호 저장이 전부 실패 |
| 신규 Functions + 구 client | ✅ 이번 수정으로 이중지급 없음(`candyOwner` 미전송 → 재화 0) |
| 구 Functions + 신규 client | 🔴 `/api/profile/title` 없음 → 칭호 저장 실패. **Functions 를 먼저 되돌리면 안 된다** |

### 데이터 migration

**실행하지 않는다.** 조사 결과 대상 0건이다
(`docs/title-production-shape-audit.md`: 미보유 복제 0 · 커스텀 0 · 손상 0 · 신규필드 0).

- resolver 가 read-time 으로 legacy 를 해석하므로 write-back 이 불필요하다.
- 사용자가 다음에 칭호를 저장하면 자연스럽게 신규 스키마로 전환된다.
- 정상 구매자 1명은 resolver 규칙 ③ 으로 유료 효과가 유지된다.
- 재조사가 필요하면 `node scripts/audit-title-shape.mjs`(읽기 전용, 쓰기 0)를 다시 돌린다.

## 3. Rules-only 가 아닌 이유(요약)

장착(bg/frame/nameEffect/bannerEffect/pet/stickers)은 **id 만 저장**하므로 Rules 로 완전 검증이 되고
client 변경이 0건이다 → Rules 유지.
칭호는 **자유 문자열**이 섞여 Rules 로 길이(바이트 vs 코드포인트)·정규화·trim·멱등을 표현할 수 없다
→ endpoint. 그래서 4단계(endpoint-first)가 필요하다.
