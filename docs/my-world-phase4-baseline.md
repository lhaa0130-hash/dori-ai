# My World Phase 4 — 기준선 (Workstream 0)

작성: 2026-07-26 · 목적: Phase 4 작업 전 상태를 고정하고, 손상 시 되돌릴 지점을 남긴다.

## 1. 복구 지점 (태그가 아니라 커밋 해시)

| 항목 | 값 |
| --- | --- |
| 브랜치 | `refactor/my-world-structure-design` |
| **Phase 3 완료 tip (복구 지점)** | `eeb4bbdc056d63e8db5735d5476f970d9ce3d74d` |
| 원격 동기 상태 | `origin/refactor/my-world-structure-design` = 동일 커밋 (push 완료) |
| 되돌리는 방법 | `git reset --hard eeb4bbdc056` (원격에 이미 있으므로 유실 없음) |
| 워킹트리 | clean (untracked·modified 0) |

> ⚠️ 사용자의 다른 변경을 삭제·초기화하지 않는다. 이 문서는 **읽기 전용 기록**이며
> 다른 워크트리(`illo-cotton`·`illo-p0`·`illo-integ`·`illo-authfix`)를 건드리지 않는다.

## 2. main 상태 — CottonCandy 병합 완료

| 항목 | 값 |
| --- | --- |
| `origin/main` tip | `2ed304b94631ca8a0c6e8df6e7f1a97eb929ce86` |
| 병합 커밋 | `Merge pull request #3 from lhaa0130-hash/security/p0-cotton-candy-authority` |
| merge-base(내 브랜치 ↔ main) | `d1faa790f3c` |
| 내 브랜치가 놓친 커밋 | **14개** (전부 CottonCandy P0 보안 트랙) |
| 내 브랜치가 앞선 커밋 | 18개 |

**병합/rebase 하지 않았다.** 운영 규칙에 따라 divergence 만 읽기 전용으로 기록한다.

### main 이 바꾼 파일 (30개, merge-base 이후)

```
app/minigame/quiz/page.tsx              lib/cottonCandy.ts
components/game/EmbeddedGame.tsx        lib/dailyMission.ts
components/game/PlaytimeRewardToast.tsx lib/gameData.ts
components/insight/InsightDetail.tsx    lib/gameReward.ts
components/my/MyDashboard.tsx           lib/myWorld/rewardOutbox.ts
docs/runbook-cotton-candy-p0.md         lib/rewardClient.ts
firestore.rules                         lib/shopClient.ts
functions/_shared/adminAuth.ts          lib/social.ts
functions/_shared/candyEnv.ts           tests/candy-cutover-guard.test.ts
functions/_shared/rewardTypes.ts        tests/candy-hardening.test.ts
functions/_shared/shopCatalog.ts        tests/edge/run-edge-e2e.mjs
functions/api/admin/grant.ts            tests/edge/run-ui-e2e.mjs
functions/api/claim-reward.ts           tests/emulator/candy-security.test.ts
functions/api/purchase.ts               tests/emulator/myworld-integration.test.ts
                                        tests/reward-cutover-guard.test.ts
                                        tests/shop-catalog.test.ts
```

### 통합 안전성 (실측)

| 검사 | 결과 |
| --- | --- |
| 변경 파일 교집합 (내 40개 ↔ main 30개) | **0건** |
| `git merge-tree --write-tree HEAD origin/main` | exit 0, **conflict 0건** |
| 내가 의존하는 main 측 export 8개 생존 | **8/8 존재** |

의존 export 확인 (origin/main 기준):
`lib/cottonCandy.ts` → `getCachedGameProfile` `getCottonCandyBalance` `hydrateGameData` `applyServerRewardResult`
`lib/rewardClient.ts` → `claimReward` `createFetchTransport` `deriveOperationId` `flushRewardOutbox`

## 3. 내 브랜치 변경 파일 (merge-base 대비 40개)

추가(A) 17 · 수정(M) 20 · 삭제(D) 3

