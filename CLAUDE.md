# dori-ai.com (홈페이지) — Claude Code 안내

이 저장소는 **dori-ai.com** 정적 사이트입니다 (Next.js 14, App Router, `output:'export'`).

## 빌드·배포 (필수 규칙)
- 변경 후 **반드시** `npm run build` → `git add -A`(반드시 `out/` 포함) → commit → `git pull --rebase` → push.
- **Cloudflare Pages**가 GitHub `main`을 배포. 원격에 **자동 커밋 파이프라인**이 동시에 돌므로 **push 전 pull 필수**.
- SNS 카드 PNG(`public/cards/animal`, `out/cards/animal`)는 웹 미사용·대용량이라 **gitignore**됨.

## ⚠️ 이 사이트는 n8n 자동화와 한 파이프라인입니다
이 repo의 상당수 콘텐츠/데이터(인사이트 글, 동물도감 등)는 **로컬 n8n(localhost:5678) + `../../n8n-work/` 스크립트**가 자동 생성해 이 repo에 커밋합니다. 그러니 홈페이지 작업 중에도 자동화 쪽을 함께 다뤄야 할 때가 많습니다.
- 동물도감: `../../n8n-work/animal-factory.js`(위키→GPT→fal 이미지)가 `data/animal-cards.json` + `public/images/animal` 생성. `TARGET=<총수>`로 멱등 실행. (현재 255종, 300은 fal 잔액 충전 필요)
- n8n API: env `N8N_API_KEY`, `http://localhost:5678/api/v1/...`. **쓰기는 Node.js로**(PowerShell PUT는 한글 깨짐).

> 전체 작업공간(홈페이지 + n8n 자동화 + 기타 프로젝트) 공유 컨텍스트:
@../../CLAUDE.md
