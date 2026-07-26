# MY WORLD — 이미지 자산 요청서

작성: 2026-07-26 · 브랜치 `refactor/my-world-structure-design`

## 왜 이 문서가 있는가

Phase 3 비주얼 리디자인에서 캐릭터·가구·방 배경 이미지가 필요하다고 판단했으나,
**이 환경에서는 이미지를 생성할 수 없다.**

```
balance → { "credits": 0, "subscription_plan_type": "free" }
generate_image(nano_banana_pro, 4:3) → 비용 preflight: 2 credits
generate_image(실제 호출)            → Error: Out of credits in the selected workspace.
```

지시에 따라 **저품질 대체물(CSS 그라데이션·이모지·임시 아이콘)로 얼버무리지 않았다.**
이미지가 필요한 자리는 기존 이모지 placeholder 를 그대로 유지했고, 이 문서에 사양을 남긴다.

기존 파일은 하나도 덮어쓰지 않았다 — 현재 `public/characters`·`public/rooms` 에는
`.gitkeep` 과 `README.md` 만 있고 이미지가 0개다(원본 훼손 위험 없음).

---

## 0. 공통 스타일 (모든 자산에 동일 적용)

일관성이 가장 중요하다. 아래 블록을 **모든 프롬프트 앞에 그대로 붙인다.**

```
STYLE LOCK (prepend to every prompt):
soft 2D vector illustration, gentle hand-drawn feel, warm children's-book-adjacent
but not babyish; medium-thin uniform outline (about 2px at 1024px), slightly rounded
corners on forms, subtle cel shading with one soft shadow tone, no gradients heavier
than two stops, matte finish, no gloss highlights, no neon;
LIGHT: single soft light source from upper-left at about 35 degrees, shadows fall
lower-right, very soft shadow edges;
VIEW: straight-on front view with a very slight 3/4 turn (about 15 degrees), eye level,
no perspective distortion, no top-down, no isometric;
PALETTE: warm cream #FBF7F1, blush #FBEEE7, pale cream #FFF1E3, warm sand #F2EADF,
brand orange #F9954E, deeper orange #E8832E, coral #F4A98C, wood #C9A27E and #D7B899,
warm gray #8A7F76, warm near-black #1C1917 for outlines (never pure black);
SATURATION: medium-low, muted and cozy;
composition centered, generous even margins, nothing cropped at edges.
```

```
NEGATIVE PROMPT (use for every asset):
text, letters, words, numbers, typography, watermark, logo, signature, caption,
UI elements, buttons, frames, borders, drop shadow box, checkerboard pattern,
photorealistic, 3D render, glossy plastic, chrome, neon, harsh contrast,
heavy black outlines, sketchy pencil lines, cluttered detail, busy background,
multiple characters when one is asked, cropped subject, tilted horizon,
anime big-eye style, chibi extreme proportions, emoji, sticker outline, drop-shadow halo
```

**표정 세트 추가 잠금**(감정 자산에만 덧붙임):

```
CONSISTENCY LOCK (emotion sets only):
identical character identity as the base portrait — same head-to-body ratio,
same fur/skin colors and markings, same eye shape and spacing, same ear shape,
same outfit; ONLY the facial expression and eyebrow/mouth shapes change;
same camera distance, same pose, same lighting.
```

---

## 1. 캐릭터

### 우선순위

| 단계 | 범위 | 이유 |
| --- | --- | --- |
| **A (필수)** | `dori` 기본 4종 + 표정 6종 | 기본 캐릭터. 첫 화면·무대·헤더·아바타 전부 dori 로 시작 |
| **B** | 나머지 11종 `portrait` + `thumbnail` | 캐릭터 선택 모달이 12칸이라 하나만 그림이면 더 어색하다 |
| **C** | 나머지 11종 표정 6종 | 총 66장 — 마지막 |

### 1-A. 기본 자산 (캐릭터당 4장)

