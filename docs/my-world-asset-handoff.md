# My World 이미지 제작 인수인계 패키지

작성: 2026-07-27 · branch `refactor/my-world-structure-design` · tip `18b1716281604c52b369aaac3b190b34bfe1b21f`
상태: **코드 변경 0건** — 이 문서와 스크린샷만 추가했다.

이 문서 하나만 읽으면 제작을 시작할 수 있다. 상세 프롬프트는 `MY-WORLD-ASSET-REQUEST.md`,
기계 판독 계약은 `lib/myWorld/assets/manifest.ts` 에 있다.

---

## 1. 자산 개수 확정 — 왜 숫자가 바뀌었나

| 보고 시점 | 총 개수 | MVP | 근거 |
| --- | --- | --- | --- |
| Phase 3 (초판) | 139~141 | 40~42 | **손으로 센 추정치.** 표정 세트를 일부 캐릭터만 계산했고, "약 40장" 처럼 범위로 적었다 |
| Phase 4 (현재) | **150** | **36** | `lib/myWorld/assets/manifest.ts` 가 registry 를 기준으로 **계산한 값**. `node scripts/verify-my-world-assets.mjs` 가 같은 수를 출력한다 |

### 변한 이유 (셋 다 계산 착오였고, 기능이 늘어난 게 아니다)

1. **총합 +9~11**: 초판은 "표정 6종 × 12캐릭터 = 72" 를 후속 단계에서 66으로 잘못 적었다(11종 × 6 = 66 은 맞지만, dori 6장을 MVP 쪽에서 이미 세고도 총합에서 한 번 더 빼먹었다). 정확히는 **12종 × 6 = 72**.
2. **MVP −4~6**: 초판 MVP 는 `dori` **기본 4종**(portrait·avatar·thumbnail·idle)을 넣었다. `idle` 은 현재 코드에서 **아무 곳도 소비하지 않는다**(향후 애니메이션 예약) → MVP 에서 제외했다.
3. **범위 표기 제거**: "40~42" 처럼 흔들리던 값을 계산으로 확정했다.

### 최종 내역 (manifest 계산)

```
캐릭터 12종 × (기본 4 + 표정 6) = 120
가구    12종 × (sprite + thumbnail) = 24
방 배경                              =  1
상태·효과(empty-room, empty-diary, guest-preview, fx-affinity, fx-exp) = 5
────────────────────────────────────────
합계                                  = 150
```

### 중복·선택·자동 파생 분리

| 구분 | 개수 | 설명 |
| --- | --- | --- |
| **실제 제작 필요** | 150 | 아래 세 줄을 뺀 나머지 전부 |
| 자동 파생 (제작 불필요) | 0 | 코드가 이미지를 합성·변형하지 않는다. 리사이즈도 하지 않는다 |
| 중복 정의 | **0** | `tests/my-world-assets.test.ts` 가 경로 중복을 실패시킨다 |
| 상태 조합으로 파생 | 0 | 감정은 **파일별 개별 이미지**다. `normal` 감정만 `portrait.webp` 를 재사용한다(파일 추가 없음) |
| 선택 사항 | **15** | `idle` 12장 + `fx-affinity`·`fx-exp` 2장 + `guest-preview` 1장 — 없어도 화면이 성립한다 |
| 필수 | **135** | 150 − 15 |

> `emotion-excited` · `emotion-angry` 는 `Emotion` 타입에는 있지만 **manifest 에 넣지 않았다**
> (지금 화면에서 거의 나오지 않는다). 필요해지면 manifest 에 2줄 추가하면 되고, 그때 총합은 174가 된다.

---

## 2. MVP Asset Pack — 1차 제작 범위 **37장**

manifest 의 `mvp:true` 는 36장이다. 여기에 요청하신 **게스트 미리보기 1장**을 더해 **37장**으로 정한다.

> ⚠️ `guest-preview.webp` 는 manifest 에서 `mvp:false` 다. 이 한 줄(`mvp: false → true`)은
> **코드 변경이라 이번에 하지 않았다.** 검증에는 영향이 없다 —
> `node scripts/verify-my-world-assets.mjs`(옵션 없이)는 150장 전체를 검사하므로 이 파일도 함께 확인된다.
> `--mvp` 플래그로 돌리면 36장만 본다.

### 공통 사양 (37장 전부)

