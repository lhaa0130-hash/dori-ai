# dori-ai.com (홈페이지) — Claude Code 안내

이 저장소는 **dori-ai.com** 정적 사이트입니다 (Next.js 14, App Router, `output:'export'`).

## 빌드·배포 (필수 규칙) — ⚠️ 2026-06-26 변경: **커밋 ↔ 빌드·배포 분리**
- **소스만 커밋하라**: 바뀐 소스 파일(content/·data/·public/images 등)만 `git add <경로>` → commit → `git pull --rebase` → push.
  - ❌ **`npm run build` 하지 말 것. `git add out/`/`git add -A`로 out/ 커밋하지 말 것.** (out/은 빌드 전담 잡만 커밋)
- **빌드·배포는 단일 권한 1곳**: 호스트 `../../n8n-work/deploy.js`가 **매시 정각**(Windows 작업 스케줄러 `illo-deploy`) `git pull --rebase` → `npm run build` → `git add -A`(out/ 포함) → commit → push. 급할 때 수동: `node ../../n8n-work/deploy.js`. `.deploy.lock`로 동시실행 방지(60분↑ stale 시 탈취).
  - 이유: 여러 곳이 각자 out/ 빌드·푸시 → rebase 충돌·CF 빌드 폭주. **빌드 주체를 1개로 모아 충돌 원천 제거.**
- ⚠️ **Cloudflare Pages는 커밋된 out/를 그대로 서빙**(빌드 명령 없음/skip, 출력=out)하도록 설정해야 매시 deploy.js push가 즉시 반영되고 CF 빌드 폭주·중단이 사라짐.
- **Cloudflare Pages**가 GitHub `main`을 배포. 원격에 자동 커밋 파이프라인이 동시에 도니 **push 전 pull 필수**.
- SNS 카드 PNG(`public/cards/animal`, `out/cards/animal`)·`.deploy.lock`은 **gitignore**됨.

## ⚠️ 이 사이트는 n8n 자동화와 한 파이프라인입니다
이 repo의 상당수 콘텐츠/데이터(인사이트 글, 동물도감 등)는 **로컬 n8n(localhost:5678) + `../../n8n-work/` 스크립트**가 자동 생성해 이 repo에 커밋합니다. 그러니 홈페이지 작업 중에도 자동화 쪽을 함께 다뤄야 할 때가 많습니다.
- 동물도감: `../../n8n-work/animal-factory.js`(위키→GPT→fal 이미지)가 `data/animal-cards.json` + `public/images/animal` 생성. `TARGET=<총수>`로 멱등 실행. (현재 255종, 300은 fal 잔액 충전 필요)
- n8n API: env `N8N_API_KEY`, `http://localhost:5678/api/v1/...`. **쓰기는 Node.js로**(PowerShell PUT는 한글 깨짐).

> 전체 작업공간(홈페이지 + n8n 자동화 + 기타 프로젝트) 공유 컨텍스트:
@../../CLAUDE.md