| 파일명 | 용도 | 화면 표시 크기 | 원본 해상도 | 투명 |
| --- | --- | --- | --- | --- |
| `portrait.webp` | 무대 위 캐릭터(주역), 게스트 인트로 | 61–130px (뷰포트 360→1440) · scale 여유 필요 | **1024×1024** | ○ |
| `thumbnail.webp` | 캐릭터 선택 모달 그리드 | 64–72px | **256×256** | ○ |
| `avatar.webp` | 월드 바 아바타 | 52–60px | **256×256** | ○ |
| `idle.webp` | 향후 애니메이션 기본 포즈 | portrait 와 동일 | 1024×1024 | ○ |

경로: `public/characters/{id}/{파일명}` — 이미 존재하는 규약(`lib/myWorld/character/utils.ts`).

`portrait` 은 **전신 또는 상반신 일관 선택** 필요. 무대에서 발이 바닥에 닿는 연출이므로 **전신** 권장.
`avatar`/`thumbnail` 은 얼굴 중심 크롭(같은 캐릭터임이 작게도 식별되어야 함).

### 1-B. 표정 세트

| 파일명 | 감정 키 | 언제 나오는가 |
| --- | --- | --- |
| `emotion-happy.webp` | `happy` | 쓰다듬기·인사 성공 |
| `emotion-love.webp` | `love` | 선물하기, 친밀도 마일스톤 |
| `emotion-sleepy.webp` | `sleepy` | 재우기, 밤 시간대 idle |
| `emotion-hungry.webp` | `hungry` | 식사 시간대 idle |
| `emotion-thinking.webp` | `thinking` | hover/preview |
| `emotion-sad.webp` | `sad` | 오랜만에 돌아온 첫 순간 |

표시 크기·해상도·투명은 `portrait` 과 동일(1024×1024, 투명).
감정 키는 `lib/myWorld/interaction/types.ts` 의 `Emotion` 과 **정확히 일치**해야 한다
(`happy · normal · sleepy · hungry · thinking · excited · sad · angry · love`).
`normal` 은 `portrait.webp` 를 그대로 쓴다. `excited`·`angry` 는 2순위.

> 코드 변경 필요: `characterAssetPath()` 에 `emotion-{key}` 종류 추가 (자산 도착 후 1줄).

### 1-C. 캐릭터별 프롬프트 (STYLE LOCK 뒤에 붙임)

| id | 프롬프트 본문 |
| --- | --- |
| dori | `a small friendly fox character standing, full body, warm apricot orange fur (#F9954E family) with cream chest and cheeks, dark rounded eyes, small triangular ears with cream inner ear, fluffy tail curling to one side, wearing nothing, calm gentle smile, standing on invisible ground with weight on both feet` |
| bomi | `a small cheerful rabbit character standing, full body, soft pink-white fur, long ears with blush pink inner ear (#F368A0 family), round dark eyes, small round tail, bright open smile, light bouncy stance` |
| nabi | `a small calm cat character standing, full body, soft lavender-gray fur (#8B7BE8 family), cream muzzle, almond half-closed eyes, slender tail curved gently, quiet gentle expression` |
| haru | `a small loyal puppy character standing, full body, soft sky-blue-gray fur (#4FA3E3 family) with cream belly, floppy ears, round bright eyes, short wagging tail, friendly open-mouth smile` |
| pengs | `a small sturdy penguin character standing, full body, teal-blue back (#3FBBD6 family) and cream front, small flippers at sides, orange-cream beak and feet, calm confident expression` |
| gomi | `a small cozy bear character standing, full body, warm caramel brown fur (#B5895E family) with cream muzzle, round ears, sleepy half-open eyes, soft round body, relaxed expression` |
| simba | `a small brave lion cub standing, full body, golden amber fur (#EDA92E family), soft short mane, cream muzzle, round determined eyes, tufted tail, chin slightly up` |
| buhu | `a small wise owl character standing, full body, dusty slate-blue plumage (#7E88A8 family) with cream face disc, large calm eyes, small hooked beak, folded wings at sides` |
| mango | `a small playful tiger cub standing, full body, warm orange fur (#F0851F family) with soft muted stripes and cream belly, round mischievous eyes, small ears, tail up` |
| koya | `a small gentle koala character standing, full body, sage-gray fur (#7FA894 family) with cream chest, large round ears, small dark nose, soft relaxed eyes` |
| uni | `a small magical unicorn foal standing, full body, pale lilac-white coat (#C88BE8 family), soft pastel mane, small pearl horn, long eyelashes, kind bright eyes, no glitter particles` |
| ari | `a small friendly baby dragon standing, full body, soft teal-green scales (#3FAF9E family) with cream belly, tiny rounded wings, small blunt horns, round curious eyes, no fire, no smoke` |

