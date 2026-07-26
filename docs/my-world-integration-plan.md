# My World ↔ CottonCandy 통합 계획 (Workstream 14)

작성: 2026-07-26 · **읽기 전용 관찰 결과**. 이 문서를 만드는 동안 merge·rebase·충돌 해결·배포를
하지 않았고, production endpoint 로 데이터를 쓰지 않았다.

---

## 1. 관찰된 상태

| 항목 | 값 |
| --- | --- |
| 디자인 브랜치 | `refactor/my-world-structure-design` |
| `origin/main` tip | `2ed304b94631ca8a0c6e8df6e7f1a97eb929ce86` |
| main 최신 커밋 | `Merge pull request #3 from lhaa0130-hash/security/p0-cotton-candy-authority` |
| merge-base | `d1faa790f3c` |
| 디자인 브랜치가 놓친 커밋 | **14개** (전부 CottonCandy P0 보안 트랙) |
| 디자인 브랜치가 앞선 커밋 | Phase 4 진행 중 계속 증가 |
| 병합·rebase 수행 | **하지 않음** (운영 규칙) |

## 2. main 이 바꾼 파일 (merge-base 이후 30개)

보상·재화·권한 계약이 대부분이다.

```
보상 서버      functions/api/claim-reward.ts · functions/_shared/rewardTypes.ts
관리자·권한    functions/_shared/adminAuth.ts · functions/api/admin/grant.ts · firestore.rules
재화·상점      lib/cottonCandy.ts · lib/shopClient.ts · functions/_shared/shopCatalog.ts
               functions/api/purchase.ts · functions/_shared/candyEnv.ts
게임 보상      lib/gameReward.ts · lib/gameData.ts · lib/dailyMission.ts
보상 클라이언트 lib/rewardClient.ts · lib/myWorld/rewardOutbox.ts
소셜           lib/social.ts
화면           components/my/MyDashboard.tsx · components/game/EmbeddedGame.tsx
               components/game/PlaytimeRewardToast.tsx · components/insight/InsightDetail.tsx
               app/minigame/quiz/page.tsx
테스트         tests/candy-*.test.ts · tests/reward-cutover-guard.test.ts · tests/shop-catalog.test.ts
               tests/emulator/* · tests/edge/*
문서           docs/runbook-cotton-candy-p0.md
```

## 3. 충돌 가능성 — 실측

| 검사 | 명령 | 결과 |
| --- | --- | --- |
| 변경 파일 교집합 | `comm -12 <(main 변경) <(내 변경)` | **0건** |
| 시험 병합 | `git merge-tree --write-tree HEAD origin/main` | exit 0, **conflict 0건** |
| 내가 쓰는 main 측 export 생존 | `git show origin/main:lib/...` | **8/8 존재** |

생존 확인된 export:

| 파일 | export |
| --- | --- |
| `lib/cottonCandy.ts` | `getCachedGameProfile` · `getCottonCandyBalance` · `hydrateGameData` · `applyServerRewardResult` |
| `lib/rewardClient.ts` | `claimReward` · `createFetchTransport` · `deriveOperationId` · `flushRewardOutbox` |

## 4. 보상 관련 연결부의 변화와 영향

My World 는 보상 계약을 **소비만** 한다. Phase 4 에서 소비 방식이 하나 바뀌었다.

| 연결부 | 이전 | Phase 4 이후 | main 변화와의 충돌 |
| --- | --- | --- | --- |
| `claimReward()` 호출 | 응답 무시(`.catch(() => {})`), 요청 전 낙관적 "EXP +N" 표시 | 응답의 `ClaimOutcome` 을 소비해 **서버 `awardedExp` 로만** 표시, 5종 분기 | 없음 — `ClaimOutcome` 은 main 에도 동일하게 존재하는 기존 타입이며 요청 body·operationId·금액을 바꾸지 않았다 |
| `hydrateGameData()` | 캐시 갱신 | 동일 | 없음 |
| `applyServerRewardResult()` | Hero 갱신 | 동일 | 없음 |
| `rewardOutbox` | 오프라인 큐 | 손대지 않음 | main 이 이 파일을 수정했으나 **내 브랜치는 이 파일을 건드리지 않았다** |

