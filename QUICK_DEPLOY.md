# 빠른 배포 가이드

## 🚀 배포 방법 선택

### 방법 1: Vercel 웹 대시보드 (가장 쉬움) ⭐

1. **GitHub에 푸시**
   ```bash
   git add .
   git commit -m "배포 준비: 마이페이지 고도화 및 구글 로그인 개선"
   git push origin main
   ```

2. **Vercel 접속**
   - https://vercel.com 접속
   - GitHub 계정으로 로그인

3. **프로젝트 추가**
   - "Add New Project" 클릭
   - GitHub 저장소 선택
   - 프로젝트 설정:
     - Framework: Next.js (자동 감지)
     - Root Directory: `./`
     - Build Command: `npm run build` (기본값)
     - Output Directory: `.next` (기본값)

4. **환경 변수 설정** (중요!)
   - "Environment Variables" 섹션에서 다음 변수 추가:
   
   ```
   NEXTAUTH_SECRET=<랜덤 시크릿>
   NEXTAUTH_URL=https://your-project.vercel.app
   GOOGLE_CLIENT_ID=<구글 클라이언트 ID>
   GOOGLE_CLIENT_SECRET=<구글 클라이언트 시크릿>
   JWT_SECRET=<랜덤 시크릿>
   NODE_ENV=production
   ```
   
   **시크릿 키 생성:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

5. **배포 실행**
   - "Deploy" 버튼 클릭
   - 배포 완료 후 URL 확인 (예: `your-project.vercel.app`)

6. **Google OAuth 설정 업데이트**
   - Google Cloud Console 접속
   - OAuth 클라이언트 ID의 승인된 리디렉션 URI에 추가:
     - `https://your-project.vercel.app/api/auth/callback/google`
   - Vercel의 `NEXTAUTH_URL`도 동일한 URL로 업데이트

---

### 방법 2: Vercel CLI 사용

1. **Vercel CLI 설치**
   ```bash
   npm i -g vercel
   ```

2. **로그인**
   ```bash
   vercel login
   ```

3. **프로젝트 배포**
   ```bash
   vercel
   ```
   - 첫 배포 시 질문에 답변:
     - Set up and deploy? **Yes**
     - Which scope? **개인 계정 선택**
     - Link to existing project? **No**
     - Project name? **dori-ai** (또는 원하는 이름)
     - Directory? **./**
     - Override settings? **No**

4. **환경 변수 설정**
   ```bash
   vercel env add NEXTAUTH_SECRET
   vercel env add NEXTAUTH_URL
   vercel env add GOOGLE_CLIENT_ID
   vercel env add GOOGLE_CLIENT_SECRET
   vercel env add JWT_SECRET
   ```

5. **프로덕션 배포**
   ```bash
   vercel --prod
   ```

---

## ⚠️ 배포 전 필수 확인사항

- [x] 빌드 테스트 완료 (`npm run build` 성공)
- [ ] 모든 변경사항 커밋 및 푸시
- [ ] 환경 변수 준비 완료
- [ ] Google OAuth 클라이언트 ID/Secret 준비 완료
- [ ] `.env.local` 파일이 커밋되지 않았는지 확인

## 📝 배포 후 확인사항

1. 홈페이지 접속 확인
2. 로그인/회원가입 테스트
3. Google OAuth 로그인 테스트
4. 마이페이지 기능 테스트
5. 커뮤니티 기능 테스트
6. Vercel 대시보드에서 에러 로그 확인

## 🔧 문제 해결

### 빌드 실패 시
```bash
# 의존성 재설치
rm -rf node_modules package-lock.json
npm install
npm run build
```

### 환경 변수 에러
- Vercel 대시보드에서 환경 변수 확인
- 환경 변수 이름 정확히 확인
- 재배포 필요

### 인증 에러
- `NEXTAUTH_URL`이 정확한 프로덕션 URL인지 확인
- Google OAuth 리디렉션 URI 확인
- `NEXTAUTH_SECRET` 설정 확인



