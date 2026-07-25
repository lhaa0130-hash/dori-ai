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
적립 : POST /api/claim-reward   금액=서버 표, 상한=타입별 일일, 멱등=rewardOperations
차감 : POST /api/purchase       가격=서버 카탈로그, 프리미엄=서버 문서, 멱등=purchases
관리 : POST /api/admin/grant    권한=서버가 ADMIN_EMAIL 판정, 멱등=grants
```

클라이언트가 `cottonCandy`·`cottonCandyTotal`·`ownedItems`·`isPremium` 을 Firestore 에
쓰는 경로는 **0개**다(정적 가드 `tests/candy-cutover-guard.test.ts` 가 고정).

### 남은 위험(정직한 한계)

- `mission_complete` / `achievement_claim` 은 **BOUNDED CLIENT-ASSERTED** 다. 서버가 "정말 기사를
  읽었는지"까지는 증명하지 않는다. 다만 ①고정 금액 ②미션당 1일 1회 / 업적당 평생 1회 ③타입별 일일
  상한으로 **최대 피해가 상한선**으로 묶인다(무한 → 유한). 완전 서버검증은 후속 과제(§7).
- `community_post/comment` 와 `level_reward` 는 서버가 실제로 검증한다(feed 소스 소유권 / EXP 재계산).

## 3. 배포 순서 (⚠️ 순서 고정)

EXP 릴리스(05-06P)와 **같은 불변식**: 코드가 먼저, Rules 가 마지막.
Rules 를 먼저 올리면 아직 구버전 클라이언트가 쓰고 있는 필드가 막혀 오류가 난다.

1. **사전 확인**
   - Cloudflare Production 환경변수: `REWARD_ENV=production`, `REWARD_ROLLOUT_MODE=all`,
     `FIREBASE_SA_CLIENT_EMAIL`, `FIREBASE_SA_PRIVATE_KEY` 존재 (값 출력 금지, 존재 여부만).
   - 새 엔드포인트(`/api/purchase`, `/api/admin/grant`)는 **기존 환경변수만** 사용한다 → 추가 설정 불필요.
2. **PR 머지** → Functions + 클라이언트가 함께 배포된다(CF Pages 는 둘을 한 번에 올린다).
3. **엔드포인트 스모크**(운영, 읽기 위주)
   - `OPTIONS /api/purchase` → 204
   - `GET /api/purchase` → 405
   - 인증 없는 `POST /api/purchase` → 401
   - `POST /api/purchase {itemKey, price:0}` (본인 토큰) → 400 (가격 위조 거부)
4. **카나리 1건**: 관리자 본인 계정으로 저가 아이템 1개 구매 → 잔액이 정확히 가격만큼 줄고
   `users/{uid}/purchases/{op}` 원장 1건 생성 확인.
5. **Firestore Rules 배포** (마지막)
   ```bash
   firebase deploy --only firestore:rules --project dori-ai-0130
   ```
6. **배포 후 확인**: 미션/구매/출석 각 1회, 5xx 0건, 콘솔 permission-denied 0건.

### 시간 창 — 자동배포 충돌 회피

`deploy.js` 가 **매시 정각~04분** 에 `pull → build → commit out/ → push` 를 돈다.
**정각 5분 이후에 머지**하고, 다음 정각 전에 스모크까지 끝낸다. 머지 시각이 :55~:05 에
걸리면 다음 사이클을 기다린다. (이 브랜치는 `out/` 을 커밋하지 않았다 — 정책 준수.)

## 4. 롤백

| 증상 | 조치 |
|---|---|
| 구매/미션이 실패(4xx·5xx 급증) | `REWARD_ROLLOUT_MODE=canary` 로 되돌려 영향 범위를 allowlist 로 축소 |
| Rules 때문에 정상 저장이 막힘 | **Rules 만** 이전 버전으로 롤백(코드는 유지). 코드는 Rules 없이도 안전하다 — 클라이언트에 재화 writer 자체가 없다 |
| 심각 | PR revert → 재배포. 원장(`purchases`/`grants`/`rewardOperations`)은 남으므로 재배포 후에도 이중 지급되지 않는다 |

⚠️ **금지**: 문제가 생겨도 클라이언트 직접 쓰기 권한을 되돌리지 말 것. 그건 P0 재개방이다.

## 5. 검증 현황 (이 브랜치)

| 스위트 | 결과 |
|---|---|
| 단위 (`npm test`) | **150/150** |
| 에뮬레이터 Rules (`test:my-world:emulator`) | **42/42** |
| Edge HTTP E2E (`test:reward:edge`) | **66/66** |
| 브라우저 DOM 클릭 E2E (`test:reward:ui`) | **63/63** |
| 프로덕션 빌드 (`npm run build`) | 통과 (`out/` 은 커밋하지 않음) |

전부 `origin/main` 병합 **후** 재실행한 결과다.

## 6. 데이터 마이그레이션

없음. 기존 `users/{uid}.cottonCandy` 값을 그대로 쓴다. 새 필드(`rewardTypeCandy_*`)는
서버가 처음 지급할 때 생성된다. `ownedItems` 도 기존 배열을 그대로 이어받는다.

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
