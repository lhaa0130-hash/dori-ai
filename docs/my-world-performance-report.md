# My World 성능·안정성 보고 (Workstream 11)

작성: 2026-07-26 · 기준선: `docs/my-world-phase4-baseline.md` (Phase 3 tip `eeb4bbdc056`)
방법: `next build` 출력, CDP 로 심은 timer/listener/fetch 계측 프로브, DOM 실측.

---

## 1. 번들

| 항목 | Phase 1 이전(main) | Phase 3 | **Phase 4** | 변화 |
| --- | --- | --- | --- | --- |
| `/my-world` route JS | 28.7 kB | 34.7 kB | **35.9 kB** | +1.2 kB (vs Phase 3) |
| First Load JS | 261 kB | 267 kB | **268 kB** | +1 kB |
| 공유 chunk | 87.8 kB | 87.8 kB | **87.8 kB** | 0 |
| 신규 런타임 의존성 | — | 0 | **0** | — |

### +1.2 kB 의 내역과 허용 판단

| 추가된 것 | 성격 | 허용 |
| --- | --- | --- |
| `lib/myWorld/view/worldView.ts` | 표시 결정 순수 함수 4개 | ✅ 상태 위장 버그를 구조적으로 막고 테스트로 고정한다 |
| `lib/myWorld/assets/manifest.ts` | 자산 계약 150개 | ⚠️ **런타임에 쓰이지 않는다**(검증 도구·테스트 전용). 아래 §5 확인 |
| `CharacterImage` | 이미지 실패 폴백 | ✅ 깨진 아이콘 방지 |
| `WorldNotices` | 삼켜졌던 저장 실패 노출 | ✅ |
| `authState` 3분기 + 보상 결과 5분기 | 상태 정확성 | ✅ |

**판정: 허용.** 1.2 kB 로 거짓 표현 3건·이미지 깨짐·저장 실패 은폐를 없앴다.
기준선보다 악화된 유일한 수치이며 원인이 명확하다.

---

## 2. DOM

| 항목 | Phase 1 이전 | Phase 3 | **Phase 4** |
| --- | --- | --- | --- |
| 문서 전체 노드 (390px, 게스트) | 568 | 549 | **555** |
| 방 캔버스 렌더 수 | **4** (미리보기+무대 중복) | 2 | **2** |
| My World 내부 인터랙티브 요소 | 16 | 11 | **11** |
| 1920px 문서 높이 | — | 1438 | **1155** (캔버스 상한 적용) |

노드 +6 은 `WorldNotices` 컨테이너와 `CharacterImage` 래퍼다.

---

## 3. timer / listener / 요청 — 계측 프로브

`setInterval`·`setTimeout`·`addEventListener`·`fetch` 를 감싸 생성/해제를 셌다.

| 시점 | interval | timeout(누적 생성) | listener(순증) | fetch |
| --- | --- | --- | --- | --- |
| ① 유휴 3초 | **0** | 28 | 8 | 0 |
| ② 상호작용 직후 | 1 | 50 | 10 | 0 |
| ③ cooldown 종료 후(+9초) | **0** ← 수정 전 `1` | 132 | 34 | 1 |

### 발견하고 고친 실제 누수

**cooldown 시계 interval 이 끝나도 멈추지 않았다.**

`state.cooldowns` 에는 지나간 타임스탬프가 계속 남는다(0 으로 리셋되지 않는다).
조건이 `until > 0` 이어서 한 번이라도 상호작용하면 **페이지를 떠날 때까지 500ms interval 이 돌았다.**

```
수정 전: cooldown 종료 9초 후에도 interval = 1
수정 후: interval = 0  (미래 cooldown 이 없으면 스스로 clearInterval)
```

이제 유휴 상태에서 **폴링이 전혀 없다**(interval 0). 회귀 방지를 위해
`tests/my-world-reward-ui.test.ts` 가 `until > 0` 패턴의 재등장을 실패시킨다.

### 프로브 한계 (해석 주의)

- **timeout 누적치는 누수 지표가 아니다.** 프로브는 `clearTimeout` 만 집합에서 제거하므로,
  정상적으로 **발화한** 타이머는 계속 카운트에 남는다. My World 의 idle 스케줄러는 8~14초마다
  재귀 `setTimeout` 을 쓰므로 시간이 지나면 수치가 늘어나는 것이 정상이다.