**표정 프롬프트 조립법** (dori 예시):
```
{STYLE LOCK} + {CONSISTENCY LOCK} + {dori 본문} + ", expression: <아래 표>"
```

| 감정 | expression 문구 |
| --- | --- |
| happy | `eyes softly closed in a happy curve, wide gentle smile, cheeks slightly raised, ears perked up` |
| love | `heart-warmed look, eyes half-closed and soft, small blush on cheeks, tiny content smile, head tilted slightly` |
| sleepy | `heavy droopy eyelids, small yawning mouth, ears relaxed and lowered, head tilted down slightly` |
| hungry | `eyes looking to the side, small open mouth, one paw near belly, slightly drooped ears` |
| thinking | `eyes looking up and to the side, closed neutral mouth, one ear tilted, curious tilt of the head` |
| sad | `downturned eyes with slight shine, small closed frown, ears folded down, shoulders lowered` |

---

## 2. 방 (벽 · 바닥 · 배경)

캔버스는 **4:3 고정**, 좌표는 퍼센트다(`ROOM_ASPECT = "4 / 3"`, `FLOOR_BAND_PERCENT = 34`).
따라서 배경은 **위 66% 가 벽, 아래 34% 가 바닥**이어야 좌표계와 어긋나지 않는다.

| 파일명 | 용도 | 화면 표시 크기 | 원본 해상도 | 투명 |
| --- | --- | --- | --- | --- |
| `public/rooms/backgrounds/basic/scene.webp` | 벽+바닥이 연결된 기본 방 배경(권장) | 290×218 → 532×399 | **1536×1152 (4:3)** | ✕ |
| `public/rooms/walls/basic-warm/wall.webp` | 벽만 (분리 운용 시) | 532×263 | 1536×768 | ✕ |
| `public/rooms/floors/basic-wood/floor.webp` | 바닥만 (분리 운용 시) | 532×136 | 1536×392 | ✕ |

프롬프트 (`scene.webp`):
```
{STYLE LOCK} + "an empty cozy small room interior seen straight on, the upper two thirds
is a warm cream plaster wall (#FBEFE2 to #F6E2CE) with a soft baseboard line at the
boundary, the lower one third is a warm light wood plank floor (#E8D2B4 to #D8BE99)
receding gently toward the viewer, one soft ambient light from upper left, gentle
shadow where wall meets floor, completely empty — no furniture, no objects, no plants,
no window, no door, no decoration, nothing on the wall, nothing on the floor"
```
추가 negative: `furniture, objects, plants, window, door, rug, lamp, picture, people, animal`

> ⚠️ 배경에 가구·창문이 들어가면 사용자가 배치한 가구와 겹쳐 못 쓴다. **완전히 빈 방**이어야 한다.

---

## 3. 가구 (12종)

경로: `public/rooms/items/{itemId}/sprite.webp` (배치용) · `thumbnail.webp` (팔레트용)

| itemId | 화면 표시 크기(1440 기준, scale 0.6~1.8) | sprite 해상도 | thumbnail 해상도 |
| --- | --- | --- | --- |
| bed-basic | 128–383 × 72–215 px | **1024×768** | 256×256 |
| desk-basic | 89–268 × 57–172 | 1024×768 | 256×256 |
| bookshelf-basic | 77–230 × 96–287 | 768×1024 | 256×256 |
| rug-basic | 147–441 × 62–187 | 1024×576 | 256×256 |
| chair-basic | 48–144 × 53–158 | 512×768 | 256×256 |
| table-basic | 64–192 × 43–129 | 768×640 | 256×256 |
| toybox-basic | 64–192 × 43–129 | 768×640 | 256×256 |
| cushion-basic | 51–153 × 33–100 | 512×512 | 256×256 |
| frame-basic | 51–153 × 43–129 | 512×640 | 256×256 |
| doll-basic | 38–115 × 43–129 | 512×768 | 256×256 |
| plant-basic | 48–144 × 62–187 | 512×896 | 256×256 |
| lamp-basic | 45–134 × 72–215 | 512×1024 | 256×256 |

