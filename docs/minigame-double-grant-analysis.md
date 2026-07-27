# 미니게임 이중 지급 — 재현·원인·계약 (결함 B)

기준 `2ed304b9463` · 재현 `tests/edge/run-doublegrant-e2e.mjs`(31/31) · **Production 재현 0건**

---

## 1. "한 판 완료" 가 만드는 호출 (시퀀스)

### 1-1. 구버전 live client (현재 Production, buildId `vG_Fwmt0xMymPpf4uymsB`)

```
사용자                 PlaytimeRewardToast        lib/cottonCandy           Firestore            /api/claim-reward
  │  미니게임 페이지 진입        │                        │                      │                       │
  │──────────────────────────>│                        │                      │                       │
  │        (60초 체류)          │  hasClaimedPlaytimeToday(localStorage) 확인   │                       │
  │                           │───────────────────────>│                      │                       │
  │                           │  grantPlaytimeReward(email, 50)               │                       │
  │                           │───────────────────────>│                      │                       │
  │                           │                        │ ① addCottonCandy(+50)│                       │
  │                           │                        │─────────────────────>│  cottonCandy += 50    │
  │                           │                        │                      │  (구 Rules 가 허용)     │
  │                           │                        │ ② submitGameReward("minigame_play",           │
  │                           │                        │      sourceId: playtime_{date})               │
  │                           │                        │──────────────────────────────────────────────>│
  │                           │                        │                      │   병합 전: EXP 5 만     │
  │                           │                        │                      │   병합 후: EXP 5 + 재화 50 ← 문제
  │   토스트 "+50"             │<───────────────────────│                      │                       │
```

- 미션(`mission_complete`)은 **발생하지 않는다** — 구버전은 `postset/commentset/likeset` 만 보낸다(전부 재화 0).
- 트리거: **로그인 상태로 미니게임 페이지에 60초 체류**. 사이트 일반 이용·미션 카드 클릭으로는 발생하지 않는다.
- 하루 1회 게이트는 **localStorage**(`hasClaimedPlaytimeToday`).

### 1-2. 신규 client (미배포)

```
사용자      PlaytimeRewardToast     lib/cottonCandy                    /api/claim-reward
  │  (60초)        │                     │                                    │
  │──────────────>│  grantPlaytimeReward │                                    │
  │               │────────────────────>│ ① claimGameReward("minigame_play")  │
  │               │                     │───────────────────────────────────>│  EXP 5 + 재화 50
  │               │                     │ ② completeMission("play_minigame")  │
  │               │                     │───────────────────────────────────>│  EXP 10 + 재화 40
  │               │                     │ ③ recordCandyHistory(표시 캐시만)     │
```

**클라이언트 직접 Firestore 쓰기 없음.** 잔액은 서버 응답으로 확정된다.

---

## 2. 정확한 보상 계약 (소스로 확정, 추측 없음)

| 구성 | rewardType | sourceId | candy | exp | 빈도 |
|---|---|---|---|---|---|
| 플레이타임 보상 | `minigame_play` | `playtime_{date}` | **50** | 5 | 1일 1회 |
| 일일 미션 '미니게임 1판' | `mission_complete` | `play_minigame_{date}` | **40** | 10 | 1일 1회 |

- **신규 client 한 판 = 90 candy + 15 exp** (`EXTENDED_REWARD_POLICIES` · `MISSION_CANDY` 실행 확인)
- **구버전 client 한 판(병합 전) = 50 candy + 5 exp**
- **구버전 client 한 판(병합 후) = 100 candy + 5 exp** ← 이중 지급

## 3. 원인

서버는 요청만 보고 **클라이언트 세대를 구분할 수 없다.**
구버전과 신규가 **완전히 동일한 요청**(`minigame_play` + `playtime_{date}`)을 보낸다.
병합이 그 타입에 재화를 붙이자, 로컬에도 쓰는 구버전에서 합계가 2배가 됐다.

원장은 정상이었다 — `rewardOperations` 는 1건, `awardedCandy` 50. **문제는 클라 직접 쓰기와의 합산**이다.

## 4. 수정

재화를 **스스로 쓰지 않는** 클라만 `candyOwner: "server"` 를 보낸다.

```ts
// lib/rewardClient.ts — 확장 타입에만 붙인다
const candyOwner = intent.rewardType === "my_world_interaction" ? {} : { candyOwner: "server" as const };
```
```ts
// functions/api/claim-reward.ts
const candyAward = candyAllowed && intent.candyOwnerIsServer ? Math.min(...) : 0;
```

- 표식 없음 → 서버 재화 **0**, EXP 는 그대로 → 구버전 합계 50 (**병합 전 계약 유지**)
- 표식 있음 → 서버 재화 **50**, 클라 직접 쓰기 없음 → 신규 합계 50
- **fail-safe 방향**: 모르면 "클라가 쓴다"고 가정한다
- 잘못된 값(`""`,`"client"`,숫자,불리언,객체)은 **400 `invalid_candy_owner`**

⚠️ `my_world_interaction`·`daily_attendance` 정제기는 미지 필드를 거부하므로 **확장 타입에만** 붙인다.
(이 한계를 놓쳤다면 상호작용 보상이 전부 400 이 됐을 것 — 구현 중 발견해 수정)

### 보안 경계가 아니다
공격자가 구버전 client 로 표식을 수동 전송해도, **Rules 배포 전에는 어차피 재화를 직접 쓸 수 있고**,
**Rules 배포 후에는 직접 쓰기가 막혀** 어느 쪽이든 서버 값만 남는다. 순수한 **과도기 세대 구분자**다.

## 5. 호환성 매트릭스 (테스트로 고정)

| Client | Functions | Rules | 한 판 합계 | 판정 |
|---|---|---|---|---|
| 구버전 | 구버전 | 구버전 | 50 | 기존 기준 |
| 구버전 | **병합 현재** | 구버전 | **100** | 🔴 문제(카나리 UID 한정) |
| 구버전 | **수정** | 구버전 | **50** | ✅ |
| 신규 | 수정 | 구버전 | **50** | ✅ |
| 신규 | 수정 | 신규 Rules | **50** | ✅ |

*(신규 client 는 미션 40 이 추가되어 실제 총액 90 — 위 표는 "플레이타임 보상" 항목만 비교한 것)*

## 6. 검증 (31/31)

한 판 전체 시퀀스(90 candy·15 exp·원장 2건) · 재전송 · 여러 탭 동시(5) · 연속 두 판 ·
`minigame_play`+`mission_complete` 동시 발생 · `candyOwner` 위조값 5종 ·
**출석은 표식과 무관하게 지급**(계약 불변) · 구버전 EXP 전용 미션 3종 무변화 ·
다른 미션(`write_post` 80) 정상 · 일일 상한 직전(20만 지급)/도달(0) · 날짜 경계.

## 7. 바꾸지 않은 것

- **금액**: 50·40 어느 것도 변경하지 않았다
- **출석 계약**: `daily_attendance` 는 이 경로를 타지 않는다
- **다른 mission_complete**: `write_post`·`read_trend` 등 전부 그대로
- **EXP**: 표식과 무관하게 항상 지급
