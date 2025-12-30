---
title: "개발 방법 및 제작 구조"
date: "2024-01-01"
description: "APPLICATION: DORI의 개발 방법 및 제작 구조"
---

# 개발 방법 및 제작 구조

## 기술 스택

- **언어**: Kotlin
- **UI 프레임워크**: Jetpack Compose
- **아키텍처**: MVVM (Model-View-ViewModel)
- **의존성 주입**: Hilt
- **비동기 처리**: Coroutines, Flow

## 프로젝트 구조

```
app/
├── data/
│   ├── local/
│   └── remote/
├── domain/
│   ├── model/
│   └── repository/
├── presentation/
│   ├── ui/
│   └── viewmodel/
└── di/
```

## 개발 방법론

- Clean Architecture 적용
- 테스트 주도 개발 (TDD)
- 코드 리뷰 및 품질 관리
- 지속적인 통합 (CI/CD)




