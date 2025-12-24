# DORI-AI Android WebView 앱

## 파일 구조

```
android-app/
├── MainActivity.kt              # 메인 액티비티
├── AndroidManifest.xml          # 앱 매니페스트
├── build.gradle.kts             # 빌드 설정
└── res/
    ├── layout/
    │   └── activity_main.xml    # 레이아웃 파일
    └── values/
        └── strings.xml          # 문자열 리소스
```

## Android Studio에서 사용 방법

1. **새 프로젝트 생성**
   - Android Studio 실행
   - "New Project" 선택
   - "Empty Activity" 템플릿 선택
   - Package name: `com.doriai.app`
   - Language: Kotlin
   - Minimum SDK: API 24

2. **파일 복사**
   - 위의 파일들을 생성된 프로젝트의 해당 위치에 복사

3. **build.gradle.kts 설정**
   - 프로젝트 레벨 `build.gradle.kts`에 다음 추가:
   ```kotlin
   plugins {
       id("com.android.application") version "8.2.0" apply false
       id("org.jetbrains.kotlin.android") version "1.9.20" apply false
   }
   ```

4. **의존성 동기화**
   - "Sync Now" 클릭

5. **실행**
   - 에뮬레이터 또는 실제 기기 연결
   - Run 버튼 클릭

## 주요 기능

- ✅ WebView로 https://dori-ai.com 로드
- ✅ JavaScript 활성화
- ✅ 뒤로가기 버튼으로 히스토리 이동
- ✅ 풀스크린 모드 (상태바 숨김)
- ✅ 외부 브라우저로 열리지 않음
- ✅ 네트워크 오류 처리
- ✅ 로딩 프로그레스바





