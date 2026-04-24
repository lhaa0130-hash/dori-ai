# DORI-AI Android App

## 빠른 시작 (Android Studio)
1. Android Studio → **Open** 클릭
2. 이 `android/` 폴더 선택
3. Gradle sync 완료 대기 (첫 실행 시 수 분 소요)
4. Run ▶️ 버튼 클릭

## Firebase 설정 (푸시 알림 - 선택사항)
1. [Firebase Console](https://console.firebase.google.com/) → 새 프로젝트 생성
2. Android 앱 추가 → 패키지명: `com.doriai.app`
3. `google-services.json` 다운로드 → `app/` 폴더에 붙여넣기
4. ※ Firebase 없이도 앱은 정상 동작 (알림 기능만 비활성)

## 주요 기능
- ✅ https://dori-ai.com 전체 연동
- ✅ 쿠키/세션 유지 (로그인 상태 유지)
- ✅ 스플래시 화면 (1.5초)
- ✅ 당겨서 새로고침 (SwipeRefreshLayout)
- ✅ 오프라인 에러 화면 + 재시도 버튼
- ✅ 딥링크 지원 (https://dori-ai.com/*)
- ✅ Firebase 푸시 알림 (FCM)
- ✅ 뒤로가기 히스토리 지원
- ✅ SSL 보안 강화
- ✅ 로딩 프로그레스바 (상단)

## 앱 정보
- Package: `com.doriai.app`
- Min SDK: 26 (Android 8.0+)
- Target SDK: 34 (Android 14)
- 색상: 보라색 (#7C3AED) - DORI-AI 브랜드 컬러

## APK 빌드 (명령줄)
```bash
cd android
chmod +x gradlew
./gradlew assembleDebug
# APK 위치: app/build/outputs/apk/debug/app-debug.apk
```