| 항목 | 값 |
| --- | --- |
| 시점 | 정면에서 약 **15° 돌아간 3/4**, 눈높이. top-down·isometric 금지 |
| 광원 | **좌상단 35°** 단일 광원, 그림자는 우하단, 아주 부드러운 경계 |
| 스타일 | 부드러운 2D 벡터 일러스트, 균일한 중간 굵기 외곽선(1024px 기준 약 2px), 셀 셰이딩 1단, 무광 |
| 외곽선 색 | `#1C1917` (순수 검정 금지) |
| 채도 | 중간~낮음 |
| 글자·로고·워터마크 | **금지** |
| 파일 형식 | 제작은 PNG → 납품은 **WebP**(품질 82~88, 알파 유지). 원본 PNG 는 검토 폴더에 보관 |

**STYLE LOCK / NEGATIVE PROMPT 전문**은 `MY-WORLD-ASSET-REQUEST.md` §0 에 있다. 모든 프롬프트 앞에 그대로 붙인다.

### 목록

우선순위 P0 → P3 순으로 만든다. 앞 단계가 뒤 단계의 스타일 기준이 된다.

| # | 우선 | 파일 | 표시 크기(390 / 1440) | 원본 | 투명 | 배치 컴포넌트 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | **P0** | `characters/dori/portrait.webp` | 77×77 / 129×129 | 1024×1024 | ○ | `CharacterImage` ← 무대·`RoomCanvas` |
| 2 | P1 | `characters/dori/avatar.webp` | 48×48 / 48×48 | 256×256 | ○ | `CharacterAvatar` ← `WorldBar` |
| 3 | P1 | `characters/dori/thumbnail.webp` | 64~72 정사각 | 256×256 | ○ | `CharacterSelectModal` |
| 4 | **P0** | `rooms/backgrounds/basic/scene.webp` | 297×223 / 498×374 | 1536×1152 | ✕ | `RoomCanvas` (CSS 벽/바닥 대체) |
| 5 | P1 | `rooms/items/bed-basic/sprite.webp` | 119×67 / 199×112 | 1024×768 | ○ | `RoomItemSprite` |
| 6 | P1 | `rooms/items/desk-basic/sprite.webp` | 83×53 / 139×90 | 1024×768 | ○ | `RoomItemSprite` |
| 7 | P1 | `rooms/items/plant-basic/sprite.webp` | 45×58 / 75×97 | 512×896 | ○ | `RoomItemSprite` |
| 8 | P1 | `rooms/items/rug-basic/sprite.webp` | 기본 배치 러그 | 1024×576 | ○ | `RoomItemSprite` |
| 9–16 | P2 | `rooms/items/{chair,table,bookshelf,toybox,cushion,frame,doll,lamp}-basic/sprite.webp` | 각 §3 표 | §3 표 | ○ | `RoomItemSprite` |
| 17–28 | P2 | `rooms/items/{12종}/thumbnail.webp` | 48×48 | 256×256 | ○ | `RoomItemCard`(팔레트) |
| 29 | **P0** | `characters/dori/emotion-happy.webp` | portrait 와 동일 | 1024×1024 | ○ | 무대(감정 전환) |
| 30 | P1 | `characters/dori/emotion-love.webp` | 〃 | 1024×1024 | ○ | 〃 |
| 31 | P1 | `characters/dori/emotion-sleepy.webp` | 〃 | 1024×1024 | ○ | 〃 |
| 32 | P2 | `characters/dori/emotion-thinking.webp` | 〃 | 1024×1024 | ○ | 〃 |
| 33 | P2 | `characters/dori/emotion-hungry.webp` | 〃 | 1024×1024 | ○ | 〃 |
| 34 | P2 | `characters/dori/emotion-sad.webp` | 〃 | 1024×1024 | ○ | 〃 |
| 35 | P2 | `my-world/empty-diary.webp` | 290×124 / 298×137 영역 안 120 정사각 | 512×512 | ○ | `DiaryTimeline` 빈 상태 |
| 36 | P3 | `my-world/empty-room.webp` | 240×180 | 1024×768 | ○ | `RoomPreviewCard`(가구 0개) |
| 37 | P3 | `my-world/guest-preview.webp` | 320×226 / 532×229 영역 | 1536×1152 | ✕ | `GuestInvite` |