> ⚠️ 병합 후 반드시 확인할 것: main 의 `ClaimOutcome`/`ClaimServerResult` 필드가 바뀌었는지.
> 현재 `origin/main` 기준으로는 `awardedExp` 가 그대로 있으나, 병합 시점에 재확인해야 한다
> (아래 절차 5단계에 포함).

## 5. 컴파일 영향

| 검사 | 결과 |
| --- | --- |
| `tsc --noEmit` (내 브랜치) | 오류 26개 — **전부 기존 오류**. merge-base 에서도 26개 |
| My World 관련 신규 타입 오류 | **0** |
| main 이 바꾼 client 파일을 My World 가 import 하는가 | `lib/cottonCandy` (2) · `lib/rewardClient` (1) · `lib/firebase` (1) · `lib/userProfile` (1) — 전부 **함수 호출만**, 내부 구조에 의존하지 않음 |
| `next build` | 성공 |

## 6. 권장 통합 절차 (아직 실행하지 않음)

**전제**: CottonCandy 배포가 끝나 main 이 안정된 뒤에 진행한다.

1. **읽기 전용 재확인**
   ```bash
   git fetch origin
   git log --oneline HEAD..origin/main          # 새로 들어온 커밋
   comm -12 <(git diff --name-only $(git merge-base HEAD origin/main)..origin/main | sort) \
            <(git diff --name-only $(git merge-base HEAD origin/main)..HEAD | sort)
   git merge-tree --write-tree --name-only HEAD origin/main | grep -c CONFLICT
   ```
   교집합 0 · conflict 0 이 아니면 **여기서 멈추고** 파일별로 판단한다.

2. **의존 export 재확인** (병합 전에 깨질 것을 미리 안다)
   ```bash
   for s in getCachedGameProfile getCottonCandyBalance hydrateGameData applyServerRewardResult; do
     git show origin/main:lib/cottonCandy.ts | grep -c "export .*$s"; done
   for s in claimReward createFetchTransport deriveOperationId flushRewardOutbox; do
     git show origin/main:lib/rewardClient.ts | grep -c "export .*$s"; done
   git show origin/main:lib/rewardClient.ts | grep -A6 "ClaimOutcome ="      # awardedExp 생존 확인
   ```

3. **main → 디자인 브랜치 방향으로 병합** (반대 방향 금지)
   ```bash
   git switch refactor/my-world-structure-design
   git merge --no-ff origin/main
   ```
   보상·보안 파일에 충돌이 나면 **디자인 트랙이 해결하지 않는다** — 보안 트랙 담당자에게 넘긴다.

4. **게이트 전부 재실행**
   ```bash
   npm test                                  # 197 pass 유지
   npx tsc --noEmit | grep -c "error TS"     # 26 유지(신규 0)
   node scripts/scan-production-seams.mjs    # PASS
   node scripts/verify-my-world-assets.mjs   # PASS
   npx next build                            # 성공
   git checkout -- out && git clean -fdq out # out/ 원복 (커밋 금지)
   ```

5. **보상 경로 재검증** (병합으로 계약이 바뀌었을 수 있다)
   ```bash
   node --test "tests/reward-cutover-guard.test.ts" "tests/my-world-reward-ui.test.ts"
   ```
   `my-world-reward-ui` 가 실패하면 UI 가 서버 결과를 잘못 읽고 있다는 뜻이다.

6. **에뮬레이터 스위트** (JDK 21+ 있는 기기에서만)
   ```bash
   npm run test:my-world:emulator
   ```
   현재 기기는 JDK 17 이라 실행 불가 — **미실행을 PASS 로 보고하지 않는다.**

7. **사람 QA** — `docs/my-world-human-qa.md` 의 13개 항목.

8. Draft PR 은 그 다음이다. 이 트랙에서는 만들지 않았다.

## 7. 하지 않은 것 (명시)

- 자동 merge / rebase
- 충돌 해결
- 보상 코드 편집
- 배포 상태 추정
- production endpoint 호출·데이터 쓰기
- main 또는 다른 브랜치(`illo-cotton`·`illo-p0`·`illo-integ`·`illo-authfix`) 변경
