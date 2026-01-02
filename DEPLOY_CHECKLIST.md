# 배포 체크리스트

## ✅ 빌드 테스트 완료
- [x] `npm run build` 성공적으로 완료
- [x] 253개 페이지 생성 완료
- [x] 빌드 에러 없음

## 📋 배포 전 확인사항

### 1. 환경 변수 설정 (Vercel 대시보드)
다음 환경 변수들을 Vercel 프로젝트 설정에서 추가해야 합니다:

```
NEXTAUTH_SECRET=<랜덤 시크릿 키>
NEXTAUTH_URL=https://your-project.vercel.app
GOOGLE_CLIENT_ID=<구글 클라이언트 ID>
GOOGLE_CLIENT_SECRET=<구글 클라이언트 시크릿>
JWT_SECRET=<JWT 시크릿 키>
NODE_ENV=production
```

**시크릿 키 생성 방법:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Google OAuth 설정
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 선택
3. "API 및 서비스" > "사용자 인증 정보"
4. OAuth 클라이언트 ID의 승인된 리디렉션 URI에 추가:
   - `https://your-project.vercel.app/api/auth/callback/google`

### 3. Git 저장소 확인
- [ ] 모든 변경사항 커밋 완료
- [ ] GitHub에 푸시 완료
- [ ] `.env.local` 파일이 커밋되지 않았는지 확인

## 🚀 Vercel 배포 단계

### 방법 1: Vercel CLI 사용 (권장)

1. **Vercel CLI 설치 및 로그인**
```bash
npm i -g vercel
vercel login
```

2. **프로젝트 배포**
```bash
vercel
```

3. **프로덕션 배포**
```bash
vercel --prod
```

### 방법 2: Vercel 웹 대시보드 사용

1. [Vercel](https://vercel.com) 접속 및 로그인
2. "Add New Project" 클릭
3. GitHub 저장소 선택 또는 직접 업로드
4. 프로젝트 설정:
   - Framework Preset: Next.js (자동 감지)
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`
5. 환경 변수 설정 (위의 환경 변수 목록 참고)
6. "Deploy" 클릭

## 📝 배포 후 확인사항

- [ ] 홈페이지 접속 확인
- [ ] 로그인/회원가입 기능 테스트
- [ ] Google OAuth 로그인 테스트
- [ ] 마이페이지 기능 테스트
- [ ] 커뮤니티 기능 테스트
- [ ] API 엔드포인트 테스트
- [ ] 에러 로그 확인 (Vercel 대시보드)

## 🔧 문제 해결

### 빌드 에러 발생 시
```bash
# node_modules 재설치
rm -rf node_modules package-lock.json
npm install
npm run build
```

### 환경 변수 관련 에러
- Vercel 대시보드에서 환경 변수 확인
- 환경 변수 이름에 오타 없는지 확인
- 재배포 필요

### 인증 관련 에러
- `NEXTAUTH_URL`이 정확한 프로덕션 URL인지 확인
- Google OAuth 리디렉션 URI 확인
- `NEXTAUTH_SECRET` 설정 확인



