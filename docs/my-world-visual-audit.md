# My World 시각 감사 (Phase 3, 2026-07-26)

브랜치: `refactor/my-world-structure-design`
목적: 코드를 고치기 전에 **실제로 존재하는 시각 자산**과 사이트의 디자인 언어를 확인해,
재사용할 것과 교체해야 할 것을 가른다.

---

## 1. 결론 먼저

| 구분 | 내용 |
| --- | --- |
| **재사용 가능** | 색상 토큰(따뜻한 크림·오렌지 계열), Pretendard, 사이트 공통 표면색(`#FBEEE7`·`#FFF1E3`), 방 좌표계·가구 정의·감정 카탈로그, 에셋 폴더 구조·경로 규약 |
| **교체 필요(이미지)** | 캐릭터 12종 그림, 캐릭터 표정 세트, 가구 12종 그림, 방 벽·바닥, 빈 방/빈 일기 일러스트, 게스트 미리보기, 보상 피드백 효과 |
| **현재 상태** | 위 이미지가 **하나도 없다.** 전부 이모지 placeholder 로 그려지고 있다 |
| **이번 Phase 3 에서 한 것** | 이미지가 필요 없는 아트 디렉션(표면·레이아웃·위계·감정 표현·마이크로 인터랙션)만 구현 |
| **이번 Phase 3 에서 하지 않은 것** | 이미지 자산 제작 — 생성 도구의 크레딧이 0 이라 실제 호출이 `Out of credits` 로 실패. 저품질 대체물을 만들지 않고 `MY-WORLD-ASSET-REQUEST.md` 로 남겼다 |

---

## 2. 캐릭터 자산

정의: `lib/myWorld/character/registry.ts` — 12종.

| id | 이름 | 종 | 희귀도 | themeColor | 현재 표시 |
| --- | --- | --- | --- | --- | --- |
| dori | 도리 | 여우 | common | `#F9954E` | 이모지 🦊 |
| bomi | 보미 | 토끼 | common | `#F368A0` | 🐰 |
| nabi | 나비 | 고양이 | common | `#8B7BE8` | 🐱 |
| haru | 하루 | 강아지 | common | `#4FA3E3` | 🐶 |
| pengs | 펭수 | 펭귄 | rare | `#3FBBD6` | 🐧 |
| gomi | 고미 | 곰 | rare | `#B5895E` | 🐻 |
| simba | 심바 | 사자 | rare | `#EDA92E` | 🦁 |
| buhu | 부후 | 부엉이 | rare | `#7E88A8` | 🦉 |
| mango | 망고 | 호랑이 | epic | `#F0851F` | 🐯 |
| koya | 코야 | 코알라 | epic | `#7FA894` | 🐨 |
| uni | 유니 | 유니콘 | legendary | `#C88BE8` | 🦄 |
| ari | 아리 | 용 | legendary | `#3FAF9E` | 🐉 |

### 파일 실측

```
public/characters/
  README.md          (672 B)
  {12개 id}/.gitkeep  (각 120 B)
```

**이미지 0개.** 폴더와 경로 규약만 준비돼 있다.
경로 생성기: `lib/myWorld/character/utils.ts` → `/characters/{id}/{thumbnail|portrait|idle|avatar}.webp`
게이트: `CHARACTER_ASSETS_READY = false` → 컴포넌트가 이모지로 폴백.

### 감정 상태

`lib/myWorld/interaction/catalog.ts` 의 `EMOTION_META` — 9종이 이미 정의돼 있다
(`happy · normal · sleepy · hungry · thinking · excited · sad · angry · love`).
각 감정에 label·emoji·color 가 있으나 **표정 이미지가 없다.**
애니메이션은 CSS 키프레임 14종(`app/globals.css` `.mw-anim-*`)으로 존재 — 이미지가 들어오면 그대로 재사용 가능.

**판정:** 이모지는 임시 데모로 보인다(지적사항 ①). 12종 × (기본 + 표정) 이미지가 필요하다.
단, `CharacterAvatar` / `RoomCanvas` / 무대가 이미 "이미지 우선 → 이모지 폴백" 구조라
**이미지를 넣고 플래그만 켜면 코드 변경 없이 반영된다.**

---

## 3. 가구 · 방 자산

정의: `lib/myWorld/room/registry.ts` — 가구 12종, 테마/바닥/벽 각 1종.

