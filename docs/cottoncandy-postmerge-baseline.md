# CottonCandy Post-Merge 기준선 (Phase 0)

작성 2026-07-26 · 감사 브랜치 `audit/cottoncandy-postmerge-hardening-20260726`
기준 commit **`2ed304b94631ca8a0c6e8df6e7f1a97eb929ce86`** (Merge PR #3)

> 이 문서는 **관찰된 사실만** 기록한다. 추정은 "미확인"으로 표시한다.
> Production 쓰기 0건 · client 재배포 0건 · Rules 배포 0건 · Cloudflare 변경 0건.

---

## 1. 배포 상태 실측

| 항목 | 값 | 확인 방법 |
|---|---|---|
| `origin/main` | `2ed304b9463` | `git rev-parse` |
| 병합 파일 수 | 30 | `git diff d1faa790f3c..origin/main --name-only` |
| 병합 `out/` 변경 | **0건** | 같은 diff |
| 라이브 client buildId | `vG_Fwmt0xMymPpf4uymsB` | 병합 전후 동일 (HTML 실측) |
| `/api/purchase` | 405 → **204/401** | 22:08:13 KST 전환 포착 |
| `/api/admin/grant` | 405 → **204/503** | `reward_admin_not_configured` |
| `/api/claim-reward` | 204 / 401 (10회) | 회귀 없음, 5xx 0건 |
| 주요 화면 8개 | 전부 200 | `/ /login /my-world /insight /animal /shop /community /minigame` |
| `CANDY_ROLLOUT_MODE` | `canary` | 사용자 설정 (값 미열람) |
| `REWARD_TEST_UIDS` | **≥1개 존재** | 가짜 토큰이 503 아닌 **403 `candy_rollout_disabled`** 를 받음 = allowlist 비어있지 않음 |
| `REWARD_ADMIN_UIDS` | 미설정 | `/api/admin/grant` → 503 |
| `ARTICLE_ADMIN_UIDS` | 미설정 | 기존 계약 유지 |
| `illo-deploy` 예약작업 | **Disabled** | `Get-ScheduledTask` |
| 배포 lock | 없음 | `.deploy.lock` 부재 |

### worktree 상태

| worktree | HEAD | 브랜치 | 미커밋 |
|---|---|---|---|
| `D:\01. illo.im\repo` (배포용) | `d1faa790f3c` | main | **0건** (보존) |
| `D:\01. illo.im\illo-cotton` | `62efd695add` | security/p0-cotton-candy-authority | 0건 |
| `D:\01. illo.im\illo-audit` | `2ed304b9463` | **audit/…-20260726** | 감사 전용 |
| illo-authfix / illo-integ / illo-myworld / illo-p0 | (기존) | — | 미변경 |

> 배포 worktree `repo` 는 `d1faa790f3c` 에 머물러 있다(병합을 아직 pull 하지 않음). clean 이며 **손대지 않았다**.
> `2ed304b9463^{tree}` == `62efd695add^{tree}` — 병합이 브랜치 트리를 그대로 채택했으므로 감사 대상 코드는 PR head 와 동일하다.

### 감사 worktree 격리 확인

`.env.local` · `.env` · credential 파일 **복사하지 않음**(부재 확인). `node_modules` 만 junction.

---

## 2. 🔴 현재 Production 은 3계층이 어긋난 과도기다

| 계층 | 버전 | 근거 |
|---|---|---|
| **Functions** | 신규 (서버 권위 재화) | `/api/purchase`·`/api/admin/grant` 응답 전환 실측 |
| **Client** | **구버전** (`d1faa790f3c` 빌드) | buildId 불변 |
| **Firestore Rules** | **구버전** | 이번 작업에서 배포하지 않음 |

Cloudflare Pages 는 build command 없이 커밋된 `out/` 를 서빙하므로 merge 는 Functions 만 갱신한다.
이는 **의도된 카나리 구간**이지만, 아래 3-1 의 상호작용을 만든다.

---

## 3. 이 조합에서 가능한/불가능한 사용자 행동 (소스 증명)

### 3-0. 구버전 client 가 **호출하지 않는** 신규 경로

```
$ git grep -c 'api/purchase'     d1faa790f3c -- lib app components  →  0개 파일
$ git grep -c 'api/admin/grant'  d1faa790f3c -- lib app components  →  0개 파일
```

→ `/api/purchase` 와 `/api/admin/grant` 는 **현재 아무도 호출하지 않는다**(dead traffic).
배포됐지만 트래픽 0 → 이번 병합이 일반 사용자에게 만든 변화는 `/api/claim-reward` 뿐이다.

### 3-1. 🟠 구버전 client 가 **호출하는** 신규 재화 경로 — P1 발견

구버전 client 가 서버에 보내는 rewardType 전수:

```
daily_attendance · my_world_interaction · community_post · community_comment
· mission_complete · minigame_play · game_activity
```

이 중 신규 서버 정책표에서 **재화가 붙은 것**을 실행으로 확인:

| rewardType | 구버전 client 의 sourceId | `isKnownSource` | 서버 candy |
|---|---|---|---|
| `minigame_play` | `playtime_2026-07-26` | true | **50** |
| `mission_complete` | `postset_…` | true | 0 (EXP_ONLY) |
| `mission_complete` | `commentset_…` | true | 0 (EXP_ONLY) |
| `mission_complete` | `likeset_…` | true | 0 (EXP_ONLY) |
| `community_post` / `community_comment` / `game_activity` | — | — | 0 (정책표 candy=0) |

그런데 구버전 `lib/cottonCandy.ts:445-458` 의 `grantPlaytimeReward` 는 **둘 다** 한다:

```js
addCottonCandy(email, amount, "1분 이상 플레이 보상");   // ① 클라이언트 직접 Firestore increment
void import("./gameReward").then((m) =>
  m.submitGameReward("minigame_play", { sourceId: `playtime_${getTodayDateStr()}` }));  // ② 서버 청구
```

병합 **전**에는 ②가 EXP 만 주었다(정책표에 candy 필드가 없었음).
병합 **후**에는 ②가 candy 50 을 준다. 구버전 Rules 는 ①을 여전히 허용한다.

> **⇒ P1 · 과도기 이중 지급**: `CANDY_ROLLOUT_MODE=canary` allowlist 에 있는 UID 가
> 라이브(구버전 client)에서 미니게임을 1분 이상 플레이하면 **+50 이 아니라 +100** 을 받는다.
> 하루 1회, 최대 +50 초과. 미션 3종은 EXP_ONLY 라 영향 없다.
>
> - **일반 사용자에게는 발생하지 않는다** — 게이트가 403 으로 ②를 막는다.
> - 이 문제는 **신규 client 를 배포하면 자동 소멸**한다(신규 client 는 ① 을 제거했다).
> - 실무 영향: **사람 카나리 체크리스트에서 "미니게임 플레이" 항목은 이중 계상된다.**
>   Phase 15 체크리스트에 명시하고, 카나리는 이 항목을 마지막에 하거나 건너뛴다.

### 3-2. 여전히 살아있는 **기존** P0 (병합이 만든 것 아님)

구버전 client 는 관리자 지급을 `/api/admin/grant` 가 아니라 **알림 문서**로 예약한다
(`lib/cottonCandy.ts:95 adminGrantCandy` → `addDoc(notifications/{targetUid}/items)`),
그리고 대상 사용자가 스스로 반영한다. 구버전 Rules 는 이 위조를 막지 못한다(05-07 P0 #6).

또한 구버전 client 의 `fsAddCandy` / `purchaseShopItem(price)` / `isPremiumUser()`(localStorage) 는
구버전 Rules 아래에서 **여전히 동작한다**.

> **⇒ 현재 Production 의 재화 보안 수준은 병합 전과 동일하다.**
> 병합은 서버 쪽 방어를 배치했을 뿐, **client + Rules 를 배포해야 실제로 닫힌다.**
> 이 사실이 배포 순서(Phase 16)의 핵심 제약이다.

---

## 4. 버전 조합 요약

| 조합 | Functions | Client | Rules | 상태 |
|---|---|---|---|---|
| 병합 전 | 구 | 구 | 구 | 재화 P0 열림 |
| **현재** | **신규** | **구** | **구** | 재화 P0 **여전히 열림** + 카나리 UID 이중지급(P1) |
| 다음(client 배포 후) | 신규 | 신규 | 구 | 정상 경로는 서버 권위. 단 **콘솔 직접 쓰기 창 유지** |
| 최종(Rules 배포 후) | 신규 | 신규 | 신규 | 닫힘 |

---

## 5. PR #3 변경 파일 30개

```
app/minigame/quiz/page.tsx · components/game/EmbeddedGame.tsx
components/game/PlaytimeRewardToast.tsx · components/insight/InsightDetail.tsx
components/my/MyDashboard.tsx · docs/runbook-cotton-candy-p0.md(신규)
firestore.rules · functions/_shared/adminAuth.ts · functions/_shared/candyEnv.ts(신규)
functions/_shared/rewardTypes.ts · functions/_shared/shopCatalog.ts(신규)
functions/api/admin/grant.ts(신규) · functions/api/claim-reward.ts
functions/api/purchase.ts(신규) · lib/cottonCandy.ts · lib/dailyMission.ts(신규)
lib/gameData.ts · lib/gameReward.ts · lib/myWorld/rewardOutbox.ts · lib/rewardClient.ts
lib/shopClient.ts(신규) · lib/social.ts
tests/candy-cutover-guard.test.ts(신규) · tests/candy-hardening.test.ts(신규)
tests/edge/run-edge-e2e.mjs · tests/edge/run-ui-e2e.mjs
tests/emulator/candy-security.test.ts(신규) · tests/emulator/myworld-integration.test.ts
tests/reward-cutover-guard.test.ts · tests/shop-catalog.test.ts(신규)
```

`out/` 0건 · Checks: Cloudflare Pages = success.