```
A MY-WORLD-ASSET-REQUEST.md                  M contexts/DiaryContext.tsx
A components/my-world/DiaryTimeline.tsx       M contexts/InteractionContext.tsx
A components/my-world/GuestInvite.tsx         M contexts/RoomContext.tsx
A components/my-world/RecordsPanel.tsx        M app/globals.css
A components/my-world/WorldBar.tsx            M app/my-world/page.tsx
A components/my-world/WorldExtras.tsx         M components/my-world/AchievementsCard.tsx
A components/my-world/WorldGuide.tsx          M components/my-world/CreationsCard.tsx
A components/my-world/WorldHero.tsx           M components/my-world/RecentActivityCard.tsx
A components/my-world/WorldPanel.tsx          M components/my-world/interaction/CharacterInteractionStage.tsx
A components/my-world/WorldSectionBoundary.tsx M components/my-world/room/RoomCanvas.tsx
A components/my-world/WorldSurface.tsx        M components/my-world/room/RoomEditorModal.tsx
A components/my-world/interaction/CharacterAura.tsx   M components/my-world/room/RoomItemCard.tsx
A components/my-world/interaction/CharacterStatus.tsx M components/my-world/room/RoomItemPalette.tsx
A components/my-world/interaction/InteractionActions.tsx M components/my-world/room/RoomItemSprite.tsx
A components/my-world/interaction/WorldFeedback.tsx   M components/my-world/room/RoomPreviewCard.tsx
A hooks/my-world/useGameProfile.ts            M components/my-world/room/RoomToolbar.tsx
A lib/myWorld/interaction/availability.ts     M lib/myWorld/diary/utils.ts
A tests/interaction-availability.test.ts      M lib/myWorld/interaction/types.ts
A docs/my-world-audit.md
A docs/my-world-visual-audit.md
D components/my-world/DiaryCard.tsx
D components/my-world/interaction/InteractionNotices.tsx
D components/my-world/{GrowthCard,TodayCard,WorldHeader,WorldIntro}.tsx (Phase 3 에서 흡수)
```

> `WorldHero.tsx` 는 Phase 2 에서 추가됐고 Phase 3 에서 `WorldBar` 로 대체됐으나 파일이 남아 있다
> → Workstream 8(죽은 코드 정리)에서 처리한다.

## 4. 기존 테스트·검증 기준선 (Phase 4 시작 시점 실측)

| 항목 | 값 | 비고 |
| --- | --- | --- |
| 단위 테스트 | **160 pass / 0 fail** | 기존 153 + Phase 1 신규 7 |
| `tsc --noEmit` 오류 | **26** | 전부 기존 오류. `origin/main`(d1faa79)에서도 26 |
| `next build` | 성공 | `/my-world` 34.7 kB · First Load 267 kB |
| console 오류 (게스트) | **0** | 경고 1건은 홈 썸네일 LCP(무관) |
| horizontal overflow | 0 (5 breakpoint) | |
| 44px 터치 위반 | 0 | |
| 중복 id | 0 | |
| 캐릭터 가림 | 0% | 상승 피드백 포함 |
| 초기 로드 layout shift | 0px | 400ms~4.5s |
| out/ 변경 | 0 | 빌드 후 복구 완료 |

### 실행 불가로 남은 검증 (Phase 3 인계)

| 항목 | 이유 |
| --- | --- |
| Firebase 에뮬레이터 스위트 | firebase-tools 가 JDK 21+ 요구, 이 기기 JDK 17 |
| 실제 로그인 계정 화면 | 자격증명 없음 — 임시 스텁으로 레이아웃만 확인 |
| 오류·로딩 실화면 | uid 없이는 원격 요청이 일어나지 않아 상태 진입 불가 |
| ESLint | 저장소 flat config ↔ eslint 8.57 불일치 (main 에서도 동일 실패) |
| 이미지 자산 | 생성 크레딧 0 (free 플랜) |

## 5. My World production 파일 (65개)

`app/my-world/page.tsx` · `components/my-world/**`(21) · `hooks/my-world/`(1) ·
`lib/myWorld/**`(38) · `contexts/{Character,Diary,Room,Interaction,InteractionAudio}Context.tsx`(5)

## 6. 보상·보안 경계 파일 — **이번 Phase 에서 절대 수정 금지**

읽기만 한다. My World UI 가 이 파일들을 필요로 하면 수정하지 않고 차단 보고한다.