- **listener 순증(8→34)** 은 전역 레이아웃·광고 스크립트·Next 라우터를 함께 센 값이다.
  My World 컴포넌트가 등록하는 listener 는 `online`/`offline`/`dori-gamedata-synced` 3종이며
  전부 cleanup 이 있다(코드 확인). 세분화 계측은 하지 않았다.
- fetch 1건은 보상 청구(`/api/claim-reward`) 시도다 — 게스트에서는 identity gate 가 막아
  실제 전송은 없다(요청 목록 비어 있음).

---

## 4. 레이아웃 안정성

| 항목 | 결과 |
| --- | --- |
| 초기 로드 중 `main` 높이 변동 (400ms→4.5s) | **0px** |
| 인증 확인 → 게스트 확정 시 무대·캐릭터 위치 | **196 / 401px 고정** (늘어난 445px 는 전부 아래로 추가) |
| cooldown 문구 등장 | 자리 미리 확보 → 밀림 없음 |
| 안내 문구 영역 | `min-h-[36px]` 예약 |
| 12 viewport 가로 스크롤 | **0** |

---

## 5. 확인해야 할 것 — manifest 의 런타임 포함 여부

`lib/myWorld/assets/manifest.ts` 는 150개 spec 을 담고 있는데 **화면에서 import 하지 않는다**
(검증 스크립트와 테스트만 사용). 그래도 route JS 가 1.2 kB 늘었으므로,
Next 의 트리 셰이킹이 이 모듈을 제외했는지 확인이 남아 있다.

실측: `out/` 에서 manifest 고유 문자열을 검색

```
grep -rl "월드 바 아바타" out/_next/static  → 0건
grep -rl "EMOTION_ASSET_KEYS" out/_next/static → 0건
```

→ **번들에 포함되지 않았다.** +1.2 kB 는 `worldView`·`CharacterImage`·`WorldNotices`·
상태 분기 코드에서 온 것으로 판단한다.

---

## 6. 이미지 도착 후 로딩 우선순위 (manifest 에 기록됨)

자산이 없으므로 아직 적용되지 않았지만, 도착 시 적용할 우선순위를 계약으로 못 박았다.

| 우선순위 | 자산 | 근거 |
| --- | --- | --- |
| `eager` | 캐릭터 `portrait`·`avatar`, 가구 `sprite`, 방 `scene` | 첫 화면의 주역 |
| `lazy` | 캐릭터 `thumbnail`·`idle`·표정, 가구 `thumbnail`, 빈 상태 일러스트, 효과 | 스크롤·모달 이후 |

`tests/my-world-assets.test.ts` 가 "첫 화면 자산만 eager" 를 강제한다
(`/my-world/*` 상태 일러스트가 eager 가 되면 실패).
크기 예약(`aspect-ratio` / 고정 `width·height`)은 `CharacterImage` 와 `RoomCanvas` 가 이미 갖고 있어
이미지 도착 후에도 layout shift 가 발생하지 않는다.

---

## 7. 느린 네트워크에서의 오작동 방지

| 항목 | 처리 |
| --- | --- |
| 응답 전 버튼 재클릭 | `claiming` 상태로 비활성화(중복 전송 차단) |
| 응답 전 증가량 표시 | **금지** — "적립 중…" 만 보여주고 서버 `awardedExp` 로만 확정 표시 |
| 오프라인 | outbox 큐 + "오프라인 · 기기에 저장 중" 배지, `online` 이벤트에 single-flight flush |
| 저장 디바운스 | 450ms, 실행 시점에 identity 재검증(계정 전환 시 취소) |
| 로딩 중 조작 | `loading` 이면 캐릭터·가구 버튼 비활성 |

---

## 8. 하지 않은 최적화 (근거)

| 항목 | 이유 |
| --- | --- |
| `memo`/`useMemo`/`useCallback` 추가 | 수치 근거가 없다. 현재 재렌더는 상호작용당 1회 수준이고 DOM 555 노드로 충분히 가볍다 |
| 신규 성능 패키지 | 금지 범위 |
| Context 분할(재렌더 축소) | cooldown 시계가 `InteractionActions` 로컬 상태라 페이지 전체를 다시 그리지 않는다. 추가 분할의 이득이 측정되지 않았다 |
| 이미지 CDN·`next/image` | 정적 export(`output: 'export'`, `images.unoptimized`) 환경이라 적용 불가 |