전부 **투명 배경**. sprite 은 프레임에 꽉 차게(여백 최소), 물체 밑면이 프레임 아래쪽에 닿도록
— 코드가 접지 그림자를 물체 박스 하단에 그리므로 밑면이 맞아야 자연스럽다.

프롬프트 본문 (STYLE LOCK 뒤에 붙임, 전부 `, isolated object on transparent background,
no ground shadow baked in, no floor, no wall` 로 끝냄):

| itemId | 본문 |
| --- | --- |
| bed-basic | `a small cozy single bed, warm wood frame (#C9A27E), cream mattress, one soft coral pillow (#F4A98C) and a folded blush blanket (#FBEEE7), seen from the front with a slight 3/4 turn` |
| desk-basic | `a small wooden writing desk (#C9A27E) with two drawers and simple round knobs, clean empty top` |
| chair-basic | `a small wooden chair with a rounded backrest, warm wood (#D7B899), a thin cream cushion on the seat` |
| table-basic | `a small round side table, warm wood top (#D7B899) with three slender legs, nothing on it` |
| bookshelf-basic | `a low wooden bookshelf (#C9A27E) with three shelves holding a few upright books in muted cream, coral and sage covers, spines plain with no text` |
| toybox-basic | `a wooden toy chest (#D7B899) with a slightly open lid, warm cream inside, a soft ball resting beside it` |
| rug-basic | `a soft oval woven rug, warm terracotta and cream concentric bands (#C98B7A, #FFF1E3), lying flat, seen from a low front angle` |
| cushion-basic | `a plump square floor cushion in muted dusty blue fabric (#7FA8D9) with a simple corner tassel` |
| frame-basic | `a small rectangular picture frame with warm gold-beige border (#C0A16B), the picture inside is an abstract soft cream and coral shape with no text` |
| doll-basic | `a small soft teddy bear plush in warm caramel (#D9A066) with a cream muzzle and stitched smile, sitting` |
| plant-basic | `a small potted plant, terracotta pot (#C98B7A) with a few broad sage-green leaves (#6FBF8B)` |
| lamp-basic | `a slim floor lamp with a warm cream fabric shade (#E8C86B glow) and a thin wooden stand, light off` |

---

## 4. 상태 일러스트 · 효과

| 파일명 | 용도 | 표시 크기 | 원본 | 투명 |
| --- | --- | --- | --- | --- |
| `public/my-world/empty-room.webp` | 가구 0개인 빈 방 안내 | 240×180 | 1024×768 | ○ |
| `public/my-world/empty-diary.webp` | 일기 빈 상태 | 96–120 정사각 | 512×512 | ○ |
| `public/my-world/guest-preview.webp` | 게스트에게 보여줄 My World 한 장 미리보기 | 320–532 × 4:3 | 1536×1152 | ✕ |
| `public/my-world/fx-affinity.webp` | 친밀도 상승 피드백 | 28–36 정사각 | 256×256 | ○ |
| `public/my-world/fx-exp.webp` | EXP 상승 피드백 | 28–36 정사각 | 256×256 | ○ |

프롬프트:

- `empty-room` — `{STYLE LOCK} + "a single cardboard moving box with its flaps open, empty, sitting alone, one small folded blanket beside it, isolated on transparent background, no room, no floor, no wall"`
- `empty-diary` — `{STYLE LOCK} + "a closed cream notebook lying flat with a thin coral ribbon bookmark and one small sprout growing beside it, isolated on transparent background, no text on the cover"`
- `guest-preview` — `{STYLE LOCK} + "a cozy small room interior with a wooden bed, a small desk, a potted plant and a woven rug arranged naturally on a warm wood floor against a cream plaster wall, a small friendly apricot fox character standing in the middle of the room, warm afternoon light from upper left, no people, no text"`
- `fx-affinity` — `{STYLE LOCK} + "a single soft rounded heart shape in blush pink and coral (#F368A0, #F4A98C) with a soft inner highlight, isolated on transparent background"`
- `fx-exp` — `{STYLE LOCK} + "a single soft four-pointed sparkle star in warm amber and orange (#EDA92E, #F9954E) with rounded points, isolated on transparent background"`

---

## 5. 제작 · 검토 절차 (요청)

1. 생성물은 먼저 **검토용 폴더**에 저장한다: `_자산검토/my-world/2026-07-xx/`
   (production 경로인 `public/` 에 바로 넣지 않는다)
2. 캐릭터 12종·가구 12종의 **contact sheet** 를 각각 1장 만들어 시점·광원·외곽선·채도를 비교한다.
3. 통과한 것만 `public/` 규약 경로로 옮긴다. 기존 파일은 덮어쓰지 않는다(현재 이미지 0개).
4. WebP 변환: 품질 82–88, 알파 유지. 원본 PNG 는 검토 폴더에 남긴다.
5. 반영 스위치:
   - 캐릭터 → `lib/myWorld/character/utils.ts` 의 `CHARACTER_ASSETS_READY = true`
   - 가구 → `lib/myWorld/room/constants.ts` 의 `ROOM_ASSETS_READY = true`
   - 두 플래그만 켜면 **컴포넌트 수정 없이** 이미지가 쓰인다(이미지 우선 → 실패 시 이모지 폴백).
6. 표정 세트를 쓰려면 `characterAssetPath()` 에 `emotion-{key}` 를 추가하고
   무대에서 `EMOTION_META` 키로 경로를 만든다(약 1~2줄).

## 6. 구현 위치 색인

| 자산 | 소비하는 코드 |
| --- | --- |
| `characters/{id}/portrait.webp` | `components/my-world/interaction/CharacterInteractionStage.tsx`, `components/my-world/room/RoomCanvas.tsx` |
| `characters/{id}/avatar.webp` | `components/my-world/CharacterAvatar.tsx` ← `WorldBar`/`WorldHeader` |
| `characters/{id}/thumbnail.webp` | `components/my-world/CharacterSelectModal.tsx` |
| `characters/{id}/emotion-*.webp` | 무대(감정 전환) — 코드 추가 필요 |
| `rooms/items/{id}/sprite.webp` | `components/my-world/room/RoomItemSprite.tsx` (캔버스) |
| `rooms/items/{id}/thumbnail.webp` | `components/my-world/room/RoomItemCard.tsx` (팔레트) |
| `rooms/backgrounds/basic/scene.webp` | `components/my-world/room/RoomCanvas.tsx` (벽·바닥 CSS 대체) |
| `my-world/empty-room.webp` | `components/my-world/room/RoomPreviewCard.tsx` (가구 0개) |
| `my-world/empty-diary.webp` | `components/my-world/DiaryCard.tsx` (빈 상태) |
| `my-world/guest-preview.webp` | `components/my-world/WorldIntro.tsx` |
| `my-world/fx-*.webp` | `components/my-world/interaction/WorldFeedback.tsx`, 캐릭터 주변 상승 피드백 |

---

## 7. 총량

| 단계 | 장수 | 비고 |
| --- | --- | --- |
| A. dori 기본 4 + 표정 6 | 10 | 최소 착수 단위 |
| 방 배경 | 1–3 | `scene` 1장으로 충분 |
| 가구 12종 (sprite + thumbnail) | 24 | |
| 상태·효과 | 5 | |
| **여기까지 소계** | **40–42** | 이것만으로 "임시 데모" 느낌은 사라진다 |
| B. 나머지 11종 기본 (portrait+thumbnail+avatar) | 33 | 캐릭터 선택 모달 완성 |
| C. 나머지 11종 표정 6 | 66 | 마지막 |
| **합계** | **139–141** | |