| 경계 | 파일 |
| --- | --- |
| 보상 계약 | `lib/rewardClient.ts` · `lib/myWorld/rewardOutbox.ts` · `functions/api/claim-reward.ts` · `functions/_shared/reward*.ts` |
| 재화·상점 | `lib/cottonCandy.ts` · `lib/shopClient.ts` · `lib/shopItems.ts` · `functions/_shared/shopCatalog.ts` · `functions/api/purchase.ts` |
| 게임 보상 | `lib/gameReward.ts` · `lib/gameData.ts` · `lib/dailyMission.ts` · `lib/missionProgress.ts` |
| 권한·규칙 | `firestore.rules` · `functions/_shared/adminAuth.ts` · `functions/api/admin/grant.ts` · `functions/_shared/candyEnv.ts` |
| 인증 | `contexts/AuthContext.tsx` · `lib/firebase.ts` · `lib/userPrivate.ts` |
| cooldown·판정 | `lib/myWorld/interaction/constants.ts`(수치) · `lib/myWorld/interaction/engine.ts`(판정) |
| identity gate | `lib/myWorld/identity.ts` · `lib/myWorld/storageScope.ts` |

My World UI 가 쓰는 것 중 **표시 전용으로만** 다루는 파일:
`lib/myWorld/interaction/availability.ts`(내가 만든 표시용 예측 — 정책 미정의),
`hooks/my-world/useGameProfile.ts`(캐시 읽기 전용).

## 7. 기존 스크린샷 (69개)

`_문서/my-world-refactor-2026-07-26/` 아래
`before` `before-probe` `after` `after-probe`(Phase 1) ·
`p2r1-guest` `p2final-guest` `p2final-signed`(Phase 2) ·
`p3r1-guest` `p3final-guest` `p3final-signed` `p3r3d-states` `p3final-signed-states`(Phase 3)

## 8. Phase 4 체크포인트 로그

| 커밋 | Workstream | 결과 |
| --- | --- | --- |
| `15a26d6` | WS0 기준선 | 복구 지점·divergence·경계 파일 고정 |
| `3c9ec72` | WS1·WS2 상태 모델·구조화 | 거짓 표현 3건 수정(확인중 위장·이미지 깨짐·삼켜진 저장 실패), 죽은 코드 4개 제거 |
| `72aa6ad` | WS3·WS7 하네스·자산 파이프라인 | 순수 view-model + 16 fixture · seam 스캐너 · manifest 150 · 자산 verifier. 테스트 160 → 183 |
| `8c16eb3` | WS4·WS5·WS9·WS10·WS11 | 보상 표시를 서버 확정 기준으로 · interval 누수 제거 · h1/landmark/캔버스 상한. 183 → 189 |
| `41b825a` | WS6·WS8·WS12·WS13·WS14·WS15 | 대비 AA 0건 미달 · 진입점 추가 · 견고성 8건 · 통합·QA 문서. 189 → 197 |
| `3c14cec` | WS16 최종 검증 | 접근성·성능 보고 · 자산 계약 갱신 · 전 게이트 재실행 |

### 최종 실측 (Phase 4 종료 시점)

| 항목 | 기준선 | 최종 | 판정 |
| --- | --- | --- | --- |
| 단위 테스트 | 160 pass | **197 pass / 0 fail** | ✅ +37 |
| `tsc` 오류 | 26 (전부 기존) | **26** | ✅ 신규 0 |
| `/my-world` route JS | 34.7 kB | 35.9 kB | ⚠️ +1.2 kB — 내역·허용 근거는 성능 보고 §1 |
| First Load JS | 267 kB | 268 kB | ⚠️ +1 kB |
| console 오류 | 0 | **0** | ✅ |
| horizontal overflow | 0 (5 vp) | **0 (12 vp)** | ✅ 범위 확대 |
| 44px 위반 | 0 | **0 (12 vp)** | ✅ |
| 중복 id | 0 | **0** | ✅ |
| WCAG AA 미달 | 미측정 | **0** (최저 4.51) | ✅ 신규 측정 |
| 유휴 interval | 1 (누수) | **0** | ✅ 누수 제거 |
| landmark `main` | 2 (중첩) | **1** | ✅ |
| out/ 변경 | 0 | **0** | ✅ |
| seam scan | 없음 | **PASS** | ✅ 신규 |
| asset verifier | 없음 | **PASS** | ✅ 신규 |
| CottonCandy 교집합 / conflict | 0 / 0 | **0 / 0** | ✅ 유지 |
