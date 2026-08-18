# 배너 배경 이미지 — GPT 생성 프롬프트

ChatGPT(또는 이미지 생성 도구)에 **원본 유화 그림을 첨부하고** 아래 프롬프트를 붙여넣으세요.

---

## 왜 원본을 그대로 못 쓰나

| 문제 | 내용 |
|---|---|
| 비율 | 원본 4:3 → 배너는 **16:9**. 위아래를 잘라야 하는데 잘리면 구도가 깨짐 |
| 중앙이 시끄러움 | 배너 안전영역은 **정중앙**인데, 거기에 밝고 복잡한 모니터 화면이 있어 글씨가 안 읽힘 |
| 모니터 속 한글 | AI 생성 흔적으로 글자가 뭉개져 있음 |

→ **글씨 자리를 처음부터 비워둔 16:9 버전**을 새로 뽑는 게 맞다.

---

## 프롬프트 A — 리메이크 (권장)

> 이미지 모델은 영어를 더 잘 알아듣습니다. 영문을 그대로 쓰세요.

```
Recreate this scene as a wide 16:9 banner image (2048x1152), keeping the exact same
oil painting style — thick impasto brushstrokes, visible canvas texture, warm cream
and beige palette, deep navy monitor bezels, small amber and blue accent keycaps.

Key changes:
- Widen the composition to 16:9. Extend the wall and desk naturally to both sides.
- Move the three monitors UP into the top two-thirds of the frame.
- Leave a WIDE, CALM, UNCLUTTERED horizontal band across the lower-middle of the
  image — an empty stretch of desk surface in soft shadow. This is where text will
  be placed, so keep it simple: no objects, no bright highlights, low detail.
- Keep the keyboards and mouse, but push them toward the right side and bottom edge.
- Absolutely NO text, NO letters, NO writing anywhere in the image, including on the
  monitor screens. Screens should show soft abstract blocks of light and color only.
- Soft warm daylight from the left. Calm, quiet, focused mood.
```

## 프롬프트 B — 확장(아웃페인팅)

원본 구도를 최대한 살리고 싶을 때.

```
Extend this image to a 16:9 aspect ratio (2048x1152) by outpainting the left and
right sides. Match the oil painting style, brushwork, lighting and color palette
exactly. Continue the wall and the wooden desk naturally outward. Add no new
objects and no text. Keep the existing composition untouched in the center.
```

→ B는 원형을 지키지만 **중앙이 여전히 시끄러워** 글씨 대비용 밴드가 꼭 필요하다.
A는 글씨 자리가 처음부터 비어 있어 밴드를 아주 옅게 쓰거나 생략할 수 있다.

---

## 받은 뒤 확인할 것

1. **글씨 자리** — 이미지 세로 기준 **48%~64% 구간**(y 548~742)이 비어 있고 어두운가
2. **글자 없음** — 화면 속에 한글·영문이 섞여 들어오지 않았는가
3. **비율** — 정확히 16:9인가 (아니면 2048×1152로 리사이즈)
4. **색** — 크림/베이지 바탕 + 딥네이비 + 앰버 포인트가 유지됐는가

## 그다음

새 이미지를 아래 경로에 넣어주세요.

```
youtube/ai-manhakdo/_assets/banner-bg.png
```

그러면 `banner-overlay-b.svg` 에 물려서 **완성 배너 PNG + 기기별 잘림 검증**까지 바로 돌립니다.
