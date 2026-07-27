# 칭호 데이터 계약

enforcement 방식: **`/api/profile/title` endpoint + Rules 잠금** (`docs/title-authority-decision.md`)

## 0. 개념 분리

| 개념 | 저장 위치 | 누가 쓰나 |
|---|---|---|
| 상점에서 **구매한** 카탈로그 칭호 | `titleId` (itemKey) | 서버(endpoint) |
| 사용자가 **직접 입력한** 커스텀 칭호 | `customTitle` (문자열) | 서버(endpoint) |
| 기존 legacy 표시 문자열 | `title` | 서버(endpoint) — 구버전 호환용으로만 유지 |
| 현재 선택된 칭호 **종류** | `titleMode` | 서버(endpoint) |
| 화면에 표시되는 최종 문자열 | 저장하지 않음 — **resolver 가 계산** | — |
| 유료 칭호의 희귀도·시각 효과 | 저장하지 않음 — **카탈로그에서 조회** | — |

> **핵심**: rarity·style 은 **절대 문서에 저장하지 않는다.** `titleId` 를 서버 카탈로그에서
> 조회해 얻는다. 문서에 저장하면 그 자체가 위조 대상이 된다.

## 1. 필드 계약

### `titleMode`
| | |
|---|---|
| 타입 | `string` |
| 허용값 | `"catalog"` · `"custom"` · `"none"` |
| 기본값 | 없음(부재) → resolver 가 legacy 경로로 해석 |
| create | 클라이언트 **금지**(Rules) |
| update | 클라이언트 **금지**(Rules). endpoint 만 |
| 해제 | `"none"` 저장 |
| legacy | 부재해도 정상 — resolver 규칙 ③~⑤ |
| 공개 | `users/{uid}` 는 공개 읽기이므로 공개 |
| client cache | 표시 전용. 권한 근거 아님 |
| Rules | `titleFieldNames()` 로 직접 쓰기 차단 |

### `titleId`
| | |
|---|---|
| 타입 | `string` (itemKey `"title::<id>"`) |
| 최대 길이 | 형식으로 제한(`^title::[A-Za-z0-9_-]{1,40}$`) |
| 기본값 | `""` |
| create/update | 클라이언트 **금지** |
| 서버 검증 | 카탈로그 존재 + `slot === "title"` + **`resource.data.ownedItems` 에 존재** |
| 해제 | `titleMode="custom"|"none"` 저장 시 `""` 로 초기화 |
| 공개 | 공개 |
| Rules | 직접 쓰기 차단 |

### `customTitle`
| | |
|---|---|
| 타입 | `string` |
| 최대 길이 | **24 코드포인트**(서버가 `[...s].length` 로 판정 — 바이트 아님) |
| 정규화 | NFC · 앞뒤 trim · 내부 연속 공백 1칸으로 축약 |
| 금지 | 제어문자(C0/C1) · zero-width(`​-‏`,`﻿`) · bidi override(`‪-‮`,`⁦-⁩`) · 줄바꿈 |
| 기본값 | `""` |
| create/update | 클라이언트 **금지** |
| 해제 | `""` |
| 공개 | 공개 |
| **HTML** | 렌더러가 텍스트 노드로만 출력(React 기본). `dangerouslySetInnerHTML` 금지 |
| Rules | 직접 쓰기 차단 |

### legacy `title`
| | |
|---|---|
| 타입 | `string` |
| 역할 | **구버전 client 표시 호환 전용**. 신규 렌더러는 읽지 않는다 |
| 서버 동작 | endpoint 가 최종 표시 문자열로 **자동 동기화**한다(catalog→카탈로그 text, custom→customTitle, none→`""`) |
| create/update | 클라이언트 **금지**(Rules) — 이게 우회를 닫는 핵심 |
| legacy 해석 | 신규 필드가 없을 때만 resolver 규칙 ③~⑤ 에서 사용 |
| **rarity 근거** | **절대 아님** — 문자열이 카탈로그와 같아도 소유하지 않으면 중립 스타일 |

## 2. 불변식 (테스트로 고정)