| itemId | 이름 | 카테고리 | 기본 크기(%) | layer | 회전/반전 | 현재 표시 |
| --- | --- | --- | --- | --- | --- | --- |
| bed-basic | 침대 | furniture | 40×30 | 1 | ○/○ | 🛏️ |
| desk-basic | 책상 | furniture | 28×24 | 1 | ○/○ | 🗄️ |
| chair-basic | 의자 | furniture | 15×22 | 1 | ○/○ | 🪑 |
| table-basic | 작은 테이블 | furniture | 20×18 | 1 | ○/○ | ☕ |
| bookshelf-basic | 책장 | storage | 24×40 | 1 | ✕/○ | 📚 |
| toybox-basic | 장난감 상자 | storage | 20×18 | 1 | ○/○ | 📦 |
| rug-basic | 러그 | decoration | 46×26 | 0 | ○/✕ | 🟫 |
| cushion-basic | 쿠션 | decoration | 16×14 | 1 | ✕/○ | 🟦 |
| frame-basic | 액자 | decoration | 16×18 | 3(벽) | ✕/○ | 🖼️ |
| doll-basic | 인형 | decoration | 12×18 | 2 | ✕/○ | 🧸 |
| plant-basic | 화분 | plant | 15×26 | 2 | ✕/○ | 🪴 |
| lamp-basic | 스탠드 조명 | lighting | 14×30 | 2 | ✕/○ | 💡 |

### 파일 실측

```
public/rooms/
  README.md                       (1.8 KB)
  backgrounds/basic/.gitkeep
  floors/basic-wood/.gitkeep
  walls/basic-warm/.gitkeep
  items/{12개 itemId}/.gitkeep
```

**이미지 0개.** 벽·바닥은 CSS 그라데이션으로 대체돼 있다.
- 벽: `linear-gradient(180deg,#FBEFE2,#F6E2CE)`
- 바닥: `linear-gradient(180deg,#E8D2B4,#D8BE99)`, 높이 = 캔버스의 34%
- 캔버스 비율 4:3 고정, 좌표는 **퍼센트** (기기 무관) — 이미지가 들어와도 좌표 호환 유지
게이트: `ROOM_ASSETS_READY = false`

**판정:** 방이 "사각형 위에 아이콘"으로 보이는 원인(지적사항 ②)은 벽·바닥·가구 이미지가 전부
없기 때문이다. Phase 2 에서 접지 그림자·굽도리선·원근 하이라이트·비네트를 넣어 깊이감은
개선했지만, **가구가 이모지인 한 한계가 있다.** 이미지가 최우선 필요 항목이다.

---

## 4. 아이콘

| 종류 | 위치 | 상태 |
| --- | --- | --- |
| 솜사탕 | `components/icons/CottonCandy.tsx` (SVG 컴포넌트) | 재사용 가능 |
| 사이트 아이콘 | `lucide-react` (의존성에 있음) | 재사용 가능 |
| My World UI 아이콘 | 없음 — 전부 이모지 문자(💗 ✨ 🌙 🎯 🛋️ 📖 …) | 부분 교체 검토 대상 |

이모지는 상태 표시용 보조 기호로는 허용 범위지만, **캐릭터·가구처럼 "콘텐츠"인 자리에는 부적합**하다.
상태 기호(💗/✨)는 lucide 아이콘으로 교체하면 더 정돈되나, 이번 Phase 에서는 정보 위계와
표면 디자인을 먼저 잡고 아이콘 교체는 자산 작업과 함께 하도록 남겼다.

---

## 5. 폰트 · 색상 토큰 (재사용)

- **폰트**: Pretendard (dynamic subset, jsdelivr) — `app/layout.tsx` 에서 전역 지정. My World 전용 폰트 없음.
- **CSS 변수** (`app/globals.css` `:root`) — 이미 "따뜻한 크림/에디토리얼" 톤으로 정의돼 있다.

| 변수 | 값 | 의미 |
| --- | --- | --- |
| `--background` | `35 40% 97%` → `#FBF7F1` | Warm paper |
| `--foreground` | `22 13% 11%` → `#1C1917` | Warm near-black |
| `--primary` | `25 94% 64%` → `#F9954E` | 브랜드 오렌지 |
| `--secondary` | `36 32% 93%` → `#F2EADF` | Warm sand |
| `--muted` | `37 34% 94%` → `#F7F2EA` | Warm cream |
| `--muted-foreground` | `28 9% 47%` → `#8A7F76` | Warm gray |

### 사이트 전역에서 실제로 많이 쓰는 색 (사용 횟수 실측)

