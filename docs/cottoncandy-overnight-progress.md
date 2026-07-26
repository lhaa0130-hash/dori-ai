# CottonCandy Post-Merge Hardening — 진행 로그

브랜치 `audit/cottoncandy-postmerge-hardening-20260726` · 기준 `2ed304b9463`

> 규칙: Production 쓰기 0건 · client 재배포 0건 · Rules 배포 0건 · Cloudflare 변경 0건.
> Production endpoint 요청은 **무쓰기 상태 확인**만. 적대적 테스트는 전부 로컬 Edge/에뮬레이터.

---

## Phase 0 — 기준선 고정 ✅

- 감사 worktree `D:\01. illo.im\illo-audit` 생성 (main 배포 worktree 무손상, 미커밋 0건)
- `.env.local`·credential **미복사** 확인
- `2ed304b9463^{tree}` == `62efd695add^{tree}` → 감사 코드 = PR head
- `docs/cottoncandy-postmerge-baseline.md` 작성

**발견 (P1)** — 과도기 이중 지급
구버전 client `grantPlaytimeReward` 가 클라 직접 +50 과 서버 `minigame_play` 청구를 **둘 다** 한다.
병합 후 서버가 `minigame_play` 에 candy 50 을 주므로, **카나리 UID 는 하루 1회 +100** 을 받는다.
- 일반 사용자 미영향(게이트 403)
- 신규 client 배포 시 자동 소멸
- 사람 카나리 체크리스트에 반영 필요

**미션 3종(postset/commentset/likeset)은 EXP_ONLY → candy 0** (안전, 실행으로 확인)

**확인** — 구버전 client 는 `/api/purchase`·`/api/admin/grant` 를 **호출하지 않는다**(git grep 0건).
두 신규 endpoint 는 현재 트래픽 0.

**확인** — 병합은 재화 P0 를 닫지 않았다. 구버전 client+Rules 조합이라
`fsAddCandy`·`price` 위조·localStorage premium·알림 위조 관리자지급이 **여전히 살아있다**.
client + Rules 를 배포해야 실제로 닫힌다.

Production 변경: **0건** (읽기 상태 확인만)
