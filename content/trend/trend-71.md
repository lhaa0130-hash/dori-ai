---
title: "구글, 에이전트 시대 위한 TPU 8t·8i 공개 — 엔비디아에 도전장"
description: "구글 클라우드가 8세대 AI 전용 칩 TPU 8t(트레이닝)와 TPU 8i(추론) 두 종을 공개했다. 전 세대 대비 모델 훈련 속도 3배, 비용 대비 성능 80% 향상을 내세우며 AI 인프라 패권을 놓고 엔비디아와의 경쟁에 불을 지폈다."
date: "2026-04-25"
author: "DORI-AI"
category: "트렌드"
thumbnail: "/thumbnails/trend/trend-71.png"
tags:
  - "구글TPU"
  - "AI칩"
  - "에이전트AI"
  - "클라우드인프라"
  - "엔비디아"
  - "딥러닝하드웨어"
  - "구글클라우드"
---

## 핵심 요약

구글 클라우드가 2026년 4월 22일, 라스베이거스에서 열린 Google Cloud Next 행사에서 8세대 텐서 처리 장치(TPU) 두 종을 공개했다. **TPU 8t(Training)**는 대형 AI 모델 훈련에 특화되었고, **TPU 8i(Inference)**는 실서비스 단계의 추론 연산에 최적화됐다. 구글은 이 칩들이 "에이전트 시대를 위해 설계됐다"고 강조하며, 모델 훈련 기간을 기존 수개월에서 수 주로 단축할 수 있다고 발표했다.

![구글 TPU 8세대 AI 칩 소개 이미지](/images/trend/trend-71-1.png)

---

## 주요 내용

### 1. TPU 8t와 8i — 역할 분리의 의미

구글의 이번 전략에서 가장 눈에 띄는 점은 훈련(Training)과 추론(Inference)을 위한 칩을 **완전히 분리**한 것이다. 기존 TPU는 두 가지 작업을 하나의 칩에서 처리했지만, 8세대부터는 목적에 따라 최적화 방향이 달라진다.

**TPU 8t**는 대형 언어 모델(LLM) 훈련에 특화돼 단일 클러스터에서 100만 개 이상의 TPU를 동시에 연결할 수 있는 아키텍처를 채용했다. 구글은 이를 통해 프론티어 모델 개발 기간을 기존 수개월에서 수 주로 단축할 수 있다고 밝혔다. **TPU 8i**는 사용자가 프롬프트를 입력한 뒤 모델이 응답을 생성하는 '추론' 단계에 집중하며, 달러당 성능(Performance per Dollar)을 전 세대 대비 80% 향상시켰다. 클라우드 서비스 운영 비용을 대폭 절감할 수 있어, 기업 고객 입장에서도 매력적인 선택지가 된다.

### 2. 엔비디아와의 공존과 경쟁

업계 일각에서는 구글의 자체 칩 공개를 엔비디아 대체 선언으로 해석하지만, 실상은 좀 더 복잡하다. 구글은 엔비디아의 최신 칩 **'베라 루빈(Vera Rubin)'**을 2026년 하반기 자사 클라우드에 공급받기로 합의했다. 즉, TPU와 GPU를 **상호 보완적으로 운용**하는 전략이다.

나아가 구글과 엔비디아는 소프트웨어 기반 네트워킹 기술 **'팰컨(Falcon)'**을 함께 고도화하기로 했다. 팰컨은 2023년 구글이 오픈소스로 공개한 데이터센터 내 초저지연 네트워크 기술로, 양사 협력은 클라우드 인프라 전반의 AI 효율을 높이는 방향으로 이어진다. 칩 시장 분석가 패트릭 무어헤드(Patrick Moorhead)는 "구글이 2016년 첫 TPU를 발표할 때도 엔비디아 종말론이 나왔지만, 엔비디아의 시가총액은 현재 5조 달러에 육박한다"고 꼬집었다. TPU가 틈새 보완재에 그칠지, 진정한 경쟁자가 될지는 여전히 미지수다.

### 3. 에이전트 AI 시대를 겨냥한 인프라 재편

구글이 이번 칩에 '에이전트 시대를 위한 TPU'라는 타이틀을 붙인 데는 이유가 있다. 2025~2026년 AI 업계의 핵심 화두는 단순 응답 생성에서 벗어나 **다중 단계 작업을 자율 수행하는 AI 에이전트**다. 에이전트는 하나의 대화보다 훨씬 많은 연산을 연속으로 처리해야 하므로, 추론 비용을 낮추는 TPU 8i의 역할이 더욱 중요해진다.

아마존(Trainium), 마이크로소프트(Maia) 등 빅테크가 앞다퉈 자체 AI 칩을 개발하는 배경도 같다. 엔비디아 GPU 의존도를 낮추고, 에이전트 워크로드에 최적화된 독자 인프라를 구축하려는 경쟁이 본격화됐다. 구글이 이번 발표를 통해 그 레이스에서 한발 앞서 나갔다는 평가가 나온다.

---

## 에디터 인사이트

구글 TPU 8세대의 핵심은 단순한 성능 향상이 아니라 **'훈련'과 '추론'이라는 두 가지 서로 다른 AI 요구를 목적별로 분리했다**는 데 있다. 마치 공장에서 제품을 만드는 라인과 완성품을 배송하는 라인을 전문화하듯, AI 칩도 이제 전문 분야가 생긴 것이다.

국내 기업 입장에서도 시사점이 크다. 자체 AI 인프라를 보유한 빅테크와 달리, 대부분의 국내 기업은 여전히 엔비디아 GPU 공급망에 종속돼 있다. 구글·아마존·마이크로소프트가 자체 칩 생태계를 구축할수록, 클라우드 전환 비용과 벤더 락인(Vendor Lock-in) 리스크에 대한 전략적 재검토가 필요한 시점이다.

---

## 핵심 용어

- **TPU(Tensor Processing Unit)**: 구글이 개발한 딥러닝 전용 AI 가속 칩. GPU보다 특정 AI 연산에 최적화됨.
- **추론(Inference)**: 학습이 완료된 AI 모델이 사용자 입력에 대한 응답을 생성하는 과정.
- **에이전트 AI(Agentic AI)**: 사용자의 지시 없이 여러 단계의 작업을 자율 계획·실행하는 AI 시스템.
- **팰컨(Falcon)**: 구글이 2023년 오픈소스로 공개한 데이터센터 초저지연 네트워크 기술.

---

## 출처 및 참고

1. TechCrunch, "Google Cloud launches two new AI chips to compete with Nvidia" (2026.04.22) — https://techcrunch.com/2026/04/22/google-cloud-next-new-tpu-ai-chips-compete-with-nvidia/
2. Bloomberg, "Google Cloud Debuts New AI Chips, Tools for Building Agents" (2026.04.22) — https://www.bloomberg.com/news/articles/2026-04-22/google-cloud-releases-new-tpu-chip-lineup-in-bid-to-speed-up-ai
3. Google Blog, "We're launching two specialized TPUs for the agentic era" (2026.04.22) — https://blog.google/innovation-and-ai/infrastructure-and-cloud/google-cloud/tpus-8t-8i-cloud-next/
4. Ars Technica, "Google unveils two new TPUs designed for the agentic era" (2026.04.22) — https://arstechnica.com/ai/2026/04/google-unveils-two-new-tpus-designed-for-the-agentic-era/