### 캐릭터 행동에 필요한 최소 상태

행동 4종이 어떤 감정으로 이어지는지 — **P0~P1 감정 3장이면 행동 전부가 그림으로 반응한다.**

| 행동 | 결과 감정 | 필요한 파일 |
| --- | --- | --- |
| 쓰다듬기 · 인사하기 · 캐릭터 터치 | `happy` | `emotion-happy.webp` (**P0**) |
| 선물하기 · 길게 누르기 · 친밀도 마일스톤 | `love` | `emotion-love.webp` (P1) |
| 재우기 · 밤 시간대 | `sleepy` | `emotion-sleepy.webp` (P1) |
| hover/포커스 미리보기 | `thinking` | `emotion-thinking.webp` (P2) |
| 식사 시간대 idle | `hungry` | `emotion-hungry.webp` (P2) |
| 오랜만에 돌아온 첫 순간 | `sad` | `emotion-sad.webp` (P2) |
| 그 외 전부 | `normal` | **없음** — `portrait.webp` 재사용 |

### 이미지 오류 fallback — **제작할 자산이 없다**

"이미지 로드 실패 시 무엇을 보여줄지" 는 이미 코드가 처리한다.

| 상황 | 동작 | 담당 |
| --- | --- | --- |
| 플래그 OFF | 이미지를 **요청조차 하지 않는다**(404 방지) | `CharacterImage` · `RoomItemSprite` |
| 플래그 ON + 파일 없음/깨짐 | `onError` → **이모지 placeholder** 로 조용히 되돌림. 브라우저 기본 깨진 아이콘 없음 | `CharacterImage` |
| 캐릭터 교체 | 실패 기록 초기화 후 재시도 | `CharacterImage` |
| 레이아웃 | 정사각 비율 예약 → 이미지 전후 흔들림 0 | `CharacterImage` |

→ **fallback 전용 이미지를 만들지 마세요.** 만들면 이모지 폴백과 중복됩니다.

### 개별 생성 프롬프트

`MY-WORLD-ASSET-REQUEST.md` 에 전문이 있다. 참조 위치:

| 자산 | 문서 위치 |
| --- | --- |
| `dori` 본문 | §1-C 표 첫 행 |
| 표정 6종 | §1-C 하단 "expression 문구" 표 + CONSISTENCY LOCK |
| 방 배경 | §2 (`scene.webp` 프롬프트 + 추가 negative) |
| 가구 12종 | §3 표 (전부 `, isolated object on transparent background, no ground shadow baked in, no floor, no wall` 로 끝냄) |
| `empty-room` · `empty-diary` · `guest-preview` | §4 |

### 합격 기준 (자산마다 확인)

1. 요구 원본 해상도와 **정확히 일치** (verifier 가 헤더로 검사)
2. 투명 요구 자산에 **알파 채널 존재** (verifier 검사)
3. 방 배경은 **상단 66% 벽 / 하단 34% 바닥**, 완전히 빈 방
4. 시점 15° 3/4 · 광원 좌상단 · 외곽선 `#1C1917`
5. 가구는 **밑면이 프레임 하단에 닿음** (코드가 접지 그림자를 따로 그린다)
6. 표정 세트는 **얼굴 비율·색·무늬가 기준 portrait 와 동일**, 표정만 다름
7. 용량 예산 이내 (§3 표, verifier 가 경고)
8. 48px 로 줄여도 형태가 식별됨(썸네일)

### 불합격 기준 (하나라도 걸리면 재생성)

1. 글자·로고·워터마크·서명이 있다
2. 투명이어야 하는데 흰 사각이 남았다
3. 방 배경에 가구·창문·문·사람이 들어갔다
4. top-down 또는 isometric 시점
5. 외곽선이 순수 검정
6. 광원 방향이 다른 자산과 반대
7. 그림자가 이미지에 **구워져** 있다
8. 표정 세트에서 얼굴 비율·색이 달라졌다
9. subject 가 프레임에서 잘렸다
10. 해상도 불일치
11. 용량 예산 크게 초과

---

## 3. 자산이 놓일 화면 위치 (실측 좌표표)

Phase 4 실제 화면에서 각 이미지가 들어갈 자리를 측정했다. 좌표는 **문서 좌상단 기준(px)**,
`y` 는 스크롤 포함 절대 위치다. 스크린샷과 대조해 쓰면 된다.