| 색 | 횟수 | 용도 |
| --- | --- | --- |
| `#F9954E` | 285 | 주 버튼·강조 |
| `#FBEEE7` | 77 | **따뜻한 블러시 표면** |
| `#E8832E` | 20 | 버튼 hover |
| `#FFF1E3` | 6 | 옅은 크림 표면 |

**판정:** 사이트는 이미 크림·블러시 표면을 쓰고 있는데 My World 만 **순백 카드**를 반복해
톤이 겉돌았다(지적사항 ④·⑤). Phase 3 은 `#FBEEE7`/`#FFF1E3`/warm sand 를 표면 기본값으로 삼고
순백은 "떠 있어야 하는 요소"에만 쓴다.

---

## 6. 다른 화면의 디자인 언어

| 화면 | 특징 | My World 에 가져올 것 |
| --- | --- | --- |
| 홈 (`components/home/*`) | 정돈된 편집 그리드, `backdrop-blur` 유리 표면, `#FBEEE7` 블록, 오렌지 그림자(`shadow-[#F9954E]`) | 편집형 여백 감각, 블러시 표면, 오렌지 그림자 |
| 프로필/마이 (`components/my/MyDashboard.tsx`) | 수치 카드 + 티어 배지 | 수치 위계(모두 크게 X) |
| 미니게임 (`app/minigame/*`, `lib/minigames/*`) | 게임 UI 이지만 어수선하지 않음 | 게임감과 정돈 사이의 균형 |
| 레이아웃 (`components/layout/LayoutClient.tsx`) | `pt-[100px] pb-[80px] lg:pb-[200px] xl:px-[260px]`, 좌우 광고 레일(≥1280) | 폭 제약·레일 회피 규칙 |

`xl:px-[260px]` 가 광고 레일 자리를 이미 비워두므로 그 안에서는 폭을 넓혀도 충돌하지 않는다
(Phase 2 에서 실측 확인: 1440 콘텐츠 920px 사용, 레일 x=1212 와 미충돌).

---

## 7. 지적사항별 원인과 이번 Phase 처리

| # | 지적 | 원인 | Phase 3 처리 |
| --- | --- | --- | --- |
| ① | 이모지가 임시 데모처럼 보임 | 캐릭터·가구 이미지 0개 | **자산 요청서로 이관**(생성 불가). 이모지 유지 |
| ② | 방이 사각형 위 아이콘 | 벽·바닥·가구 이미지 0개 | 자산 요청서 + 조명/원근/그림자 보강으로 완화 |
| ③ | 각 영역이 별도 카드로 끊김 | 패널이 독립 흰 카드 | **하나의 월드 컨테이너 + 기록 영역 통합** |
| ④ | 오렌지 버튼 + 흰 카드 반복 | 표면 1종 + 강조색 1종 | **표면 4단(paper·cream·blush·wood) + 강조 위계 분리** |
| ⑤ | 2열이 위젯 모음처럼 보일 위험 | 열 사이 시각적 연결 없음 | 월드 컨테이너로 두 열을 한 배경 위에 묶음 |
| ⑥ | 게스트가 제품 안내 화면 같음 | 혜택 카드 3장이 상단 점유 | 체험을 먼저, CTA 는 체험 뒤 한 곳 |
| ⑦ | 모바일에서 교감까지 느림 | 헤더+오늘 카드가 캐릭터를 아래로 밀어냄 | 월드 바에 오늘 지표를 얇게 흡수, 무대를 위로 |
| ⑧ | 감정·친밀도 전달 부족 | 상태가 표 형태 수치로만 존재 | 감정 후광·친밀도 링·캐릭터 주변 상승 피드백 |

---

## 8. 이미지 없이 개선할 수 없는 것 (한계 명시)

- 캐릭터의 **표정 변화** — 현재 감정은 색·라벨·CSS 애니메이션으로만 전달된다. 표정 이미지가 없으면
  "감정이 얼굴로 보이는" 경험은 불가능하다.
- 가구의 **재질감·시점 통일** — 이모지는 기기별 폰트로 렌더되어 광원·외곽선·시점을 통일할 수 없다.
- **빈 방·빈 일기 일러스트** — 현재는 이모지 + 문장. 일러스트가 들어오면 빈 상태의 정서가 달라진다.

이 항목들은 `MY-WORLD-ASSET-REQUEST.md` 의 사양대로 이미지가 준비되면
`CHARACTER_ASSETS_READY` / `ROOM_ASSETS_READY` 플래그만 켜서 반영할 수 있다.
