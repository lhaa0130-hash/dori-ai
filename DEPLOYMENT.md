# 배포 가이드 (Deployment Guide)

이 문서는 Dori-AI 프로젝트를 배포하는 방법을 안내합니다.

## 필수 환경 변수 설정

배포 전에 다음 환경 변수들을 설정해야 합니다:

### 1. NextAuth 설정
- `NEXTAUTH_SECRET`: NextAuth 세션 암호화를 위한 시크릿 키 (랜덤 문자열 생성 권장)
- `NEXTAUTH_URL`: 프로덕션 도메인 URL (예: `https://yourdomain.com`)

### 2. Google OAuth 설정
- `GOOGLE_CLIENT_ID`: Google OAuth 클라이언트 ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth 클라이언트 시크릿

### 3. JWT 설정
- `JWT_SECRET`: JWT 토큰 암호화를 위한 시크릿 키

### 환경 변수 생성 방법

#### NEXTAUTH_SECRET 및 JWT_SECRET 생성
```bash
# Node.js를 사용하여 랜덤 시크릿 생성
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Google OAuth 설정
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. "API 및 서비스" > "사용자 인증 정보" 이동
4. "사용자 인증 정보 만들기" > "OAuth 클라이언트 ID" 선택
5. 애플리케이션 유형: "웹 애플리케이션"
6. 승인된 리디렉션 URI 추가:
   - 개발: `http://localhost:3000/api/auth/callback/google`
   - 프로덕션: `https://yourdomain.com/api/auth/callback/google`

---

## 배포 방법

### 방법 1: Vercel 배포 (권장)

Vercel은 Next.js를 만든 회사에서 제공하는 플랫폼으로, 가장 간단하게 배포할 수 있습니다.

#### 1단계: Vercel 계정 생성
- [Vercel](https://vercel.com)에 가입 (GitHub 계정으로 연동 권장)

#### 2단계: 프로젝트 연결
1. Vercel 대시보드에서 "Add New Project" 클릭
2. GitHub 저장소 선택 또는 직접 업로드
3. 프로젝트 설정:
   - Framework Preset: Next.js (자동 감지)
   - Root Directory: `./` (기본값)
   - Build Command: `npm run build` (자동 설정)
   - Output Directory: `.next` (자동 설정)

#### 3단계: 환경 변수 설정
Vercel 대시보드에서 "Settings" > "Environment Variables"에서 다음 변수 추가:
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` (프로덕션 URL)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `JWT_SECRET`
- `NODE_ENV=production`

#### 4단계: 배포
- "Deploy" 버튼 클릭
- 배포 완료 후 자동으로 도메인 할당 (예: `your-project.vercel.app`)

#### 5단계: 커스텀 도메인 설정 (선택사항)
- "Settings" > "Domains"에서 커스텀 도메인 추가
- DNS 설정 안내에 따라 도메인 연결

---

### 방법 2: 다른 플랫폼 배포

#### Netlify
1. [Netlify](https://www.netlify.com)에 가입
2. GitHub 저장소 연결
3. 빌드 설정:
   - Build command: `npm run build`
   - Publish directory: `.next`
4. 환경 변수 설정 (Vercel과 동일)

#### Railway
1. [Railway](https://railway.app)에 가입
2. GitHub 저장소 연결
3. 환경 변수 설정
4. 자동 배포 활성화

#### 자체 서버 (VPS/클라우드)
1. 서버에 Node.js 18+ 설치
2. 프로젝트 클론 및 의존성 설치:
   ```bash
   git clone <repository-url>
   cd Dori-ai
   npm install
   ```
3. 환경 변수 파일 생성 (`.env.local`):
   ```
   NEXTAUTH_SECRET=your-secret
   NEXTAUTH_URL=https://yourdomain.com
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   JWT_SECRET=your-jwt-secret
   NODE_ENV=production
   ```
4. 프로덕션 빌드 및 실행:
   ```bash
   npm run build
   npm start
   ```
5. PM2 또는 systemd로 프로세스 관리 설정

---

## 배포 전 체크리스트

- [ ] 모든 환경 변수가 설정되었는지 확인
- [ ] `npm run build`가 성공적으로 완료되는지 확인
- [ ] Google OAuth 리디렉션 URI가 프로덕션 URL로 설정되었는지 확인
- [ ] `NEXTAUTH_URL`이 프로덕션 도메인으로 설정되었는지 확인
- [ ] 프로덕션 환경에서 `NODE_ENV=production`으로 설정되었는지 확인
- [ ] `.env` 파일이 `.gitignore`에 포함되어 있는지 확인 (보안)

---

## 배포 후 확인사항

1. **홈페이지 접속 확인**: 메인 페이지가 정상적으로 로드되는지 확인
2. **인증 기능 테스트**: 로그인/회원가입이 정상 작동하는지 확인
3. **Google OAuth 테스트**: Google 로그인이 정상 작동하는지 확인
4. **API 엔드포인트 테스트**: 주요 API가 정상 작동하는지 확인
5. **에러 로그 확인**: 배포 플랫폼의 로그에서 에러가 없는지 확인

---

## 문제 해결

### 빌드 에러
- TypeScript 에러: `next.config.ts`에서 `ignoreBuildErrors: true` 설정 확인
- 의존성 문제: `node_modules` 삭제 후 `npm install` 재실행

### 환경 변수 관련 에러
- 모든 필수 환경 변수가 설정되었는지 확인
- 환경 변수 이름에 오타가 없는지 확인
- Vercel의 경우 환경 변수 설정 후 재배포 필요

### 인증 관련 에러
- `NEXTAUTH_URL`이 정확한 프로덕션 URL인지 확인
- Google OAuth 리디렉션 URI가 정확한지 확인
- `NEXTAUTH_SECRET`이 설정되었는지 확인

---

## 추가 리소스

- [Next.js 배포 문서](https://nextjs.org/docs/deployment)
- [Vercel 배포 가이드](https://vercel.com/docs)
- [NextAuth.js 배포 가이드](https://next-auth.js.org/configuration/options#nextauth_url)