### 게스트 · 390×844 (문서 높이 1937)

| 자산 | 크기 | 위치 (x, y) | 비고 |
| --- | --- | --- | --- |
| `characters/dori/portrait.webp` | 77×77 | (156, 401) | 무대 주역. 감정 전환 시 `emotion-*` 로 교체 |
| `characters/dori/avatar.webp` | 48×48 | (47, 127) | 월드 바 |
| `rooms/backgrounds/basic/scene.webp` | 297×223 | (47, 262) | 벽 66% / 바닥 34% |
| `rooms/items/bed-basic/sprite.webp` | 119×67 | (67, 326) | 기본 배치 |
| `rooms/items/desk-basic/sprite.webp` | 83×53 | (225, 337) | 기본 배치 |
| `rooms/items/plant-basic/sprite.webp` | 45×58 | (292, 388) | 기본 배치 |
| `my-world/guest-preview.webp` | 320×226 | (35, 787) | 게스트 초대 패널 |

### 게스트 · 1440×900 (문서 높이 1543)

| 자산 | 크기 | 위치 (x, y) |
| --- | --- | --- |
| `characters/dori/portrait.webp` | 129×129 | (477, 521) |
| `characters/dori/avatar.webp` | 48×48 | (293, 143) |
| `rooms/backgrounds/basic/scene.webp` | 498×374 | (293, 287) |
| `rooms/items/bed-basic/sprite.webp` | 199×112 | (328, 395) |
| `rooms/items/desk-basic/sprite.webp` | 139×90 | (592, 414) |
| `rooms/items/plant-basic/sprite.webp` | 75×97 | (704, 500) |
| `my-world/guest-preview.webp` | 532×229 | (276, 925) |

### 로그인(mock) · 390×844 (문서 높이 2044)

캐릭터·방·가구 좌표는 게스트와 **동일**하다(월드 바 높이가 같다). 달라지는 것은 기록 영역뿐이다.

| 자산 | 크기 | 위치 (x, y) |
| --- | --- | --- |
| `my-world/empty-diary.webp` | 290×124 영역 | (50, 1003) |

### 로그인(mock) · 1440×900 (문서 높이 1387)

| 자산 | 크기 | 위치 (x, y) |
| --- | --- | --- |
| `my-world/empty-diary.webp` | 298×137 영역 | (845, 439) |

### 크기 요약 — 왜 원본이 그렇게 큰가

| 자산 | 최대 표시 | 배율 여유 | 원본 |
| --- | --- | --- | --- |
| 캐릭터 portrait | 129px (1440) | 2× + 넓은 화면 여유 | 1024 |
| 가구 sprite | 사용자가 `scale` 을 최대 1.8배까지 키울 수 있다 | 1.8 × 2× | §3 표 |
| 방 배경 | 498px (캔버스 상한 600px) | 2× + 여유 | 1536 |

가구 크기는 `registry.ts` 의 `defaultWidth/Height` × 캔버스 532×399 × `scale` 1.8 로 계산했다.
`lib/myWorld/assets/manifest.ts` 의 `roomItemSpecs()` 가 같은 식을 쓴다.

---

## 4. 전달 파일 목록 (최종 경로)

| 파일 | 경로 | 용도 |
| --- | --- | --- |
| 자산 사양 전문 | `illo-myworld/MY-WORLD-ASSET-REQUEST.md` | STYLE LOCK · negative · 자산별 프롬프트 · 제작 순서 · 검수 |
| 기계 판독 계약 | `illo-myworld/lib/myWorld/assets/manifest.ts` | 150개 spec(경로·크기·투명·우선순위·예산) |
| 이 문서 | `illo-myworld/docs/my-world-asset-handoff.md` | 개수 확정 · MVP 37 · 좌표표 · 실행 명령 |
| 검증 도구 | `illo-myworld/scripts/verify-my-world-assets.mjs` | 존재·해상도·알파·중복·예산·플래그 fail-safe |
| 시각 감사 | `illo-myworld/docs/my-world-visual-audit.md` | 왜 이 자산들이 필요한지 |
| **대표 스크린샷 4장** | `_문서/my-world-refactor-2026-07-26/handoff-guest/{390,1440}.png`<br>`_문서/my-world-refactor-2026-07-26/handoff-signed/{390,1440}.png` | 제작자가 볼 현재 화면 |
| 좌표 원본(JSON) | 위 두 폴더의 `slots.json` | 이 문서 §3 표의 원본 데이터 |