1. 카탈로그 칭호 선택은 **item ID** 로 저장한다
2. 커스텀 칭호는 **별도 필드**에 저장한다
3. 현재 모드가 **명시적**이다
4. `catalog` 모드에서 `titleId` 는 **서버 `ownedItems`** 에 있어야 한다
5. `custom` 모드에서는 `titleId` 효과를 받지 못한다(서버가 `titleId=""` 로 초기화)
6. `none` 모드에서는 모든 칭호 효과가 없다
7. legacy `title` 문자열만으로는 유료 희귀도·스타일을 얻지 못한다
8. request body 의 `uid`/`email`/`ownedItems`/`premium`/`rarity`/`style` 을 신뢰하지 않는다
9. localStorage 는 권한 근거가 아니다
10. 같은 요청에서 `ownedItems` 를 위조해도 `titleId` 권한을 얻지 못한다
    (→ Rules 가 `ownedItems` 를 잠그고, 서버는 **읽은 문서**의 값만 본다)

## 3. Read-time(lazy) 호환 resolver

`lib/titleAuthority.ts` — **client/server 공통 순수 함수**. Firestore 추가 조회 **0회**(N+1 없음).
카탈로그는 `lib/shopItems.ts` 정적 레지스트리에서 해결한다.

| # | 조건 | 결과 |
|---|---|---|
| ① | `titleMode==="catalog"` + `titleId` 유효 + **소유** | 카탈로그 text + **rarity 스타일** |
| ①' | `titleMode==="catalog"` 인데 미소유·불명 id | **중립**(fail-safe) — rarity 없음 |
| ② | `titleMode==="custom"` | `customTitle` + **중립** 스타일 |
| ③ | 신규 필드 없음 + legacy `title` 이 카탈로그 문자열과 일치 + **해당 id 보유** | catalog 로 해석 + rarity |
| ④ | 신규 필드 없음 + 카탈로그 문자열과 일치하지만 **미보유** | **중립**만 — 유료 rarity **금지** |
| ⑤ | 신규 필드 없음 + 일반 커스텀 문자열 | 중립 |
| ⑥ | `titleMode==="none"` / 값 없음 | 표시 없음 |
| ⑦ | 타입 손상 · 길이 초과 · 제어문자 | **안전한 기본값**(표시 없음 또는 절단된 중립) |

- **write-back 하지 않는다.** 사용자가 다음에 칭호를 저장할 때 자연스럽게 신규 스키마로 전환된다.
- 기존 custom 문자열을 지우지 않는다.
- 정상 구매자의 catalog 효과는 규칙 ③ 으로 유지된다(조사 결과 해당자 1명, 전부 보유 확인).

## 4. resolver 반환 view-model

```ts
interface ResolvedTitle {
  text: string;               // 표시 문자열(정규화·절단 완료)
  mode: "catalog" | "custom" | "none";
  rarity: "rare" | "epic" | "legend" | null;   // catalog + 소유일 때만
  itemId: string | null;      // itemKey
  isVerifiedCatalog: boolean; // 소유가 확인된 카탈로그 칭호인가
  toneClass: string;          // **고정 토큰만** — 사용자 문자열로 조합하지 않는다
}
```

⚠️ `toneClass` 는 미리 정의된 상수 중 하나다. 사용자 입력으로 Tailwind class·HTML·style URL 을
만들지 않는다.

## 5. 유료 vs 커스텀 시각 차별성 (최소·안정)

| 구분 | 배경 | 테두리 | 아이콘 | 대비 |
|---|---|---|---|---|
| custom / legacy 중립 | 회색 톤(중립) | 없음 | 없음 | AA |
| catalog **rare** | 파랑 톤 | 1px 실선 | ◆ | AA |
| catalog **epic** | 보라 톤 | 1px 실선 + 미세 광 | ✦ | AA |
| catalog **legend** | 앰버 톤 | 1.5px 실선 + 미세 광 | ★ | AA |

- **색만으로 등급을 구분하지 않는다** — 아이콘(◆/✦/★)과 테두리 두께가 함께 다르다
- animation 은 넣지 않는다(넣게 되면 `prefers-reduced-motion` 필수)
- 표시 위치별로 권한을 재검증하지 않는다 — **resolver 결과만 소비**한다
- customTitle 이 유료 문구와 같아도 **badge·rarity 를 절대 얻지 못한다**

> 상세 시각 개선은 별도 디자인 후속 과제로 분리한다. 여기서는 **기능 구분에 필요한 최소**만 한다.
