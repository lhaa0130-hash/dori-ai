# DORI'S 동물도감 (Vite + React)

이 프로젝트는 Vite, React, Tailwind CSS, Framer Motion을 사용하여 만들어진 'DORI'S 동물도감'의 새로운 프론트엔드입니다.

## 🚀 시작하기

1. **의존성 설치:**
   ```bash
   npm install
   ```

2. **개발 서버 실행:**
   ```bash
   npm run dev
   ```
   개발 서버는 http://localhost:5173 에서 실행됩니다.

## 📁 프로젝트 구조

- `dori-ai-vite/`
  - `public/`: 정적 에셋 (이미지, 폰트 등)
  - `src/`: 소스 코드
    - `components/`: 재사용 가능한 리액트 컴포넌트
      - `Header.jsx`: 헤더 컴포넌트
      - `AnimalCard.jsx`: 동물 카드 컴포넌트
      - `Footer.jsx`: 푸터 컴포넌트
      - `Layout.jsx`: 레이아웃 컴포넌트
    - `App.jsx`: 메인 애플리케이션 컴포넌트
    - `main.jsx`: 애플리케이션의 진입점
    - `style.css`: Tailwind CSS 스타일
  - `index.html`: 메인 HTML 파일
  - `tailwind.config.js`: Tailwind CSS 설정
  - `postcss.config.js`: PostCSS 설정
  - `vite.config.js`: Vite 설정
  - `package.json`: 프로젝트 의존성 및 스크립트

## 📦 빌드 및 배포

Cloudflare Pages에 배포하려면, 다음 명령어를 사용하여 프로젝트를 빌드합니다:

```bash
npm run build
```

빌드 결과물은 `dist` 디렉토리에 생성되며, 이 디렉토리를 Cloudflare Pages에 배포할 수 있습니다.

## 📝 프로젝트 규칙

- IP 주소나 API 키 노출 금지: 사용자(특히 n8n 서버 IP)의 실제 IP 주소나 API 키 등의 민감 정보를 코드, 답변, 로그 등에 절대 노출하지 않습니다.
- 모든 보고는 한국어로 수행: 앞으로 모든 커뮤니케이션은 한국어로 진행됩니다.

## 🚀 시작하기