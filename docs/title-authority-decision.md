# 칭호 enforcement 방식 결정

기준 `2ed304b9463` · 선행 조사 `docs/title-production-shape-audit.md`

## 결론

# 방식 2 — **`/api/profile/title` 서버 endpoint**

Rules 는 칭호 관련 필드의 **클라이언트 직접 쓰기를 전면 잠근다.**

> 지시 기준: *"규칙만으로 완전한 검증을 증명하지 못하면 endpoint 를 선택하세요.
> 단순 구현량이 적다는 이유만으로 Rules 방식을 선택하지 마세요."*
> → Rules 로 **증명하지 못하는 항목이 4개** 있다(아래). 그래서 endpoint 다.

---

## 1. Rules 로 검증할 수 있는 것 / 없는 것

| 검증 항목 | Rules 로 가능? | 근거 |
|---|---|---|
| `titleMode` allowlist | ✅ | `in ['catalog','custom','none']` |
| `titleId` 형식·카테고리 | ✅ | 생성된 id 목록과 대조 |
| `titleId` **소유 여부** | ✅ | `('title::'+titleId) in resource.data.ownedItems` |
| 같은 요청의 `ownedItems` 위조 | ✅ | `ownedItems` 는 이미 `rewardFieldNames()` 로 잠김 + `resource.data` 기준 판정 |
| 다른 장착 필드와 동시 저장 | ✅ | 기존 `equipOwnedOnUpdate` 와 동일 패턴 |
| **`customTitle` 길이 "24자"** | ❌ | **실측**: Rules `string.size()` 는 **UTF-8 바이트**. 이모지 6개=24바이트, **한글 8자=24바이트** → 제품 계약 "24자"와 최대 4배 어긋난다 |
| **Unicode 정규화(NFC)** | ❌ | Rules 에 정규화 함수가 없다. 합성/분해 표기가 다른 문자열을 같은 것으로 다룰 수 없어 어떤 대조도 신뢰할 수 없다 |
| **trim·정규화 후 저장** | ❌ | Rules 는 **수락/거부만** 한다. 값을 다듬을 수 없어 "앞뒤 공백 제거" 같은 계약을 강제할 수 없다 |
| **`operationId` 멱등성** | ❌ | Rules 에 원장 개념이 없다. 중복 저장을 흡수할 수 없다 |
| legacy `title` 표시문자열 동기화 | △ | 가능하지만 39개 ko+en **77개 문자열**을 Rules 에 박아야 하고, 카탈로그 문구를 한 글자만 고쳐도 **기존 사용자 저장이 조용히 거부**된다 |

**❌ 4개 · △ 1개** → Rules 단독으로 완전한 검증을 **증명하지 못한다.**

### 실측 근거 (`tests/emulator/rules-string-size-probe.test.ts`)

```
이모지 6개 → 코드포인트 6 · UTF-8 바이트 24
한글 8자   → UTF-8 바이트 24
리스트 size() 는 원소 수(스티커 6/7 경계로 확인) — 문자열 size() 와 의미가 다르다
```

## 2. 선택 기준별 비교 (지시 우선순위 순)

| # | 기준 | Rules 단독 | **endpoint** |
|---|---|---|---|
| 1 | **권한 우회 불가능** | ❌ 길이·정규화·정규형 우회 여지 | ✅ 서버가 전량 검증·정규화 후 저장 |
| 2 | 과도기 안전 | ⚠️ 구버전이 legacy `title` 을 쓰면 Rules 가 막아 **조용히 실패** | ✅ Rules 로 직접 쓰기를 막되, endpoint 가 유일 경로 |
| 3 | rollback | ✅ Rules 만 되돌림 | ✅ Rules 되돌림(= 이전 동작). endpoint 는 남아도 무해 |
| 4 | 부분 저장 없음 | ✅ 단일 문서 update | ✅ 단일 트랜잭션 |
| 5 | migration 최소화 | ✅ | ✅ (조사 결과 대상 0건) |
| 6 | 테스트 가능성 | ⚠️ Rules 조합 폭발 | ✅ 단위+Edge 로 정밀 |
| 7 | 운영 복잡도 | ✅ 낮음 | ⚠️ endpoint 1개 추가 |

1·2 번이 결정적이다.

## 3. 방식 A(Rules)를 포기하며 감수하는 비용

| 비용 | 대응 |
|---|---|
| 배포가 **endpoint-first** 로 늘어난다 | 이미 client 재배포가 필요한 릴리스다. Functions 는 merge 만으로 나가므로 **단계가 1개 늘 뿐** |
| 프로필 저장이 2회 write 로 쪼개진다 | **칭호 섹션에 자체 저장 버튼**을 둔다. 이름·소개와 저장 시점을 분리하면 부분 실패가 오히려 명확해진다(§UI) |
| 구버전 client 는 칭호를 저장할 수 없게 된다 | Rules 배포 **이후**부터. 그 전까지는 기존대로 동작한다. 순서를 지키면 사용자에게 보이는 구간이 없다 |

## 4. 장착(bg/frame/…)은 왜 Rules 로 두는가

장착 필드는 **id 만 저장**하고 길이·정규화·트림·멱등이 필요 없다.
Rules 로 **완전히** 검증 가능하며(§equipment-authority-decision) client 변경도 0건이다.
반면 칭호는 **자유 문자열**이 섞여 있어 성질이 다르다.

> ⇒ **혼합 설계**: 장착 = Rules, 칭호 = endpoint + Rules 잠금.
> 두 방식이 같은 `users/{uid}` 문서를 다루므로, Rules 는
> "칭호 필드는 클라이언트가 못 쓴다"만 담당하고 값 판정은 서버가 한다.

## 5. Rules 가 지는 책임 (endpoint 채택 후)

```
titleMode · titleId · customTitle · title  →  클라이언트 create/update 금지
                                              (서버 SA 만 씀 — Rules 우회)
```

기존 `rewardFieldNames()` 와 같은 원리다. 관리자(`isAdmin()`)도 예외가 아니다.