---

## 5. 이미지가 도착한 뒤 실행할 명령

```bash
cd "D:/01. illo.im/illo-myworld"

# 1) 검토 폴더에서 사양 확인 (production 경로에 넣기 전)
node scripts/verify-my-world-assets.mjs --json

# 2) public/ 규약 경로로 옮긴 뒤 전체 검사
node scripts/verify-my-world-assets.mjs

# 3) MVP 만 확인하고 싶을 때
node scripts/verify-my-world-assets.mjs --mvp
```

검사 항목: 파일 존재 · 해상도 일치 · 알파 채널 · 중복 정의 · manifest 에 없는 파일 ·
용량 예산 · **readiness 플래그 fail-safe**.

현재 출력:
```
[assets] 선언 150개 (MVP 36) · 검사 150 · 존재 0 · 없음 150
[assets] 플래그 CHARACTER_ASSETS_READY=false ROOM_ASSETS_READY=false
[assets] PASS — 계약 위반 0건
```

---

## 6. READY 플래그를 켜기 전 통과 조건

플래그는 **fail-safe** 다. 자산이 없는데 켜면 검증과 테스트가 실패한다.

### `CHARACTER_ASSETS_READY = true` (`lib/myWorld/character/utils.ts:7`)

- [ ] `characters/dori/{portrait,avatar,thumbnail}.webp` 3장 존재 + 해상도·알파 통과
- [ ] `node scripts/verify-my-world-assets.mjs` 가 캐릭터 그룹에서 오류 0
- [ ] 나머지 11종이 아직 없다면 **그 캐릭터를 고른 사용자에게는 이모지 폴백**이 뜬다는 것을 확인하고 수용
- [ ] `npm test` 의 `readiness 플래그는 자산이 없는 동안 반드시 꺼져 있다` 테스트 통과

### `ROOM_ASSETS_READY = true` (`lib/myWorld/room/constants.ts:26`)

- [ ] 가구 12종 `sprite.webp` + `thumbnail.webp` **24장 전부** 존재
- [ ] `rooms/backgrounds/basic/scene.webp` 존재 (벽 66% / 바닥 34%)
- [ ] verifier 방 그룹 오류 0
- [ ] 방 배경을 실제로 쓰려면 `RoomCanvas` 의 CSS 벽/바닥을 이미지로 바꾸는 **코드 변경이 필요**하다
      (플래그만으로는 가구 sprite 만 반영된다)

### 두 플래그 공통

- [ ] `npm test` 197 pass / 0 fail 유지
- [ ] `npx tsc --noEmit` 오류 26개 유지(신규 0)
- [ ] `npx next build` 성공 후 **`git checkout -- out && git clean -fdq out`** (out/ 커밋 금지)
- [ ] `node scripts/scan-production-seams.mjs` PASS
- [ ] 실제 화면에서 12 viewport 캡처 재확인 (레이아웃 흔들림 0)

### 표정 세트를 쓰려면 (코드 변경 필요)

`characterAssetPath()` 에 `emotion-{key}` 종류를 추가하고, 무대에서 `EMOTION_META` 키로 경로를
만들어야 한다(1~2줄). 이번 트랙에서는 하지 않았다.

---

## 7. 안전 상태 확인 (이 작업 종료 시점)

| 항목 | 상태 |
| --- | --- |
| branch tip | `18b1716281604c52b369aaac3b190b34bfe1b21f` **보존** |
| 워킹트리 | clean (이 문서 추가 전 기준 0건) |
| 코드 변경 | **0건** — `.md` 문서와 `_문서/` 스크린샷만 |
| 임시 스텁 | 로그인 화면 캡처용으로 적용 후 **완전 제거**(마커 0 · `git diff` 비어 있음 · seam scan PASS) |
| 실제 로그인 QA | **수행하지 않음** |
| 보상 행동 실행 | **수행하지 않음** (캡처 중 버튼 클릭 0회) |
| main merge / rebase | 하지 않음 |
| Draft PR | 만들지 않음 |
| deploy.js / 배포 | 실행하지 않음 |
| production 데이터 쓰기 | 없음 |
