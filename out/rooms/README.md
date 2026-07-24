# My World — Room 에셋 (05-05)

My Room(개인 방 꾸미기)의 실제 이미지 에셋 폴더입니다.
현재는 **이미지 파일이 없으며**, 코드가 CSS/이모지 Placeholder 로 렌더링합니다
(`lib/myWorld/room/constants.ts` 의 `ROOM_ASSETS_READY = false`).

## 활성화 방법

1. 아래 규칙대로 각 폴더에 `.webp` 파일을 넣습니다.
2. `ROOM_ASSETS_READY` 를 `true` 로 바꾸면 코드 수정 없이 이미지가 자동 사용됩니다
   (이미지 우선 → 로드 실패 시 Placeholder 폴백).

## 폴더 규칙

```
public/rooms/
  backgrounds/basic/         # 테마 배경(예약)
  floors/basic-wood/         # 바닥(예약, 현재는 CSS 그라데이션)
  walls/basic-warm/          # 벽(예약, 현재는 CSS 그라데이션)
  items/{itemId}/
    thumbnail.webp           # 팔레트 목록 썸네일(정사각 권장)
    sprite.webp              # 방 캔버스 배치용 스프라이트(투명 배경)
    preview.webp             # 상세/미리보기(선택)
```

- `{itemId}` 는 Registry(`lib/myWorld/room/registry.ts`)의 아이템 id 와 동일해야 합니다
  (bed-basic, desk-basic, chair-basic, table-basic, bookshelf-basic, toybox-basic,
   rug-basic, cushion-basic, frame-basic, doll-basic, plant-basic, lamp-basic).
- 스프라이트는 **투명 배경 PNG→WebP**, 아이템이 프레임에 꽉 차게(여백 최소) 권장합니다.
- 파일명은 위 규칙을 그대로 사용합니다. 경로는 `registry.ts` 의 `sprite()`/`thumb()` 헬퍼가 생성합니다.

## 주의

- 외부 URL 이미지를 코드에서 직접 참조하지 마세요(자체 호스팅만).
- 에셋이 없는 동안 존재하지 않는 경로를 요청하지 않도록 `ROOM_ASSETS_READY=false` 를 유지하세요(404 방지).
